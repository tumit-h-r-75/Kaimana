"use client";

import Link from "next/link";
import { useReveal } from "@/hooks/useReveal";
import { IconCheck } from "./icons";
import styles from "./arena.module.css";

/**
 * Section 4. The competitive half.
 *
 * Practice alone is a library. The reason to come back on a Saturday is
 * that other people are solving the same problem at the same time, so the
 * visual here is the scoreboard rather than a photograph of a keyboard.
 */

interface Row {
  rank: number;
  name: string;
  solved: number;
  time: string;
  up: boolean;
  /** The viewer's own row — only one, and it is styled apart from the rest. */
  me?: boolean;
}

const BOARD: Row[] = [
  { rank: 1, name: "zahid.k", solved: 5, time: "1:04:12", up: true },
  { rank: 2, name: "priya.d", solved: 5, time: "1:11:47", up: false },
  { rank: 3, name: "you", solved: 4, time: "0:52:30", up: true, me: true },
  { rank: 4, name: "arif.h", solved: 4, time: "1:09:03", up: false },
  { rank: 5, name: "lamia.s", solved: 3, time: "0:47:55", up: false },
];

export function Arena() {
  const copy = useReveal<HTMLDivElement>();
  const board = useReveal<HTMLDivElement>(2);

  return (
    <section className={styles.section}>
      <div className="section-shell">
        <div className={styles.inner}>
          <div ref={copy.ref} className={copy.className}>
            <p className={styles.kicker}>Contests</p>
            <h2>
              The same judge,
              <br />
              <span className={styles.accent}>with a clock on it.</span>
            </h2>
            <p className={styles.lede}>
              Nothing changes when a contest starts except who else is watching. A green tick
              in practice means exactly what it means on the scoreboard, because it is the
              same run through the same hidden tests.
            </p>

            <ul className={styles.points}>
              <li><IconCheck size={13} /> Penalty time on wrong submissions, the way real rounds score it</li>
              <li><IconCheck size={13} /> Standings that move while you are still typing</li>
              <li><IconCheck size={13} /> Your rating and your global rank, updated when it ends</li>
            </ul>

            <div className={styles.actions}>
              <Link className="button" href="/contest">
                See live contests <span aria-hidden="true">→</span>
              </Link>
              <Link className="button-outline" href="/leaderboard">
                Global leaderboard
              </Link>
            </div>
          </div>

          <div ref={board.ref} className={`${styles.visual} ${board.className}`}>
            <div className={styles.board}>
              <div className={styles.boardHead}>
                <span className={styles.live}><i />Live · Weekly Sprint</span>
                <span className={styles.clock}>01:47:22 left</span>
              </div>

              <div className={styles.rows}>
                {BOARD.map((r) => (
                  <div key={r.rank} className={`${styles.row} ${r.me ? styles.me : ""}`}>
                    <span className={styles.rank}>{r.rank}</span>
                    <span className={styles.name}>{r.name}</span>
                    <span className={styles.cells}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <i key={i} className={i < r.solved ? styles.solved : ""} />
                      ))}
                    </span>
                    <span className={styles.time}>{r.time}</span>
                    <span className={`${styles.delta} ${r.up ? styles.upward : ""}`} aria-hidden="true">
                      {r.up ? "▲" : "▼"}
                    </span>
                  </div>
                ))}
              </div>

              <div className={styles.boardFoot}>
                Updating as submissions land
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
