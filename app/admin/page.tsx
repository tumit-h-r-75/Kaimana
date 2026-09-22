"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { getAdminStats, listAdminProblems, listAdminUsers } from "@/lib/api/admin";
import { listHostRequests } from "@/lib/api/hosts";
import { listProposals } from "@/lib/api/proposals";
import type { AdminStats } from "@/types/api";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { AdminShell, AdminErrorState } from "@/components/admin/AdminShell";
import { usePendingReviews } from "@/components/admin/usePendingReviews";
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

/* ------------------------------------------------------------ the sections */

type TabId = "problems" | "users" | "contests" | "hosting" | "proposals";

interface Section {
  id: TabId;
  label: string;
  icon: typeof IconGrid;
  title: string;
  body: string;
  cta: { href: string; label: string };
  secondary?: { href: string; label: string };
  can: string[];
}

// What each manager actually does — every line here is a control that
// exists on that page, so the list doubles as a map of the admin.
const SECTIONS: Section[] = [
  {
    id: "problems",
    label: "Problems",
    icon: IconCode,
    title: "Problem library",
    body: "Write, test and publish the challenges learners solve. A problem reaches learners the moment it is published.",
    cta: { href: "/admin/problems", label: "Open problem manager" },
    secondary: { href: "/admin/problems/new", label: "New problem" },
    can: [
      "Write statements, limits and starter code",
      "Generate test cases, each run against your reference solution",
      "Check AI-generated cases before they count",
      "Publish, unpublish or delete a problem",
    ],
  },
  {
    id: "users",
    label: "Users",
    icon: IconUsers,
    title: "People",
    body: "Everyone with an account, newest first. Find a learner, change what they can do, or stop an account that is causing harm.",
    cta: { href: "/admin/users", label: "Open user manager" },
    can: [
      "Search by name or email",
      "Filter to learners, hosts or admins",
      "Make someone a contest host or an admin",
      "Block and unblock accounts",
    ],
  },
  {
    id: "contests",
    label: "Contests",
    icon: IconTrophy,
    title: "Contests",
    body: "Schedule timed rounds from the problem library — including the ones approved hosts run themselves.",
    cta: { href: "/admin/contests", label: "Open contest manager" },
    can: [
      "Set a start and an end time",
      "Pick the problems a contest uses",
      "Edit or delete any contest",
      "See every contest hosts have created",
    ],
  },
  {
    id: "hosting",
    label: "Host requests",
    icon: IconInbox,
    title: "Host requests",
    body: "People asking to run their own contests on Kaimana. Approving one gives that account the contest manager and nothing else.",
    cta: { href: "/admin/host-requests", label: "Review host requests" },
    can: [
      "Read the contest each host plans to run",
      "Approve, to grant host access",
      "Reject, with a note the requester sees",
      "Hosts only ever see the contest manager",
    ],
  },
  {
    id: "proposals",
    label: "Proposals",
    icon: IconBulb,
    title: "Problem proposals",
    body: "Problems suggested by learners, who spend gems to send one in. A good one becomes part of the library.",
    cta: { href: "/admin/proposals", label: "Review proposals" },
    can: [
      "Read the statement, tests and reference solution",
      "Accept it as a published problem or a draft",
      "Reject with a note — part of the gems go back",
      "See what each proposal cost its author",
    ],
  },
];

const TIPS = [
  "AI-generated test cases grade nothing until you mark them reviewed — they are left out of judging and of the samples learners see.",
  "The AI test generator runs every input against the problem's reference solution — save one first, or it has nothing to check against.",
  "Hosts can only reach the contest manager. Every other admin endpoint refuses them, whatever the page shows.",
  "A rejected proposal gets its author half the gems back, and your note is shown to them — say what would get it accepted.",
];

/* ---------------------------------------------------------------- activity */

interface ActivityItem {
  key: string;
  at: string;
  icon: typeof IconGrid;
  title: string;
  detail: string;
  href: string;
}

const dateFormat = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });
const timeFormat = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

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

/* -------------------------------------------------------------------- page */

function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <section className={`${styles.card} ${className}`}>{children}</section>;
}

