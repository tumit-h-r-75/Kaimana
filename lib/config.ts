const trimTrailingSlash = (value: string) => value.replace(/\/$/, "");

export const appConfig = {
  // Defaults to "" (a relative path) rather than the backend's absolute
  // URL. The frontend and backend are deployed as two separate Vercel
  // projects on two different domains, so a direct cross-site fetch makes
  // the auth cookie a *third-party* cookie — which Chrome and other
  // browsers increasingly block by default. Login would appear to
  // succeed (the POST goes through) but the cookie never actually gets
  // stored, so the very next request looks signed-out again.
  //
  // Routing through "" means every API call hits this app's own origin
  // (e.g. /api/auth/me), which next.config.ts rewrites server-side to the
  // real backend. The browser only ever talks to one origin, so the
  // cookie is first-party and persists normally. Set NEXT_PUBLIC_API_URL
  // to override this (e.g. for local development against a backend that
  // isn't proxied).
  apiUrl: trimTrailingSlash(process.env.NEXT_PUBLIC_API_URL ?? ""),
  // Blank counts as unset for these two. A dashboard variable that exists
  // but is empty satisfies `??`, and an empty socket URL sends production
  // to the localhost fallback in lib/socket.ts — a connection that can only
  // ever fail, on someone else's machine.
  // apiUrl above is the exception: empty is its correct value.
  socketUrl: trimTrailingSlash(process.env.NEXT_PUBLIC_SOCKET_URL?.trim() || "https://kaimana-back.vercel.app"),
  appUrl: trimTrailingSlash(process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://kaimana.vercel.app"),
  // Execution Visualizer. Must match FEATURE_EXECUTION_VISUALIZER on the API:
  // this only decides whether the button is offered, and the server refuses
  // the request on its own when the feature is off there.
  executionVisualizer: process.env.NEXT_PUBLIC_FEATURE_VISUALIZER === "true",
};
