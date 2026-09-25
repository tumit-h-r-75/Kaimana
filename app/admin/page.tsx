"use client";

// The admin overview.
//
// It used to open with a feature tour — five tabs explaining what a problem
// manager is to the one person who already knows. That is a page for a
// first visit, and this is a page somebody opens every day, so it now asks
// the three questions a running site actually raises: what needs me, how is
// it going, and where is it stuck.

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { getAdminPulse, getAdminStats, listAdminProblems, listAdminUsers, type AdminPulse } from "@/lib/api/admin";
import { listHostRequests } from "@/lib/api/hosts";
import { listProposals } from "@/lib/api/proposals";
import type { AdminStats } from "@/types/api";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { AdminShell, AdminErrorState } from "@/components/admin/AdminShell";
import { usePendingReviews } from "@/components/admin/usePendingReviews";
import PulseChart from "@/components/admin/PulseChart";
import Sparkline from "@/components/admin/Sparkline";
import { getErrorMessage } from "@/lib/api/client";
import {
  IconBulb,
  IconCheckCircle,
  IconChevronRight,
  IconCode,
  IconGlobe,
  IconGrid,
  IconInbox,
  IconPlus,
  IconPulse,
  IconTrophy,
  IconUsers,
} from "@/components/admin/icons";
import styles from "./dashboard.module.css";

/* ----------------------------------------------------------------- helpers */

const dateFormat = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
const timeFormat = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

/** "4 min ago" while it is still news, a date once it is history. */
function timeAgo(iso: string): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";
  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 90) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return dateFormat.format(new Date(then));
}

// The judge's own words, in the reader's. "TIME_LIMIT_EXCEEDED" is what the
// runner returns; "too slow" is what happened.
const VERDICT_LABEL: Record<string, string> = {
  ACCEPTED: "Accepted",
  WRONG_ANSWER: "Wrong answer",
  TIME_LIMIT_EXCEEDED: "Too slow",
  MEMORY_LIMIT_EXCEEDED: "Out of memory",
  RUNTIME_ERROR: "Crashed",
  COMPILATION_ERROR: "Would not compile",
};

const TIPS = [
  "AI-generated test cases grade nothing until you mark them reviewed — they are left out of judging and of the samples learners see.",
  "The AI test generator runs every input against the problem's reference solution — save one first, or it has nothing to check against.",
  "Hosts can only reach the contest manager. Every other admin endpoint refuses them, whatever the page shows.",
  "A rejected proposal gets its author half the gems back, and your note is shown to them — say what would get it accepted.",
];

/* ---------------------------------------------------------------- the feed */

interface ActivityItem {
  key: string;
  at: string;
  icon: typeof IconGrid;
  title: string;
  detail: string;
  href: string;
}

// The four lists the backend already serves newest-first, merged into one
// feed. Each is fetched on its own so one failing only thins the feed.
async function loadActivity(): Promise<ActivityItem[]> {
  const [users, hosts, proposals, problems] = await Promise.all([
    listAdminUsers({ limit: 5 }).then((r) => r.items).catch(() => []),
    listHostRequests({ status: "all", limit: 5 }).then((r) => r.items).catch(() => []),
    listProposals({ status: "all", limit: 5 }).then((r) => r.items).catch(() => []),
    listAdminProblems({ limit: 5 }).then((r) => r.items).catch(() => []),
  ]);

  const items: ActivityItem[] = [
    ...users.map((u) => ({
      key: `user-${u.id}`,
      at: u.createdAt,
      icon: IconUsers,
      title: "New account",
      detail: `${u.name} · ${u.email}`,
      href: "/admin/users",
    })),
    ...hosts.map((h) => ({
      key: `host-${h.id}`,
      at: h.createdAt,
      icon: IconInbox,
      title: h.status === "pending" ? "Host request waiting" : `Host request ${h.status}`,
      detail: `${h.contestTitle}${h.user ? ` — ${h.user.name}` : ""}`,
      href: "/admin/host-requests",
    })),
    ...proposals.map((p) => ({
      key: `proposal-${p.id}`,
      at: p.submittedAt || p.createdAt,
      icon: IconBulb,
      title: p.status === "pending" ? "Problem proposed" : `Proposal ${p.status}`,
      detail: `${p.title} · ${p.difficulty.toLowerCase()}`,
      href: "/admin/proposals",
    })),
    ...problems.map((p) => ({
      key: `problem-${p.id}`,
      at: p.createdAt,
      icon: IconCode,
      title: p.isPublished ? "Problem added" : "Draft problem added",
      detail: `${p.title} · ${p.difficulty.toLowerCase()}`,
      href: `/admin/problems/${p.id}/edit`,
    })),
  ];

  return items
    .filter((item) => item.at && !Number.isNaN(Date.parse(item.at)))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, 7);
}

