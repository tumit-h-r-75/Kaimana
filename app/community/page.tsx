"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  getCommunityFeed,
  type CommunityDifficulty,
  type CommunityFeedItem,
  type CommunityFeedResult,
  type CommunityLanguage,
  type CommunitySort,
} from "@/lib/api/community";
import { Loader } from "@/components/ui/Loader";
import { Pagination } from "@/components/ui/Pagination";
import { LANGUAGE_NAME, LanguageMark } from "@/components/ui/LanguageMark";
import { getErrorMessage } from "@/lib/api/client";
import { SiteHeader } from "@/app/_components/home/SiteHeader";
import { SiteFooter } from "@/app/_components/home/SiteFooter";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import styles from "./feed.module.css";

const PAGE_SIZE = 20;
const VIEW_KEY = "kai-community-view";

const DIFFICULTIES: { value: CommunityDifficulty; label: string }[] = [
  { value: "EASY", label: "Easy" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HARD", label: "Hard" },
];
const LANGUAGES: CommunityLanguage[] = ["python", "cpp", "javascript", "typescript"];
const SORTS: { value: CommunitySort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "fastest", label: "Fastest runtime" },
];

const oneOf = <T extends string>(value: string | null, allowed: readonly T[]): T | null =>
  value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : null;

const parsePage = (value: string | null) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
};

