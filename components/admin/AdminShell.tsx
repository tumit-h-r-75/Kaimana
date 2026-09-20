"use client";

// Shared layout for every /admin/* page.
//
// The marketing SiteHeader used to sit on top of this, which meant the
// control room carried a nav bar advertising Problems, Contests and Kids to
// someone who came here to moderate them — and a "Start coding" button next
// to a user table. A dashboard is its own surface: a thin bar with the mark
// and the way out, a persistent section rail, and the page's own head. No
// marketing chrome, and no footer.

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { useAuth } from "@/providers/AuthProvider";
import type { UserRole } from "@/types/api";
import { IconGrid, IconCode, IconUsers, IconTrophy, IconAlert, IconInbox, IconRefresh, IconBulb } from "./icons";

// Sections used to carry a colour each — orange, cyan, violet, green. The
// rebrand collapsed cyan, violet and green into the one accent, so three of
// the four had become the same swatch and the mapping was decoration
// pretending to be information. The active state carries it now.
//
// `roles` lists who can use a section: guest contest hosts only ever see the
// contest manager (the backend enforces the same split on every endpoint).
const NAV_ITEMS: { href: string; label: string; icon: typeof IconGrid; exact: boolean; roles: readonly UserRole[] }[] = [
  { href: "/admin", label: "Overview", icon: IconGrid, exact: true, roles: ["admin"] },
  { href: "/admin/problems", label: "Problems", icon: IconCode, exact: false, roles: ["admin"] },
  { href: "/admin/users", label: "Users", icon: IconUsers, exact: false, roles: ["admin"] },
  { href: "/admin/contests", label: "Contests", icon: IconTrophy, exact: false, roles: ["admin", "guest"] },
  { href: "/admin/host-requests", label: "Host requests", icon: IconInbox, exact: false, roles: ["admin"] },
  { href: "/admin/proposals", label: "Proposals", icon: IconBulb, exact: false, roles: ["admin"] },
];

interface AdminShellProps {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

export function AdminShell({ eyebrow, title, description, actions, children }: AdminShellProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const role: UserRole = user?.role ?? "user";
  const navItems = NAV_ITEMS.filter((item) => item.roles.includes(role));
  const active = navItems.find((item) => (item.exact ? pathname === item.href : pathname?.startsWith(item.href)));

  return (
    <div className="admin-root">
      {/* Just the mark, where you are, and who you are. Anything else here
          is a link away from the job the page exists for. */}
      <header className="admin-topbar">
        <BrandLogo href="/admin" />
        <span className="admin-topbar-scope">
          {role === "guest" ? "Host panel" : "Control room"}
          {active && <b>{active.label}</b>}
        </span>
        <div className="admin-topbar-user">
          {user?.name && <span className="admin-topbar-name">{user.name}</span>}
          <Link href="/" className="admin-topbar-link">View site</Link>
          <button type="button" className="admin-topbar-link" onClick={() => void logout()}>
            Sign out
          </button>
        </div>
      </header>

      <div className="admin-shell">
        <aside className="admin-sidebar">
          <p className="admin-sidebar-kicker">{role === "guest" ? "Host panel" : "Control room"}</p>
          <nav aria-label="Admin sections">
            {navItems.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`admin-nav-item${isActive ? " is-active" : ""}`}
                >
                  <Icon />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Link href="/" className="admin-sidebar-exit">
            ← Back to site
          </Link>
        </aside>

        <main className="admin-main">
          <div className="admin-main-head">
            <div>
              <p className="eyebrow">{eyebrow}</p>
              <h1>{title}</h1>
              {description && <p className="admin-main-desc">{description}</p>}
            </div>
            {actions && <div className="admin-main-actions">{actions}</div>}
          </div>
          {children}
        </main>
      </div>
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
