"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "../../_components/home/SiteHeader";
import { SiteFooter } from "../../_components/home/SiteFooter";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Loader, PageLoader } from "@/components/ui/Loader";
import { getErrorMessage } from "@/lib/api/client";
import { getInterviewSession, respondToInterview, type InterviewSession } from "@/lib/api/interview";
import styles from "../interview.module.css";

const DIFFICULTY_COLOR: Record<string, string> = {
  EASY: "var(--accent)",
  MEDIUM: "var(--warn)",
  HARD: "var(--error)",
};

/**
 * Splits an interviewer turn into the judgement and the question that
 * follows it.
 *
 * The model is told to evaluate the last answer first and then ask exactly
 * one thing, and it separates the two with a blank line. Rendering the
 * whole reply as one paragraph buried the verdict in the middle of a wall
 * of text — the candidate could not see at a glance whether they had got it
 * right, which is the single most useful thing on the screen.
 *
 * Heuristic, so it fails safe: with no blank line the whole turn is shown
 * as the question, which is exactly what an opening turn is.
 */
function InterviewerTurn({ content }: { content: string }) {
  const text = content.trim();
  const split = text.lastIndexOf("\n\n");
  const assessment = split > 0 ? text.slice(0, split).trim() : null;
  const question = split > 0 ? text.slice(split + 2).trim() : text;

  // The prompt asks it to say plainly whether the answer was right, so the
  // opening words are worth reading for a tone rather than left as prose.
  const lower = assessment?.toLowerCase() ?? "";
  const verdict = !assessment
    ? null
    : /\b(incorrect|not correct|wrong|off-topic|does not)\b/.test(lower)
      ? { label: "Needs work", tone: styles.verdictBad }
      : /\b(partially|partly|mostly|close|on the right track)\b/.test(lower)
        ? { label: "Partly there", tone: styles.verdictMid }
        : /\b(correct|right|good|well)\b/.test(lower)
          ? { label: "Correct", tone: styles.verdictOk }
          : null;

  return (
    <>
      {assessment && (
        <div className={styles.assessment}>
          {verdict && <span className={`${styles.verdict} ${verdict.tone}`}>{verdict.label}</span>}
          <p>{assessment}</p>
        </div>
      )}
      <p className={styles.question}>{question}</p>
    </>
  );
}

function ScoreDial({ score }: { score: number }) {
  const ratio = Math.max(0, Math.min(1, score / 10));
  const hue = score >= 7 ? "var(--accent)" : score >= 4 ? "var(--warn)" : "var(--error)";
  return (
    <span
      className={`${styles.scoreDial} ${styles.feedbackScore}`}
      style={{ background: `conic-gradient(${hue} ${ratio * 360}deg, var(--surface-hi) 0deg)` }}
      aria-label={`Score ${score} out of 10`}
    >
      <span className={styles.scoreDialValue}>
        {score}
        <small>/10</small>
      </span>
    </span>
  );
}

