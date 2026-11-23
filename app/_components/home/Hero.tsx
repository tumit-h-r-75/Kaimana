import {
  ArrowDown,
  ArrowUpRight,
  Check,
  Code2,
  Sparkles,
} from "lucide-react";
import Link from "@/components/ui/Link";
import styles from "./hero.module.css";

const PATHS = [
  {
    number: "01",
    title: "Pick a problem",
    detail: "Find a challenge at your level.",
    href: "/problems",
  },
  {
    number: "02",
    title: "Learn from the run",
    detail: "See what worked and what did not.",
    href: "#coach",
  },
  {
    number: "03",
    title: "Take on the clock",
    detail: "Bring your practice to a contest.",
    href: "/contest",
  },
];

export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="home-title">
      <div className={styles.gridGlow} aria-hidden="true" />
      <div className="section-shell">
        <div className={styles.inner}>
          <div className={styles.copy}>
            <p className={styles.kicker}>
              <span className={styles.kickerDot} />
              Practice · feedback · progress
            </p>
            <h1 id="home-title" className={styles.title}>
              Build a sharper
              <br />
              <span className={styles.titleAccent}>coding edge.</span>
            </h1>
            <p className={styles.lede}>
              Solve real problems, understand what your code did, and get a
              thoughtful nudge when you need one. Every session leaves you a
              little stronger.
            </p>
            <div className={styles.actions}>
              <Link className="button" href="/problems">
                Explore problems <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
              <Link className={styles.secondary} href="#loop">
                See how it works <ArrowDown size={15} aria-hidden="true" />
              </Link>
            </div>
            <ul className={styles.ticks}>
              <li>
                <Check size={14} aria-hidden="true" /> Free to practise
              </li>
              <li>
                <Check size={14} aria-hidden="true" /> Four languages
              </li>
              <li>
                <Check size={14} aria-hidden="true" /> Your own pace
              </li>
            </ul>
          </div>

          <div
            className={styles.visual}
            role="group"
            aria-label="Preview of the Kaimana coding workspace"
          >
            <div className={styles.previewGlow} aria-hidden="true" />
            <div className={styles.preview}>
              <div className={styles.windowBar}>
                <span className={styles.windowDots} aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <span className={styles.fileName}>
                  <Code2 size={14} aria-hidden="true" /> two_sum.py
                </span>
                <span className={styles.language}>Python 3</span>
              </div>

              <div className={styles.editor}>
                <div className={styles.editorMeta}>
                  <span>PROBLEM_042</span>
                  <span>ARRAYS / EASY</span>
                </div>
                <div className={styles.code} role="group" aria-label="Python code sample">
                  <div className={styles.codeLine}>
                    <span className={styles.lineNumber}>01</span>
                    <code>
                      <b>def</b> two_sum(nums, target):
                    </code>
                  </div>
                  <div className={styles.codeLine}>
                    <span className={styles.lineNumber}>02</span>
                    <code>
                      <span className={styles.indent} /> seen = {}
                    </code>
                  </div>
                  <div className={styles.codeLine}>
                    <span className={styles.lineNumber}>03</span>
                    <code>
                      <span className={styles.indent} /> <b>for</b> i, value{" "}
                      <b>in</b> enumerate(nums):
                    </code>
                  </div>
                  <div className={styles.codeLine}>
                    <span className={styles.lineNumber}>04</span>
                    <code>
                      <span className={styles.indent} /> <b>if</b> target -
                      value <b>in</b> seen:
                    </code>
                  </div>
                  <div className={`${styles.codeLine} ${styles.activeLine}`}>
                    <span className={styles.lineNumber}>05</span>
                    <code>
                      <span className={styles.indent} /> <span className={styles.indent} />
                      <b>return</b> [seen[target - value], i]
                    </code>
                  </div>
                  <div className={styles.codeLine}>
                    <span className={styles.lineNumber}>06</span>
                    <code>
                      <span className={styles.indent} /> seen[value] = i
                    </code>
                  </div>
                </div>
              </div>

              <div className={styles.runBar}>
                <span className={styles.runStatus}>
                  <span className={styles.runDot} /> Sample run
                </span>
                <span className={styles.accepted}>Accepted</span>
                <span className={styles.runCount}>3 / 3 tests</span>
              </div>
            </div>

            <div className={styles.coachNote}>
              <span className={styles.coachIcon}>
                <Sparkles size={16} aria-hidden="true" />
              </span>
              <span className={styles.coachCopy}>
                <span>Your coach</span>
                <strong>One pass. O(n) time.</strong>
              </span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className={styles.paths} aria-label="Ways to practise">
          {PATHS.map((item) => (
            <Link key={item.number} href={item.href} className={styles.path}>
              <span className={styles.pathNumber}>{item.number}</span>
              <div>
                <h2>{item.title}</h2>
                <p>{item.detail}</p>
              </div>
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