function SectionTabs({ stats, pending }: { stats: AdminStats | null; pending: ReturnType<typeof usePendingReviews> }) {
  const [activeId, setActiveId] = useState<TabId>("problems");
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const active = SECTIONS.find((s) => s.id === activeId) ?? SECTIONS[0];
  const Icon = active.icon;

  // A figure for the tab's own subject, where the stats have one.
  const figure: Record<TabId, string | null> = {
    problems: stats ? `${stats.totalProblems} in the library` : null,
    users: stats ? `${stats.totalUsers} accounts · ${stats.blockedUsers} blocked` : null,
    contests: stats ? `${stats.activeContests} running or upcoming` : null,
    hosting: pending.hostRequests !== null ? `${pending.hostRequests} waiting` : null,
    proposals: pending.proposals !== null ? `${pending.proposals} waiting` : null,
  };

  // Arrow keys move between tabs, as the tabs pattern expects.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const index = SECTIONS.findIndex((s) => s.id === activeId);
    const step = event.key === "ArrowRight" ? 1 : -1;
    const next = SECTIONS[(index + step + SECTIONS.length) % SECTIONS.length];
    setActiveId(next.id);
    tabRefs.current[next.id]?.focus();
  };

  return (
    <div className={styles.tabs}>
      <div className={styles.tabList} role="tablist" aria-label="Admin sections" onKeyDown={onKeyDown}>
        {SECTIONS.map((section) => {
          const selected = section.id === activeId;
          const waiting = section.id === "hosting" ? pending.hostRequests : section.id === "proposals" ? pending.proposals : null;
          return (
            <button
              key={section.id}
              ref={(node) => {
                tabRefs.current[section.id] = node;
              }}
              type="button"
              role="tab"
              id={`tab-${section.id}`}
              aria-selected={selected}
              aria-controls="section-panel"
              tabIndex={selected ? 0 : -1}
              className={`${styles.tab}${selected ? ` ${styles.tabActive}` : ""}`}
              onClick={() => setActiveId(section.id)}
            >
              {section.label}
              {waiting ? <i className={styles.tabCount}>{waiting}</i> : null}
            </button>
          );
        })}
      </div>

      <div className={styles.panel} role="tabpanel" id="section-panel" aria-labelledby={`tab-${active.id}`}>
        {/* A note in the margin, in the product's own voice. */}
        <p className={styles.marginNote} aria-hidden="true">
          {"// keep the judge honest"}
          <svg viewBox="0 0 160 14" preserveAspectRatio="none">
            <path d="M2 10 C 40 2, 90 2, 158 8" />
          </svg>
        </p>

        <div className={styles.panelMain}>
          <span className={styles.panelIcon}>
            <Icon />
          </span>
          <h2>{active.title}</h2>
          <p className={styles.panelBody}>{active.body}</p>
          {figure[active.id] && <p className={styles.panelFigure}>{figure[active.id]}</p>}
          <div className={styles.panelActions}>
            <Link className="button" href={active.cta.href}>
              {active.cta.label} <span aria-hidden="true">→</span>
            </Link>
            {active.secondary && (
              <Link className="button-outline" href={active.secondary.href}>
                <IconPlus /> {active.secondary.label}
              </Link>
            )}
          </div>
        </div>

        <div className={styles.panelSide}>
          <h3>What you can do</h3>
          <ul className={styles.canList}>
            {active.can.map((line) => (
              <li key={line}>
                <IconCheckCircle />
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function AdminDashboardContent() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [activity, setActivity] = useState<ActivityItem[] | null>(null);
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
  }, []);

  useEffect(load, [load]);

  useEffect(() => {
    let cancelled = false;
    void loadActivity().then((items) => {
      if (!cancelled) setActivity(items);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const hosts = pending.hostRequests ?? 0;
  const proposals = pending.proposals ?? 0;
  const waiting = hosts + proposals;
  const acceptance = stats && stats.totalSubmissions > 0 ? Math.round((stats.acceptedSubmissions / stats.totalSubmissions) * 100) : null;
  // One tip a day, the same for everyone that day.
  const tip = TIPS[Math.floor(Date.now() / 86_400_000) % TIPS.length];

  const tiles = [
    { icon: IconUsers, value: stats?.totalUsers, label: "Accounts", note: stats ? `${stats.blockedUsers} blocked` : "" },
    { icon: IconCode, value: stats?.totalProblems, label: "Problems", note: "in the library" },
    { icon: IconPulse, value: stats?.submissionsToday, label: "Submissions today", note: stats ? `${stats.totalSubmissions} all-time` : "" },
    { icon: IconTrophy, value: stats?.activeContests, label: "Contests", note: "running or upcoming" },
  ];

  return (
    <AdminShell
      eyebrow="Control room"
      title="Overview"
      description="The judge, the library and the people using them — everything that needs you, from one place."
      notice={
        <>
          <span>You&apos;re signed in as an admin. Changes made here reach every learner straight away.</span>
          <Link href="/">View the live site →</Link>
        </>
      }
    >
      <div className={styles.layout}>
        <div className={styles.primary}>
          {status === "error" ? (
            <AdminErrorState message={errorMessage} onRetry={load} />
          ) : (
            <div className={styles.tiles} aria-busy={status === "loading"}>
              {tiles.map((tile) => {
                const TileIcon = tile.icon;
                return (
                  <div key={tile.label} className={styles.tile}>
                    <span className={styles.tileIcon}>
                      <TileIcon />
                    </span>
                    <div>
                      {status === "loading" ? (
                        <span className={`kai-skeleton ${styles.tileSkeleton}`} />
                      ) : (
                        <b>{tile.value ?? "—"}</b>
                      )}
                      <span>{tile.label}</span>
                      {tile.note && <small>{tile.note}</small>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <SectionTabs stats={stats} pending={pending} />
        </div>

        <aside className={styles.side} aria-label="At a glance">
          <Card>
            <h2 className={styles.sideTitle}>Needs review</h2>
            <p className={styles.sideText}>
              {pending.hostRequests === null && pending.proposals === null
                ? "Checking the review queues…"
                : waiting === 0
                  ? "Nothing is waiting on you. All caught up."
                  : `${waiting} ${waiting === 1 ? "item is" : "items are"} waiting for a decision.`}
            </p>
            {waiting > 0 && (
              <ul className={styles.queue}>
                {hosts > 0 && (
                  <li>
                    <span>Host requests</span>
                    <b>{hosts}</b>
                  </li>
                )}
                {proposals > 0 && (
                  <li>
                    <span>Proposals</span>
                    <b>{proposals}</b>
                  </li>
                )}
              </ul>
            )}
            <Link className={styles.outlineButton} href={hosts > 0 ? "/admin/host-requests" : "/admin/proposals"}>
              {waiting > 0 ? "Review now" : "Open the queues"} <span aria-hidden="true">→</span>
            </Link>
          </Card>

          <Card>
            <div className={styles.sideRow}>
              <span className={styles.sideIcon}>
                <IconPulse />
              </span>
              <div>
                <h2 className={styles.sideTitle}>Judge health</h2>
                {acceptance === null ? (
                  <p className={styles.sideText}>{stats ? "No submissions yet." : "Loading…"}</p>
                ) : (
                  <>
                    <p className={styles.bigFigure}>
                      {acceptance}
                      <small>% accepted</small>
                    </p>
                    <div className={styles.meter} role="img" aria-label={`${acceptance}% of submissions accepted`}>
                      <span style={{ width: `${acceptance}%` }} />
                    </div>
                    <p className={styles.sideText}>
                      {stats?.acceptedSubmissions} of {stats?.totalSubmissions} submissions passed every test.
                    </p>
                  </>
                )}
                <Link className={styles.textLink} href="/leaderboard">
                  View leaderboard <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </Card>

          <Card className={styles.tipCard}>
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
        </aside>
      </div>

      <div className={styles.lower}>
        <Card>
          <div className={styles.cardHead}>
            <h2>Recent activity</h2>
            <Link className={styles.textLink} href="/admin/users">
              All accounts <span aria-hidden="true">→</span>
            </Link>
          </div>
          {activity === null ? (
            <div className={styles.feedLoading} role="status" aria-label="Loading recent activity">
              {Array.from({ length: 4 }).map((_, i) => (
                <span key={i} className="kai-skeleton" />
              ))}
            </div>
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

        <Card>
          <div className={styles.cardHead}>
            <h2>Quick links</h2>
          </div>
          <ul className={styles.links}>
            {[
              { href: "/admin/problems/new", icon: IconPlus, title: "Create a problem", text: "Statement, limits, tests and starter code." },
              { href: "/admin/contests", icon: IconTrophy, title: "Schedule a contest", text: "Pick the problems and the time window." },
              { href: "/admin/users", icon: IconUsers, title: "Manage accounts", text: "Roles, hosts and blocked users." },
              { href: "/admin/proposals", icon: IconBulb, title: "Review proposals", text: "Problems learners want to add." },
              { href: "/", icon: IconGlobe, title: "View the live site", text: "See it the way learners do." },
            ].map((link) => {
              const LinkIcon = link.icon;
              return (
                <li key={link.href}>
                  <Link href={link.href} className={styles.linkRow}>
                    <span className={styles.feedIcon}>
                      <LinkIcon />
                    </span>
                    <span className={styles.feedText}>
                      <b>{link.title}</b>
                      <span>{link.text}</span>
                    </span>
                    <IconChevronRight className={styles.chevron} />
                  </Link>
                </li>
              );
            })}
          </ul>
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