/* --------------------------------------------------------------- the queue */

interface QueueItem {
  key: string;
  kind: "host" | "proposal";
  title: string;
  who: string;
  at: string;
  href: string;
}

// Two counts told an admin that something was waiting. The rows tell them
// what it is, which is the difference between a badge and a to-do list.
async function loadQueue(): Promise<QueueItem[]> {
  const [hosts, proposals] = await Promise.all([
    listHostRequests({ status: "pending", limit: 4 }).then((r) => r.items).catch(() => []),
    listProposals({ status: "pending", limit: 4 }).then((r) => r.items).catch(() => []),
  ]);

  return [
    ...hosts.map((h) => ({
      key: `host-${h.id}`,
      kind: "host" as const,
      title: h.contestTitle,
      who: h.user?.name ?? h.organization ?? "Someone",
      at: h.createdAt,
      href: "/admin/host-requests",
    })),
    ...proposals.map((p) => ({
      key: `proposal-${p.id}`,
      kind: "proposal" as const,
      title: p.title,
      who: p.user?.name ?? "A learner",
      at: p.submittedAt || p.createdAt,
      href: "/admin/proposals",
    })),
  ]
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
    .slice(0, 6);
}

/* ------------------------------------------------------------------ pieces */

function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <section className={`${styles.card} ${className}`}>{children}</section>;
}

function CardHead({ title, link }: { title: string; link?: { href: string; label: string } }) {
  return (
    <div className={styles.cardHead}>
      <h2>{title}</h2>
      {link && (
        <Link className={styles.textLink} href={link.href}>
          {link.label} <span aria-hidden="true">→</span>
        </Link>
      )}
    </div>
  );
}

function RowsLoading({ rows = 3, label }: { rows?: number; label?: string }) {
  return (
    <div className={styles.rowsLoading} role={label ? "status" : undefined} aria-label={label}>
      {Array.from({ length: rows }).map((_, index) => (
        <span key={index} className="kai-skeleton" />
      ))}
    </div>
  );
}

/** Why the judge said no, over the last fortnight. */
function VerdictMix({ pulse, className }: { pulse: AdminPulse | null; className?: string }) {
  const rows = pulse?.verdicts ?? [];
  const total = rows.reduce((count, row) => count + row.count, 0);

  return (
    <Card className={className}>
      <CardHead title="How it lands" />
      {!pulse ? (
        <RowsLoading rows={4} />
      ) : total === 0 ? (
        <p className={styles.sideText}>Nothing has been judged in the last two weeks.</p>
      ) : (
        <ul className={styles.verdicts}>
          {rows.map((row) => {
            const share = Math.round((row.count / total) * 100);
            return (
              <li key={row.verdict}>
                <span className={styles.verdictLabel}>{VERDICT_LABEL[row.verdict] ?? row.verdict.toLowerCase()}</span>
                <span className={`${styles.verdictBar} ${row.verdict === "ACCEPTED" ? styles.barGood : styles.barBad}`}>
                  <span style={{ width: `${Math.max(share, 1.5)}%` }} />
                </span>
                <b>{share}%</b>
              </li>
            );
          })}
        </ul>
      )}
      <p className={styles.footnote}>{total > 0 ? `${total.toLocaleString()} runs judged in 14 days` : "The last 14 days"}</p>
    </Card>
  );
}

