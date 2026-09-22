"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { listSubmissions } from "@/lib/api/submissions";
import type { SubmissionListResult, Verdict } from "@/types/api";
import { Loader } from "@/components/ui/Loader";
import { Pagination } from "@/components/ui/Pagination";
import { LANGUAGE_NAME, LanguageMark, type LanguageKey } from "@/components/ui/LanguageMark";
import { getErrorMessage } from "@/lib/api/client";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SiteHeader } from "@/app/_components/home/SiteHeader";
import { SiteFooter } from "@/app/_components/home/SiteFooter";
import styles from "./submissions.module.css";

const PAGE_SIZE = 20;

type Tone = "ok" | "bad" | "warn" | "info";
type Row = SubmissionListResult["items"][number];

// Written out rather than printed raw: WRONG_ANSWER is an enum, not a label.
const VERDICT_META: Record<Verdict, { label: string; tone: Tone }> = {
  ACCEPTED: { label: "Accepted", tone: "ok" },
  WRONG_ANSWER: { label: "Wrong answer", tone: "bad" },
  RUNTIME_ERROR: { label: "Runtime error", tone: "bad" },
  COMPILATION_ERROR: { label: "Compile error", tone: "bad" },
  TIME_LIMIT_EXCEEDED: { label: "Time limit", tone: "warn" },
  MEMORY_LIMIT_EXCEEDED: { label: "Memory limit", tone: "warn" },
  PENDING: { label: "Pending", tone: "info" },
  RUNNING: { label: "Running", tone: "info" },
};

// The order the filter chips appear in; a chip shows only once its verdict
// has happened at least once.
const CHIP_ORDER: Verdict[] = ["ACCEPTED", "WRONG_ANSWER", "TIME_LIMIT_EXCEEDED", "RUNTIME_ERROR", "COMPILATION_ERROR", "MEMORY_LIMIT_EXCEEDED"];

const isVerdict = (value: string | null): value is Verdict => value !== null && value in VERDICT_META;

// "?page=3" → 3; a missing or malformed value → page 1.
const parsePage = (value: string | null) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
};

