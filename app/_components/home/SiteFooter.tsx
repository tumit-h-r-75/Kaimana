"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { LANGUAGE_NAME, LanguageMark, type LanguageKey } from "@/components/ui/LanguageMark";
import styles from "./siteFooter.module.css";

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

// Only accounts that exist go here. Add X, Discord, YouTube or LinkedIn as
// { label, href, icon } once there is a real profile to point at — an icon
// that links nowhere is worse than no icon.
const SOCIAL: { label: string; href: string; icon: ReactNode }[] = [
  {
    label: "GitHub",
    href: "https://github.com/tumit-h-r-75",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.58 9.58 0 0 1 5 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"
        />
      </svg>
    ),
  },
];

const LANGUAGES: LanguageKey[] = ["python", "cpp", "javascript", "typescript"];

function Column({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <nav className={styles.col} aria-label={title}>
      <h2>{title}</h2>
      <ul>
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href}>
              <span>{link.label}</span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SiteFooter() {
  const { user, isLoading } = useAuth();
  const year = new Date().getFullYear();

  // The account column follows the session, the way the header does.
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
      {/* Two faint arcs in the corner — the only ornament, and quiet. */}
      <svg className={styles.arcs} viewBox="0 0 800 400" preserveAspectRatio="none" aria-hidden="true">
        <path d="M120 400 C 320 170, 560 90, 800 70" />
        <path d="M300 400 C 470 250, 640 190, 800 170" />
      </svg>

      <div className={`section-shell ${styles.main}`}>
        <div className={styles.brand}>
          <BrandLogo size="lg" />
          <p>
            Pressure, applied daily, for people who like the hard problems — a real judge, an AI
            coach and a scoreboard, free for everyone.
          </p>

          <ul className={styles.social} aria-label="Kaimana elsewhere">
            {SOCIAL.map((item) => (
              <li key={item.label}>
                <a href={item.href} target="_blank" rel="noopener noreferrer" aria-label={item.label} title={item.label}>
                  {item.icon}
                </a>
              </li>
            ))}
          </ul>

          <div className={styles.langs}>
            <span>Judged in</span>
            <ul>
              {LANGUAGES.map((lang) => (
                <li key={lang}>
                  <LanguageMark language={lang} />
                  {LANGUAGE_NAME[lang]}
                </li>
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
    </footer>
  );
}
