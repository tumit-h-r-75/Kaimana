"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { AccountMenu } from "./AccountMenu";
import { NotificationBell } from "./NotificationBell";
import { IconGem } from "./icons";
import { CommandPalette } from "@/components/search/CommandPalette";
import styles from "./siteHeader.module.css";

const Arrow = () => <span aria-hidden="true">→</span>;

const icon = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    {children}
  </svg>
);

interface NavLink {
  href: string;
  label: string;
  icon: ReactNode;
}

/**
 * The same six links for everyone; account-scoped pages (Analytics,
 * Submissions, Admin) live in AccountMenu. Each has an icon for the subject
 * rather than a decoration: code for problems, a trophy for contests.
 */
const PRIMARY_LINKS: NavLink[] = [
  { href: "/problems", label: "Problems", icon: icon(<path d="m8 7-5 5 5 5M16 7l5 5-5 5" />) },
  {
    href: "/contest",
    label: "Contests",
    icon: icon(
      <>
        <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
        <path d="M7 5H4a3 3 0 0 0 3 5.5M17 5h3a3 3 0 0 1-3 5.5M12 14v3M8.5 21h7M9.5 17.5h5l.7 3.5H8.8z" />
      </>,
    ),
  },
  { href: "/leaderboard", label: "Leaderboard", icon: icon(<path d="M4 20h16M7 20v-7M12 20V5M17 20v-10" />) },
  {
    href: "/community",
    label: "Community",
    icon: icon(
      <>
        <circle cx="9" cy="8" r="3.4" />
        <path d="M2.5 20c0-4 3-6.4 6.5-6.4s6.5 2.4 6.5 6.4M16.2 4.3c1.7.5 3 2.1 3 4s-1.3 3.5-3 4M20.5 20c0-3-1.6-5.1-4-6" />
      </>,
    ),
  },
  {
    href: "/interview",
    label: "Interview",
    icon: icon(
      <>
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
      </>,
    ),
  },
  { href: "/kids", label: "Kids", icon: icon(<path d="M2 9.5 12 5l10 4.5-10 4.5zM6 11.3V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.7M22 9.5V15" />) },
];

export function SiteHeader() {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const signedIn = !isLoading && Boolean(user);
  const adminLink =
    user?.role === "admin"
      ? { href: "/admin", label: "Admin dashboard" }
      : user?.role === "guest"
        ? { href: "/admin/contests", label: "Host panel" }
        : null;
  const roleBadge = user?.role === "admin" ? "Admin" : user?.role === "guest" ? "Host" : null;

  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  // Close the drawer on navigation; firm up the bar once the page scrolls.
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await logout();
    } finally {
      setIsSigningOut(false);
      window.location.assign("/");
    }
  };

  return (
    <header className={`${styles.header}${isScrolled ? ` ${styles.scrolled}` : ""}`}>
      <div className={styles.bar}>
        <BrandLogo />

        <nav className={styles.nav} aria-label="Primary navigation">
          {PRIMARY_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={isActive(link.href) ? styles.active : undefined}
              aria-current={isActive(link.href) ? "page" : undefined}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <CommandPalette />
          {signedIn && user ? (
            <>
              {typeof user.gems === "number" && (
                <Link href="/profile" className={styles.gems} title="Gems — earned by solving, spent on hints">
                  <IconGem size={16} /> {user.gems}
                </Link>
              )}
              <NotificationBell user={user} />
              <span className={styles.rule} aria-hidden="true" />
              <AccountMenu
                user={user}
                roleBadge={roleBadge}
                adminLink={adminLink}
                onSignOut={handleSignOut}
                isSigningOut={isSigningOut}
                onOpen={() => setIsMenuOpen(false)}
              />
            </>
          ) : (
            // Kept in the layout, invisibly, while the session check runs, so
            // Sign in never flashes up for a visitor who is signed in.
            <div className={`${styles.guest}${isLoading ? ` ${styles.pending}` : ""}`}>
              <Link className={styles.signIn} href="/signin">
                Sign in
              </Link>
              <Link className="button button-small" href="/signin?mode=register">
                Start free <Arrow />
              </Link>
            </div>
          )}
          <button
            type="button"
            className={`${styles.round} ${styles.toggle}${isMenuOpen ? ` ${styles.isOpen}` : ""}`}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {isMenuOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div id="mobile-nav" className={styles.drawer}>
          <nav aria-label="Mobile navigation">
            {PRIMARY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={isActive(link.href) ? styles.active : undefined}
                aria-current={isActive(link.href) ? "page" : undefined}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </nav>
          {!signedIn && (
            <div className={styles.drawerActions}>
              <Link className="button-outline" href="/signin">
                Sign in
              </Link>
              <Link className="button" href="/signin?mode=register">
                Start free <Arrow />
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