/** What is actually in the library, by difficulty. */
function LibraryMix({ pulse, className }: { pulse: AdminPulse | null; className?: string }) {
  const library = pulse?.library;
  const bands = [
    { label: "Easy", value: library?.easy ?? 0, className: styles.bandEasy },
    { label: "Medium", value: library?.medium ?? 0, className: styles.bandMedium },
    { label: "Hard", value: library?.hard ?? 0, className: styles.bandHard },
  ];
  const peak = Math.max(1, ...bands.map((band) => band.value));

  return (
    <Card className={className}>
      <CardHead title="The library" link={{ href: "/admin/problems", label: "Manage" }} />
      {!library ? (
        <RowsLoading />
      ) : (
        <>
          <ul className={styles.bands}>
            {bands.map((band) => (
              <li key={band.label}>
                <span className={styles.bandBar}>
                  <span className={band.className} style={{ height: `${(band.value / peak) * 100}%` }} />
                </span>
                <b>{band.value}</b>
                <small>{band.label}</small>
              </li>
            ))}
          </ul>
          <p className={styles.footnote}>
            {library.published} published
            {library.drafts > 0 ? (
              <>
                {" · "}
                <Link className={styles.inlineLink} href="/admin/problems">
                  {library.drafts} still a draft
                </Link>
              </>
            ) : (
              " · no drafts waiting"
            )}
          </p>
        </>
      )}
    </Card>
  );
}

