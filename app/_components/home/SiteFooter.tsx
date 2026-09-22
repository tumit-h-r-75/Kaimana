"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { BrandLogo } from "@/components/layout/BrandLogo";
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

// Each language's own mark, drawn small, so the list reads at a glance.
const LANGUAGES: { name: string; mark: ReactNode }[] = [
  {
    name: "Python",
    mark: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4B8BBE" d="M11.9 2C7 2 7.3 4.1 7.3 4.1v2.2h4.7V7H5.4S2 6.6 2 11.9s2.9 5.1 2.9 5.1h1.8v-2.5s-.1-2.9 2.9-2.9h4.9s2.8 0 2.8-2.7V4.7S17.7 2 11.9 2Zm-2.7 1.6a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8Z" />
        <path fill="#FFD43B" d="M12.1 22c4.9 0 4.6-2.1 4.6-2.1v-2.2H12V17h6.6s3.4.4 3.4-4.9-2.9-5.1-2.9-5.1h-1.8v2.5s.1 2.9-2.9 2.9H9.5s-2.8 0-2.8 2.7v4.2S6.3 22 12.1 22Zm2.7-1.6a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8Z" />
      </svg>
    ),
  },
  {
    name: "C++",
    mark: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#3F7FC1" d="M12 1.8 21 7v10l-9 5.2L3 17V7z" />
        <text x="12" y="15.6" fill="#fff" fontSize="8.4" fontWeight="700" textAnchor="middle" fontFamily="Inter, Arial, sans-serif">
          C++
        </text>
      </svg>
    ),
  },
  {
    name: "JavaScript",
    mark: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="3" fill="#F0DB4F" />
        <text x="19" y="19" fill="#1A1A1A" fontSize="9" fontWeight="800" textAnchor="end" fontFamily="Inter, Arial, sans-serif">
          JS
        </text>
      </svg>
    ),
  },
  {
    name: "TypeScript",
    mark: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="3" fill="#3178C6" />
        <text x="19" y="19" fill="#fff" fontSize="9" fontWeight="800" textAnchor="end" fontFamily="Inter, Arial, sans-serif">
          TS
        </text>
      </svg>
    ),
  },
];

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
                <li key={lang.name}>
                  {lang.mark}
                  {lang.name}
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
