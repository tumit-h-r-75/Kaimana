"use client";

import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { BrandLogo } from "@/components/layout/BrandLogo";
import styles from "./siteFooter.module.css";

const LANGUAGES = ["Python", "C++", "JavaScript", "TypeScript"];

interface FooterLink {
  href: string;
  label: string;
}

const PRACTICE: FooterLink[] = [
  { href: "/problems", label: "Problems" },
  { href: "/interview", label: "Mock interviews" },
  { href: "/kids", label: "Kids zone" },
];

const COMPETE: FooterLink[] = [
  { href: "/contest", label: "Contests" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/community", label: "Community" },
];

function Column({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <nav className={styles.col} aria-label={title}>
      <h2>{title}</h2>
      <ul>
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SiteFooter() {
  const { user, isLoading } = useAuth();
  const year = new Date().getFullYear();

  // The account column follows the session, the way the header does: a
  // signed-out visitor has no use for "Submission history", and a signed-in
  // one has none for "Sign in".
  const account: FooterLink[] =
    !isLoading && user
      ? [
          { href: "/profile", label: "Profile" },
          { href: "/analytics", label: "Analytics" },
          { href: "/submissions", label: "Submissions" },
          user.role === "admin"
            ? { href: "/admin", label: "Admin dashboard" }
            : user.role === "guest"
              ? { href: "/admin/contests", label: "Host panel" }
              : { href: "/host", label: "Host a contest" },
        ]
      : [
          { href: "/signin", label: "Sign in" },
          { href: "/signin?mode=register", label: "Create an account" },
          { href: "/host", label: "Host a contest" },
        ];

  return (
    <footer className={styles.footer}>
      <div className={`section-shell ${styles.main}`}>
        <div className={styles.brand}>
          <BrandLogo size="lg" />
          <p>
            Pressure, applied daily, for people who like the hard problems — a real judge, an AI
            coach and a scoreboard, free for everyone.
          </p>
          <div className={styles.langs}>
            <span>Judged in</span>
            <ul>
              {LANGUAGES.map((lang) => (
                <li key={lang}>{lang}</li>
              ))}
            </ul>
          </div>
        </div>

        <Column title="Practice" links={PRACTICE} />
        <Column title="Compete" links={COMPETE} />
        <Column title="Account" links={account} />
      </div>

      <div className={`section-shell ${styles.bottom}`}>
        <span>© {year} Kaimana</span>

        <div className={styles.bottomEnd}>
          {/* The credit: signed, not shouted. A byline at the foot of the
              page, the size of a caption, that brightens if you look. */}
          <a
            className={styles.maker}
            href="https://github.com/tumit-h-r-75"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className={styles.monogram} aria-hidden="true">TH</span>
            <span>
              Designed &amp; built by <b>Tumit Hasan</b>
            </span>
          </a>
          <button
            type="button"
            className={styles.toTop}
            // No behaviour passed: scrollTo then follows html's
            // scroll-behavior, which is smooth unless reduced motion is on.
            onClick={() => window.scrollTo({ top: 0 })}
          >
            Top <span aria-hidden="true">↑</span>
          </button>
        </div>
      </div>

      <span className={styles.wordmark} aria-hidden="true">kaimana</span>
    </footer>
  );
}
