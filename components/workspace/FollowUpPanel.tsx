"use client";

// The interview that starts where the judge stops.
//
// A green verdict ends the exercise; in a real interview it is the opening.
// This asks three questions about the code that just passed — growth,
// memory, why this structure — and marks each answer, saying what a strong
// one would have contained.
//
// Nothing here is required and nothing is scored: it is practice for the
// conversation, which is the part most people have never rehearsed.

import { useState } from "react";
import { askFollowUps, markFollowUp, type FollowUpMark } from "@/lib/api/ai";
import { getErrorMessage } from "@/lib/api/client";
import { useAiLanguage } from "@/hooks/useAiLanguage";
import styles from "./FollowUpPanel.module.css";

interface AnswerState {
  text: string;
  sending: boolean;
  mark?: FollowUpMark;
  error?: string;
}

const VERDICT_LABEL: Record<FollowUpMark["verdict"], string> = {
  strong: "Strong answer",
  partial: "Partly there",
  off: "Not this one",
};

export default function FollowUpPanel({ submissionId }: { submissionId: string }) {
  const { language } = useAiLanguage();
  const [questions, setQuestions] = useState<string[] | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({});

  const start = async () => {
    setStatus("loading");
    setError("");
    try {
      const result = await askFollowUps(submissionId, language);
      setQuestions(result.questions);
      setStatus("idle");
    } catch (startError) {
      setError(getErrorMessage(startError, "The interviewer is busy right now."));
      setStatus("error");
    }
  };

  const setAnswer = (index: number, patch: Partial<AnswerState>) =>
    setAnswers((previous) => {
      const current: AnswerState = previous[index] ?? { text: "", sending: false };
      return { ...previous, [index]: { ...current, ...patch } };
    });

  const submitAnswer = async (index: number, question: string) => {
    const current = answers[index]?.text ?? "";
    if (current.trim().length < 2) return;
    setAnswer(index, { sending: true, error: undefined });
    try {
      const mark = await markFollowUp({ submissionId, question, answer: current, language });
      setAnswer(index, { sending: false, mark });
    } catch (markError) {
      setAnswer(index, { sending: false, error: getErrorMessage(markError, "Could not mark that one.") });
    }
  };

  if (!questions) {
    return (
      <div className={styles.intro}>
        <h3>The part after the code works</h3>
        <p>
          In an interview, a passing solution is where the questions start: what happens when the input is huge, whether the memory can come
          down, why you chose what you chose. Three of them, about the code you just wrote.
        </p>
        <button type="button" className="button button-small" onClick={start} disabled={status === "loading"}>
          {status === "loading" ? "Reading your solution…" : "Ask me three questions"}
        </button>
        {status === "error" && <p className="form-error">{error}</p>}
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      {questions.map((question, index) => {
        const state = answers[index];
        return (
          <section key={question} className={styles.question}>
            <p className={styles.ask}>
              <span className={styles.number}>{index + 1}</span>
              {question}
            </p>

            {state?.mark ? (
              <div className={`${styles.mark} ${styles[`mark_${state.mark.verdict}`]}`}>
                <b>{VERDICT_LABEL[state.mark.verdict]}</b>
                <p>{state.mark.feedback}</p>
                <details>
                  <summary>What you wrote</summary>
                  <p>{state.text}</p>
                </details>
              </div>
            ) : (
              <>
                <textarea
                  value={state?.text ?? ""}
                  placeholder="Answer as you would out loud — a few sentences is plenty."
                  rows={3}
                  onChange={(event) => setAnswer(index, { text: event.target.value })}
                />
                <div className={styles.actions}>
                  <button
                    type="button"
                    className="button-outline button-small"
                    disabled={state?.sending || (state?.text ?? "").trim().length < 2}
                    onClick={() => submitAnswer(index, question)}
                  >
                    {state?.sending ? "Marking…" : "Check my answer"}
                  </button>
                  {state?.error && <span className="form-error">{state.error}</span>}
                </div>
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}
