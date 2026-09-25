"use client";

// "How does this work?" under somebody else's accepted code.
//
// The feed shows the code and nothing else, which is where a reader stalls:
// it is correct, it is short, and it is not obvious why. This asks for the
// idea, the steps, and — when the reader has solved the same problem — what
// this one does differently.

import { useState } from "react";
import { explainSolution } from "@/lib/api/ai";
import { getErrorMessage } from "@/lib/api/client";
import { AI_LANGUAGES, useAiLanguage } from "@/hooks/useAiLanguage";
import styles from "./SolutionExplainer.module.css";

export default function SolutionExplainer({ submissionId }: { submissionId: string }) {
  const { language, setLanguage } = useAiLanguage();
  const [explanation, setExplanation] = useState("");
  const [compared, setCompared] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const ask = async () => {
    setStatus("loading");
    setError("");
    try {
      const result = await explainSolution(submissionId, language);
      setExplanation(result.explanation);
      setCompared(result.comparedWithYours);
      setStatus("done");
    } catch (askError) {
      setError(getErrorMessage(askError, "Could not explain this one right now."));
      setStatus("error");
    }
  };

  return (
    <section className={styles.panel}>
      <div className={styles.head}>
        <div>
          <h4>Not sure how it works?</h4>
          <p>The idea, the steps, and{status === "done" && compared ? " how it differs from yours" : " how it compares with your own solution"}.</p>
        </div>
        <label className={styles.lang}>
          <span className="sr-only">Language</span>
          <select value={language} onChange={(event) => setLanguage(event.target.value)}>
            {AI_LANGUAGES.map((entry) => (
              <option key={entry.code} value={entry.code}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {status === "done" ? (
        <div className={styles.body}>
          {explanation.split(/\n{2,}/).map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      ) : (
        <>
          <button type="button" className="button-outline button-small" onClick={ask} disabled={status === "loading"}>
            {status === "loading" ? "Reading it…" : "Explain this solution"}
          </button>
          {status === "error" && <p className="form-error">{error}</p>}
        </>
      )}
    </section>
  );
}
