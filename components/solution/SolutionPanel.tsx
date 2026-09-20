"use client";

import { useState } from "react";
import type { Language } from "@/types/api";
import styles from "./SolutionPanel.module.css";

/**
 * The reference solution, shown only after the learner has solved the
 * problem themselves — the API withholds it until then, so this component
 * never has anything to leak.
 *
 * It exists because the hints deliberately stop short of the answer. Someone
 * who has just got Accepted usually still wants to know whether their own
 * approach was the intended one, and someone who ground it out the long way
 * has no other way to find that out.
 */
export default function SolutionPanel({
  solution,
  myCode,
}: {
  solution: { language: Language; code: string };
  /** The learner's own accepted code, for a side-by-side read. */
  myCode?: string;
}) {
  const [showMine, setShowMine] = useState(false);
  const canCompare = Boolean(myCode?.trim());

  return (
    <div className={styles.panel}>
      <div className={styles.head}>
        <div>
          <h4 className={styles.title}>Reference solution</h4>
          <p className={styles.note}>
            One clean way to do it — not the only way. If yours is different and passes, yours is also right.
          </p>
        </div>
        <span className={styles.lang}>{solution.language}</span>
      </div>

      {canCompare && (
        <div className={styles.toggle} role="tablist">
          <button type="button" role="tab" aria-selected={!showMine}
            className={!showMine ? styles.on : ""} onClick={() => setShowMine(false)}>
            Reference
          </button>
          <button type="button" role="tab" aria-selected={showMine}
            className={showMine ? styles.on : ""} onClick={() => setShowMine(true)}>
            Yours
          </button>
        </div>
      )}

      <pre className={styles.code}>
        <code>{showMine && myCode ? myCode : solution.code}</code>
      </pre>
    </div>
  );
}
