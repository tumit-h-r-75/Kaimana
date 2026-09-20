// Shape detection for the Execution Visualizer.
//
// A trace gives values with a Python type tag but no intent: the difference
// between "a list" and "a DP table you should draw as a filling grid" is
// something we infer here. Kept apart from the component so it can be
// exercised against real traces without a DOM.

import type { TraceFrame, TraceValue } from "@/lib/api/submissions";

export const isScalar = (value: TraceValue): value is Extract<TraceValue, { t: "s" }> => value.t === "s";

export const isNumber = (value: TraceValue) => isScalar(value) && typeof value.v === "number";

/** A list whose sampled items are all numbers — the case worth drawing as bars. */
export const numericList = (value: TraceValue): number[] | null => {
  if (value.t !== "l" || !value.v.length) return null;
  if (!value.v.every(isNumber)) return null;
  return value.v.map((item) => (item as { v: number }).v);
};

/**
 * A list of two or more equal-length numeric rows — a DP table. The width
 * check matters: a ragged list-of-lists is not a grid, and drawing it as one
 * would silently misalign every row after the first.
 */
export const numericGrid = (value: TraceValue): number[][] | null => {
  if (value.t !== "l" || value.v.length < 2) return null;
  const rows = value.v.map(numericList);
  if (rows.some((row) => row === null)) return null;
  const width = rows[0]!.length;
  if (width < 2 || rows.some((row) => row!.length !== width)) return null;
  return rows as number[][];
};

/**
 * Integer locals that are a valid index into a list of `length` — how a
 * two-pointer or sliding-window solution shows up in a trace. Drawn as
 * markers under the bars rather than as separate numbers, which is the
 * whole point of watching the loop move.
 */
export const pointersInto = (frame: TraceFrame, length: number, listName: string) =>
  Object.entries(frame.v)
    .filter(([name, value]) => {
      if (name === listName || !isScalar(value)) return false;
      const raw = value.v;
      return typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw < length;
    })
    .map(([name, value]) => ({ name, index: (value as { v: number }).v }));

/**
 * Rebuilds the call stack as of frame `upTo`.
 *
 * Depth is read from the frame rather than by counting calls and returns,
 * because sampling drops frames: on a long run the trace holds every 8th
 * line, so a call and its return can both vanish. Reconciling to the
 * recorded depth keeps the tree honest even then.
 */
export const callStackAt = (frames: TraceFrame[], upTo: number) => {
  const stack: string[] = [];
  for (let i = 0; i <= upTo && i < frames.length; i++) {
    const { d, fn } = frames[i];
    while (stack.length > d) stack.pop();
    while (stack.length < d) stack.push(fn);
    if (stack.length) stack[stack.length - 1] = fn;
  }
  return stack;
};
