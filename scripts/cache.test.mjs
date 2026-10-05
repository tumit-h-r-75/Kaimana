import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Execute the actual client with a browser and HTTP transport stub. No backend
// or real account is needed to exercise session boundaries and request races.
function clientFixture(fetcher) {
  let token = "account-a";
  let refreshToken = "refresh-a";
  const window = new EventTarget();
  const auth = {
    TOKENS_CHANGED_EVENT: "auth:tokens-changed",
    getAccessToken: () => token,
    getRefreshToken: () => refreshToken,
    setTokens: (next, refresh) => {
      token = next;
      refreshToken = refresh;
      window.dispatchEvent(new Event(auth.TOKENS_CHANGED_EVENT));
    },
    clearTokens: () => {
      token = null;
      refreshToken = null;
      window.dispatchEvent(new Event(auth.TOKENS_CHANGED_EVENT));
    },
  };
  function compile(file, modules = {}) {
    const source = ts.transpileModule(
      readFileSync(new URL(file, import.meta.url), "utf8"),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
        },
      },
    ).outputText;
    const exports = {};
    vm.runInNewContext(source, {
      exports,
      require: (name) => {
        assert.ok(name in modules, `Unexpected import: ${name}`);
        return modules[name];
      },
      window,
      fetch: fetcher,
      Event,
      URL,
      FormData,
      AbortSignal,
      DOMException,
      console,
    });
    return exports;
  }
  const cache = compile("../lib/api/request-cache.ts");
  const api = compile("../lib/api/client.ts", {
    "@/lib/config": { appConfig: { apiUrl: "" } },
    "@/lib/auth-storage": auth,
    "./request-cache": cache,
  });
  return { api, cache, auth };
}

const ok = (data) => Response.json({ success: true, data });
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

test("concurrent reads and reordered query parameters use one request", async () => {
  let calls = 0;
  const { api } = clientFixture(async () => {
    calls++;
    return ok({ total: 20 });
  });
  const [a, b] = await Promise.all([
    api.apiRequest("/api/problems?page=1&limit=20"),
    api.apiRequest("/api/problems?limit=20&page=1"),
  ]);
  assert.equal(a.total, 20);
  assert.equal(b.total, 20);
  await api.apiRequest("/api/problems?page=1&limit=20");
  assert.equal(calls, 1);
  await api.apiRequest("/api/problems?page=2&limit=20");
  assert.equal(calls, 2);
});

test("account switches and logout cannot reuse another account's data", async () => {
  let calls = 0;
  const { api, auth } = clientFixture(async (_url, options) => {
    calls++;
    return ok(options.headers?.Authorization ?? "anonymous");
  });
  assert.equal(await api.apiRequest("/api/analytics/me"), "Bearer account-a");
  auth.setTokens("account-b", "refresh-b");
  assert.equal(await api.apiRequest("/api/analytics/me"), "Bearer account-b");
  auth.clearTokens();
  assert.equal(await api.apiRequest("/api/analytics/me"), "anonymous");
  assert.equal(calls, 3);
});

test("a successful mutation invalidates already cached reads", async () => {
  let version = 0;
  let calls = 0;
  const { api } = clientFixture(async (_url, options) => {
    calls++;
    if (options.method === "POST") version++;
    return ok(version);
  });
  assert.equal(await api.apiRequest("/api/problems"), 0);
  await api.apiRequest("/api/submissions", { method: "POST", body: {} });
  assert.equal(await api.apiRequest("/api/problems"), 1);
  assert.equal(calls, 3);
});

test("reads completed during a mutation cannot repopulate stale data", async () => {
  const gate = deferred();
  let reads = 0;
  const { api } = clientFixture(async (_url, options) => {
    if (options.method === "POST") {
      await gate.promise;
      return ok(null);
    }
    return ok(++reads);
  });
  const write = api.apiRequest("/api/submissions", { method: "POST" });
  await api.apiRequest("/api/problems");
  gate.resolve();
  await write;
  assert.equal(await api.apiRequest("/api/problems"), 2);
});

test("errors are retriable and an explicit refresh bypasses stored data", async () => {
  let calls = 0;
  const { api } = clientFixture(async () => {
    calls++;
    return calls === 1
      ? Response.json({ success: false, message: "Try again" }, { status: 503 })
      : ok(calls);
  });
  await assert.rejects(api.apiRequest("/api/problems"), /Try again/);
  assert.equal(await api.apiRequest("/api/problems"), 2);
  assert.equal(await api.apiRequest("/api/problems", { cache: false }), 3);
});

test("concurrent 401s share one refresh and retry with the rotated token", async () => {
  let refreshes = 0;
  const gate = deferred();
  const { api } = clientFixture(async (url, options) => {
    if (url === "/api/auth/refresh-token") {
      refreshes++;
      await gate.promise;
      return ok({ accessToken: "rotated", refreshToken: "new-refresh" });
    }
    if (options.headers?.Authorization !== "Bearer rotated")
      return Response.json({ success: false }, { status: 401 });
    return ok("fresh");
  });
  const reads = [
    api.apiRequest("/api/problems"),
    api.apiRequest("/api/analytics/me"),
  ];
  await new Promise((resolve) => setImmediate(resolve));
  gate.resolve();
  assert.deepEqual(await Promise.all(reads), ["fresh", "fresh"]);
  assert.equal(refreshes, 1);
});

test("aborting one subscriber leaves the shared read usable", async () => {
  const gate = deferred();
  let calls = 0;
  const { api } = clientFixture(async () => {
    calls++;
    await gate.promise;
    return ok("complete");
  });
  const controller = new AbortController();
  const cancelled = api.apiRequest("/api/problems", {
    signal: controller.signal,
  });
  const active = api.apiRequest("/api/problems");
  controller.abort();
  await assert.rejects(cancelled, { name: "AbortError" });
  gate.resolve();
  assert.equal(await active, "complete");
  assert.equal(calls, 1);
});

test("TTL expiry, bounded eviction and invalidation during a pending read", async () => {
  const { cache } = clientFixture(async () => ok(null));
  let now = 0;
  let loads = 0;
  const reads = new cache.RequestCache(2, () => now);
  const load = async () => ++loads;
  assert.equal(await reads.read("a", 10, load), 1);
  assert.equal(await reads.read("a", 10, load), 1);
  now = 11;
  assert.equal(await reads.read("a", 10, load), 2);
  await reads.read("b", 10, load);
  await reads.read("c", 10, load);
  assert.equal(await reads.read("a", 10, load), 5);
  const gate = deferred();
  const pending = reads.read("pending", 10, () => gate.promise);
  reads.clear();
  gate.resolve("stale");
  await pending;
  assert.equal(await reads.read("pending", 10, async () => "new"), "new");
});
