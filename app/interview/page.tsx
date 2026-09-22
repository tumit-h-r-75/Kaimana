"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "../_components/home/SiteHeader";
import { SiteFooter } from "../_components/home/SiteFooter";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Loader } from "@/components/ui/Loader";
import { getErrorMessage } from "@/lib/api/client";
import {
  listInterviewSessions,
  startInterviewSession,
  type InterviewDifficulty,
  type InterviewSessionSummary,
} from "@/lib/api/interview";
import styles from "./lobby.module.css";

/* ------------------------------------------------------------------ icons */

const icon = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const ICONS = {
  arrays: icon(<><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M9.3 5v14M14.7 5v14M4 12h16" /></>),
  strings: icon(<path d="M4 7V5h9v2M8.5 5v14M7 19h3M14 11v-1.5h6V11M17 9.5V19M15.8 19h2.4" />),
  dp: icon(<path d="M8 4c-2 0-3 1-3 3v2c0 1.5-.8 2.5-2 3 1.2.5 2 1.5 2 3v2c0 2 1 3 3 3M16 4c2 0 3 1 3 3v2c0 1.5.8 2.5 2 3-1.2.5-2 1.5-2 3v2c0 2-1 3-3 3" />),
  graphs: icon(<><circle cx="6" cy="6" r="2.4" /><circle cx="18" cy="8" r="2.4" /><circle cx="9" cy="18" r="2.4" /><path d="M8.2 6.6 15.6 7.6M7 8.2l1.4 7.5M16.6 10 10.8 16.4" /></>),
  general: icon(<><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>),
  mic: icon(<><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></>),
  clock: icon(<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 1.8" /></>),
  doc: icon(<><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4M9 12h6M9 16h6" /></>),
  calendar: icon(<><rect x="4" y="5.5" width="16" height="14" rx="2" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></>),
  check: icon(<><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12.3 2.4 2.4L15.8 10" /></>),
  star: icon(<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" />),
  trend: icon(<path d="M4 18 10 12l3.5 3.5L20 9M15 9h5v5" />),
  bulb: icon(<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3Z" />),
  chat: icon(<path d="M5 5.5h14v10H10l-4 3.5v-3.5H5z" />),
  refresh: icon(<><path d="M20 12a8 8 0 1 1-2.3-5.7" /><path d="M20 4v4.5h-4.5" /></>),
  compass: icon(<><circle cx="12" cy="12" r="8.5" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></>),
  bars: icon(<path d="M5 20V12M10 20V6M15 20v-9M20 20V9" />),
  arrow: icon(<path d="M5 12h14M13 6l6 6-6 6" />),
};

/* ---------------------------------------------------------------- options */

const TOPICS = [
  { value: "arrays", label: "Arrays", icon: ICONS.arrays },
  { value: "strings", label: "Strings", icon: ICONS.strings },
  { value: "dynamic-programming", label: "Dynamic programming", icon: ICONS.dp },
  { value: "graphs", label: "Graphs", icon: ICONS.graphs },
  { value: "general", label: "General", icon: ICONS.general },
];

/* Every control that uses a colour also carries its text label. */
const DIFFICULTIES: { value: InterviewDifficulty; label: string; tone: string; bars: number }[] = [
  { value: "EASY", label: "Easy", tone: "var(--accent)", bars: 1 },
  { value: "MEDIUM", label: "Medium", tone: "var(--warn)", bars: 2 },
  { value: "HARD", label: "Hard", tone: "var(--error)", bars: 3 },
];

// Kept in sync with the backend's MIN/MAX_TOTAL_QUESTIONS clamp in
// interview.service.ts — offering only values the server will actually
// honor as-is, rather than letting a pick get silently clamped.
const QUESTION_COUNTS = [3, 5, 7, 10];
const DEFAULT_QUESTION_COUNT = 5;
/** Rough pacing used only for the "about N minutes" hint on the form. */
const MINUTES_PER_QUESTION = 2;

type SessionFilter = "ALL" | "in_progress" | "completed";

const difficultyMeta = (value: InterviewDifficulty) => DIFFICULTIES.find((item) => item.value === value) ?? DIFFICULTIES[0];
const topicMeta = (value: string) => TOPICS.find((item) => item.value === value);

/** Three rising bars, filled up to the level. */
function LevelBars({ level, tone }: { level: number; tone: string }) {
  return (
    <span className={styles.levelBars} style={{ "--tone": tone } as React.CSSProperties} aria-hidden="true">
      {[1, 2, 3].map((n) => (
        <i key={n} className={n <= level ? styles.levelOn : undefined} />
      ))}
    </span>
  );
}

function ScoreRing({ score }: { score: number }) {
  const ratio = Math.max(0, Math.min(1, score / 10));
  const tone = score >= 7 ? "var(--accent)" : score >= 4 ? "var(--warn)" : "var(--error)";
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <span className={styles.ring} role="img" aria-label={`Score ${score} out of 10`}>
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r={r} />
        <circle cx="32" cy="32" r={r} style={{ stroke: tone }} strokeDasharray={`${c * ratio} ${c}`} />
      </svg>
      <span>
        {score}
        <small>/10</small>
      </span>
    </span>
  );
}

function SessionCard({ session }: { session: InterviewSessionSummary }) {
  const meta = difficultyMeta(session.difficulty);
  const topic = topicMeta(session.topic);
  const isDone = session.status === "completed";
  // Two messages per turn (the question, then the answer), so the number of
  // answered questions is half the transcript, capped at the session length.
  const total = session.totalQuestions ?? DEFAULT_QUESTION_COUNT;
  const answered = Math.min(total, Math.floor(session.messageCount / 2));
  const minutes =
    isDone && session.updatedAt ? Math.max(1, Math.round((Date.parse(session.updatedAt) - Date.parse(session.createdAt)) / 60000)) : null;

  return (
    <article className={styles.session}>
      <span className={styles.sessionIcon}>{topic?.icon ?? ICONS.general}</span>

      <div className={styles.sessionBody}>
        <div className={styles.sessionTop}>
          <h3>{topic?.label ?? session.topic.replace(/-/g, " ")}</h3>
          <span className={`${styles.status} ${isDone ? styles.statusDone : styles.statusOpen}`}>
            {isDone ? "Completed" : "In progress"}
          </span>
          <span className={styles.level}>
            <i style={{ background: meta.tone }} aria-hidden="true" />
            {meta.label}
          </span>
        </div>

        {session.reportSummary && <p className={styles.sessionSummary}>{session.reportSummary}</p>}

        {!isDone && (
          <span className={styles.progress} role="img" aria-label={`${answered} of ${total} questions answered`}>
            <i style={{ width: `${(answered / total) * 100}%` }} />
          </span>
        )}

        <ul className={styles.sessionMeta}>
          <li>
            {ICONS.doc} {isDone ? `${total} questions` : `${answered} of ${total} answered`}
          </li>
          <li>
            {ICONS.calendar} {new Date(session.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
          </li>
          {minutes !== null && (
            <li>
              {ICONS.clock} {minutes} {minutes === 1 ? "minute" : "minutes"}
            </li>
          )}
        </ul>
      </div>

      <div className={styles.sessionSide}>
        {typeof session.score === "number" && <ScoreRing score={session.score} />}
        <Link href={`/interview/${session.id}`} className={styles.sessionLink}>
          {isDone ? "View details" : "Resume"} {ICONS.arrow}
        </Link>
      </div>
    </article>
  );
}

/** The interviewer, drawn: a card with a live-looking voice line, a few of
    the questions it asks, and the four things the practice builds. */
function HeroArt() {
  return (
    <div className={styles.art} aria-hidden="true">
      <ul className={styles.artBubbles}>
        <li>{ICONS.chat} Let&apos;s solve this together.</li>
        <li>{ICONS.chat} Can you explain your approach?</li>
        <li>{ICONS.chat} What&apos;s the time complexity?</li>
      </ul>
      <div className={styles.artCard}>
        <p>AI Interviewer</p>
        <div className={styles.artVoice}>
          <span className={styles.artMic}>{ICONS.mic}</span>
          <span className={styles.artWave}>
            {[5, 9, 14, 8, 18, 11, 6, 15, 20, 9, 13, 7, 16, 10].map((h, i) => (
              <i key={i} style={{ height: h, animationDelay: `${(i % 7) * -0.18}s` }} />
            ))}
          </span>
        </div>
      </div>
      <ul className={styles.artSkills}>
        <li>{ICONS.bulb} Think</li>
        <li>{ICONS.chat} Explain</li>
        <li>{ICONS.refresh} Iterate</li>
        <li>{ICONS.trend} Improve</li>
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------- page */

function InterviewContent() {
  const router = useRouter();
  const [sessions, setSessions] = useState<InterviewSessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [filter, setFilter] = useState<SessionFilter>("ALL");

  const [topic, setTopic] = useState(TOPICS[0].value);
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>("EASY");
  const [totalQuestions, setTotalQuestions] = useState(DEFAULT_QUESTION_COUNT);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    listInterviewSessions()
      .then((result) => {
        if (!cancelled) setSessions(result);
      })
      .catch((error) => {
        if (!cancelled) setListError(getErrorMessage(error, "Could not load your past interviews."));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleStart = async (event: FormEvent) => {
    event.preventDefault();
    setIsStarting(true);
    setStartError(null);
    try {
      const session = await startInterviewSession({ topic, difficulty, totalQuestions });
      router.push(`/interview/${session.id}`);
    } catch (error) {
      setStartError(getErrorMessage(error, "Could not start the interview. Try again."));
      setIsStarting(false);
    }
  };

  const stats = useMemo(() => {
    const completed = sessions.filter((s) => s.status === "completed");
    const scored = completed.filter((s) => typeof s.score === "number").map((s) => s.score as number);
    const average = scored.length > 0 ? scored.reduce((sum, value) => sum + value, 0) / scored.length : null;
    return {
      total: sessions.length,
      completed: completed.length,
      average: average === null ? "—" : `${average.toFixed(1)}/10`,
      best: scored.length > 0 ? `${Math.max(...scored)}/10` : "—",
    };
  }, [sessions]);

  const counts: Record<SessionFilter, number> = {
    ALL: sessions.length,
    in_progress: sessions.filter((s) => s.status === "in_progress").length,
    completed: sessions.filter((s) => s.status === "completed").length,
  };
  const visible = filter === "ALL" ? sessions : sessions.filter((s) => s.status === filter);

  const topicLabel = topicMeta(topic)?.label ?? topic;
  const minutes = totalQuestions * MINUTES_PER_QUESTION;

  const statCards = [
    { key: "total", icon: ICONS.doc, tone: "#8B8CF8", value: stats.total, label: "Interviews", note: "Total interviews taken" },
    { key: "done", icon: ICONS.check, tone: "var(--accent)", value: stats.completed, label: "Completed", note: "Finished interviews" },
    { key: "avg", icon: ICONS.star, tone: "var(--warn)", value: stats.average, label: "Average score", note: "Across finished interviews" },
    { key: "best", icon: ICONS.trend, tone: "#6CB6FF", value: stats.best, label: "Best score", note: "Your highest score" },
  ];

  return (
    <main className={styles.page}>
      {/* ------------------------------------------------------------ hero */}
      <section className={`section-shell ${styles.hero}`}>
        <div className={styles.heroText}>
          <p className={styles.kicker}>
            <i aria-hidden="true" /> Mock interview
          </p>
          <h1>
            Practise saying
            <br />
            <span>it out loud.</span>
          </h1>
          <p className={styles.lede}>
            Talk through a problem like a real interview. The AI asks the questions, follows up on what you say, and scores
            you with written feedback at the end.
          </p>
          <ul className={styles.perks}>
            <li>
              <span>{ICONS.mic}</span> Real interview flow
            </li>
            <li>
              <span>{ICONS.bulb}</span> AI-scored feedback
            </li>
            <li>
              <span>{ICONS.chat}</span> Practise explaining
            </li>
            <li>
              <span>{ICONS.trend}</span> Track your progress
            </li>
          </ul>
        </div>
        <HeroArt />
      </section>

      <div className="section-shell">
        {/* ---------------------------------------------------------- setup */}
        <section className={styles.setup} aria-labelledby="setup-title">
          <div className={styles.setupHead}>
            <span className={styles.setupIcon}>{ICONS.mic}</span>
            <div>
              <h2 id="setup-title">Set up your interview</h2>
              <p>Choose a few options, then you&apos;re ready to go.</p>
            </div>
            <p className={styles.tip}>
              {ICONS.bulb} Tip: start with an easy interview to get comfortable.
            </p>
          </div>

          <form onSubmit={handleStart}>
            <div className={styles.options}>
              <fieldset className={styles.group} disabled={isStarting}>
                <legend>1. Topic</legend>
                <div className={styles.chips}>
                  {TOPICS.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      aria-pressed={topic === item.value}
                      className={`${styles.chip}${topic === item.value ? ` ${styles.chipOn}` : ""}`}
                      onClick={() => setTopic(item.value)}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className={styles.group} disabled={isStarting}>
                <legend>2. Difficulty</legend>
                <div className={styles.chips}>
                  {DIFFICULTIES.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      aria-pressed={difficulty === item.value}
                      className={`${styles.chip}${difficulty === item.value ? ` ${styles.chipOn}` : ""}`}
                      onClick={() => setDifficulty(item.value)}
                    >
                      <LevelBars level={item.bars} tone={item.tone} />
                      {item.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className={styles.group} disabled={isStarting}>
                <legend>3. Number of questions</legend>
                <div className={styles.chips}>
                  {QUESTION_COUNTS.map((count) => (
                    <button
                      key={count}
                      type="button"
                      aria-pressed={totalQuestions === count}
                      aria-label={`${count} questions`}
                      className={`${styles.count}${totalQuestions === count ? ` ${styles.chipOn}` : ""}`}
                      onClick={() => setTotalQuestions(count)}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            <div className={styles.summary}>
              <span className={styles.summaryIcon}>{ICONS.clock}</span>
              <p>
                A <b>{totalQuestions}-question</b> <b>{difficultyMeta(difficulty).label.toLowerCase()}</b> interview on{" "}
                <b>{topicLabel.toLowerCase()}</b> — about <b>{minutes} minutes</b>.
              </p>
              <button type="submit" className="button" disabled={isStarting}>
                {isStarting ? "Starting…" : "Start interview"} <span aria-hidden="true">→</span>
              </button>
            </div>
          </form>

          {startError && (
            <p className={styles.error} role="alert">
              {startError}
            </p>
          )}
        </section>

        {/* ---------------------------------------------------------- stats */}
        <section className={styles.stats} aria-label="Your interview record">
          {statCards.map((card) => (
            <div key={card.key} className={styles.stat} style={{ "--tone": card.tone } as React.CSSProperties}>
              <span className={styles.statIcon}>{card.icon}</span>
              <div>
                <b>{card.value}</b>
                <span>{card.label}</span>
                <small>{card.note}</small>
              </div>
            </div>
          ))}
        </section>

        {/* -------------------------------------------------------- history */}
        <div className={styles.listHead}>
          <h2>Past interviews</h2>
          {sessions.length > 0 && (
            <div className={styles.filters} role="group" aria-label="Filter interviews">
              {(
                [
                  { key: "ALL", label: "All" },
                  { key: "in_progress", label: "In progress" },
                  { key: "completed", label: "Completed" },
                ] as { key: SessionFilter; label: string }[]
              ).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={filter === item.key}
                  className={`${styles.filter}${filter === item.key ? ` ${styles.filterOn}` : ""}`}
                  onClick={() => setFilter(item.key)}
                >
                  {item.label}
                  <b>{counts[item.key]}</b>
                </button>
              ))}
            </div>
          )}
        </div>

        {isLoading ? (
          <Loader label="Loading your interviews…" />
        ) : listError ? (
          <p className={styles.error}>{listError}</p>
        ) : sessions.length === 0 ? (
          <div className={styles.empty}>
            <b>No interviews yet</b>
            Pick a topic above and run your first one — it takes about ten minutes and you get a written score at the end.
          </div>
        ) : visible.length === 0 ? (
          <div className={styles.empty}>
            <b>Nothing here yet</b>
            No interviews match that filter.
          </div>
        ) : (
          <div className={styles.sessions}>
            {visible.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------- closing */}
      <section className={styles.closing}>
        <div className={`section-shell ${styles.closingInner}`}>
          <span className={styles.closingIcon}>{ICONS.bars}</span>
          <div>
            <h2>Keep improving</h2>
            <p>The more you practise, the more confident you become. Consistency beats intensity.</p>
          </div>
          <blockquote>
            <p>“Practise like it&apos;s the real thing.”</p>
            <cite>— Kaimana</cite>
          </blockquote>
        </div>
      </section>
    </main>
  );
}

export default function InterviewPage() {
  return (
    <ProtectedRoute>
      <SiteHeader />
      <InterviewContent />
      <SiteFooter />
    </ProtectedRoute>
  );
}
