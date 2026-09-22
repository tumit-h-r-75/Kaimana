// Client for the public Community feature — a feed of other users' accepted
// solutions plus each one's comment thread. Types are defined locally here
// (rather than in @/types/api) to avoid conflicting with a parallel edit to
// that shared file.

import { apiRequest } from "./client";

export type CommunityDifficulty = "EASY" | "MEDIUM" | "HARD";
export type CommunityLanguage = "python" | "cpp" | "javascript" | "typescript";
export type CommunitySort = "newest" | "oldest" | "fastest";

export interface CommunityAuthor {
  id: string;
  name: string;
  profilePicUrl?: string;
}

export interface CommunityProblemRef {
  id: string;
  title: string;
  slug: string;
  difficulty: CommunityDifficulty;
  /** Present on feed items, where the card picks its icon from them. */
  tags?: string[];
}

export interface CommunityFeedItem {
  id: string;
  language: CommunityLanguage;
  verdict: string;
  score: number;
  runtimeMs: number;
  createdAt: string;
  author: CommunityAuthor | null;
  problem: CommunityProblemRef | null;
  commentCount: number;
}

export interface CommunitySubmissionDetail extends CommunityFeedItem {
  code: string;
}

export interface CommunityFeedResult {
  items: CommunityFeedItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CommunityComment {
  id: string;
  content: string;
  createdAt: string;
  author: CommunityAuthor | null;
}

export interface CommunityFeedParams {
  page?: number;
  limit?: number;
  /** Problem title or solver name. */
  search?: string;
  difficulty?: CommunityDifficulty;
  language?: CommunityLanguage;
  sort?: CommunitySort;
}

export const getCommunityFeed = (params: CommunityFeedParams = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.difficulty) query.set("difficulty", params.difficulty);
  if (params.language) query.set("language", params.language);
  if (params.sort && params.sort !== "newest") query.set("sort", params.sort);
  const queryString = query.toString();
  return apiRequest<CommunityFeedResult>(`/api/community/feed${queryString ? `?${queryString}` : ""}`);
};

export const getCommunitySubmission = (id: string) => apiRequest<CommunitySubmissionDetail>(`/api/community/submissions/${id}`);

export const listCommunityComments = (id: string) => apiRequest<CommunityComment[]>(`/api/community/submissions/${id}/comments`);

export const addCommunityComment = (id: string, content: string) =>
  apiRequest<CommunityComment>(`/api/community/submissions/${id}/comments`, { method: "POST", body: { content } });

export const deleteCommunityComment = (commentId: string) =>
  apiRequest<null>(`/api/community/comments/${commentId}`, { method: "DELETE" });