function formatSubmittedAt(iso: string) {
  const date = new Date(iso);
  const diffMinutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/* ------------------------------------------------------------------ icons */

const svg = (children: ReactNode, className?: string) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

// A card's icon comes from its problem's first recognised tag, so a graph
// problem looks like a graph problem at a glance.
const TOPIC_ICONS: { match: string[]; icon: ReactNode }[] = [
  { match: ["graph", "tree", "bfs", "dfs"], icon: svg(<><circle cx="6" cy="7" r="2.5" /><circle cx="18" cy="7" r="2.5" /><circle cx="12" cy="18" r="2.5" /><path d="M8.3 8.3 10.7 16M15.7 8.3 13.3 16M8.5 7h7" /></>) },
  { match: ["dp", "dynamic-programming"], icon: svg(<path d="M4 20h4v-5h4v-5h4V5h4" />) },
  { match: ["matrix", "grid"], icon: svg(<><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 9.3h16M4 14.7h16M9.3 4v16M14.7 4v16" /></>) },
  { match: ["hashmap", "hash", "hash-table"], icon: svg(<path d="M9 4 7.5 20M16.5 4 15 20M4.5 9h15M4 15h15" />) },
  { match: ["string"], icon: svg(<><path d="M5 7h14M5 12h10M5 17h12" /></>) },
  { match: ["math", "bit-manipulation"], icon: svg(<><rect x="5" y="3.5" width="14" height="17" rx="2" /><path d="M8.5 8h7M9 12.5h.01M12 12.5h.01M15 12.5h.01M9 16h.01M12 16h.01M15 16h.01" /></>) },
  { match: ["stack", "heap", "queue"], icon: svg(<><path d="m12 4 8 4-8 4-8-4z" /><path d="m4 12 8 4 8-4M4 16l8 4 8-4" /></>) },
  { match: ["two-pointers", "sliding-window"], icon: svg(<path d="M8 8 4 12l4 4M16 8l4 4-4 4M4 12h16" />) },
  { match: ["binary-search", "sorting", "search"], icon: svg(<><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>) },
  { match: ["backtracking", "recursion"], icon: svg(<><path d="M20 12a8 8 0 1 1-2.3-5.7" /><path d="M20 4v4.5h-4.5" /></>) },
  { match: ["array", "prefix-sum", "implementation"], icon: svg(<><path d="M8 4H5v16h3M16 4h3v16h-3" /><path d="M10 12h.01M14 12h.01" /></>) },
];
const DEFAULT_ICON = svg(<path d="m8 7-5 5 5 5M16 7l5 5-5 5" />);

function topicIcon(tags: string[] | undefined) {
  const lower = (tags ?? []).map((tag) => tag.toLowerCase());
  return TOPIC_ICONS.find((entry) => entry.match.some((m) => lower.includes(m)))?.icon ?? DEFAULT_ICON;
}

const ICON = {
  search: svg(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.8-3.8" /></>),
  clock: svg(<><circle cx="12" cy="12" r="8" /><path d="M12 8v4.5l2.8 1.6" /></>),
  comment: svg(<path d="M5 5.5h14v10H10l-4 3.5v-3.5H5z" />),
  calendar: svg(<><rect x="4" y="5.5" width="16" height="14" rx="2" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></>),
  chevron: svg(<path d="m9 5 7 7-7 7" />),
  grid: svg(<><rect x="4" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" /></>),
  list: svg(<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />),
};

function AuthorAvatar({ author }: { author: { name: string; profilePicUrl?: string } | null }) {
  if (author?.profilePicUrl) {
    // A plain <img>: a profile photo can come from any host a user signed up
    // through, and next/image throws on a host missing from remotePatterns.
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={styles.avatar} src={author.profilePicUrl} alt="" />;
  }
  return <span className={`${styles.avatar} ${styles.avatarFallback}`}>{(author?.name ?? "?").slice(0, 1).toUpperCase()}</span>;
}

function SolutionCard({ item }: { item: CommunityFeedItem }) {
  const difficulty = item.problem?.difficulty;
  return (
    <Link href={`/community/${item.id}`} className={styles.card}>
      <span className={styles.topic}>{topicIcon(item.problem?.tags)}</span>
      <div className={styles.cardBody}>
        <div className={styles.cardTop}>
          <h3>{item.problem?.title ?? "Deleted problem"}</h3>
          {difficulty && <span className={`${styles.level} ${styles[`level_${difficulty}`]}`}>{difficulty.toLowerCase()}</span>}
        </div>
        <div className={styles.who}>
          <span className={styles.author}>
            <AuthorAvatar author={item.author} />
            {item.author?.name ?? "Deleted user"}
          </span>
          <span className={styles.lang}>
            <LanguageMark language={item.language} />
            {LANGUAGE_NAME[item.language] ?? item.language}
          </span>
        </div>
        <div className={styles.meta}>
          <span>
            {ICON.clock} {item.runtimeMs} ms
          </span>
          <span>
            {ICON.comment} {item.commentCount} {item.commentCount === 1 ? "comment" : "comments"}
          </span>
          <span>
            {ICON.calendar} {formatSubmittedAt(item.createdAt)}
          </span>
        </div>
      </div>
      <span className={styles.chevron}>{ICON.chevron}</span>
    </Link>
  );
}

function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | "";
  options: { value: T; label: string }[];
  onChange: (value: T | "") => void;
}) {
  return (
    <label className={styles.select}>
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value as T | "")}>
        {options.map((option) => (
          <option key={option.value || "all"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/* ------------------------------------------------------------------- page */

function CommunityContent() {
  const searchParams = useSearchParams();
  const page = parsePage(searchParams.get("page"));
  const query = searchParams.get("q") ?? "";
  const difficulty = oneOf(searchParams.get("difficulty"), DIFFICULTIES.map((d) => d.value));
  const language = oneOf(searchParams.get("language"), LANGUAGES);
  const sort = oneOf(searchParams.get("sort"), SORTS.map((s) => s.value)) ?? "newest";

  const [result, setResult] = useState<CommunityFeedResult | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [searchText, setSearchText] = useState(query);
  const [view, setView] = useState<"grid" | "list">("grid");
  const latestRequestRef = useRef(0);

  // The chosen layout is a per-viewer convenience; it may not be readable.
  useEffect(() => {
    try {
      if (window.localStorage.getItem(VIEW_KEY) === "list") setView("list");
    } catch {
      // Private mode or blocked storage: the grid is fine.
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

  // See app/submissions/page.tsx: the input follows ?q= on back/forward,
  // but not a value this page just wrote while the user kept typing.
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
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchText, query, updateUrl]);

  useEffect(() => {
    const requestId = ++latestRequestRef.current;
    setStatus("loading");
    getCommunityFeed({
      page,
      limit: PAGE_SIZE,
      search: query || undefined,
      difficulty: difficulty ?? undefined,
      language: language ?? undefined,
      sort,
    })
      .then((next) => {
        if (requestId !== latestRequestRef.current) return;
        setResult(next);
        setStatus("ready");
      })
      .catch((error) => {
        if (requestId !== latestRequestRef.current) return;
        setErrorMessage(getErrorMessage(error, "Could not load the community feed."));
        setStatus("error");
      });
  }, [page, query, difficulty, language, sort]);

  const items = result?.items ?? [];
  const filtered = Boolean(query || difficulty || language);

  return (
    <main className={styles.page}>
      <section className={`section-shell ${styles.hero}`}>
        <div>
          <p className={styles.kicker}>
            <i aria-hidden="true" /> Community
          </p>
          <h1>
            Accepted <span>solutions</span>
          </h1>
          <p className={styles.lede}>
            Every accepted submission from every solver, in one public feed — browse approaches, and discuss them.
          </p>
        </div>

        <svg className={styles.heroArt} viewBox="0 0 300 170" aria-hidden="true">
          <path className={styles.artOrbit} d="M20 150 C 70 60, 230 30, 290 90" />
          <rect x="30" y="40" width="58" height="52" rx="12" className={styles.artTile} />
          <path d="m50 58-8 8 8 8M68 58l8 8-8 8" className={styles.artCode} />
          <rect x="104" y="22" width="148" height="56" rx="12" className={styles.artCard} />
          <circle cx="124" cy="42" r="5" className={styles.artDot} />
          <path d="M138 42h70M122 60h96" className={styles.artLine} />
          <rect x="120" y="92" width="130" height="56" rx="12" className={styles.artCard} />
          <path d="M138 112h60M138 128h84" className={styles.artLine} />
          <circle cx="252" cy="94" r="13" className={styles.artPlusBg} />
          <path d="M252 88v12M246 94h12" className={styles.artPlus} />
        </svg>
      </section>

      <div className="section-shell">
        <div className={styles.toolbar}>
          <label className={styles.search}>
            <span className="sr-only">Search solutions</span>
            {ICON.search}
            <input
              type="search"
              value={searchText}
              placeholder="Search problems or solvers…"
              onChange={(event) => setSearchText(event.target.value)}
            />
          </label>
          <Select
            label="Difficulty"
            value={difficulty ?? ""}
            options={[{ value: "" as const, label: "All difficulties" }, ...DIFFICULTIES]}
            onChange={(value) => updateUrl({ difficulty: value || null, page: null })}
          />
          <Select
            label="Language"
            value={language ?? ""}
            options={[{ value: "" as const, label: "All languages" }, ...LANGUAGES.map((l) => ({ value: l, label: LANGUAGE_NAME[l] }))]}
            onChange={(value) => updateUrl({ language: value || null, page: null })}
          />
          <Select
            label="Sort"
            value={sort}
            options={SORTS.map((s) => ({ ...s, label: `Sort: ${s.label}` }))}
            onChange={(value) => updateUrl({ sort: value && value !== "newest" ? value : null, page: null })}
          />
          <div className={styles.viewToggle} role="group" aria-label="Layout">
            <button type="button" aria-pressed={view === "grid"} aria-label="Grid" className={view === "grid" ? styles.viewOn : undefined} onClick={() => chooseView("grid")}>
              {ICON.grid}
            </button>
            <button type="button" aria-pressed={view === "list"} aria-label="List" className={view === "list" ? styles.viewOn : undefined} onClick={() => chooseView("list")}>
              {ICON.list}
            </button>
          </div>
        </div>

        {status === "loading" && !result && <Loader label="Loading community feed…" />}
        {status === "error" && <p className={styles.state}>{errorMessage}</p>}

        {status !== "error" && result && items.length === 0 && (
          <div className={styles.empty}>
            {filtered ? (
              <>
                <p>No accepted solutions match these filters.</p>
                <button
                  type="button"
                  className="button-outline button-small"
                  onClick={() => {
                    writtenQueryRef.current = "";
                    setSearchText("");
                    updateUrl({ q: null, difficulty: null, language: null, page: null });
                  }}
                >
                  Clear filters
                </button>
              </>
            ) : (
              <p>
                No accepted solutions yet — <Link href="/problems">be the first to solve a problem</Link>.
              </p>
            )}
          </div>
        )}

        {items.length > 0 && (
          <div
            className={`${view === "grid" ? styles.grid : styles.list}${status === "loading" ? ` ${styles.busy}` : ""}`}
            aria-busy={status === "loading"}
          >
            {items.map((item) => (
              <SolutionCard key={item.id} item={item} />
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
              itemLabel="solutions"
              disabled={status === "loading"}
            />
          </div>
        )}
      </div>
    </main>
  );
}

export default function CommunityPage() {
  return (
    <ProtectedRoute>
      <SiteHeader />
      <Suspense fallback={<Loader label="Loading community feed…" />}>
        <CommunityContent />
      </Suspense>
      <SiteFooter />
    </ProtectedRoute>
  );
}
