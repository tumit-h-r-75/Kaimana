// One solver's public page. Everything here is already published elsewhere
// on the site — the leaderboard, the community feed — gathered under an
// address that can be linked to.

import { apiRequest } from "./client";

export interface PublicSolution {
  id: string;
  language: string;
  runtimeMs: number;
  createdAt: string;
  commentCount: number;
  problem: { id: string; title: string; slug: string; difficulty: "EASY" | "MEDIUM" | "HARD" };
}

export interface PublicProfile {
  id: string;
  name: string;
  profilePicUrl?: string;
  role: string;
  joinedAt: string;
  gems: number;
  rank: number | null;
  totalRanked: number;
  score: number;
  solved: { EASY: number; MEDIUM: number; HARD: number };
  solvedTotal: number;
  submissions: number;
  acceptanceRate: number;
  languages: string[];
  topics: { tag: string; solved: number }[];
  streakDays: number;
  recentSolutions: PublicSolution[];
}

export const getPublicProfile = (id: string) => apiRequest<PublicProfile>(`/api/users/${encodeURIComponent(id)}`);
