"use client";

// "Why did it fail?" under a red verdict.
//
// The panel above already shows which test broke and what came out of it.
// This asks the AI to say what the code actually does with that input, what
// was wanted instead, and where it most likely goes wrong — on request,
// because not everyone wants it, and it is one model call.
//
// It is not a hint and takes nothing off the score: it describes what has
// already happened rather than what to do next.

import { useState } from "react";
import { explainFailure } from "@/lib/api/ai";
import { getErrorMessage } from "@/lib/api/client";
import { useAiLanguage } from "@/hooks/useAiLanguage";

export default function FailureExplainer({ submissionId }: { submissionId: string }) {
  const { language } = useAiLanguage();
  const [explanation, setExplanation] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const ask = async () => {
    setStatus("loading");
    setError("");
    try {
      const result = await explainFailure(submissionId, language);
      setExplanation(result.explanation);
      setStatus("done");
    } catch (askError) {
      setError(getErrorMessage(askError, "Could not explain this one right now."));
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className="verdict-explain">
        <h4>Why it failed</h4>
        {explanation.split(/\n{2,}/).map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
        <small>An explanation of what happened — not a hint, and nothing off your score.</small>
      </div>
    );
  }

  return (
    <div className="verdict-explain">
      <button type="button" className="button-outline button-small" onClick={ask} disabled={status === "loading"}>
        {status === "loading" ? "Reading your code…" : "Why did it fail?"}
      </button>
      <small>Free — it explains what happened, it does not tell you what to do.</small>
      {status === "error" && <p className="form-error">{error}</p>}
    </div>
  );
}
