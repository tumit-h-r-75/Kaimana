"use client";

// One box that reaches everything: problems, contests, topics and people.
//
// The site had search on the pages that list things, which only helps once
// you are already on the right page. Ctrl+K (⌘K) opens this from anywhere,
// arrow keys walk the results, Enter goes. With nothing typed it offers the
// places people go most and the last few things they looked for, so an empty
// palette is still useful.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { searchEverything, type SearchResults } from "@/lib/api/search";
import { LANGUAGE_NAME } from "@/components/ui/LanguageMark";
import styles from "./commandPalette.module.css";

const RECENT_KEY = "kai-recent-searches";
const MAX_RECENT = 4;

type Row = { key: string; href: string; label: string; hint?: string; group: string; badge?: string; tone?: string };

const icon = (children: React.ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const ICON = {
  search: icon(<><circle cx="10.5" cy="10.5" r="6.5" /><line x1="15" y1="15" x2="20" y2="20" /></>),
  problem: icon(<><path d="M7 4h10v16H7z" /><path d="M10 9h4M10 13h4" /></>),
  contest: icon(<><circle cx="12" cy="13" r="7" /><path d="M12 9.5V13l2.5 1.5M9 3h6" /></>),
  tag: icon(<><path d="M4 11V5h6l9 9-6 6-9-9Z" /><circle cx="8" cy="8" r="1.2" /></>),
  person: icon(<><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c0-3.6 3-6 7-6s7 2.4 7 6" /></>),
  recent: icon(<><circle cx="12" cy="12" r="8" /><path d="M12 7.5V12l3 1.8" /></>),
  enter: icon(<path d="M20 6v5a3 3 0 0 1-3 3H5m0 0 4-4m-4 4 4 4" />),
};

const QUICK: Row[] = [
  { key: "q-problems", href: "/problems", label: "Problems", hint: "The whole library", group: "Go to" },
  { key: "q-contests", href: "/contests", label: "Contests", hint: "Live and upcoming", group: "Go to" },
  { key: "q-community", href: "/community", label: "Community", hint: "Accepted solutions", group: "Go to" },
  { key: "q-leaderboard", href: "/leaderboard", label: "Leaderboard", hint: "Where you stand", group: "Go to" },
  { key: "q-interview", href: "/interview", label: "Mock interview", hint: "Timed, with feedback", group: "Go to" },
  { key: "q-profile", href: "/profile", label: "Your profile", hint: "Stars, gems, history", group: "Go to" },
];

function readRecent(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string").slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function rememberSearch(term: string) {
  const value = term.trim();
  if (value.length < 2) return;
  try {
    const next = [value, ...readRecent().filter((item) => item.toLowerCase() !== value.toLowerCase())].slice(0, MAX_RECENT);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Not remembered, and that is all.
  }
}

const startsSoon = (contest: { startTime: string; endTime: string }) => {
  const now = Date.now();
  const start = new Date(contest.startTime).getTime();
  const end = new Date(contest.endTime).getTime();
  if (now >= start && now < end) return "live";
  if (start > now) return "upcoming";
  return "finished";
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Ctrl+K / ⌘K from anywhere, and Escape to leave. A shortcut typed into a
  // field belongs to that field, except this one — every editor uses it.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((previous) => !previous);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    setRecent(readRecent());
    setCursor(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 20);
    // The page behind must not scroll while this is over it.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Every keystroke would be a request; 220ms of quiet is one.
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(() => {
      searchEverything(term, controller.signal)
        .then((next) => {
          setResults(next);
          setLoading(false);
          setCursor(0);
        })
        .catch(() => {
          // An aborted request is the normal case here, not a failure.
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 220);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  const rows = useMemo<Row[]>(() => {
    const term = query.trim();
    if (term.length < 2) {
      return [
        ...recent.map((item) => ({ key: `r-${item}`, href: `/problems?q=${encodeURIComponent(item)}`, label: item, group: "Recent", hint: "Searched before" })),
        ...QUICK,
      ];
    }
    if (!results) return [];
    return [
      ...results.problems.map((problem) => ({
        key: `p-${problem.id}`,
        href: `/problems/${problem.slug}`,
        label: problem.title,
        hint: problem.tags.join(" · "),
        badge: problem.difficulty.toLowerCase(),
        tone: problem.difficulty,
        group: "Problems",
      })),
      ...results.contests.map((contest) => ({
        key: `c-${contest.id}`,
        href: `/contests/${contest.slug}`,
        label: contest.title,
        hint: new Date(contest.startTime).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }),
        badge: startsSoon(contest),
        group: "Contests",
      })),
      ...results.tags.map((tag) => ({
        key: `t-${tag}`,
        href: `/problems?topic=${encodeURIComponent(tag)}`,
        label: tag,
        hint: LANGUAGE_NAME[tag as keyof typeof LANGUAGE_NAME] ? "Language" : "Topic",
        group: "Topics",
      })),
      ...results.users.map((user) => ({
        key: `u-${user.id}`,
        href: `/community?q=${encodeURIComponent(user.name)}`,
        label: user.name,
        hint: "Their accepted solutions",
        group: "People",
      })),
    ];
  }, [query, results, recent]);

  const go = useCallback(
    (row: Row) => {
      rememberSearch(query);
      setOpen(false);
      setQuery("");
      router.push(row.href);
    },
    [query, router],
  );

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((previous) => {
        if (!rows.length) return 0;
        const next = event.key === "ArrowDown" ? previous + 1 : previous - 1;
        return (next + rows.length) % rows.length;
      });
    }
    if (event.key === "Enter" && rows[cursor]) {
      event.preventDefault();
      go(rows[cursor]);
    }
  };

  // Keep the highlighted row in view when the arrows run past the edge.
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${cursor}"]`)?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  let lastGroup = "";
  const mounted = typeof document !== "undefined";

  const panel = (
    open ? (
        <div className={styles.backdrop} role="presentation" onClick={(event) => event.target === event.currentTarget && setOpen(false)}>
          <div className={styles.panel} role="dialog" aria-modal="true" aria-label="Search Kaimana">
            <div className={styles.field}>
              {ICON.search}
              <input
                ref={inputRef}
                type="text"
                value={query}
                placeholder="Search problems, contests, topics, people…"
                aria-label="Search Kaimana"
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onKeyDown}
              />
              <button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label="Close search">
                Esc
              </button>
            </div>

            <div className={styles.results} ref={listRef}>
              {loading && rows.length === 0 && <p className={styles.state}>Searching…</p>}
              {!loading && query.trim().length >= 2 && rows.length === 0 && (
                <p className={styles.state}>Nothing matches “{query.trim()}”. Try a topic, or part of a title.</p>
              )}
              {rows.map((row, index) => {
                const header = row.group !== lastGroup ? row.group : null;
                lastGroup = row.group;
                return (
                  <div key={row.key}>
                    {header && <p className={styles.group}>{header}</p>}
                    <Link
                      href={row.href}
                      data-index={index}
                      className={`${styles.row}${index === cursor ? ` ${styles.rowOn}` : ""}`}
                      onMouseEnter={() => setCursor(index)}
                      onClick={(event) => {
                        event.preventDefault();
                        go(row);
                      }}
                    >
                      <span className={styles.rowIcon}>
                        {row.group === "Problems"
                          ? ICON.problem
                          : row.group === "Contests"
                            ? ICON.contest
                            : row.group === "Topics"
                              ? ICON.tag
                              : row.group === "People"
                                ? ICON.person
                                : row.group === "Recent"
                                  ? ICON.recent
                                  : ICON.search}
                      </span>
                      <span className={styles.rowText}>
                        <b>{row.label}</b>
                        {row.hint && <small>{row.hint}</small>}
                      </span>
                      {row.badge && <span className={`${styles.badge}${row.tone ? ` ${styles[`tone_${row.tone}`]}` : ""}`}>{row.badge}</span>}
                      <span className={styles.rowEnter} aria-hidden="true">
                        {ICON.enter}
                      </span>
                    </Link>
                  </div>
                );
              })}
            </div>

            <p className={styles.foot}>
              <span>
                <kbd>↑</kbd> <kbd>↓</kbd> to move
              </span>
              <span>
                <kbd>↵</kbd> to open
              </span>
              <span>
                <kbd>Esc</kbd> to close
              </span>
            </p>
          </div>
        </div>
    ) : null
  );

  return (
    <>
      <button type="button" className={styles.trigger} onClick={() => setOpen(true)} aria-label="Search Kaimana" aria-keyshortcuts="Control+K">
        {ICON.search}
        <span>Search</span>
        <kbd>Ctrl K</kbd>
      </button>
      {mounted && panel ? createPortal(panel, document.body) : null}
    </>
  );
}
