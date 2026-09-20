import { apiRequest } from "./client";
import type { Language, Submission, SubmissionListResult } from "@/types/api";

export interface SubmitPayload {
  problemId: string;
  code: string;
  language: Language;
  contestId?: string;
}

export const submitSolution = (payload: SubmitPayload) => apiRequest<Submission>("/api/submissions", { method: "POST", body: payload });

export const getSubmissionById = (id: string) => apiRequest<Submission>(`/api/submissions/${id}`);

export const listSubmissions = (params: { problemId?: string; page?: number; limit?: number } = {}) => {
  const query = new URLSearchParams();
  if (params.problemId) query.set("problemId", params.problemId);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  const queryString = query.toString();
  return apiRequest<SubmissionListResult>(`/api/submissions${queryString ? `?${queryString}` : ""}`);
};

export interface RunPayload {
  language: Language;
  source: string;
  /** Run against this problem's sample tests and compare the output. */
  problemId?: string;
  /** Custom input instead of the sample tests (output is not compared). */
  stdin?: string;
}

/**
 * How one sample run ended. PASSED / WRONG_ANSWER compare against the sample's
 * expected output; NO_EXPECTED means it ran cleanly on custom input (nothing
 * to compare against); SKIPPED cases never ran because the code didn't compile.
 */
export type RunOutcome =
  | "PASSED"
  | "WRONG_ANSWER"
  | "NO_EXPECTED"
  | "COMPILATION_ERROR"
  | "RUNTIME_ERROR"
  | "TIME_LIMIT_EXCEEDED"
  | "MEMORY_LIMIT_EXCEEDED"
  | "SKIPPED";

export interface RunCaseResult {
  index: number;
  input: string;
  expectedOutput: string | null;
  outcome: RunOutcome;
  stdout: string;
  stderr: string;
  compileOutput: string;
  exitCode: number | null;
  timeMs: number | null;
  memoryKb: number | null;
}

export interface RunResult {
  /** The first failing case's outcome, or PASSED / NO_EXPECTED when nothing failed. */
  outcome: RunOutcome;
  passed: number;
  total: number;
  cases: RunCaseResult[];
}

// Ad-hoc "Run" — executes against the problem's sample tests (no persisted
// Submission record). Backed by POST /api/submissions/execute.
export const runCode = (payload: RunPayload) => apiRequest<RunResult>("/api/submissions/execute", { method: "POST", body: payload });

/**
 * One value captured at one line. The tag says what shape it had in Python,
 * which is what lets the timeline pick a rendering instead of printing repr:
 * `s`calar, `l`ist, s`e`t, `d`ict, or a `r`epr fallback for everything else.
 * `n` is the true length, which can exceed the sampled items.
 */
export type TraceValue =
  | { t: "s"; v: string | number | boolean | null }
  | { t: "l" | "e"; v: TraceValue[]; n: number }
  | { t: "d"; v: [string, TraceValue][]; n: number }
  | { t: "r"; v: string };

export interface TraceFrame {
  /** 1-based line in the learner's own source. */
  l: number;
  /** Call depth; 1 is module level, deeper means inside a call. */
  d: number;
  fn: string;
  v: Record<string, TraceValue>;
}

export interface TraceResult {
  frames: TraceFrame[];
  /** 1 = every line was kept, 2 = every other, and so on. */
  stride: number;
  truncated: boolean;
  /** Set when values were summarised to fit the response. */
  summarised?: boolean;
  /** The exception that ended the run, if it ended that way. */
  error: string | null;
  /** What the program itself printed, separate from the trace. */
  stdout: string;
}

// Execution Visualizer — re-runs the code under a tracing harness. A separate,
// much slower execution than Run, so it is only ever called on demand.
export const visualiseExecution = (payload: { language: Language; source: string }) =>
  apiRequest<TraceResult>("/api/submissions/visualise", { method: "POST", body: payload });
