"use client";

import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { useReveal } from "@/hooks/useReveal";
import { IconCheck, IconGem } from "./icons";
import styles from "./hero.module.css";

/**
 * Section 1. The promise, and a look at the thing itself.
 *
 * The visual is drawn, not photographed. A stock shot of someone at a laptop
 * says "a website about programming"; a judge panel mid-verdict says what
 * this particular product does, in the product's own colours, at any screen
 * size, for no download.
 */

const TESTS = [
  { label: "handles the sample", state: "pass" },
  { label: "empty input", state: "pass" },
  { label: "duplicates", state: "pass" },
  { label: "negative values", state: "pass" },
  { label: "10^5 elements", state: "run" },
  { label: "all identical", state: "idle" },
] as const;

export function Hero() {
  const copy = useReveal<HTMLDivElement>();
  const visual = useReveal<HTMLDivElement>(2);
  const { user, isLoading } = useAuth();
  const signedIn = !isLoading && Boolean(user);

  return (
    <section className={styles.hero}>
      <div className={styles.backdrop} aria-hidden="true">
        <span className={styles.grid} />
        <span className={styles.glow} />
      </div>

      <div className="section-shell">
        <div className={styles.inner}>
          <div ref={copy.ref} className={copy.className}>
            <p className={styles.kicker}>
              <span className={styles.dot} />
              Real judge · AI coach · live contests
            </p>

            <h1 className={styles.title}>
              Pressure makes
              <br />
              <span className={styles.accent}>the edge.</span>
            </h1>

            <p className={styles.lede}>
              Write it, run it against the same hidden tests a contest would use, and get told
              what to fix — the nudge you need, the complexity you actually wrote, and a cleaner
              version of your own code.
            </p>

            <div className={styles.actions}>
              <Link className="button" href={signedIn ? "/problems" : "/signin?mode=register"}>
                {signedIn ? "Continue solving" : "Start solving — free"} <span aria-hidden="true">→</span>
              </Link>
              <Link className="button-outline" href="#loop">
                See how it works
              </Link>
            </div>

            <ul className={styles.ticks}>
              <li><IconCheck size={13} /> Free, all of it</li>
              <li><IconCheck size={13} /> Python, C++, JS &amp; TS</li>
              <li><IconCheck size={13} /> Nothing to install</li>
            </ul>
          </div>

          {/* The judge, mid-run. Everything below is markup and tokens — no
              image, so it stays crisp and on-palette at any size. */}
          <div ref={visual.ref} className={`${styles.visual} ${visual.className}`}>
            <div className={styles.console}>
              <div className={styles.bar}>
                <span className={styles.lights}><b /><b /><b /></span>
                two_sum.py
                <small>python</small>
              </div>

              <ol className={styles.code}>
                <li><code><i>def</i> <b>two_sum</b>(nums, target):</code></li>
                <li><code>    seen = {"{}"}</code></li>
                <li><code>    <i>for</i> i, v <i>in</i> <b>enumerate</b>(nums):</code></li>
                <li><code>        <i>if</i> target - v <i>in</i> seen:</code></li>
                <li><code>            <i>return</i> [seen[target - v], i]</code></li>
                <li><code>        seen[v] = i</code></li>
              </ol>

              <div className={styles.tests}>
                {TESTS.map((t) => (
                  <span key={t.label} className={`${styles.test} ${styles[t.state]}`}>
                    <i aria-hidden="true" />
                    {t.label}
                  </span>
                ))}
              </div>

              <div className={styles.verdict}>
                <span className={styles.ok}><IconCheck size={14} /> Accepted</span>
                <span className={styles.metrics}>O(n) · 48 ms · 16.2 MB</span>
              </div>
            </div>

            <div className={styles.gems}>
              <IconGem size={16} />
              <span><b>+15 gems</b><small>first-try solve</small></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
