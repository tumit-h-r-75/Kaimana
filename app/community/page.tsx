"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
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
import { useDialog } from "@/providers/DialogProvider";
import styles from "./feed.module.css";

const PAGE_SIZE = 20;
const VIEW_KEY = "kai-community-view";
/** Tags shown on a card; the rest are on the problem's own page. */
const TAG_LIMIT = 3;

const DIFFICULTIES: { value: CommunityDifficulty; label: string }[] = [
  { value: "EASY", label: "Easy" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HARD", label: "Hard" },
];
const LANGUAGES: CommunityLanguage[] = ["python", "cpp", "javascript", "typescript"];
const SORTS: { value: CommunitySort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "fastest", label: "Fastest" },
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

const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const ICON = {
  search: svg(<><circle cx="10.5" cy="10.5" r="6.5" /><line x1="15" y1="15" x2="20" y2="20" /></>),
  slashKey: svg(<><rect x="6" y="6" width="12" height="12" rx="1.5" /><line x1="9" y1="13" x2="15" y2="9" /></>),
  clock: svg(<><circle cx="12" cy="12" r="8" /><line x1="12" y1="6.5" x2="12" y2="12" /><line x1="12" y1="12" x2="15" y2="14.5" /></>),
  comment: svg(<path d="M4 4h16v12h-6l-3 4-3-4H4z" />),
  calendar: svg(<><rect x="4" y="6.25" width="16" height="14" rx="1.5" /><path d="M4 10.25h16" /><line x1="8" y1="3.75" x2="8" y2="6.25" /><line x1="16" y1="3.75" x2="16" y2="6.25" /></>),
  grid: svg(<><rect x="4.5" y="4.5" width="6" height="6" rx="1" /><rect x="13.5" y="4.5" width="6" height="6" rx="1" /><rect x="4.5" y="13.5" width="6" height="6" rx="1" /><rect x="13.5" y="13.5" width="6" height="6" rx="1" /></>),
  list: svg(<><circle cx="4.5" cy="6" r="0.8" /><line x1="9.5" y1="6" x2="20" y2="6" /><circle cx="4.5" cy="12" r="0.8" /><line x1="9.5" y1="12" x2="20" y2="12" /><circle cx="4.5" cy="18" r="0.8" /><line x1="9.5" y1="18" x2="20" y2="18" /></>),
  close: svg(<><line x1="8.5" y1="8.5" x2="15.5" y2="15.5" /><line x1="15.5" y1="8.5" x2="8.5" y2="15.5" /></>),
  link: svg(<><rect x="10.25" y="10.25" width="9.5" height="9.5" rx="1.5" /><path d="M4.25 4.25v9.5M4.25 4.25h9.5" /></>),
  check: svg(<path d="M4 12l8 8L20 4" />),
  bolt: svg(<path d="M12 4 6 10h6L4 20l16-8h-8l8-8Z" />),
  accepted: svg(<><circle cx="12" cy="12" r="8" /><path d="m8 12 3 3 6-6" /></>),
  users: svg(<><circle cx="8.5" cy="7.5" r="3.5" /><path d="M4 20q4.5-10 9 0" /><circle cx="16.5" cy="6.5" r="2.5" /><path d="M15 20q2.5-8 5 0" /></>),
  code: svg(<><path d="M8 6.5 4 12l4 5.5" /><path d="M16 6.5 20 12l-4 5.5" /></>),
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

/* ------------------------------------------------------------------- card */

function SolutionCard({ item, fastest }: { item: CommunityFeedItem; fastest: boolean }) {
  const dialog = useDialog();
  const [copied, setCopied] = useState(false);
  const difficulty = item.problem?.difficulty;
  const tags = (item.problem?.tags ?? []).slice(0, TAG_LIMIT);
  const title = item.problem?.title ?? "Deleted problem";
  const author = item.author?.name ?? "Deleted user";

  // The button lives inside the card, which is itself one big link through
  // the stretched .cardLink — so this has to stop the click from following
  // that link as well.
  const copyLink = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/community/${item.id}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      dialog.toast({ title: "Could not copy the link", message: "Your browser blocked clipboard access.", tone: "warning" });
    }
  };

  return (
    <article className={styles.card}>
      <div className={styles.cardTop}>
        {difficulty && <span className={`${styles.level} ${styles[`level_${difficulty}`]}`}>{difficulty.toLowerCase()}</span>}
        <span className={styles.lang}>
          <LanguageMark language={item.language} />
          {LANGUAGE_NAME[item.language] ?? item.language}
        </span>
        <span className={styles.points}>{item.score} pts</span>
      </div>

      <h3>
        <Link className={styles.cardLink} href={`/community/${item.id}`}>
          {title}
        </Link>
      </h3>

      {tags.length > 0 && (
        <div className={styles.tags}>
          {tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      )}

      <div className={styles.cardFoot}>
        <span className={styles.author}>
          <AuthorAvatar author={item.author} />
          {item.author?.id ? (
            // Above the card's stretched link, which otherwise swallows it.
            <Link className={styles.authorLink} href={`/u/${item.author.id}`} onClick={(event) => event.stopPropagation()}>
              {author}
            </Link>
          ) : (
            <span>{author}</span>
          )}
        </span>
        <span className={styles.fact}>
          {ICON.clock} {item.runtimeMs} ms
        </span>
        {fastest && (
          <span className={styles.fastest}>
            {ICON.bolt} fastest here
          </span>
        )}
        <span className={styles.fact}>
          {ICON.comment} {item.commentCount}
        </span>
        <span className={styles.fact}>
          {ICON.calendar} {formatSubmittedAt(item.createdAt)}
        </span>
        <button
          type="button"
          className={`${styles.copy}${copied ? ` ${styles.copyDone}` : ""}`}
          onClick={copyLink}
          aria-label={copied ? "Link copied" : `Copy link to ${title} by ${author}`}
        >
          {copied ? ICON.check : ICON.link}
        </button>
      </div>
    </article>
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
  const [stuck, setStuck] = useState(false);
  const latestRequestRef = useRef(0);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

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

  // "/" jumps to the search box from anywhere on the page, the way the rest
  // of the developer tools this audience uses behave. It must never steal a
  // slash that is being typed into a field.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = Boolean(target?.closest("input, textarea, select, [contenteditable='true']"));
      if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // The toolbar draws a rule under itself only once it is actually stuck to
  // the header, which a 1px sentinel above it reports without any scroll
  // maths. The toolbar is not sticky on phones, where it would eat the view.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), { threshold: 1 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

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
        setErrorMessage(getErrorMessage(error, "Could not load solutions."));
        setStatus("error");
      });
  }, [page, query, difficulty, language, sort]);

  const items = useMemo(() => result?.items ?? [], [result]);
  const filtered = Boolean(query || difficulty || language);

  // Everything here is counted off what is on screen, which is why the
  // labels say so. The API returns no aggregates beyond the total.
  const stats = useMemo(() => {
    const runtimes = items.map((item) => item.runtimeMs).filter((ms) => Number.isFinite(ms));
    return {
      fastestMs: runtimes.length > 1 ? Math.min(...runtimes) : null,
      solvers: new Set(items.map((item) => item.author?.id).filter(Boolean)).size,
      languages: new Set(items.map((item) => item.language)).size,
    };
  }, [items]);

  const clearFilters = () => {
    writtenQueryRef.current = "";
    setSearchText("");
    updateUrl({ q: null, difficulty: null, language: null, page: null });
  };

  const activeChips = [
    query ? { key: "q", label: "Search", value: `“${query}”` } : null,
    difficulty ? { key: "difficulty", label: "Difficulty", value: DIFFICULTIES.find((d) => d.value === difficulty)?.label ?? difficulty } : null,
    language ? { key: "language", label: "Language", value: LANGUAGE_NAME[language] ?? language } : null,
  ].filter((chip): chip is { key: string; label: string; value: string } => chip !== null);

  const total = result?.total ?? 0;
  const sortLabel = SORTS.find((s) => s.value === sort)?.label ?? "Newest";

  return (
    <main className={styles.page}>
      <section className={`section-shell ${styles.hero}`}>
        <div>
          <p className={styles.kicker}>
            <i aria-hidden="true" /> Community
          </p>
          <h1>
            Public <span>solutions</span>
          </h1>
          <p className={styles.lede}>Browse and discuss every accepted solution from across the platform.</p>
        </div>

        <div className={styles.heroStats}>
          <div className={styles.heroStat}>
            <span className={styles.statIcon}>{ICON.accepted}</span>
            <div>
              <b>{result ? total.toLocaleString() : "—"}</b>
              <span>Accepted solutions</span>
            </div>
          </div>
          <div className={styles.heroStat}>
            <span className={styles.statIcon}>{ICON.bolt}</span>
            <div>
              <b>{stats.fastestMs === null ? "—" : `${stats.fastestMs} ms`}</b>
              <span>Fastest on this page</span>
            </div>
          </div>
          <div className={styles.heroStat}>
            <span className={styles.statIcon}>{ICON.users}</span>
            <div>
              <b>{items.length ? stats.solvers : "—"}</b>
              <span>Solvers on this page</span>
            </div>
          </div>
          <div className={styles.heroStat}>
            <span className={styles.statIcon}>{ICON.code}</span>
            <div>
              <b>
                {items.length ? stats.languages : "—"}
                {items.length ? <small className={styles.statOf}>/ {LANGUAGES.length}</small> : null}
              </b>
              <span>Languages used here</span>
            </div>
          </div>
        </div>
      </section>

      <div className="section-shell">
        <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
        <div className={`${styles.toolbar}${stuck ? ` ${styles.stuck}` : ""}`}>
          <label className={styles.search}>
            <span className="sr-only">Search solutions</span>
            {ICON.search}
            <input
              ref={searchRef}
              type="search"
              value={searchText}
              placeholder="Search problems or solvers…"
              aria-keyshortcuts="/"
              onChange={(event) => setSearchText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape" && searchText) {
                  event.preventDefault();
                  setSearchText("");
                }
              }}
            />
            <span className={styles.searchKey} title="Press / to search" aria-hidden="true">
              {ICON.slashKey}
            </span>
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
          <div className={styles.segment} role="group" aria-label="Sort">
            {SORTS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={sort === option.value}
                className={sort === option.value ? styles.segmentOn : undefined}
                onClick={() => updateUrl({ sort: option.value === "newest" ? null : option.value, page: null })}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className={styles.viewToggle} role="group" aria-label="Layout">
            <button type="button" aria-pressed={view === "grid"} aria-label="Grid" className={view === "grid" ? styles.viewOn : undefined} onClick={() => chooseView("grid")}>
              {ICON.grid}
            </button>
            <button type="button" aria-pressed={view === "list"} aria-label="List" className={view === "list" ? styles.viewOn : undefined} onClick={() => chooseView("list")}>
              {ICON.list}
            </button>
          </div>
        </div>

        {activeChips.length > 0 && (
          <div className={styles.chips}>
            {activeChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                className={styles.chip}
                aria-label={`Remove ${chip.label.toLowerCase()} filter: ${chip.value}`}
                onClick={() => {
                  if (chip.key === "q") {
                    writtenQueryRef.current = "";
                    setSearchText("");
                  }
                  updateUrl({ [chip.key]: null, page: null });
                }}
              >
                <em>{chip.label}:</em> {chip.value}
                {ICON.close}
              </button>
            ))}
            {activeChips.length > 1 && (
              <button type="button" className={styles.chipClear} onClick={clearFilters}>
                Clear all
              </button>
            )}
          </div>
        )}

        {status === "error" ? (
          <p className={styles.state}>{errorMessage}</p>
        ) : (
          <p className={styles.resultsHead}>
            <span>
              <b>{result ? total.toLocaleString() : "—"}</b> {total === 1 ? "solution" : "solutions"}
              {query ? ` matching “${query}”` : ""}
            </span>
            <span>Sorted by {sortLabel.toLowerCase()}</span>
          </p>
        )}

        {status === "loading" && !result && (
          <div className={styles.grid} aria-busy="true" aria-live="polite">
            <span className="sr-only">Loading solutions…</span>
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className={styles.skeleton} aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
            ))}
          </div>
        )}

        {status !== "error" && result && items.length === 0 && (
          <div className={styles.empty}>
            {filtered ? (
              <>
                <p>No solutions match these filters.</p>
                <button type="button" className="button-outline button-small" onClick={clearFilters}>
                  Clear filters
                </button>
              </>
            ) : (
              <p>
                No solutions yet — <Link href="/problems">solve a problem</Link> to open the feed.
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
              <SolutionCard key={item.id} item={item} fastest={stats.fastestMs !== null && item.runtimeMs === stats.fastestMs} />
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
      <Suspense fallback={<Loader label="Loading solutions…" />}>
        <CommunityContent />
      </Suspense>
      <SiteFooter />
    </ProtectedRoute>
  );
}
