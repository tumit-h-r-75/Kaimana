// Client for the site-wide search behind the command palette.

import { apiRequest } from "./client";

export interface SearchProblem {
  id: string;
  title: string;
  slug: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  tags: string[];
}

export interface SearchContest {
  id: string;
  title: string;
  slug: string;
  startTime: string;
  endTime: string;
}

export interface SearchUser {
  id: string;
  name: string;
  profilePicUrl?: string;
}

export interface SearchResults {
  problems: SearchProblem[];
  contests: SearchContest[];
  users: SearchUser[];
  tags: string[];
}

export const searchEverything = (query: string, signal?: AbortSignal) =>
  apiRequest<SearchResults>(`/api/search?q=${encodeURIComponent(query)}`, { signal });