/** The problems people attempt and do not solve. */
function HardestProblems({ pulse, className }: { pulse: AdminPulse | null; className?: string }) {
  const rows = pulse?.hardest ?? [];

  return (
    <Card className={className}>
      <CardHead title="Where people get stuck" link={{ href: "/admin/problems", label: "All problems" }} />
      {!pulse ? (
        <RowsLoading />
      ) : rows.length === 0 ? (
        <p className={styles.sideText}>No problem has been attempted enough times yet to say.</p>
      ) : (
        <ul className={styles.stuck}>
          {rows.map((row) => (
            <li key={row.id}>
              <Link href={`/admin/problems/${row.id}/edit`} className={styles.stuckRow}>
                <span className={styles.feedText}>
                  <b>{row.title}</b>
                  <span>
                    {row.solved} of {row.tried} solved it · {row.attempts} attempts · {row.difficulty.toLowerCase()}
                  </span>
                </span>
                <span className={styles.stuckRate}>
                  <span className={styles.rateMeter}>
                    <span style={{ width: `${Math.max(row.solveRate, 2)}%` }} />
                  </span>
                  <b>{row.solveRate}%</b>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className={styles.footnote}>Solve rate counts people, not submissions — one person trying nine times counts once.</p>
    </Card>
  );
}

/* -------------------------------------------------------------------- page */

function AdminDashboardContent() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pulse, setPulse] = useState<AdminPulse | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [activity, setActivity] = useState<ActivityItem[] | null>(null);
  const [queue, setQueue] = useState<QueueItem[] | null>(null);
  const pending = usePendingReviews(true);

  const load = useCallback(() => {
    setStatus("loading");
    getAdminStats()
      .then((result) => {
        setStats(result);
        setStatus("ready");
      })
      .catch((error) => {
        setErrorMessage(getErrorMessage(error, "Could not load platform stats."));
        setStatus("error");
      });
    // The series is a bonus, not a blocker: a backend that predates the
    // endpoint should still get a working dashboard, minus the charts.
    getAdminPulse()
      .then(setPulse)
      .catch(() => setPulse(null));
  }, []);

  useEffect(load, [load]);

  useEffect(() => {
    let cancelled = false;
    void loadActivity().then((items) => {
      if (!cancelled) setActivity(items);
    });
    void loadQueue().then((items) => {
      if (!cancelled) setQueue(items);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const hosts = pending.hostRequests ?? 0;
  const proposals = pending.proposals ?? 0;
  const waiting = hosts + proposals;
  const acceptance = stats && stats.totalSubmissions > 0 ? Math.round((stats.acceptedSubmissions / stats.totalSubmissions) * 100) : null;
  const days = pulse?.days ?? [];
  const newThisWeek = days.slice(-7).reduce((total, day) => total + day.users, 0);
  const submittedThisWeek = days.slice(-7).reduce((total, day) => total + day.submissions, 0);
  // One tip a day, the same for everyone that day.
  const tip = TIPS[Math.floor(Date.now() / 86_400_000) % TIPS.length];

  const tiles: {
    key: string;
    icon: typeof IconGrid;
    value: number | null;
    suffix?: string;
    label: string;
    note: string;
    href?: string;
    urgent?: boolean;
    spark?: number[];
  }[] = [
    {
      key: "waiting",
      icon: IconInbox,
      value: pending.hostRequests === null && pending.proposals === null ? null : waiting,
      label: "Waiting on you",
      note: waiting === 0 ? "all caught up" : `${hosts} host · ${proposals} proposal${proposals === 1 ? "" : "s"}`,
      href: hosts > 0 ? "/admin/host-requests" : "/admin/proposals",
      urgent: waiting > 0,
    },
    {
      key: "today",
      icon: IconPulse,
      value: stats?.submissionsToday ?? null,
      label: "Submissions today",
      note: submittedThisWeek > 0 ? `${submittedThisWeek} in 7 days` : stats ? `${stats.totalSubmissions} all-time` : "",
      spark: days.map((day) => day.submissions),
    },
    {
      key: "accepted",
      icon: IconCheckCircle,
      value: acceptance,
      suffix: "%",
      label: "Accepted",
      note: stats ? `${stats.acceptedSubmissions} of ${stats.totalSubmissions}` : "",
      spark: days.map((day) => day.accepted),
    },
    {
      key: "users",
      icon: IconUsers,
      value: stats?.totalUsers ?? null,
      label: "Accounts",
      note: newThisWeek > 0 ? `+${newThisWeek} this week` : stats ? `${stats.blockedUsers} blocked` : "",
      href: "/admin/users",
      spark: days.map((day) => day.users),
    },
    {
      key: "problems",
      icon: IconCode,
      value: stats?.totalProblems ?? null,
      label: "Problems",
      note: pulse ? `${pulse.library.drafts} draft${pulse.library.drafts === 1 ? "" : "s"}` : "in the library",
      href: "/admin/problems",
    },
    {
      key: "contests",
      icon: IconTrophy,
      value: stats?.activeContests ?? null,
      label: "Contests",
      note: "running or upcoming",
      href: "/admin/contests",
    },
  ];

  return (
    <AdminShell
      eyebrow="Control room"
      title="Overview"
      description="What needs you, how the judge is doing, and where people are getting stuck."
      actions={
        <>
          <Link className="button button-small" href="/admin/problems/new">
            <IconPlus /> New problem
          </Link>
          <Link className="button-outline button-small" href="/">
            <IconGlobe /> Live site
          </Link>
        </>
      }
    >
      {status === "error" ? (
        <AdminErrorState message={errorMessage} onRetry={load} />
      ) : (
        <div className={styles.tiles} aria-busy={status === "loading"}>
          {tiles.map((tile) => {
            const TileIcon = tile.icon;
            const inner = (
              <>
                <span className={styles.tileTop}>
                  <span className={styles.tileIcon}>
                    <TileIcon />
                  </span>
                  {tile.spark && tile.spark.length > 1 && (
                    <span className={styles.tileSpark}>
                      <Sparkline values={tile.spark} />
                    </span>
                  )}
                  {tile.href && <IconChevronRight className={styles.tileGo} />}
                </span>
                {tile.value === null ? (
                  <span className={`kai-skeleton ${styles.tileSkeleton}`} />
                ) : (
                  <b>
                    {tile.value}
                    {tile.suffix && <i>{tile.suffix}</i>}
                  </b>
                )}
                <span className={styles.tileLabel}>{tile.label}</span>
                {tile.note && <small>{tile.note}</small>}
              </>
            );
            const className = `${styles.tile}${tile.urgent ? ` ${styles.tileUrgent}` : ""}`;
            return tile.href ? (
              <Link key={tile.key} href={tile.href} className={className}>
                {inner}
              </Link>
            ) : (
              <div key={tile.key} className={className}>
                {inner}
              </div>
            );
          })}
        </div>
      )}

      {/* One twelve-column grid rather than a tall main column beside a tall
          rail: the rail always ran out of cards long before the main column
          ran out of page, and left a column of nothing down the right. */}
      <div className={styles.grid}>
        <Card className={`${styles.chartCard} ${styles.spanChart}`}>
          {pulse ? <PulseChart days={pulse.days} /> : <span className={`kai-skeleton ${styles.chartSkeleton}`} role="status" aria-label="Loading activity" />}
        </Card>

        <Card className={`${styles.spanQueue}${waiting > 0 ? ` ${styles.queueCard}` : ""}`}>
          <CardHead title="Needs review" />
          {queue === null ? (
            <RowsLoading />
          ) : queue.length === 0 ? (
            <div className={styles.clear}>
              <IconCheckCircle />
              <p>Nothing is waiting on you. All caught up.</p>
            </div>
          ) : (
            <>
              <ul className={styles.queue}>
                {queue.map((item) => (
                  <li key={item.key}>
                    <Link href={item.href} className={styles.queueRow}>
                      <span className={styles.queueIcon}>{item.kind === "host" ? <IconInbox /> : <IconBulb />}</span>
                      <span className={styles.feedText}>
                        <b>{item.title}</b>
                        <span>
                          {item.who} · {timeAgo(item.at)}
                        </span>
                      </span>
                      <IconChevronRight className={styles.chevron} />
                    </Link>
                  </li>
                ))}
              </ul>
              <Link className={styles.outlineButton} href={hosts > 0 ? "/admin/host-requests" : "/admin/proposals"}>
                Review now <span aria-hidden="true">→</span>
              </Link>
            </>
          )}
        </Card>

        <VerdictMix pulse={pulse} className={styles.spanThird} />
        <LibraryMix pulse={pulse} className={styles.spanThird} />

        <Card className={`${styles.tipCard} ${styles.spanThird}`}>
          <div className={styles.sideRow}>
            <span className={styles.sideIcon}>
              <IconBulb />
            </span>
            <div>
              <h2 className={styles.sideTitle}>Admin tip</h2>
              <p className={styles.sideText}>{tip}</p>
            </div>
          </div>
        </Card>

        <HardestProblems pulse={pulse} className={styles.spanStuck} />

        <Card className={styles.spanFeed}>
          <CardHead title="Recent activity" link={{ href: "/admin/users", label: "All accounts" }} />
          {activity === null ? (
            <RowsLoading rows={4} label="Loading recent activity" />
          ) : activity.length === 0 ? (
            <p className={styles.sideText}>Nothing has happened yet — or the activity could not be loaded.</p>
          ) : (
            <ul className={styles.feed}>
              {activity.map((item) => {
                const ItemIcon = item.icon;
                const at = new Date(item.at);
                return (
                  <li key={item.key}>
                    <Link href={item.href} className={styles.feedRow}>
                      <span className={styles.feedIcon}>
                        <ItemIcon />
                      </span>
                      <span className={styles.feedText}>
                        <b>{item.title}</b>
                        <span>{item.detail}</span>
                      </span>
                      <time className={styles.feedTime} dateTime={item.at}>
                        {dateFormat.format(at)}
                        <small>{timeFormat.format(at)}</small>
                      </time>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </AdminShell>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminRoute>
      <AdminDashboardContent />
    </AdminRoute>
  );
}
