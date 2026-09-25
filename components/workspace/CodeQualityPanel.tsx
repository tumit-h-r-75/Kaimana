"use client";

// The second question, after "does it pass".
//
// Four marks out of twenty-five on the things a reviewer comments on, with
// one sentence each on what is good and what is not. Asked for rather than
// automatic, and scored once — the code cannot change, so neither can the
// score.

import { useState } from "react";
import { scoreCodeQuality, type CodeQualityScore } from "@/lib/api/ai";
import { getErrorMessage } from "@/lib/api/client";
import { useAiLanguage } from "@/hooks/useAiLanguage";
import styles from "./CodeQualityPanel.module.css";

const PARTS: { key: keyof Pick<CodeQualityScore, "naming" | "structure" | "clarity" | "robustness">; label: string; hint: string }[] = [
  { key: "naming", label: "Naming", hint: "Do the names say what the things are" },
  { key: "structure", label: "Structure", hint: "Sensible pieces, or one long block" },
  { key: "clarity", label: "Clarity", hint: "Can it be followed without running it" },
  { key: "robustness", label: "Robustness", hint: "Are the awkward inputs handled" },
];

const bandFor = (total: number) => (total >= 80 ? "strong" : total >= 60 ? "fair" : "rough");

export default function CodeQualityPanel({ submissionId }: { submissionId: string }) {
  const { language } = useAiLanguage();
  const [score, setScore] = useState<CodeQualityScore | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  const run = async () => {
    setStatus("loading");
    setError("");
    try {
      setScore(await scoreCodeQuality(submissionId, language));
      setStatus("idle");
    } catch (scoreError) {
      setError(getErrorMessage(scoreError, "Could not review this one right now."));
      setStatus("error");
    }
  };

  if (!score) {
    return (
      <div className={styles.intro}>
        <h3>Would anyone want to read this?</h3>
        <p>
          The judge only asks whether it passes. An interviewer asks the other question — whether the code is legible — and this answers it on
          four counts. The algorithm is not judged here; it already worked.
        </p>
        <button type="button" className="button button-small" onClick={run} disabled={status === "loading"}>
          {status === "loading" ? "Reading your code…" : "Review how it reads"}
        </button>
        {status === "error" && <p className="form-error">{error}</p>}
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={`${styles.total} ${styles[bandFor(score.total)]}`}>
        <b>{score.total}</b>
        <span>out of 100</span>
      </div>

      <p className={styles.summary}>{score.summary}</p>

      <ul className={styles.parts}>
        {PARTS.map((part) => (
          <li key={part.key}>
            <div className={styles.partHead}>
              <b>{part.label}</b>
              <span>{score[part.key]}/25</span>
            </div>
            <span className={styles.bar} aria-hidden="true">
              <i style={{ width: `${(score[part.key] / 25) * 100}%` }} />
            </span>
            <small>{part.hint}</small>
          </li>
        ))}
      </ul>

      {score.strengths.length > 0 && (
        <section>
          <h4>What works</h4>
          <ul className={styles.notes}>
            {score.strengths.map((entry, index) => (
              <li key={index}>{entry}</li>
            ))}
          </ul>
        </section>
      )}

      {score.improvements.length > 0 && (
        <section>
          <h4>What to tighten</h4>
          <ul className={`${styles.notes} ${styles.notesWarn}`}>
            {score.improvements.map((entry, index) => (
              <li key={index}>{entry}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
