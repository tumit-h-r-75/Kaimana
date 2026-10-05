import "server-only";
import type { ProblemListResult, ApiResponse } from "@/types/api";
import type { ListProblemsParams } from "./problems";

/** Anonymous, paginated server rendering. Never forward a visitor's session. */
export async function getPublicProblems(
  params: ListProblemsParams,
): Promise<ProblemListResult | null> {
  const origin = (
    process.env.BACKEND_ORIGIN?.trim() || "https://kaimana-back.vercel.app"
  ).replace(/\/$/, "");
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  try {
    const response = await fetch(`${origin}/api/problems?${query}`, {
      next: { revalidate: 60, tags: ["public-problems"] },
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as ApiResponse<ProblemListResult>;
    return payload.success ? payload.data : null;
  } catch {
    // Keep the page usable during an API cold start; the browser can retry.
    return null;
  }
}