function InterviewRoomContent() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [answer, setAnswer] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const messageListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    getInterviewSession(sessionId)
      .then((result) => {
        if (!cancelled) setSession(result);
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(getErrorMessage(error, "Could not load this interview."));
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [session?.messages.length]);

  const send = async () => {
    if (!answer.trim() || !session || isSending) return;
    setIsSending(true);
    setSendError(null);
    try {
      const updated = await respondToInterview(session.id, answer.trim());
      setSession(updated);
      setAnswer("");
    } catch (error) {
      setSendError(getErrorMessage(error, "Could not send your answer. Try again."));
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault();
    void send();
  };

  if (isLoading) {
    return <PageLoader label="Loading interview…" />;
  }

  if (loadError || !session) {
    return (
      <main className="section-shell">
        <div className={styles.notFoundPanel}>
          <p>{loadError ?? "This interview could not be found."}</p>
          <Link className="button button-small" href="/interview">
            Back to mock interviews
          </Link>
        </div>
      </main>
    );
  }

  // Candidate turns already answered, out of the session's configured
  // total — shown so the candidate always knows how far along they are,
  // not just that the interview is "in progress" with no visible length.
  const candidateTurns = session.messages.filter((m) => m.role === "candidate").length;
  const totalQuestions = session.totalQuestions ?? 5;
  const isDone = session.status === "completed";
  const questionProgress = isDone ? totalQuestions : Math.min(candidateTurns + 1, totalQuestions);
  const answered = isDone ? totalQuestions : candidateTurns;

  // A completed session's closing feedback is also appended as the final
  // interviewer message (interview.service.ts) — it's already shown in the
  // feedback panel below, so don't render it a second time in the chat.
  const lastMessage = session.messages[session.messages.length - 1];
  const visibleMessages =
    isDone && session.feedback && lastMessage?.role === "interviewer" && lastMessage.content === session.feedback
      ? session.messages.slice(0, -1)
      : session.messages;

  return (
    <main className={styles.roomShell}>
      <Link className={styles.roomBack} href="/interview">
        <span aria-hidden="true">←</span> All mock interviews
      </Link>

      <div className={styles.roomHead}>
        <div className={styles.roomTitleRow}>
          <h1>{session.topic.replace(/-/g, " ")}</h1>
          <span className={`${styles.badge} ${isDone ? styles.badgeCompleted : styles.badgeInProgress}`}>
            {isDone ? "Completed" : "In progress"}
          </span>
        </div>
        <div className={styles.roomMeta}>
          <span className={styles.difficultyTag}>
            <span
              className={styles.chipDot}
              style={{ background: DIFFICULTY_COLOR[session.difficulty] ?? "var(--text-dim)" }}
              aria-hidden="true"
            />
            {session.difficulty.charAt(0) + session.difficulty.slice(1).toLowerCase()}
          </span>
          <span>
            {isDone ? `${totalQuestions} questions answered` : `Question ${questionProgress} of ${totalQuestions}`}
          </span>
        </div>
        <span className={styles.roomProgress} aria-hidden="true">
          <i style={{ width: `${(answered / totalQuestions) * 100}%` }} />
        </span>
      </div>

      <div className={styles.chatShell}>
        <div className={styles.messageList} ref={messageListRef}>
          {visibleMessages.map((message, index) => {
            const fromInterviewer = message.role === "interviewer";
            return (
              <div
                key={index}
                className={`${styles.messageRow} ${
                  fromInterviewer ? styles.messageRowInterviewer : styles.messageRowCandidate
                }`}
              >
                <span
                  className={`${styles.speaker} ${fromInterviewer ? styles.speakerInterviewer : styles.speakerCandidate}`}
                  aria-hidden="true"
                >
                  {fromInterviewer ? "AI" : "You"}
                </span>
                <div className={`${styles.bubble} ${fromInterviewer ? styles.bubbleInterviewer : styles.bubbleCandidate}`}>
                  <span className={styles.bubbleLabel}>{fromInterviewer ? "Interviewer" : "You"}</span>
                  {fromInterviewer ? <InterviewerTurn content={message.content} /> : message.content}
                </div>
              </div>
            );
          })}
        </div>

        {isSending && (
          <div className={styles.thinkingRow}>
            <Loader label="Interviewer is thinking…" size="sm" />
          </div>
        )}

        {!isDone && (
          <form className={styles.composer} onSubmit={handleSend}>
            <label className="sr-only" htmlFor="interview-answer">
              Your answer
            </label>
            <textarea
              id="interview-answer"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              onKeyDown={(event) => {
                // Ctrl/Cmd+Enter sends, so a long answer can be finished
                // without reaching for the mouse. Plain Enter still breaks
                // a line — people write multi-paragraph answers here.
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  void send();
                }
              }}
              placeholder="Talk through your thinking — the approach, the trade-offs, the complexity…"
              disabled={isSending}
            />
            {sendError && <p className={styles.formError}>{sendError}</p>}
            <div className={styles.composerActions}>
              <span className={styles.composerHint}>Ctrl + Enter to send</span>
              <button type="submit" className="button button-small" disabled={isSending || !answer.trim()}>
                {isSending ? "Sending…" : "Send answer"} <span aria-hidden="true">→</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {isDone && (
        <section className={styles.feedbackPanel}>
          <div className={styles.feedbackHead}>
            <h2>Interview feedback</h2>
            {typeof session.score === "number" && <ScoreDial score={session.score} />}
          </div>
          <p className={styles.feedbackText}>{session.feedback}</p>
          <div className={styles.feedbackActions}>
            <Link className="button button-small" href="/interview">
              Start another interview <span aria-hidden="true">→</span>
            </Link>
            <Link className="button-outline button-small" href="/problems">
              Go solve a problem
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}

export default function InterviewSessionPage() {
  return (
    <ProtectedRoute>
      <SiteHeader />
      <InterviewRoomContent />
      <SiteFooter />
    </ProtectedRoute>
  );
}
