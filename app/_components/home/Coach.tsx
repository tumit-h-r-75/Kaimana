"use client";

import { useReveal } from "@/hooks/useReveal";
import { IconGem } from "./icons";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import styles from "./coach.module.css";

/**
 * Section 3. What the coach actually says.
 *
 * This is the part of the product nothing else on the page can stand in
 * for, so it shows the real output rather than describing it. "AI-powered
 * feedback" on a feature tile means nothing; a tier-2 hint that costs three
 * gems, a complexity verdict with its reasoning, and a diff of your own
 * code mean something.
 */
export function Coach() {
  const head = useReveal<HTMLDivElement>();
  const a = useReveal<HTMLDivElement>(1);
  const b = useReveal<HTMLDivElement>(2);
  const c = useReveal<HTMLDivElement>(3);

  return (
    <section className={styles.section}>
      <div className="section-shell">
        <div ref={head.ref} className={`${styles.head} ${head.className}`}>
          <p className={styles.kicker}>Inside every problem</p>
          <h2>
            A coach that has read <span className={styles.accent}>your code</span>, not
            the problem.
          </h2>
          <p className={styles.lede}>
            Three things you can ask for once you are stuck or once you are done. None of
            them hand you the answer.
          </p>
        </div>

        <div className={styles.grid}>
          {/* Hints — tiered, and priced, so asking is a decision. */}
          <SpotlightCard as="article" innerRef={a.ref} className={`${styles.card} ${a.className}`}>
            <header>
              <h3>Hints, one tier at a time</h3>
              <p>A nudge first. The approach next. You choose how much to spoil.</p>
            </header>
            <div className={styles.tiers}>
              <div className={`${styles.tier} ${styles.open}`}>
                <span className={styles.tierHead}>Tier 1 · nudge <b>free</b></span>
                <p>What changes as the loop moves? Something you already computed is worth keeping.</p>
              </div>
              <div className={styles.tier}>
                <span className={styles.tierHead}>Tier 2 · approach <b className={styles.cost}><IconGem size={11} /> 3</b></span>
                <p className={styles.locked}>████ ██████ ███ ████████ ██ █ ████ ███</p>
              </div>
              <div className={styles.tier}>
                <span className={styles.tierHead}>Tier 3 · near-solution <b className={styles.cost}><IconGem size={11} /> 8</b></span>
                <p className={styles.locked}>███████ ██ ████ █████ ███████</p>
              </div>
            </div>
          </SpotlightCard>

          {/* Complexity — the number people guess and get wrong. */}
          <SpotlightCard as="article" innerRef={b.ref} className={`${styles.card} ${b.className}`}>
            <header>
              <h3>The Big-O you actually wrote</h3>
              <p>Not the one you meant to write. Measured against what you submitted.</p>
            </header>
            <div className={styles.bigO}>
              <span className={styles.o}>O(n)</span>
              <span className={styles.oMeta}>time · O(n) space · high confidence</span>
            </div>
            <p className={styles.reason}>
              One pass, and the dictionary grows once per element. The nested scan you
              started with was O(n²) — the lookup is what removed it.
            </p>
            <div className={styles.scale}>
              {[14, 22, 30, 38, 47, 56, 66, 78].map((h, i) => (
                <span key={i} style={{ height: `${h}%` }} />
              ))}
            </div>
          </SpotlightCard>

          {/* Refactor — the same solution, tightened. */}
          <SpotlightCard as="article" innerRef={c.ref} className={`${styles.card} ${c.className}`}>
            <header>
              <h3>A cleaner version of yours</h3>
              <p>Side by side with what you wrote, so the difference is the lesson.</p>
            </header>
            <pre className={styles.diff}>
              <code>
                <span className={styles.del}>- for i in range(len(nums)):</span>
                {"\n"}
                <span className={styles.del}>-     v = nums[i]</span>
                {"\n"}
                <span className={styles.add}>+ for i, v in enumerate(nums):</span>
                {"\n"}
                <span className={styles.ctx}>      if target - v in seen:</span>
              </code>
            </pre>
            <p className={styles.reason}>
              Same complexity, one fewer variable to keep straight — and the index and the
              value now arrive together.
            </p>
          </SpotlightCard>
        </div>
      </div>
    </section>
  );
}
