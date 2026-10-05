import Link from "@/components/ui/Link";
import { IconCheck } from "./icons";
import styles from "./hero.module.css";

const TESTS = [
  "Sample input",
  "Empty array",
  "Duplicate values",
  "Large input",
];
const PATHS = [
  {
    number: "01",
    title: "Find your challenge",
    detail: "A topic, a difficulty, a fresh start.",
    href: "/problems",
    label: "Explore problems",
  },
  {
    number: "02",
    title: "Learn from each attempt",
    detail: "Hints and feedback on the code you write.",
    href: "#coach",
    label: "Meet your coach",
  },
  {
    number: "03",
    title: "Put it to the test",
    detail: "A ticking clock. A place on the board.",
    href: "/contest",
    label: "Explore contests",
  },
];

export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="home-title">
      <div className={styles.backdrop} aria-hidden="true" />
      <div className="section-shell">
        <div className={styles.inner}>
          <div className={styles.copy}>
            <p className={styles.kicker}>
              <span /> A better way to practise code
            </p>
            <h1 id="home-title" className={styles.title}>
              Small challenges.
              <br />
              <span>Sharper thinking.</span>
            </h1>
            <p className={styles.lede}>
              Build your coding edge, one solution at a time. Practise with a
              real judge, get a nudge from your AI coach, and find your rhythm.
            </p>
            <div className={styles.actions}>
              <Link className="button" href="/problems">
                Explore problems <span aria-hidden="true">↗</span>
              </Link>
              <Link className={styles.secondary} href="#loop">
                How it works <span aria-hidden="true">↓</span>
              </Link>
            </div>
            <ul className={styles.ticks}>
              <li>
                <IconCheck size={14} /> Free to practise
              </li>
              <li>
                <IconCheck size={14} /> Four languages
              </li>
              <li>
                <IconCheck size={14} /> Your pace
              </li>
            </ul>
          </div>
          <div
            className={styles.visual}
            aria-label="Example of a judged solution and coaching feedback"
          >
            <div className={styles.visualHead}>
              <span className={styles.dot} /> YOUR NEXT ACCEPTED{" "}
              <span className={styles.demo}>Preview</span>
            </div>
            <div className={styles.console}>
              <div className={styles.bar}>
                <span className={styles.fileIcon}>&lt;/&gt;</span> two_sum.py{" "}
                <small>Python</small>
              </div>
              <ol className={styles.code}>
                <li>
                  <code>
                    <i>def</i> <b>two_sum</b>(nums, target):
                  </code>
                </li>
                <li>
                  <code> seen = {"{}"}</code>
                </li>
                <li>
                  <code>
                    {" "}
                    <i>for</i> i, value <i>in</i> <b>enumerate</b>(nums):
                  </code>
                </li>
                <li>
                  <code>
                    {" "}
                    <i>if</i> target - value <i>in</i> seen:
                  </code>
                </li>
                <li>
                  <code>
                    {" "}
                    <i>return</i> [seen[target - value], i]
                  </code>
                </li>
                <li>
                  <code> seen[value] = i</code>
                </li>
              </ol>
              <div className={styles.tests}>
                {TESTS.map((label) => (
                  <span key={label}>
                    <IconCheck size={12} /> {label}
                  </span>
                ))}
              </div>
              <div className={styles.verdict}>
                <span>
                  <IconCheck size={15} /> Accepted
                </span>
                <small>O(n) time · O(n) space</small>
              </div>
            </div>
            <div className={styles.coach}>
              <span className={styles.coachIcon}>✦</span>
              <div>
                <b>A little insight goes a long way.</b>
                <p>
                  Your hash map remembers earlier values, so each lookup takes
                  constant time. One pass is all you need.
                </p>
              </div>
            </div>
            <div className={styles.visualFoot}>
              <span>Write. Run. Understand.</span>
              <span>Then do it again. ↗</span>
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
                <span className={styles.pathLink}>
                  {item.label} <i aria-hidden="true">↗</i>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
