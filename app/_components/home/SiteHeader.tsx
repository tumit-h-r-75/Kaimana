"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { AccountMenu } from "./AccountMenu";

const Arrow = () => <span aria-hidden="true">→</span>;

interface NavLink {
  href: string;
  label: string;
}

/**
 * The same six links for everyone. Interview used to appear only after
 * signing in, which hid the feature from exactly the people deciding whether
 * to sign up; the page itself sends a signed-out visitor to /signin.
 * Account-scoped pages (Analytics, Submissions, Admin) live in AccountMenu.
 */
const PRIMARY_LINKS: NavLink[] = [
  { href: "/problems", label: "Problems" },
  { href: "/contest", label: "Contests" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/community", label: "Community" },
  { href: "/interview", label: "Interview" },
  { href: "/kids", label: "Kids" },
];

export function SiteHeader() {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const signedIn = !isLoading && Boolean(user);
  const adminLink: NavLink | null =
    user?.role === "admin"
      ? { href: "/admin", label: "Admin dashboard" }
      : user?.role === "guest"
        ? { href: "/admin/contests", label: "Host panel" }
        : null;
  const roleBadge = user?.role === "admin" ? "Admin" : user?.role === "guest" ? "Host" : null;

  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  // Close the drawer on navigation, and lift the header off the page with a
  // shadow once it has scrolled.
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
    <header className={`site-header${isScrolled ? " is-scrolled" : ""}`}>
      <BrandLogo />

      <nav className="site-nav" aria-label="Primary navigation">
        {PRIMARY_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={isActive(link.href) ? "is-active" : undefined}
            aria-current={isActive(link.href) ? "page" : undefined}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="header-actions">
        {signedIn && user ? (
          <AccountMenu
            user={user}
            roleBadge={roleBadge}
            adminLink={adminLink}
            onSignOut={handleSignOut}
            isSigningOut={isSigningOut}
            onOpen={() => setIsMenuOpen(false)}
          />
        ) : (
          // Kept in the layout, invisibly, while the session check runs —
          // see .header-guest.is-pending.
          <div className={`header-guest${isLoading ? " is-pending" : ""}`}>
            <Link className="sign-in" href="/signin">Sign in</Link>
            <Link className="button button-small" href="/signin?mode=register">
              Start free <Arrow />
            </Link>
          </div>
        )}
        <button
          type="button"
          className={`nav-toggle${isMenuOpen ? " is-open" : ""}`}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-nav"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span /><span /><span />
        </button>
      </div>

      <div id="mobile-nav" className={`mobile-nav${isMenuOpen ? " is-open" : ""}`}>
        <nav aria-label="Mobile navigation">
          {PRIMARY_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={isActive(link.href) ? "is-active" : undefined}
              aria-current={isActive(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        {!signedIn && (
          <div className="mobile-nav-actions">
            <Link className="button-outline" href="/signin">Sign in</Link>
            <Link className="button" href="/signin?mode=register">Start free <Arrow /></Link>
          </div>
        )}
      </div>
    </header>
  );
}
