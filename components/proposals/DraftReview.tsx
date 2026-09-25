"use client";

// The first review of a problem draft, before it costs anything.
//
// Sending a proposal spends gems, and a draft sent back for an unstated
// limit or a missing edge case costs the author twice. This reads what is in
// the form and lists what a reviewer would ask about — it changes nothing,
// and the author decides what to do with it.

import { useState } from "react";
import { reviewProposalDraft, type DraftReview as Review } from "@/lib/api/ai";
import { getErrorMessage } from "@/lib/api/client";
import { useAiLanguage } from "@/hooks/useAiLanguage";
import styles from "./DraftReview.module.css";

interface DraftReviewProps {
  draft: {
    title: string;
    statement: string;
    constraints: string;
    difficulty: string;
    testCases: { input: string; expectedOutput: string; isSample?: boolean }[];
  };
}

export function DraftReview({ draft }: DraftReviewProps) {
  const { language } = useAiLanguage();
  const [review, setReview] = useState<Review | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  const run = async () => {
    setStatus("loading");
    setError("");
    try {
      setReview(await reviewProposalDraft({ ...draft, language }));
      setStatus("idle");
    } catch (reviewError) {
      setError(getErrorMessage(reviewError, "Could not review the draft right now."));
      setStatus("error");
    }
  };

  return (
    <section className={styles.panel}>
      <div className={styles.head}>
        <div>
          <h3>Check it before you send it</h3>
          <p>
            A reviewer will ask about unstated limits, ambiguous wording and tests that only cover the easy case. This asks first, and costs
            nothing.
          </p>
        </div>
        <button type="button" className="button-outline button-small" onClick={run} disabled={status === "loading" || draft.statement.trim().length < 40}>
          {status === "loading" ? "Reading the draft…" : review ? "Check again" : "Check my draft"}
        </button>
      </div>

      {status === "error" && <p className="form-error">{error}</p>}
      {draft.statement.trim().length < 40 && !review && <p className={styles.hint}>Write the statement first.</p>}

      {review && (
        <div className={styles.result}>
          <p className={`${styles.verdict} ${review.verdict === "ready" ? styles.ready : styles.needsWork}`}>
            {review.verdict === "ready" ? "Nothing blocking — worth sending." : "Worth another pass before sending."}
          </p>

          {review.notes.length > 0 && (
            <ul className={styles.notes}>
              {review.notes.map((note, index) => (
                <li key={index} className={note.severity === "blocker" ? styles.blocker : undefined}>
                  <b>{note.severity === "blocker" ? "Blocker" : "Worth fixing"}</b>
                  <span className={styles.kind}>{note.kind}</span>
                  {note.note}
                </li>
              ))}
            </ul>
          )}

          {review.missingCases.length > 0 && (
            <>
              <h4>Cases worth adding</h4>
              <ul className={styles.cases}>
                {review.missingCases.map((entry, index) => (
                  <li key={index}>{entry}</li>
                ))}
              </ul>
            </>
          )}

          <p className={styles.hint}>A reading, not a ruling — the reviewer decides, and you decide what to change.</p>
        </div>
      )}
    </section>
  );
}
