import { apiRequest } from "./client";

export interface VerdictBreakdownEntry {
  verdict: string;
  count: number;
}

export interface LanguageBreakdownEntry {
  language: string;
  count: number;
}

export interface DifficultyBreakdownEntry {
  difficulty: "EASY" | "MEDIUM" | "HARD";
  count: number;
}

export interface ActivityEntry {
  date: string;
  count: number;
}

export interface AnalyticsResult {
  totalSubmissions: number;
  acceptedSubmissions: number;
  problemsSolved: number;
  accuracyPercent: number;
  verdictBreakdown: VerdictBreakdownEntry[];
  languageBreakdown: LanguageBreakdownEntry[];
  difficultyBreakdown: DifficultyBreakdownEntry[];
  activity: ActivityEntry[];
  currentStreakDays: number;
}

export const getMyAnalytics = () => apiRequest<AnalyticsResult>("/api/analytics/me");

export interface AnalyticsHistoryEntry {
  date: string;
  totalSubmissions: number;
  acceptedSubmissions: number;
  problemsSolved: number;
  accuracyPercent: number;
  currentStreakDays: number;
}

export const getMyAnalyticsHistory = (days = 30) =>
  apiRequest<AnalyticsHistoryEntry[]>(`/api/analytics/history?days=${days}`);

/* ------------------------------------------------------------- insights */

export interface InsightDay {
  date: string;
  submissions: number;
  accepted: number;
  /** Distinct problems that passed that day. */
  problems: number;
}

export interface HeatCell {
  /** 0 = Sunday. */
  day: number;
  hour: number;
  count: number;
  accepted: number;
}

export interface LanguageInsight {
  language: string;
  count: number;
  accepted: number;
  solved: number;
  avgRuntimeMs: number | null;
}

export interface TagInsight {
  tag: string;
  attempted: number;
  solved: number;
  solveRate: number;
}

export interface DifficultyInsight {
  difficulty: "EASY" | "MEDIUM" | "HARD";
  attempted: number;
  solved: number;
  submissions: number;
  solveRate: number;
}

export interface AnalyticsInsights {
  windowDays: number;
  timeZone: string;
  daily: InsightDay[];
  heatmap: HeatCell[];
  languages: LanguageInsight[];
  attempts: { attempts: number; problems: number; capped: boolean }[];
  tags: TagInsight[];
  difficulty: DifficultyInsight[];
}

/** The reader's own zone decides which hour of the day a submission fell in. */
const localZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

export const getMyInsights = (days = 30) =>
  apiRequest<AnalyticsInsights>(`/api/analytics/insights?days=${days}&tz=${encodeURIComponent(localZone())}`);
