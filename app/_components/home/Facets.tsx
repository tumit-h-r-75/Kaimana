"use client";

import Link from "next/link";
import { useReveal } from "@/hooks/useReveal";
import { IconArrow, IconBlocks, IconMic, IconTrophy, IconUsers } from "./icons";
import styles from "./facets.module.css";

/**
 * Section 5. The four rooms beyond the problem list.
 *
 * Each card used to carry a stock photograph — a laptop, a meeting, a
 * child. They said nothing the heading did not, cost most of the page's
 * weight, and dragged four unrelated colour schemes onto a page built
 * around one. The motifs below are drawn from the same tokens, so they
 * cost nothing and cannot clash.
 */

const MODES = [
  {
    href: "/contest",
    icon: <IconTrophy size={17} />,
    title: "Contests",
    body: "Timed rounds against everyone else, scored with penalty time and a board that moves live.",
    cta: "See what's running",
    art: "bars",
  },
  {
    href: "/interview",
    icon: <IconMic size={17} />,
    title: "Mock interviews",
    body: "An interviewer that asks, listens, tells you where the answer went wrong, and scores you at the end.",
    cta: "Start a session",
    art: "wave",
  },
  {
    href: "/community",
    icon: <IconUsers size={17} />,
    title: "Community solutions",
    body: "Once you have solved it, read how everyone else did — the approaches you did not think of.",
    cta: "Browse solutions",
    art: "stack",
  },
  {
    href: "/kids",
    icon: <IconBlocks size={17} />,
    title: "Kids zone",
    body: "Blocks before syntax, then real Python. A different room with a gentler ramp.",
    cta: "Open the kids zone",
    art: "blocks",
  },
] as const;

/** Small drawn motif per card — no images, inherits the accent. */
function Art({ kind }: { kind: (typeof MODES)[number]["art"] }) {
  return (
    <svg className={styles.art} viewBox="0 0 120 60" fill="none" stroke="currentColor" aria-hidden="true">
      {kind === "bars" &&
        [8, 26, 44, 62, 80, 98].map((x, i) => (
          <rect key={x} x={x} y={52 - [18, 30, 22, 44, 34, 50][i]} width="12" height={[18, 30, 22, 44, 34, 50][i]} rx="2" strokeWidth="1.5" />
        ))}
      {kind === "wave" && (
        <path d="M4 30q8-22 16 0t16 0 16-18 16 18 16-10 16 10 16 0" strokeWidth="1.5" strokeLinecap="round" />
      )}
      {kind === "stack" &&
        [0, 1, 2].map((i) => (
          <rect key={i} x={14 + i * 14} y={12 + i * 10} width="66" height="26" rx="4" strokeWidth="1.5" strokeOpacity={1 - i * 0.28} />
        ))}
      {kind === "blocks" &&
        [
          [10, 30], [34, 30], [58, 30], [22, 12], [46, 12],
        ].map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="20" height="16" rx="3" strokeWidth="1.5" />)}
    </svg>
  );
}

export function Facets() {
  const head = useReveal<HTMLDivElement>();

  return (
    <section className={styles.section} id="facets">
      <div className="section-shell">
        <div ref={head.ref} className={`${styles.head} ${head.className}`}>
          <p className={styles.kicker}>More than a problem list</p>
          <h2>
            Four more <span className={styles.accent}>facets to cut.</span>
          </h2>
          <p className={styles.lede}>
            Practice is the floor. Compete against a clock, rehearse the interview, read
            everyone else&apos;s solutions — or hand the whole thing to a nine-year-old.
          </p>
        </div>

        <div className={styles.grid}>
          {MODES.map((m) => (
            <Link key={m.href} href={m.href} className={styles.card}>
              <span className={styles.icon}>{m.icon}</span>
              <h3>{m.title}</h3>
              <p>{m.body}</p>
              <span className={styles.link}>
                {m.cta} <IconArrow size={14} />
              </span>
              <Art kind={m.art} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
