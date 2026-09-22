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

// Tumit Hasan's own profiles, as listed on his portfolio. Only accounts that
// exist go here — an icon that links nowhere is worse than no icon.
const SOCIAL: { label: string; href: string; icon: ReactNode }[] = [
  {
    label: "Portfolio",
    href: "https://my-protfolio-tumit.web.app/",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3Z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/tumit-hasan-rafi/",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z"
        />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/tumit.hasan.rafi.2025",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M13.5 21v-7.5H16l.4-3.2h-2.9V8.4c0-.9.3-1.6 1.6-1.6h1.4V4a19 19 0 0 0-2.1-.1c-2.2 0-3.7 1.3-3.7 3.8v2.6H8.3v3.2h2.4V21h2.8Z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/_t_u_m_i_t_h_a_s_a_n_r_a_f_i_/",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
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

          {/* The maker's own profiles, labelled as his — they sit under the
              product's name, and should not read as the product's accounts. */}
          <ul className={styles.social} aria-label="Tumit Hasan elsewhere">
            {SOCIAL.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Tumit Hasan on ${item.label}`}
                  title={`Tumit Hasan on ${item.label}`}
                >
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
            href="https://my-protfolio-tumit.web.app/"
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
