"use client";

import Link from "@/components/ui/Link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { AccountMenu } from "./AccountMenu";
import { NotificationBell } from "./NotificationBell";
import {
  Gem,
  Code2,
  Trophy,
  ChartNoAxesColumnIncreasing,
  Users,
  Mic,
  GraduationCap,
  Menu,
  X,
  ArrowRight,
} from "lucide-react";
import { SearchTrigger } from "@/components/search/SearchTrigger";
import styles from "./siteHeader.module.css";

const Arrow = () => <ArrowRight size={14} aria-hidden="true" />;
const iconProps = { size: 17, strokeWidth: 1.75, "aria-hidden": true } as const;
interface NavLink {
  href: string;
  label: string;
  icon: ReactNode;
}
const PRIMARY_LINKS: NavLink[] = [
  { href: "/problems", label: "Problems", icon: <Code2 {...iconProps} /> },
  { href: "/contest", label: "Contests", icon: <Trophy {...iconProps} /> },
  {
    href: "/leaderboard",
    label: "Leaderboard",
    icon: <ChartNoAxesColumnIncreasing {...iconProps} />,
  },
  { href: "/community", label: "Community", icon: <Users {...iconProps} /> },
  { href: "/interview", label: "Interview", icon: <Mic {...iconProps} /> },
  { href: "/kids", label: "Kids", icon: <GraduationCap {...iconProps} /> },
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
  const roleBadge =
    user?.role === "admin" ? "Admin" : user?.role === "guest" ? "Host" : null;

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(`${href}/`);

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
    <header
      className={`${styles.header}${isScrolled ? ` ${styles.scrolled}` : ""}`}
    >
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
          <SearchTrigger />
          {signedIn && user ? (
            <>
              {typeof user.gems === "number" && (
                <Link
                  href="/profile"
                  className={styles.gems}
                  title="Gems — earned by solving, spent on hints"
                >
                  <Gem size={16} aria-hidden="true" /> {user.gems}
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
            <div
              className={`${styles.guest}${isLoading ? ` ${styles.pending}` : ""}`}
            >
              <Link className={styles.signIn} href="/signin">
                Sign in
              </Link>
              <Link
                className="button button-small"
                href="/signin?mode=register"
              >
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
            {isMenuOpen ? <X {...iconProps} /> : <Menu {...iconProps} />}
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
