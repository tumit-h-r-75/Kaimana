"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { getProblemBySlug } from "@/lib/api/problems";
import { listSubmissions, runCode, submitSolution } from "@/lib/api/submissions";
import { deriveContestStatus, getContestByIdentifier, registerForContest } from "@/lib/api/contests";
import { ApiError, getErrorMessage } from "@/lib/api/client";
import { diagnoseCase, primaryCaseIndex, type RunLimits } from "@/lib/runDiagnostics";
import type { ContestDetail, Language, ProblemDetail, Submission } from "@/types/api";
import MonacoEditor, { type EditorMarker } from "@/components/editor/MonacoEditor";
import AIPanelTabs from "@/components/workspace/AIPanelTabs";
import RunResultPanel, { type RunState } from "@/components/workspace/RunResultPanel";
import ExecutionVisualizer from "@/components/workspace/ExecutionVisualizer";
import { appConfig } from "@/lib/config";
import { PageLoader } from "@/components/ui/Loader";
import { SiteHeader } from "@/app/_components/home/SiteHeader";
import { SiteFooter } from "@/app/_components/home/SiteFooter";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import gateStyles from "./contestGate.module.css";
import styles from "./workspace.module.css";
import { compactCount, topicName } from "@/lib/problemFormat";
import { LANGUAGE_NAME, type LanguageKey } from "@/components/ui/LanguageMark";

const languages: Language[] = ["python", "cpp", "javascript", "typescript"];
const FILE_EXT: Record<Language, string> = { python: "py", cpp: "cpp", javascript: "js", typescript: "ts" };
const DEFAULT_LIMITS: RunLimits = { timeLimitMs: 2000, memoryLimitMb: 256 };

// ---- Contest mode (?contestId=…) -------------------------------------------
// How often the contest's status is re-derived from the clock.
const CONTEST_TICK_MS = 15_000;
const CONTEST_GATE_BANNER_ID = "contest-gate-banner";

type LeftTab = "description" | "discuss";

type ContestLoad = { status: "idle" | "loading" | "ready" | "missing" | "error"; message?: string };

type ContestGate =
  | { kind: "none" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "missing" }
  | { kind: "not-in-contest"; contest: ContestDetail }
  | { kind: "upcoming"; contest: ContestDetail }
  | { kind: "unregistered"; contest: ContestDetail }
  | { kind: "active"; contest: ContestDetail }
  | { kind: "ended"; contest: ContestDetail };

/** Whether (and how) this problem can be solved for the contest in the URL. */
const getContestGate = (
  contestId: string | undefined,
  load: ContestLoad,
  contest: ContestDetail | null,
  problem: ProblemDetail | null,
  now: number,
): ContestGate => {
  if (!contestId) return { kind: "none" };
  if (load.status === "missing") return { kind: "missing" };
  if (load.status === "error") return { kind: "error", message: load.message ?? "Could not load the contest." };
  // Also "loading" for the one render where a previous contest is still in state.
  if (load.status !== "ready" || !contest || !problem || (contest.id !== contestId && contest.slug !== contestId)) return { kind: "loading" };
  const inContest = contest.problems.some((entry) => entry.problemId === problem.id || (entry.slug !== null && entry.slug === problem.slug));
  if (!inContest) return { kind: "not-in-contest", contest };
  const liveStatus = deriveContestStatus(contest, now);
  if (liveStatus === "UPCOMING") return { kind: "upcoming", contest };
  if (liveStatus === "ENDED") return { kind: "ended", contest };
  return contest.isRegistered ? { kind: "active", contest } : { kind: "unregistered", contest };
};

const formatContestTime = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

interface ContestGateBannerProps {
  gate: Exclude<ContestGate, { kind: "none" }>;
  practiceHref: string;
  isRegistering: boolean;
  registerError: string | null;
  onRegister: (contest: ContestDetail) => void;
  onRetry: () => void;
}

