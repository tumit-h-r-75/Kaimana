"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { getProblemTopics, getRecommendations, listProblems, type Recommendations } from "@/lib/api/problems";
import type { Difficulty, ProblemListResult, ProblemSummary, ProblemTopics } from "@/types/api";
import { getErrorMessage } from "@/lib/api/client";
import { compactCount, topicName } from "@/lib/problemFormat";
import NextUpCard from "@/components/problems/NextUpCard";
import { Loader } from "@/components/ui/Loader";
import { Pagination } from "@/components/ui/Pagination";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SiteHeader } from "@/app/_components/home/SiteHeader";
import { SiteFooter } from "@/app/_components/home/SiteFooter";
import styles from "./problems.module.css";

const PAGE_SIZE = 20;
const VIEW_KEY = "kai-problems-view";
const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "EASY", label: "Easy" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HARD", label: "Hard" },
];

const icon = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const ICON = {
  library: icon(<><path d="M5 4h4v16H5zM10 4h4v16h-4z" /><path d="m15.5 5 3.8-1 3 15.5-3.8 1z" /></>),
  check: icon(<><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12.3 2.4 2.4L15.8 10" /></>),
  tag: icon(<><path d="M3.5 12.5v-8h8l9 9-8 8z" /><circle cx="8" cy="8" r="1.4" /></>),
  target: icon(<><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4" /><path d="M12 12h.01" /></>),
  search: icon(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.8-3.8" /></>),
  grid: icon(<><rect x="4" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" /></>),
  list: icon(<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />),
  rate: icon(<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 1.8" /></>),
  people: icon(<><circle cx="9" cy="8" r="3.2" /><path d="M3 19.5c0-3.5 2.7-5.6 6-5.6s6 2.1 6 5.6M16 4.6c1.6.5 2.8 2 2.8 3.7s-1.2 3.2-2.8 3.7M21 19.5c0-2.7-1.4-4.6-3.6-5.4" /></>),
  arrow: icon(<path d="M5 12h14M13 6l6 6-6 6" />),
  all: icon(<><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8 9h8M8 12h8M8 15h5" /></>),
};

const oneOf = <T extends string>(value: string | null, allowed: readonly T[]): T | null =>
  value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : null;
const parsePage = (value: string | null) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
};

function ProblemTile({ problem }: { problem: ProblemSummary }) {
  const rate = problem.acceptanceRate;
  return (
    <Link href={`/problems/${problem.slug}`} className={styles.card}>
      <div className={styles.cardTop}>
        <span className={`${styles.level} ${styles[`level_${problem.difficulty}`]}`}>{problem.difficulty.toLowerCase()}</span>
        {problem.solvedByMe && (
          <span className={styles.solved}>
            {ICON.check} Solved
          </span>
        )}
        <span className={styles.points}>{problem.basePoints} pts</span>
      </div>
      <h3>{problem.title}</h3>
      {problem.excerpt && <p className={styles.excerpt}>{problem.excerpt}</p>}
      {problem.tags.length > 0 && (
        <div className={styles.tags}>
          {problem.tags.slice(0, 3).map((tag) => (
            <span key={tag}>{topicName(tag)}</span>
          ))}
        </div>
      )}
      <div className={styles.cardFoot}>
        <span title="Share of submissions accepted">
          {ICON.rate} {rate === null || rate === undefined ? "New" : `${rate}%`}
        </span>
        <span title="Submissions">
          {ICON.people} {compactCount(problem.submissionCount ?? 0)}
        </span>
        <i className={styles.go}>{ICON.arrow}</i>
      </div>
    </Link>
  );
}

function ProblemsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const page = parsePage(searchParams.get("page"));
  const query = searchParams.get("q") ?? "";
  const difficulty = oneOf(searchParams.get("difficulty"), DIFFICULTIES.map((d) => d.value));
  const topic = searchParams.get("topic") || null;

  const [result, setResult] = useState<ProblemListResult | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [topics, setTopics] = useState<ProblemTopics | null>(null);
  const [reco, setReco] = useState<Recommendations | null | undefined>(undefined);
  const [searchText, setSearchText] = useState(query);
  const [view, setView] = useState<"grid" | "list">("grid");
  const latestRequestRef = useRef(0);

  useEffect(() => {
    getProblemTopics().then(setTopics).catch(() => setTopics(null));
  }, []);
  useEffect(() => {
    if (!user) return;
    getRecommendations()
      .then(setReco)
      .catch(() => setReco(null));
  }, [user]);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(VIEW_KEY) === "list") setView("list");
    } catch {
      // Storage blocked: the grid is fine.
    }
  }, []);
  const chooseView = (next: "grid" | "list") => {
    setView(next);
    try {
      window.localStorage.setItem(VIEW_KEY, next);
    } catch {
      // Not remembered, and that is all.
    }
  };

  // Filters live in the URL, so a refresh or the back button keeps them.
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

  // The input follows ?q= on back/forward, but not a value this page just
  // wrote while the user kept typing (see app/submissions/page.tsx).
  const writtenQueryRef = useRef(query);
  useEffect(() => {
    if (query === writtenQueryRef.current) return;
    writtenQueryRef.current = query;
    setSearchText(query);
  }, [query]);
  useEffect(() => {
    const next = searchText.trim();
    if (next === query) return;
    const timer = window.setTimeout(() => {
      writtenQueryRef.current = next;
      updateUrl({ q: next || null, page: null }, "replace");
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchText, query, updateUrl]);

  useEffect(() => {
    const requestId = ++latestRequestRef.current;
    setStatus("loading");
    listProblems({ search: query || undefined, difficulty: difficulty ?? undefined, tags: topic ?? undefined, page, limit: PAGE_SIZE })
      .then((next) => {
        if (requestId !== latestRequestRef.current) return;
        setResult(next);
        setStatus("ready");
      })
      .catch((error) => {
        if (requestId !== latestRequestRef.current) return;
        setErrorMessage(getErrorMessage(error, "Could not load problems."));
        setStatus("error");
      });
  }, [query, difficulty, topic, page]);

  const setTopic = (next: string | null) => updateUrl({ topic: next, page: null });
  const clearFilters = () => {
    writtenQueryRef.current = "";
    setSearchText("");
    updateUrl({ q: null, difficulty: null, topic: null, page: null });
  };

  const items = result?.items ?? [];
  const total = topics?.total ?? null;
  const readyFor = reco?.stats.readyFor;
  const stats = [
    { key: "total", icon: ICON.library, value: total ?? "—", label: "Problems", note: "In the library" },
    {
      key: "solved",
      icon: ICON.check,
      value: reco ? reco.stats.solved : "—",
      label: "Solved by you",
      note: total ? `of ${total}` : "Accepted at least once",
    },
    { key: "topics", icon: ICON.tag, value: topics ? topics.topics.length : "—", label: "Topics", note: "To practise by" },
    {
      key: "level",
      icon: ICON.target,
      value: readyFor ? readyFor.charAt(0) + readyFor.slice(1).toLowerCase() : "—",
      label: "Ready for",
      note: "From your solves so far",
    },
  ];

  return (
    <main className={styles.page}>
      <section className={`section-shell ${styles.hero}`}>
        <div>
          <p className={styles.kicker}>
            <i aria-hidden="true" /> Practise &amp; improve
          </p>
          <h1>Problems</h1>
          <p className={styles.lede}>
            Sharpen your skills against a real judge. Solve, learn from the coach, and grow with every Accepted.
          </p>
        </div>
        <svg className={styles.heroArt} viewBox="0 0 320 170" aria-hidden="true">
          <path className={styles.artOrbit} d="M10 150 C 80 40, 240 20, 310 80" />
          <rect x="70" y="24" width="190" height="120" rx="16" className={styles.artWindow} />
          <path d="M70 50h190" className={styles.artRule} />
          <circle cx="88" cy="37" r="3.5" className={styles.artDot} />
          <circle cx="100" cy="37" r="3.5" className={styles.artDot} />
          <circle cx="112" cy="37" r="3.5" className={styles.artDot} />
          <rect x="88" y="66" width="52" height="52" rx="12" className={styles.artTile} />
          <path d="m106 83-8 9 8 9M122 83l8 9-8 9" className={styles.artCode} />
          <path d="M156 72h80M156 88h60M156 104h72M156 120h44" className={styles.artText} />
        </svg>
      </section>

      <div className="section-shell">
        <section className={styles.stats} aria-label="The library and you">
          {stats.map((stat) => (
            <div key={stat.key} className={styles.stat}>
              <span className={styles.statIcon}>{stat.icon}</span>
              <div>
                <b>{stat.value}</b>
                <span>{stat.label}</span>
                <small>{stat.note}</small>
              </div>
            </div>
          ))}
        </section>

        {user && <NextUpCard recommendations={reco === undefined ? null : reco} />}

        <div className={styles.toolbar}>
          <label className={styles.search}>
            <span className="sr-only">Search problems</span>
            {ICON.search}
            <input
              type="search"
              value={searchText}
              placeholder="Search problems by title…"
              onChange={(event) => setSearchText(event.target.value)}
            />
          </label>
          <label className={styles.select}>
            <span className="sr-only">Difficulty</span>
            <select value={difficulty ?? ""} onChange={(event) => updateUrl({ difficulty: event.target.value || null, page: null })}>
              <option value="">All difficulties</option>
              {DIFFICULTIES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                  {topics ? ` (${topics.byDifficulty[d.value]})` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className={`${styles.select} ${styles.topicSelect}`}>
            <span className="sr-only">Topic</span>
            <select value={topic ?? ""} onChange={(event) => setTopic(event.target.value || null)}>
              <option value="">All topics</option>
              {(topics?.topics ?? []).map((t) => (
                <option key={t.tag} value={t.tag}>
                  {topicName(t.tag)} ({t.count})
                </option>
              ))}
              {topic && !topics?.topics.some((t) => t.tag === topic) && <option value={topic}>{topicName(topic)}</option>}
            </select>
          </label>
          <div className={styles.viewToggle} role="group" aria-label="Layout">
            <button type="button" aria-pressed={view === "grid"} aria-label="Grid" className={view === "grid" ? styles.viewOn : undefined} onClick={() => chooseView("grid")}>
              {ICON.grid}
            </button>
            <button type="button" aria-pressed={view === "list"} aria-label="List" className={view === "list" ? styles.viewOn : undefined} onClick={() => chooseView("list")}>
              {ICON.list}
            </button>
          </div>
        </div>

        <div className={styles.body}>
          <aside className={styles.topics} aria-label="Topics">
            <p className={styles.topicsHead}>Topics</p>
            <ul>
              <li>
                <button type="button" className={topic === null ? styles.topicOn : undefined} aria-pressed={topic === null} onClick={() => setTopic(null)}>
                  {ICON.all}
                  <span>All problems</span>
                  <b>{total ?? ""}</b>
                </button>
              </li>
              {(topics?.topics ?? []).map((t) => (
                <li key={t.tag}>
                  <button type="button" className={topic === t.tag ? styles.topicOn : undefined} aria-pressed={topic === t.tag} onClick={() => setTopic(t.tag)}>
                    {ICON.tag}
                    <span>{topicName(t.tag)}</span>
                    <b>{t.count}</b>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <div className={styles.results}>
            {status === "loading" && !result && <Loader label="Loading problems…" />}
            {status === "error" && <p className={styles.state}>{errorMessage}</p>}

            {status !== "error" && result && items.length === 0 && (
              <div className={styles.empty}>
                <p>No problems match these filters.</p>
                <button type="button" className="button-outline button-small" onClick={clearFilters}>
                  Clear filters
                </button>
              </div>
            )}

            {items.length > 0 && (
              <div className={`${view === "grid" ? styles.grid : styles.list}${status === "loading" ? ` ${styles.busy}` : ""}`} aria-busy={status === "loading"}>
                {items.map((problem) => (
                  <ProblemTile key={problem.id} problem={problem} />
                ))}
              </div>
            )}

            {status !== "error" && result && (
              <div className={styles.pager}>
                <Pagination
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={result.total}
                  onPageChange={(nextPage) => {
                    updateUrl({ page: nextPage > 1 ? String(nextPage) : null });
                    window.scrollTo({ top: 0 });
                  }}
                  itemLabel="problems"
                  disabled={status === "loading"}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ProblemsPage() {
  return (
    <ProtectedRoute>
      <SiteHeader />
      {/* useSearchParams needs a Suspense boundary for static prerendering. */}
      <Suspense fallback={<Loader label="Loading problems…" />}>
        <ProblemsContent />
      </Suspense>
      <SiteFooter />
    </ProtectedRoute>
  );
}
