// Bolt explaining a level in the child's own words.
//
// Separate from lib/api/ai.ts on purpose: everything here answers to a
// stricter rule — no code, ever — and the kids section should not be able
// to reach the rest of the coach by accident.

import { apiRequest } from "./client";

export interface BoltExplanation {
  explanation: string;
}

export const askBolt = (payload: {
  levelTitle: string;
  goal: string;
  kind: "python" | "puzzle";
  program: string;
  expected?: string;
  actual?: string;
  error?: string;
  language?: string;
}) => apiRequest<BoltExplanation>("/api/ai/kids-explain", { method: "POST", body: payload });
