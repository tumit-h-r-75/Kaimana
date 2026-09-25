import { apiRequest } from "./client";
import type { ComplexityReport, RefactorSuggestion } from "@/types/api";
import type { AdminTestCaseRecord } from "./admin";

// Negative marking: unlocking a hint tier costs a percentage of the
// problem's score (see hint.service.ts's HINT_TIER_COSTS, the backend's
// source of truth for these numbers — kept in sync manually since this is
// just display copy for the confirmation modal, not what's charged).
export const HINT_TIER_COSTS = [5, 15, 30];

export interface HintResult {
  level: number;
  maxLevel: number;
  hint: string;
  source: "ai" | "rule-based";
  // Percentage of the problem's score forfeited by *this* call — 0 when
  // re-reading a tier already unlocked earlier.
  cost: number;
  // Running total forfeited on this problem so far, across every tier
  // unlocked (this call included).
  penaltyPercent: number;
}

export const getHint = (payload: { problemId: string; level: number; code?: string; language?: string }) =>
  apiRequest<HintResult>("/api/ai/hint", { method: "POST", body: payload });

// Why a submission failed, in words, on your own code. Not a hint: it
// describes what already happened rather than what to do next, which is why
// it costs no score.
export interface FailureExplanation {
  explanation: string;
  source: "ai" | "facts";
}

export const explainFailure = (submissionId: string, language?: string) =>
  apiRequest<FailureExplanation>("/api/ai/explain-failure", { method: "POST", body: { submissionId, language } });

export const runComplexityAudit = (submissionId: string, language?: string) =>
  apiRequest<ComplexityReport>("/api/ai/audit", { method: "POST", body: { submissionId, language } });

// No rule-based Plan-B for refactor suggestions (see refactor.service.ts) —
// when GEMINI_API_KEY isn't configured, or Gemini's response couldn't be
// parsed after a retry, the backend returns an empty `suggestions` array
// with source:"unavailable" and a human-readable `message` instead of
// fabricating a rewrite. source:"ai" with an empty array means the model
// looked and genuinely found nothing worth changing.
export interface RefactorResult {
  suggestions: RefactorSuggestion[];
  source: "ai" | "unavailable";
  message?: string;
}

export const generateRefactorSuggestions = (submissionId: string, language?: string) =>
  apiRequest<RefactorResult>("/api/ai/refactor", { method: "POST", body: { submissionId, language } });

export const verifyRefactorSuggestion = (submissionId: string, suggestionIndex: number) =>
  apiRequest<RefactorSuggestion>("/api/ai/refactor/verify", { method: "POST", body: { submissionId, suggestionIndex } });

// Automated Test Case Generator (F10, admin-only). Every generated case is
// inserted with reviewed:false — it never affects grading until an admin
// approves it (updateAdminTestCase(id, { reviewed: true })), so `created`
// here is a pending queue to review, not live test cases yet.
export interface GenerateTestsResult {
  created: AdminTestCaseRecord[];
  requested: number;
  discarded: number;
  source: "ai" | "unavailable";
  message?: string;
}

export const generateTestCases = (problemId: string) =>
  apiRequest<GenerateTestsResult>("/api/ai/generate-tests", { method: "POST", body: { problemId } });

// The questions an interviewer asks once the code passes, and the marking
// of one answer. Both work only on your own accepted submission.
export interface FollowUpQuestions {
  questions: string[];
}

export interface FollowUpMark {
  verdict: "strong" | "partial" | "off";
  feedback: string;
}

export const askFollowUps = (submissionId: string, language?: string) =>
  apiRequest<FollowUpQuestions>("/api/ai/follow-ups", { method: "POST", body: { submissionId, language } });

export const markFollowUp = (payload: { submissionId: string; question: string; answer: string; language?: string }) =>
  apiRequest<FollowUpMark>("/api/ai/follow-ups/answer", { method: "POST", body: payload });

// A walkthrough of somebody else's accepted solution, compared with your own
// when you have one on the same problem.
export interface SolutionExplanation {
  explanation: string;
  comparedWithYours: boolean;
}

export const explainSolution = (submissionId: string, language?: string) =>
  apiRequest<SolutionExplanation>("/api/ai/explain-solution", { method: "POST", body: { submissionId, language } });
