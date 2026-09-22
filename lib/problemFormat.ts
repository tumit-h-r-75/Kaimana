// Small display helpers shared by the problem library and a problem's page.

// Short tags written out; anything else is shown as its words.
const TAG_NAMES: Record<string, string> = { dp: "Dynamic programming", bfs: "BFS", dfs: "DFS" };

/** "two-pointers" → "Two pointers", "dp" → "Dynamic programming". */
export const topicName = (tag: string) =>
  TAG_NAMES[tag.toLowerCase()] ?? tag.replace(/[-_]+/g, " ").replace(/^\w/, (c) => c.toUpperCase());

/** 2400 → "2.4K", 1500000 → "1.5M". */
export const compactCount = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
    : n >= 1000
      ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`
      : String(n);
