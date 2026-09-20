import { apiRequest } from "./client";
import type { Difficulty, ProblemDetail, ProblemListResult } from "@/types/api";

export interface ListProblemsParams {
  difficulty?: string;
  tags?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const listProblems = (params: ListProblemsParams = {}) => {
  const query = new URLSearchParams();
  if (params.difficulty) query.set("difficulty", params.difficulty);
  if (params.tags) query.set("tags", params.tags);
  if (params.search) query.set("search", params.search);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  const queryString = query.toString();
  return apiRequest<ProblemListResult>(`/api/problems${queryString ? `?${queryString}` : ""}`);
};

export const getProblemBySlug = (slug: string) => apiRequest<ProblemDetail>(`/api/problems/${slug}`);

/** A suggested problem, with the sentence that explains why it was picked. */
export interface Suggestion {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  basePoints: number;
  reason: string;
}

export interface Recommendations {
  /** Started and never finished — the cheapest win available. */
  resume: (Suggestion & { attempts: number; lastAttemptAt: string }) | null;
  /** Unsolved, in the weakest topic, at a difficulty they are ready for. */
  next: Suggestion | null;
  focusTag: string | null;
  stats: {
    solved: number;
    attempted: number;
    solvedByDifficulty: Record<Difficulty, number>;
    readyFor: Difficulty;
  };
}

// Derived entirely from the caller's own history, so it needs a session.
export const getRecommendations = () => apiRequest<Recommendations>("/api/problems/recommended");
