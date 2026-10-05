"use client";

import Link from "@/components/ui/Link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
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
import {
  Search, SquareSlash, Clock3, MessageSquare, CalendarDays, LayoutGrid,
  List, X, Copy, Check, Zap, CircleCheck, Users, Code2,
} from "lucide-react";
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

const iconProps = { size: 18, strokeWidth: 1.75, "aria-hidden": true } as const;
const ICON = {
  search: <Search {...iconProps} />,
  slashKey: <SquareSlash {...iconProps} />,
  clock: <Clock3 {...iconProps} />,
  comment: <MessageSquare {...iconProps} />,
  calendar: <CalendarDays {...iconProps} />,
  grid: <LayoutGrid {...iconProps} />,
  list: <List {...iconProps} />,
  close: <X {...iconProps} />,
  link: <Copy {...iconProps} />,
  check: <Check {...iconProps} />,
  bolt: <Zap {...iconProps} />,
  accepted: <CircleCheck {...iconProps} />,
  users: <Users {...iconProps} />,
  code: <Code2 {...iconProps} />,
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