function ContestGateBanner({ gate, practiceHref, isRegistering, registerError, onRegister, onRetry }: ContestGateBannerProps) {
  const contestLink = (contest: ContestDetail, label: string) => (
    <Link className="text-link" href={`/contest/${contest.slug}`}>
      {label} <span aria-hidden="true">→</span>
    </Link>
  );
  const registerButton = (contest: ContestDetail) => (
    <button type="button" className="button button-small" onClick={() => onRegister(contest)} disabled={isRegistering}>
      {isRegistering ? "Registering…" : "Register"}
    </button>
  );

  let tone = gateStyles.neutral;
  let title: React.ReactNode;
  let detail: React.ReactNode = null;
  let actions: React.ReactNode = null;
  let pulse = false;

  switch (gate.kind) {
    case "error":
      tone = gateStyles.error;
      title = "Couldn't check this contest";
      detail = `${gate.message} Run and Submit stay disabled until it loads — or practice this problem outside the contest.`;
      actions = (
        <>
          <button type="button" className="button-outline button-small" onClick={onRetry}>
            Retry
          </button>
          <Link className="text-link" href={practiceHref}>
            Practice instead <span aria-hidden="true">→</span>
          </Link>
        </>
      );
      break;
    case "missing":
      title = "Contest not found";
      detail = "This link points to a contest that doesn't exist. You're practicing — submissions won't count toward any contest.";
      actions = (
        <Link className="text-link" href="/contest">
          Browse contests <span aria-hidden="true">→</span>
        </Link>
      );
      break;
    case "not-in-contest":
      title = `This problem isn't part of ${gate.contest.title}`;
      detail = "You're practicing — submissions won't count for that contest.";
      actions = contestLink(gate.contest, "Back to the contest");
      break;
    case "upcoming":
      tone = gateStyles.upcoming;
      title = "This contest hasn't started yet";
      detail = `${gate.contest.title} starts ${formatContestTime(gate.contest.startTime)}. Run and Submit unlock when it begins${
        gate.contest.isRegistered ? "." : " — register now so you're ready."
      }`;
      actions = (
        <>
          {!gate.contest.isRegistered && registerButton(gate.contest)}
          {contestLink(gate.contest, "Contest page")}
        </>
      );
      break;
    case "unregistered":
      tone = gateStyles.locked;
      title = `Register for ${gate.contest.title} to solve this problem`;
      detail = "Run and Submit are disabled until you register — only registered participants can compete.";
      actions = (
        <>
          {registerButton(gate.contest)}
          {contestLink(gate.contest, "Contest page")}
        </>
      );
      break;
    case "active":
      tone = gateStyles.live;
      title = `Contest mode: ${gate.contest.title}`;
      detail = `Your submissions count toward the contest scoreboard. Ends ${formatContestTime(gate.contest.endTime)}.`;
      actions = contestLink(gate.contest, "Scoreboard");
      break;
    case "ended":
      title = "This contest has ended — you're practicing, submissions won't count for it";
      detail = `${gate.contest.title} finished ${formatContestTime(gate.contest.endTime)}.`;
      actions = contestLink(gate.contest, "Final standings");
      break;
    default:
      pulse = true;
      title = "Checking contest…";
      detail = "Run and Submit unlock once the contest status is confirmed.";
  }

  return (
    <div id={CONTEST_GATE_BANNER_ID} className={`${gateStyles.banner} ${tone}`} role="status" aria-live="polite">
      <div className={gateStyles.body}>
        <p className={gateStyles.title}>
          <span className={`${gateStyles.dot}${pulse || gate.kind === "active" ? ` ${gateStyles.pulse}` : ""}`} aria-hidden="true" />
          {title}
        </p>
        {detail && <p className={gateStyles.detail}>{detail}</p>}
      </div>
      {actions && <div className={gateStyles.actions}>{actions}</div>}
      {registerError && (gate.kind === "unregistered" || gate.kind === "upcoming") && (
        <p className={gateStyles.registerError} role="alert">
          {registerError}
        </p>
      )}
    </div>
  );
}