const dateTime = new Intl.DateTimeFormat(undefined, {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/* ------------------------------------------------------------------ icons */

const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const ICON: Record<Tone | "all" | "search" | "doc" | "folder", ReactNode> = {
  ok: svg(<path d="m7 12.5 3.2 3.2L17 9" />),
  bad: svg(<path d="m8 8 8 8M16 8l-8 8" />),
  warn: svg(<><circle cx="12" cy="12" r="8" /><path d="M12 8v4.5l2.5 1.5" /></>),
  info: svg(<><circle cx="12" cy="12" r="8" /><path d="M12 11v5M12 7.8h.01" /></>),
  all: svg(<path d="M4 6h16M4 12h16M4 18h16" />),
  search: svg(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.8-3.8" /></>),
  doc: svg(<><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4" /></>),
  folder: svg(<><path d="M3.5 7.5V18a1.5 1.5 0 0 0 1.5 1.5h14a1.5 1.5 0 0 0 1.5-1.5V9.5A1.5 1.5 0 0 0 19 8h-7.2L9.8 5.5H5A1.5 1.5 0 0 0 3.5 7v.5Z" /><path d="m10 14.5 1.8 1.8 3.7-3.8" /></>),
};

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const meta = VERDICT_META[verdict] ?? { label: verdict, tone: "info" as Tone };
  return (
    <span className={`${styles.badge} ${styles[`tone_${meta.tone}`]}`}>
      <i>{ICON[meta.tone]}</i>
      {meta.label}
    </span>
  );
}

/* ------------------------------------------------------------------- page */

function SubmissionsContent() {
  const { user } = useAuth();
  const isSignedIn = Boolean(user);
  const searchParams = useSearchParams();
  const page = parsePage(searchParams.get("page"));
  const verdictParam = searchParams.get("verdict");
  const verdict = isVerdict(verdictParam) ? verdictParam : null;
  const query = searchParams.get("q") ?? "";

  const [result, setResult] = useState<SubmissionListResult | null>(null);
  const [counts, setCounts] = useState<SubmissionListResult["counts"]>(undefined);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [searchText, setSearchText] = useState(query);

  // Only the most recent load's response is applied, so quickly paging or
  // typing can't leave an older result on screen.
  const latestRequestRef = useRef(0);

  // Page, verdict and search live in the URL, so a refresh — or coming back
  // from a submission's detail page — lands on the same view. Next.js syncs
  // History API updates into useSearchParams without a server round trip.
  const updateUrl = useCallback((changes: Record<string, string | null>, mode: "push" | "replace" = "push") => {
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(changes)) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    if (url.href === window.location.href) return;
    const target = `${url.pathname}${url.search}${url.hash}`;
    if (mode === "push") window.history.pushState(null, "", target);
    else window.history.replaceState(null, "", target);
  }, []);

  const goToPage = useCallback(
    (nextPage: number, mode: "push" | "replace" = "push") => updateUrl({ page: nextPage > 1 ? String(nextPage) : null }, mode),
    [updateUrl],
  );

  // The ?q= this page wrote itself. Back and forward change ?q= under the
  // input and the input follows — but a value we just wrote is left alone,
  // or it would overwrite whatever was typed since.
  const writtenQueryRef = useRef(query);
  useEffect(() => {
    if (query === writtenQueryRef.current) return;
    writtenQueryRef.current = query;
    setSearchText(query);
  }, [query]);

  // Typing waits a moment before it searches, and starts from page 1.
  useEffect(() => {
    const next = searchText.trim();
    if (next === query) return;
    const timer = window.setTimeout(() => {
      writtenQueryRef.current = next;
      updateUrl({ q: next || null, page: null }, "replace");
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchText, query, updateUrl]);

  useEffect(() => {
    if (!isSignedIn) return;
    const requestId = ++latestRequestRef.current;
    setStatus("loading");
    listSubmissions({ page, limit: PAGE_SIZE, verdict: verdict ?? undefined, search: query || undefined })
      .then((next) => {
        if (requestId !== latestRequestRef.current) return;
        // A stale ?page= past the last page steps back instead of showing
        // an empty state to someone who has submissions.
        if (next.items.length === 0 && next.total > 0 && page > 1) {
          goToPage(Math.min(page - 1, Math.ceil(next.total / PAGE_SIZE)), "replace");
          return;
        }
        setResult(next);
        if (next.counts) setCounts(next.counts);
        setStatus("ready");
      })
      .catch((error) => {
        if (requestId !== latestRequestRef.current) return;
        setErrorMessage(getErrorMessage(error, "Could not load your submissions."));
        setStatus("error");
      });
  }, [isSignedIn, page, verdict, query, goToPage]);

  const rows: Row[] = result?.items ?? [];
  const filtered = Boolean(verdict || query);
  // The headline counts the whole history, whatever filter is showing.
  const allTime = counts ? Object.values(counts).reduce((sum, n) => sum + (n ?? 0), 0) : result?.total ?? 0;
  const countOf = (v: Verdict) => counts?.[v] ?? 0;
  const chips = CHIP_ORDER.filter((v) => countOf(v) > 0);
  const neverSubmitted = status === "ready" && !filtered && allTime === 0;

  const summary = [
    { key: "total", label: "Total submissions", value: allTime, tone: "info" as Tone, icon: ICON.doc },
    { key: "ok", label: "Accepted", value: countOf("ACCEPTED"), tone: "ok" as Tone, icon: ICON.ok },
    { key: "wa", label: "Wrong answer", value: countOf("WRONG_ANSWER"), tone: "bad" as Tone, icon: ICON.bad },
    { key: "re", label: "Runtime error", value: countOf("RUNTIME_ERROR"), tone: "warn" as Tone, icon: ICON.warn },
  ];

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <svg className={styles.heroArt} viewBox="0 0 1200 260" preserveAspectRatio="none" aria-hidden="true">
          <path d="M520 260 C 700 150, 900 90, 1200 60" />
          <path d="M700 260 C 850 190, 1000 150, 1200 140" />
        </svg>
        <div className={`section-shell ${styles.heroInner}`}>
          <span className={styles.heroIcon}>{ICON.folder}</span>
          <div className={styles.heroText}>
            <p className={styles.kicker}>
              <i aria-hidden="true" /> Submissions
            </p>
            <h1>
              Your <span>submission</span> history
            </h1>
            <p className={styles.heroCount}>
              {status === "loading" && !result ? "Loading…" : `${allTime} ${allTime === 1 ? "submission" : "submissions"}`}
            </p>
            <p className={styles.heroNote}>Every attempt brings you closer to mastery. Keep going!</p>
          </div>
          <ul className={styles.summary} aria-label="All-time totals">
            {summary.map((item) => (
              <li key={item.key} className={styles[`tone_${item.tone}`]}>
                <span className={styles.summaryIcon}>{item.icon}</span>
                <b>{item.value}</b>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="section-shell">
        <section className={styles.panel} aria-label="Your submissions">
          <div className={styles.toolbar}>
            <div className={styles.chips} role="group" aria-label="Filter by verdict">
              <button
                type="button"
                className={`${styles.chip}${verdict === null ? ` ${styles.chipOn}` : ""}`}
                aria-pressed={verdict === null}
                onClick={() => updateUrl({ verdict: null, page: null })}
              >
                <i>{ICON.all}</i> All submissions
              </button>
              {chips.map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`${styles.chip} ${styles[`tone_${VERDICT_META[v].tone}`]}${verdict === v ? ` ${styles.chipOn}` : ""}`}
                  aria-pressed={verdict === v}
                  onClick={() => updateUrl({ verdict: verdict === v ? null : v, page: null })}
                >
                  <i>{ICON[VERDICT_META[v].tone]}</i>
                  {VERDICT_META[v].label}
                  <b>{countOf(v)}</b>
                </button>
              ))}
            </div>
            <label className={styles.search}>
              <span className="sr-only">Search submissions</span>
              {ICON.search}
              <input
                type="search"
                value={searchText}
                placeholder="Search by problem name or language…"
                onChange={(event) => setSearchText(event.target.value)}
              />
            </label>
          </div>

          {status === "loading" && !result && <Loader label="Loading submissions…" />}
          {status === "error" && <p className={styles.state}>{errorMessage}</p>}

          {neverSubmitted && (
            <div className={styles.empty}>
              <p>Run a solution from a problem workspace to begin building your history.</p>
              <Link className="button" href="/problems">
                Browse problems <span aria-hidden="true">→</span>
              </Link>
            </div>
          )}

          {status !== "error" && result && !neverSubmitted && rows.length === 0 && (
            <div className={styles.empty}>
              <p>No submissions match {query ? `“${query}”` : "this filter"}.</p>
              <button
                type="button"
                className="button-outline button-small"
                onClick={() => {
                  writtenQueryRef.current = "";
                  setSearchText("");
                  updateUrl({ verdict: null, q: null, page: null });
                }}
              >
                Clear filters
              </button>
            </div>
          )}

          {rows.length > 0 && (
            <div className={`${styles.tableWrap}${status === "loading" ? ` ${styles.busy}` : ""}`} aria-busy={status === "loading"}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Result</th>
                    <th scope="col">Problem</th>
                    <th scope="col">Tests</th>
                    <th scope="col">Score</th>
                    <th scope="col">Language</th>
                    <th scope="col">Submitted</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td data-label="Result">
                        <VerdictBadge verdict={row.verdict} />
                      </td>
                      <td data-label="Problem" className={styles.problemCell}>
                        {row.problem ? (
                          <Link href={`/problems/${row.problem.slug}`}>{row.problem.title}</Link>
                        ) : (
                          <span className={styles.dim}>Removed problem</span>
                        )}
                      </td>
                      <td data-label="Tests" className={styles.num}>
                        {row.passedTests}/{row.totalTests}
                      </td>
                      <td data-label="Score" className={styles.num}>
                        {row.score}
                      </td>
                      <td data-label="Language">
                        <span className={styles.lang}>
                          <LanguageMark language={row.language} />
                          {LANGUAGE_NAME[row.language as LanguageKey] ?? row.language}
                        </span>
                      </td>
                      <td data-label="Submitted" className={styles.when}>
                        <time dateTime={row.createdAt}>{dateTime.format(new Date(row.createdAt))}</time>
                      </td>
                      <td className={styles.actionCell}>
                        <Link className={styles.view} href={`/submissions/${row.id}`}>
                          View <span aria-hidden="true">→</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {status !== "error" && result && (
            <div className={styles.pager}>
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={result.total}
                onPageChange={(nextPage) => goToPage(nextPage)}
                itemLabel="submissions"
                disabled={status === "loading"}
              />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function SubmissionsPage() {
  return (
    <ProtectedRoute>
      <SiteHeader />
      {/* useSearchParams (the ?page= above) needs a Suspense boundary for static prerendering. */}
      <Suspense fallback={<Loader label="Loading submissions…" />}>
        <SubmissionsContent />
      </Suspense>
      <SiteFooter />
    </ProtectedRoute>
  );
}
