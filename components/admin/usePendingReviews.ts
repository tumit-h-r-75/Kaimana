"use client";

import { useEffect, useState } from "react";
import { listHostRequests } from "@/lib/api/hosts";
import { listProposals } from "@/lib/api/proposals";

export interface PendingReviews {
  /** null until loaded, or when that count could not be fetched. */
  hostRequests: number | null;
  proposals: number | null;
}

// The topbar bell, the sidebar counts and the dashboard's review card all
// want the same two numbers. One shared request per 30 seconds serves them
// all, instead of each asking the API on every page change.
const TTL_MS = 30_000;
let cached: { at: number; promise: Promise<PendingReviews> } | null = null;

function fetchPending(): Promise<PendingReviews> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.promise;
  const promise = Promise.all([
    listHostRequests({ status: "pending", limit: 1 }).then((r) => r.pendingCount).catch(() => null),
    listProposals({ status: "pending", limit: 1 }).then((r) => r.pendingCount).catch(() => null),
  ]).then(([hostRequests, proposals]) => ({ hostRequests, proposals }));
  cached = { at: Date.now(), promise };
  return promise;
}

const CHANGED = "kai:pending-reviews-changed";

/**
 * Drop the cached counts after a review, and tell every mounted counter —
 * the bell and the rail on the same page — to fetch them again.
 */
export function invalidatePendingReviews() {
  cached = null;
  window.dispatchEvent(new Event(CHANGED));
}

/**
 * Pending host requests and problem proposals. Both endpoints are admin-only,
 * so a guest host passes `enabled: false` and gets nulls without a request.
 */
export function usePendingReviews(enabled: boolean): PendingReviews {
  const [pending, setPending] = useState<PendingReviews>({ hostRequests: null, proposals: null });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const load = () =>
      void fetchPending().then((result) => {
        if (!cancelled) setPending(result);
      });
    load();
    window.addEventListener(CHANGED, load);
    return () => {
      cancelled = true;
      window.removeEventListener(CHANGED, load);
    };
  }, [enabled]);

  return pending;
}
