"use client";

// Shared layout for every /admin/* page.
//
// A dashboard is its own surface, so there is no marketing header or footer
// here. The frame follows the familiar portal pattern: a topbar that greets
// you and holds the bell and your account, a full-height section rail on
// the left with the way out at its foot, and the page's own head and body
// to the right.

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { useAuth } from "@/providers/AuthProvider";
import type { CurrentUser, UserRole } from "@/types/api";
import {
  IconAlert,
  IconBell,
  IconBulb,
  IconChevronDown,
  IconCode,
  IconGlobe,
  IconGrid,
  IconInbox,
  IconLogOut,
  IconMenu,
  IconRefresh,
  IconTrophy,
  IconUsers,
} from "./icons";
import { useDismiss } from "./useDismiss";
import { usePendingReviews, type PendingReviews } from "./usePendingReviews";
import styles from "./adminShell.module.css";

type PendingKey = keyof PendingReviews;

// `roles` lists who can use a section: guest contest hosts only ever see the
// contest manager (the backend enforces the same split on every endpoint).
// `pending` names the review queue whose count the item carries.
const NAV_ITEMS: {
  href: string;
  label: string;
  icon: typeof IconGrid;
  exact: boolean;
  roles: readonly UserRole[];
  pending?: PendingKey;
}[] = [
  { href: "/admin", label: "Overview", icon: IconGrid, exact: true, roles: ["admin"] },
  { href: "/admin/problems", label: "Problems", icon: IconCode, exact: false, roles: ["admin"] },
  { href: "/admin/users", label: "Users", icon: IconUsers, exact: false, roles: ["admin"] },
  { href: "/admin/contests", label: "Contests", icon: IconTrophy, exact: false, roles: ["admin", "guest"] },
  { href: "/admin/host-requests", label: "Host requests", icon: IconInbox, exact: false, roles: ["admin"], pending: "hostRequests" },
  { href: "/admin/proposals", label: "Proposals", icon: IconBulb, exact: false, roles: ["admin"], pending: "proposals" },
];

interface AdminShellProps {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** A one-line banner above the page head. */
  notice?: ReactNode;
  children: ReactNode;
}

function Avatar({ user, size }: { user: CurrentUser | null; size: number }) {
  if (user?.profilePicUrl) {
    return <Image className={styles.avatar} src={user.profilePicUrl} alt="" width={size} height={size} />;
  }
  return (
    <span className={`${styles.avatar} ${styles.avatarFallback}`} style={{ width: size, height: size }} aria-hidden="true">
      {(user?.name ?? "?").slice(0, 1).toUpperCase()}
    </span>
  );
}