export default function ProblemDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { user, refresh: refreshUser } = useAuth();
  // Set when this problem was opened from a contest (contest/[id]/page.tsx
  // links here with ?contestId=...) so a submission made from within a
  // contest actually counts toward that contest's scoreboard — previously
  // this was never read anywhere and no submission was ever tagged with a
  // contestId, so every contest scoreboard stayed empty forever. It's only
  // sent while the contest gate below is "active" (live + registered + this
  // problem is in the contest); otherwise the page runs in practice mode or
  // stays locked.
  const contestId = useSearchParams().get("contestId") || undefined;

  const [problem, setProblem] = useState<ProblemDetail | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadErrorMessage, setLoadErrorMessage] = useState("");
  const [language, setLanguage] = useState<Language>("python");
  const [codeByLanguage, setCodeByLanguage] = useState<Partial<Record<Language, string>>>({});
  const [runState, setRunState] = useState<RunState>({ status: "idle" });
  // The language + exact code the last finished run used. The editor only
  // marks that run's error line while the code is unchanged, because any edit
  // can move the line the error pointed at.
  const [runSnapshot, setRunSnapshot] = useState<{ language: Language; code: string } | null>(null);
  const [runCount, setRunCount] = useState(0);
  const [revealRequest, setRevealRequest] = useState<{ line: number; nonce: number } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [history, setHistory] = useState<Submission[]>([]);
  // Set only when this exact submission just paid out (first-ever ACCEPTED
  // on this problem) — briefly shown next to the verdict, and triggers a
  // header refresh so the new balance shows up right away.
  const [gemsEarned, setGemsEarned] = useState<number | null>(null);
  // The problem currently on screen. Next.js keeps this page mounted when
  // navigating between problems, so requests started for a previous problem
  // check this before writing state — otherwise a slow run, submission or
  // history response could show up on the next problem.
  const activeProblemIdRef = useRef<string | null>(null);

  // Contest gate state (only used with ?contestId=…). The contest is loaded
  // to check, with the same clock-based status as the contest page, that it's
  // live, that this user registered and that this problem belongs to it. The
  // server enforces the same rules on submit; this tells the solver up front.
  const [contest, setContest] = useState<ContestDetail | null>(null);
  const [contestLoad, setContestLoad] = useState<ContestLoad>(() => ({ status: contestId ? "loading" : "idle" }));
  const [contestNow, setContestNow] = useState(() => Date.now());
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const contestRequestRef = useRef(0);

  // The left column's tab, the run panel's mode, and the stdin for a custom run.
  const [leftTab, setLeftTab] = useState<LeftTab>("description");
  const [runTab, setRunTab] = useState<"tests" | "custom">("tests");
  const [customInput, setCustomInput] = useState("");
  const editorRef = useRef<HTMLElement | null>(null);
  const coachRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    activeProblemIdRef.current = null;
    setStatus("loading");
    setProblem(null);
    setSubmission(null);
    setSubmitError(null);
    setGemsEarned(null);
    setHistory([]);
    setRunState({ status: "idle" });
    setRunSnapshot(null);
    setLeftTab("description");
    setRunTab("tests");
    setCustomInput("");
    getProblemBySlug(slug)
      .then((data) => {
        if (cancelled) return;
        activeProblemIdRef.current = data.id;
        setProblem(data);
        setCodeByLanguage({
          python: data.starterCode.python ?? "",
          cpp: data.starterCode.cpp ?? "",
          javascript: data.starterCode.javascript ?? "",
          // Problems don't ship TypeScript starter code; the JavaScript one is
          // valid TypeScript as-is (the judge declares `require`/`process`).
          typescript: data.starterCode.typescript || data.starterCode.javascript || "",
        });
        setStatus("ready");
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadErrorMessage(getErrorMessage(error, "Could not load this problem. It may not exist."));
          setStatus("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // `silent` re-checks the contest in place (after registering) without
  // flipping the gate back to "Checking contest…".
  const loadContest = useCallback((identifier: string, { silent = false }: { silent?: boolean } = {}) => {
    const requestId = ++contestRequestRef.current;
    if (!silent) setContestLoad({ status: "loading" });
    return getContestByIdentifier(identifier)
      .then((data) => {
        if (requestId !== contestRequestRef.current) return;
        setContest(data);
        setContestNow(Date.now());
        setContestLoad({ status: "ready" });
      })
      .catch((error) => {
        if (requestId !== contestRequestRef.current) return;
        if (error instanceof ApiError && (error.statusCode === 404 || error.statusCode === 400)) {
          setContest(null);
          setContestLoad({ status: "missing" });
        } else if (silent) {
          setRegisterError(getErrorMessage(error, "Couldn't refresh the contest — please reload the page."));
        } else {
          setContest(null);
          setContestLoad({ status: "error", message: getErrorMessage(error, "Could not load the contest.") });
        }
      });
  }, []);

  useEffect(() => {
    setRegisterError(null);
    if (!contestId) {
      contestRequestRef.current += 1; // ignore any in-flight contest response
      setContest(null);
      setContestLoad({ status: "idle" });
      return;
    }
    void loadContest(contestId);
  }, [contestId, loadContest]);

  useEffect(() => {
    if (!contestId) return;
    const interval = setInterval(() => setContestNow(Date.now()), CONTEST_TICK_MS);
    return () => clearInterval(interval);
  }, [contestId]);

  const contestGate = useMemo(
    () => getContestGate(contestId, contestLoad, contest, problem, contestNow),
    [contestId, contestLoad, contest, problem, contestNow],
  );
  // Run/Submit stay disabled until the contest is confirmed, and while it's
  // upcoming or the user isn't registered. An ended contest, a missing one or
  // a problem outside it is plain practice (submitted without a contestId).
  const contestBlocksActions =
    contestGate.kind === "loading" || contestGate.kind === "error" || contestGate.kind === "upcoming" || contestGate.kind === "unregistered";
  const submitContestId = contestGate.kind === "active" ? contestGate.contest.id : undefined;

  const registerFromBanner = async (target: ContestDetail) => {
    if (isRegistering) return;
    setIsRegistering(true);
    setRegisterError(null);
    try {
      await registerForContest(target.id);
      await loadContest(contestId ?? target.id, { silent: true });
    } catch (error) {
      setRegisterError(error instanceof ApiError ? error.message : "Registration failed.");
    } finally {
      setIsRegistering(false);
    }
  };

  const refreshHistory = (problemId: string) => {
    listSubmissions({ problemId, limit: 10 })
      .then((result) => {
        if (activeProblemIdRef.current === problemId) setHistory(result.items);
      })
      .catch(() => {
        // Not signed in, or request failed — history sidebar just stays empty.
      });
  };

  useEffect(() => {
    if (problem && user) refreshHistory(problem.id);
  }, [problem, user]);

  const code = codeByLanguage[language] ?? "";
  const setCode = (value: string) => setCodeByLanguage((prev) => ({ ...prev, [language]: value }));

  const limits = useMemo<RunLimits>(
    () => (problem ? { timeLimitMs: problem.timeLimitMs, memoryLimitMb: problem.memoryLimitMb } : DEFAULT_LIMITS),
    [problem],
  );

  const editorMarkers = useMemo<EditorMarker[]>(() => {
    if (runState.status !== "done" || !runSnapshot || runSnapshot.language !== language || runSnapshot.code !== code) return [];
    const primary = runState.result.cases[primaryCaseIndex(runState.result)];
    if (!primary) return [];
    const diagnostic = diagnoseCase(runSnapshot.language, primary, limits);
    if (diagnostic.line === undefined) return [];
    return [{ line: diagnostic.line, column: diagnostic.column, message: [diagnostic.title, diagnostic.message].filter(Boolean).join(": ") }];
  }, [runState, runSnapshot, language, code, limits]);

  const jumpToLine = (line: number) => setRevealRequest((previous) => ({ line, nonce: (previous?.nonce ?? 0) + 1 }));

  const runSample = async () => {
    if (!problem || isRunning || contestBlocksActions) return;
    if (!code.trim()) {
      setRunSnapshot(null);
      setRunState({ status: "error", message: "The editor is empty — write some code first." });
      return;
    }
    const problemId = problem.id;
    const snapshot = { language, code };
    setIsRunning(true);
    setRunState({ status: "running", sampleCount: Math.min(Math.max(problem.sampleTests.length, 1), 5) });
    try {
      const result = await runCode({ language, source: code, problemId });
      if (activeProblemIdRef.current !== problemId) return;
      // A back end from before per-sample results (e.g. mid-deploy) has no
      // `cases` — show a retryable message instead of crashing the panel.
      if (!Array.isArray(result?.cases)) throw new Error("The code runner sent an unexpected response. Please try again in a moment.");
      setRunSnapshot(snapshot);
      setRunState({ status: "done", result });
    } catch (error) {
      if (activeProblemIdRef.current !== problemId) return;
      setRunSnapshot(null);
      setRunState({ status: "error", message: getErrorMessage(error, "Couldn't reach the code runner. Please try again.") });
    } finally {
      setIsRunning(false);
      setRunCount((count) => count + 1);
    }
  };

  // Runs the code on the learner's own stdin. Without a problemId the runner
  // has nothing to compare against, so each case comes back NO_EXPECTED with
  // whatever the program printed.
  const runCustom = async () => {
    if (!problem || isRunning || contestBlocksActions) return;
    if (!code.trim()) {
      setRunSnapshot(null);
      setRunState({ status: "error", message: "The editor is empty — write some code first." });
      return;
    }
    const problemId = problem.id;
    const snapshot = { language, code };
    setIsRunning(true);
    setRunState({ status: "running", sampleCount: 1 });
    try {
      const result = await runCode({ language, source: code, stdin: customInput });
      if (activeProblemIdRef.current !== problemId) return;
      if (!Array.isArray(result?.cases)) throw new Error("The code runner sent an unexpected response. Please try again in a moment.");
      setRunSnapshot(snapshot);
      setRunState({ status: "done", result });
    } catch (error) {
      if (activeProblemIdRef.current !== problemId) return;
      setRunSnapshot(null);
      setRunState({ status: "error", message: getErrorMessage(error, "Couldn't reach the code runner. Please try again.") });
    } finally {
      setIsRunning(false);
      setRunCount((count) => count + 1);
    }
  };

  const submit = async () => {
    if (!problem || contestBlocksActions) return;
    if (!user) {
      setSubmitError("Sign in to submit your solution.");
      return;
    }
    if (!code.trim()) {
      setSubmitError("The editor is empty — write your solution before submitting.");
      return;
    }
    const problemId = problem.id;
    setIsSubmitting(true);
    setSubmitError(null);
    setGemsEarned(null);
    try {
      const result = await submitSolution({ problemId, code, language, contestId: submitContestId });
      if (activeProblemIdRef.current !== problemId) return;
      setSubmission(result);
      refreshHistory(problemId);
      if (result.gemsAwarded) {
        setGemsEarned(result.gemsAwarded);
        void refreshUser(); // updates the header's gem balance right away
      }
    } catch (error) {
      if (activeProblemIdRef.current !== problemId) return;
      setSubmitError(error instanceof ApiError ? error.message : "Submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <ProtectedRoute>
        <SiteHeader />
        <PageLoader label="Loading problem…" />
        <SiteFooter />
      </ProtectedRoute>
    );
  }

  if (status === "error" || !problem) {
    return (
      <ProtectedRoute>
        <SiteHeader />
        <main className={`section-shell ${styles.page}`}>
          <p className="problem-list-status">{loadErrorMessage}</p>
          <Link className="text-link" href="/problems">
            ← Back to problems
          </Link>
        </main>
        <SiteFooter />
      </ProtectedRoute>
    );
  }

  const stats = problem.stats;
  const solved = problem.myBestVerdict === "ACCEPTED";
  const attempted = !solved && problem.mySubmissionsCount > 0;
  const related = problem.related ?? [];
  const actionState = isSubmitting
    ? "Submitting…"
    : isRunning
      ? "Running…"
      : contestGate.kind === "loading"
        ? "Checking contest…"
        : contestBlocksActions
          ? "Locked"
          : "Ready";

  // The coach and the submission history are not tabs: hidden behind one,
  // nobody found them. They stay in view as cards of their own — under the
  // problem on wide screens, under the editor on narrow ones.
  const LEFT_TABS: { key: LeftTab; label: string }[] = [
    { key: "description", label: "Description" },
    { key: "discuss", label: "Discuss" },
  ];

  const onTabKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const index = LEFT_TABS.findIndex((t) => t.key === leftTab);
    const next = LEFT_TABS[(index + (event.key === "ArrowRight" ? 1 : -1) + LEFT_TABS.length) % LEFT_TABS.length];
    setLeftTab(next.key);
    document.getElementById(`tab-${next.key}`)?.focus();
  };

  // Constraints are usually one per line; shown as a list when they are.
  const constraintLines = (problem.constraints ?? "")
    .split("\n")
    .map((line) => line.replace(/^\s*[-*•]\s*/, "").trim())
    .filter(Boolean);

  return (
    <ProtectedRoute>
      <SiteHeader />
      <main className={styles.page}>
        <div className="section-shell">
          <Link className={styles.back} href="/problems">
            <span aria-hidden="true">←</span> Back to problems
          </Link>

          {/* ------------------------------------------------------ head */}
          <header className={styles.head}>
            <div className={styles.headMain}>
              <div className={styles.titleRow}>
                <span className={`${styles.level} ${styles[`level_${problem.difficulty}`]}`}>{problem.difficulty.toLowerCase()}</span>
                <h1>{problem.title}</h1>
                {solved && <span className={styles.solvedBadge}>✓ Solved</span>}
                {attempted && <span className={styles.attemptedBadge}>Attempted</span>}
              </div>
              <div className={styles.metaRow}>
                {problem.tags.map((tag) => (
                  <Link key={tag} className={styles.tag} href={`/problems?topic=${encodeURIComponent(tag)}`}>
                    {topicName(tag)}
                  </Link>
                ))}
                <span className={styles.metaStat} title="Share of submissions accepted">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="8.5" />
                    <path d="m8.5 12.3 2.4 2.4L15.8 10" />
                  </svg>
                  {stats?.acceptanceRate === null || stats?.acceptanceRate === undefined ? "New" : `${stats.acceptanceRate}% accepted`}
                </span>
                <span className={styles.metaStat} title="Points for an Accepted solution">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" />
                  </svg>
                  {problem.basePoints} pts
                </span>
              </div>
            </div>
            <div className={styles.headActions}>
              <button
                type="button"
                className="button"
                onClick={() => {
                  editorRef.current?.scrollIntoView({ block: "start" });
                  editorRef.current?.querySelector<HTMLElement>("textarea, [contenteditable='true']")?.focus();
                }}
              >
                {solved ? "Solve again" : attempted ? "Keep solving" : "Solve now"}
              </button>
            </div>
          </header>

          {contestGate.kind !== "none" && (
            <ContestGateBanner
              gate={contestGate}
              practiceHref={`/problems/${problem.slug}`}
              isRegistering={isRegistering}
              registerError={registerError}
              onRegister={registerFromBanner}
              onRetry={() => {
                if (contestId) void loadContest(contestId);
              }}
            />
          )}

          <ul className={styles.facts} aria-label="Limits and numbers">
            <li>
              <span>Time limit</span>
              <b>{problem.timeLimitMs >= 1000 ? `${(problem.timeLimitMs / 1000).toFixed(1).replace(/\.0$/, "")} s` : `${problem.timeLimitMs} ms`}</b>
            </li>
            <li>
              <span>Memory limit</span>
              <b>{problem.memoryLimitMb} MB</b>
            </li>
            <li>
              <span>Accepted</span>
              <b>{compactCount(stats?.accepted ?? 0)}</b>
            </li>
            <li>
              <span>Submissions</span>
              <b>{compactCount(stats?.submissions ?? 0)}</b>
            </li>
            <li>
              <span>Your attempts</span>
              <b>{problem.mySubmissionsCount}</b>
            </li>
          </ul>

          {/* ------------------------------------------------- workspace */}
          <div className={styles.workspace}>
            <section className={styles.left} aria-label="Problem">
              <div className={styles.tabs} role="tablist" aria-label="Problem sections" onKeyDown={onTabKey}>
                {LEFT_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    id={`tab-${tab.key}`}
                    type="button"
                    role="tab"
                    aria-selected={leftTab === tab.key}
                    aria-controls={`panel-${tab.key}`}
                    tabIndex={leftTab === tab.key ? 0 : -1}
                    className={`${styles.tab}${leftTab === tab.key ? ` ${styles.tabOn}` : ""}`}
                    onClick={() => setLeftTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Both panels stay mounted and are only hidden. */}
              <div id="panel-description" role="tabpanel" aria-labelledby="tab-description" hidden={leftTab !== "description"} className={styles.panel}>
                <h2 className={styles.panelTitle}>Problem statement</h2>
                <p className={styles.prose}>{problem.statement}</p>

                {problem.inputFormat && (
                  <>
                    <h3 className={styles.subTitle}>Input format</h3>
                    <p className={styles.prose}>{problem.inputFormat}</p>
                  </>
                )}
                {problem.outputFormat && (
                  <>
                    <h3 className={styles.subTitle}>Output format</h3>
                    <p className={styles.prose}>{problem.outputFormat}</p>
                  </>
                )}

                {problem.sampleTests.map((sample, index) => (
                  <div key={index} className={styles.example}>
                    <h3 className={styles.subTitle}>Example {index + 1}</h3>
                    <div className={styles.exampleBox}>
                      <p>
                        <span>Input</span>
                        <code>{sample.input}</code>
                      </p>
                      <p>
                        <span>Output</span>
                        <code>{sample.expectedOutput}</code>
                      </p>
                      {sample.explanation && (
                        <p>
                          <span>Explanation</span>
                          <em>{sample.explanation}</em>
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {constraintLines.length > 0 && (
                  <>
                    <h3 className={styles.subTitle}>Constraints</h3>
                    <ul className={styles.constraints}>
                      {constraintLines.map((line, index) => (
                        <li key={index}>
                          <code>{line}</code>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              <div id="panel-discuss" role="tabpanel" aria-labelledby="tab-discuss" hidden={leftTab !== "discuss"} className={styles.panel}>
                <h2 className={styles.panelTitle}>Discuss</h2>
                <p className={styles.muted}>
                  Every accepted solution to {problem.title} is in the community feed, where you can read other people&apos;s approaches and
                  comment on them.
                </p>
                {!solved && (
                  <p className={styles.spoiler}>
                    They are complete solutions — worth saving until you have an Accepted of your own.
                  </p>
                )}
                <Link className="button-outline button-small" href={`/community?q=${encodeURIComponent(problem.title)}`}>
                  Open the solutions <span aria-hidden="true">→</span>
                </Link>
              </div>
            </section>

            <section className={styles.right} ref={editorRef} aria-label="Your solution">
              <div className={styles.editorCard}>
                <div className={styles.editorBar}>
                  <label className={styles.langSelect}>
                    <span className="sr-only">Language</span>
                    <select value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
                      {languages.map((lang) => (
                        <option key={lang} value={lang}>
                          {LANGUAGE_NAME[lang as LanguageKey]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <span className={styles.fileName}>
                    solution.{FILE_EXT[language]} <i>· {actionState}</i>
                  </span>
                  <div className={styles.editorActions}>
                    <button
                      type="button"
                      className={styles.runButton}
                      onClick={runTab === "custom" ? runCustom : runSample}
                      disabled={isRunning || contestBlocksActions}
                      aria-describedby={contestBlocksActions ? CONTEST_GATE_BANNER_ID : undefined}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M7 5v14l11-7z" />
                      </svg>
                      {isRunning ? "Running…" : "Run"}
                    </button>
                    <button
                      type="button"
                      className="button button-small"
                      onClick={submit}
                      disabled={isSubmitting || contestBlocksActions}
                      aria-describedby={contestBlocksActions ? CONTEST_GATE_BANNER_ID : undefined}
                    >
                      {isSubmitting ? "Submitting…" : "Submit"}
                    </button>
                  </div>
                </div>
                <MonacoEditor language={language} value={code} onChange={setCode} markers={editorMarkers} revealRequest={revealRequest} height="460px" />
              </div>

              {submitError && (
                <p className={styles.submitError} role="alert">
                  {submitError}
                </p>
              )}

              {/* The verdict, where the Submit button is — the full review is
                  one click away in the coach. */}
              {submission && (
                <div className={`${styles.verdictStrip} ${submission.verdict === "ACCEPTED" ? styles.toneOk : styles.toneBad}`} role="status">
                  <b>{submission.verdict.replace(/_/g, " ").toLowerCase()}</b>
                  <span>
                    {submission.passedTests}/{submission.totalTests} tests
                    {submission.verdict === "ACCEPTED" ? ` · ${submission.runtimeMs} ms · ${submission.score} pts` : ""}
                  </span>
                  <button type="button" onClick={() => coachRef.current?.scrollIntoView({ block: "start" })}>
                    See the review <span aria-hidden="true">→</span>
                  </button>
                </div>
              )}
              {gemsEarned !== null && gemsEarned > 0 && (
                <p className="gems-earned-note">✦ First solve — +{gemsEarned} gems added to your balance!</p>
              )}

              <div className={styles.runCard}>
                <div className={styles.runTabs} role="tablist" aria-label="Run">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={runTab === "tests"}
                    className={runTab === "tests" ? styles.runTabOn : undefined}
                    onClick={() => setRunTab("tests")}
                  >
                    Test results
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={runTab === "custom"}
                    className={runTab === "custom" ? styles.runTabOn : undefined}
                    onClick={() => setRunTab("custom")}
                  >
                    Custom input
                  </button>
                </div>
                {runTab === "custom" && (
                  <div className={styles.custom}>
                    <label htmlFor="custom-input">Your input — the program reads it from stdin</label>
                    <textarea
                      id="custom-input"
                      value={customInput}
                      onChange={(event) => setCustomInput(event.target.value)}
                      rows={4}
                      spellCheck={false}
                      placeholder={problem.sampleTests[0]?.input ?? ""}
                    />
                    <p>Run uses this input and shows what your program prints; there is no expected output to compare against.</p>
                  </div>
                )}
                <RunResultPanel key={runCount} state={runState} language={runSnapshot?.language ?? language} limits={limits} onJumpToLine={jumpToLine} />
              </div>

              {appConfig.executionVisualizer && (
                <ExecutionVisualizer language={language} source={code} disabled={contestBlocksActions} onLineChange={jumpToLine} />
              )}
            </section>

            {/* The coach: each tab says what it is for, so nobody has to guess
                what "Big-O" or "Refactor" will do before clicking. */}
            <section className={styles.coachCard} ref={coachRef} aria-labelledby="coach-title">
              <div className={styles.cardHead}>
                <span className={styles.cardIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3Z" />
                    <path d="M9 18h6M10 21h4" />
                  </svg>
                </span>
                <div>
                  <h2 id="coach-title">
                    AI coach
                    {submission && <i className={submission.verdict === "ACCEPTED" ? styles.dotOk : styles.dotBad} aria-hidden="true" />}
                  </h2>
                  <p>Help with this problem, on your own code.</p>
                </div>
              </div>
              <ul className={styles.coachGuide}>
                <li>
                  <b>Results</b> the full verdict of your last submission
                </li>
                <li>
                  <b>Hint</b> a nudge first, then more — each tier takes a little off the score
                </li>
                <li>
                  <b>Big-O</b> the time and space your submission really takes
                </li>
                <li>
                  <b>Refactor</b> a cleaner version of your accepted code
                </li>
                <li>
                  <b>Solution</b> the reference answer, once you have solved it
                </li>
              </ul>
              <AIPanelTabs
                problemId={problem.id}
                code={code}
                isSignedIn={Boolean(user)}
                submission={submission}
                initialHintTier={problem.myHintTier ?? 0}
                initialHintPenaltyPercent={problem.myHintPenaltyPercent ?? 0}
                referenceSolution={problem.referenceSolution ?? null}
                onApplyRefactor={(refactoredCode) => {
                  // The refactored code is in the submission's language, which may
                  // not be the editor's currently-selected tab (the user could
                  // have switched languages after submitting) — so switch to that
                  // language too, not just overwrite whatever tab happens to be
                  // open.
                  if (!submission) return;
                  setLanguage(submission.language);
                  setCodeByLanguage((prev) => ({ ...prev, [submission.language]: refactoredCode }));
                }}
              />
            </section>

            <section className={styles.subsCard} aria-labelledby="subs-title">
              <div className={styles.cardHead}>
                <span className={styles.cardIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M6 3h8l4 4v14H6z" />
                    <path d="M14 3v4h4M9 12h6M9 16h6" />
                  </svg>
                </span>
                <div>
                  <h2 id="subs-title">Recent submissions</h2>
                  <p>Your attempts at this problem, newest first. Open one to see its code and verdict.</p>
                </div>
                {history.length > 0 && (
                  <Link className={styles.cardLink} href="/submissions">
                    All <span aria-hidden="true">→</span>
                  </Link>
                )}
              </div>
              {!user ? (
                <p className={styles.muted}>Sign in to keep a history of your attempts.</p>
              ) : history.length === 0 ? (
                <p className={styles.muted}>Nothing yet — press Submit and every attempt is listed here.</p>
              ) : (
                <div className={styles.subsScroll}>
                  <table className={styles.subsTable}>
                    <thead>
                      <tr>
                        <th scope="col">Verdict</th>
                        <th scope="col">Tests</th>
                        <th scope="col">Score</th>
                        <th scope="col">Language</th>
                        <th scope="col">When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((item) => {
                        const tone =
                          item.verdict === "ACCEPTED"
                            ? styles.toneOk
                            : item.verdict === "TIME_LIMIT_EXCEEDED" || item.verdict === "MEMORY_LIMIT_EXCEEDED"
                              ? styles.toneWarn
                              : styles.toneBad;
                        return (
                          <tr key={item.id}>
                            <td>
                              <Link href={`/submissions/${item.id}`} className={`${styles.verdictPill} ${tone}`}>
                                {item.verdict.replace(/_/g, " ").toLowerCase()}
                              </Link>
                            </td>
                            <td>
                              {item.passedTests}/{item.totalTests}
                            </td>
                            <td>{item.score}</td>
                            <td>{LANGUAGE_NAME[item.language as LanguageKey] ?? item.language}</td>
                            <td>
                              <time dateTime={item.createdAt}>
                                {new Date(item.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                              </time>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          {/* --------------------------------------------------- related */}
          {related.length > 0 && (
            <section className={styles.related} aria-labelledby="related-title">
              <div className={styles.relatedHead}>
                <h2 id="related-title">Related problems</h2>
                <Link className={styles.textLink} href={problem.tags[0] ? `/problems?topic=${encodeURIComponent(problem.tags[0])}` : "/problems"}>
                  View all <span aria-hidden="true">→</span>
                </Link>
              </div>
              <div className={styles.relatedGrid}>
                {related.map((item) => (
                  <Link key={item.slug} href={`/problems/${item.slug}`} className={styles.relatedCard}>
                    <b>{item.title}</b>
                    <span className={styles.relatedMeta}>
                      <i className={`${styles.level} ${styles[`level_${item.difficulty}`]}`}>{item.difficulty.toLowerCase()}</i>
                      {item.tags[0] && <span>{topicName(item.tags[0])}</span>}
                    </span>
                    <span className={styles.relatedStats}>
                      <span>{item.acceptanceRate === null ? "New" : `${item.acceptanceRate}%`}</span>
                      <span>{compactCount(item.submissionCount)} submissions</span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
    </ProtectedRoute>
  );
}