/** Bell with the review queues behind it. */
function ReviewBell({ pending }: { pending: PendingReviews }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, rootRef, triggerRef);

  const hosts = pending.hostRequests ?? 0;
  const proposals = pending.proposals ?? 0;
  const total = hosts + proposals;

  return (
    <div className={styles.popRoot} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.iconButton}${open ? ` ${styles.isOpen}` : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={total > 0 ? `${total} items waiting for review` : "Notifications"}
        onClick={() => setOpen((v) => !v)}
      >
        <IconBell />
        {total > 0 && <span className={styles.bellCount}>{total > 99 ? "99+" : total}</span>}
      </button>
      {open && (
        <div className={`${styles.pop} ${styles.popWide}`}>
          <p className={styles.popHead}>Waiting on you</p>
          {total === 0 ? (
            <p className={styles.popEmpty}>Nothing to review — you&apos;re all caught up.</p>
          ) : (
            <div className={styles.popList}>
              {hosts > 0 && (
                <Link href="/admin/host-requests" onClick={close}>
                  <IconInbox />
                  <span>
                    <b>{hosts} host {hosts === 1 ? "request" : "requests"}</b>
                    <small>People asking to run their own contests</small>
                  </span>
                </Link>
              )}
              {proposals > 0 && (
                <Link href="/admin/proposals" onClick={close}>
                  <IconBulb />
                  <span>
                    <b>{proposals} problem {proposals === 1 ? "proposal" : "proposals"}</b>
                    <small>Problems learners paid gems to suggest</small>
                  </span>
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AccountButton({ user, onSignOut }: { user: CurrentUser | null; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, rootRef, triggerRef);

  return (
    <div className={styles.popRoot} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.account}${open ? ` ${styles.isOpen}` : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Avatar user={user} size={36} />
        <span className={styles.accountName}>{user?.name ?? "Account"}</span>
        <IconChevronDown className={styles.accountCaret} />
      </button>
      {open && (
        <div className={styles.pop} role="menu">
          <div className={styles.popWho}>
            <b>{user?.name}</b>
            <span>{user?.email}</span>
          </div>
          <div className={styles.popList}>
            <Link role="menuitem" href="/profile" onClick={close}>My profile</Link>
            <Link role="menuitem" href="/" onClick={close}>View live site</Link>
            <button type="button" role="menuitem" className={styles.popDanger} onClick={onSignOut}>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminShell({ eyebrow, title, description, actions, notice, children }: AdminShellProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const role: UserRole = user?.role ?? "user";
  const isAdmin = role === "admin";
  const navItems = NAV_ITEMS.filter((item) => item.roles.includes(role));
  const pending = usePendingReviews(isAdmin);
  const [railOpen, setRailOpen] = useState(false);

  // The rail is a drawer on narrow screens: shut it on navigation and on
  // Escape, and keep the page behind it from scrolling while it is open.
  useEffect(() => setRailOpen(false), [pathname]);
  useEffect(() => {
    if (!railOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setRailOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [railOpen]);

  const signOut = async () => {
    try {
      await logout();
    } finally {
      window.location.assign("/");
    }
  };

  const firstName = user?.name?.trim().split(/\s+/)[0];

  return (
    <div className={styles.root}>
      <header className={styles.topbar}>
        <div className={styles.brandCell}>
          <button
            type="button"
            className={`${styles.iconButton} ${styles.railToggle}`}
            aria-label={railOpen ? "Close sections" : "Open sections"}
            aria-expanded={railOpen}
            aria-controls="admin-rail"
            onClick={() => setRailOpen((v) => !v)}
          >
            <IconMenu />
          </button>
          <BrandLogo href={isAdmin ? "/admin" : "/admin/contests"} />
        </div>

        <div className={styles.welcome}>
          <p className={styles.welcomeTitle}>Welcome back{firstName ? `, ${firstName}` : ""}!</p>
          <p className={styles.welcomeSub}>
            {isAdmin ? "Your platform. Your people. All in one place." : "Your contests, all in one place."}
          </p>
        </div>

        <div className={styles.tools}>
          {isAdmin && <ReviewBell pending={pending} />}
          <span className={styles.toolsRule} aria-hidden="true" />
          <AccountButton user={user} onSignOut={() => void signOut()} />
        </div>
      </header>

      {railOpen && <button type="button" className={styles.scrim} aria-label="Close sections" onClick={() => setRailOpen(false)} />}

      <aside id="admin-rail" className={`${styles.rail}${railOpen ? ` ${styles.railOpen}` : ""}`}>
        <p className={styles.railKicker}>{isAdmin ? "Control room" : "Host panel"}</p>
        <nav className={styles.railNav} aria-label="Admin sections">
          {navItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
            const Icon = item.icon;
            const count = item.pending ? pending[item.pending] : null;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.railItem}${isActive ? ` ${styles.railItemActive}` : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon />
                <span>{item.label}</span>
                {count ? <i className={styles.railCount}>{count}</i> : null}
              </Link>
            );
          })}
        </nav>

        <div className={styles.railFoot}>
          <Link href="/" className={styles.railItem}>
            <IconGlobe />
            <span>View site</span>
          </Link>
          <button type="button" className={styles.railItem} onClick={() => void signOut()}>
            <IconLogOut />
            <span>Log out</span>
          </button>
        </div>

        {/* The product's three verbs, set like a sign-off. */}
        <p className={styles.motto} aria-hidden="true">
          <span />
          Solve
          <br />
          Compete
          <br />
          Improve
        </p>
      </aside>

      <main className={styles.main}>
        {notice && <div className={styles.notice}>{notice}</div>}
        <div className={styles.head}>
          <div>
            <p className={styles.eyebrow}>{eyebrow}</p>
            <h1>{title}</h1>
            {description && <p className={styles.desc}>{description}</p>}
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
        {children}
      </main>
    </div>
  );
}

/** Consistent "load failed" banner with the real error message and a retry button. */
export function AdminErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="admin-state admin-state-error">
      <IconAlert />
      <div>
        <p className="admin-state-title">Couldn&apos;t load this.</p>
        <p className="admin-state-detail">{message}</p>
      </div>
      {onRetry && (
        <button type="button" className="icon-button" onClick={onRetry}>
          <IconRefresh /> Retry
        </button>
      )}
    </div>
  );
}

/** Consistent empty-list state. */
export function AdminEmptyState({ message }: { message: ReactNode }) {
  return (
    <div className="admin-state admin-state-empty">
      <IconInbox />
      <p className="admin-state-detail">{message}</p>
    </div>
  );
}

/**
 * Shape-matched loading placeholders for the stat grid and data tables, so a
 * page settles into its real layout instead of jumping from a centered
 * spinner to a full table once data arrives.
 */
export function AdminStatSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="admin-skeleton-stats" role="status" aria-label="Loading stats">
      {Array.from({ length: count }).map((_, index) => (
        <div className="admin-skeleton-stat" key={index}>
          <span className="kai-skeleton" />
          <span className="kai-skeleton" />
          <span className="kai-skeleton" />
        </div>
      ))}
    </div>
  );
}

export function AdminTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="admin-skeleton-table" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, index) => (
        <div className="admin-skeleton-row" key={index}>
          <span className="kai-skeleton" />
          <span className="kai-skeleton" />
          <span className="kai-skeleton" />
          <span className="kai-skeleton" />
        </div>
      ))}
    </div>
  );
}
