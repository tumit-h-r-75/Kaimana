"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import AiLanguagePicker from "./AiLanguagePicker";
import { Skeleton } from "@/components/ui/Loader";
import type { ProblemDetail, Submission } from "@/types/api";

const PanelSkeleton = () => <Skeleton style={{ height: 160 }} />;
const VerdictPanel = dynamic(
  () => import("@/components/verdict/VerdictPanel"),
  { loading: PanelSkeleton },
);
const FollowUpPanel = dynamic(() => import("./FollowUpPanel"), {
  loading: PanelSkeleton,
});
const CodeQualityPanel = dynamic(() => import("./CodeQualityPanel"), {
  loading: PanelSkeleton,
});
const HintPanel = dynamic(() => import("@/components/hints/HintPanel"), {
  loading: PanelSkeleton,
});
const ComplexityAuditorPanel = dynamic(
  () => import("@/components/complexity/ComplexityAuditorPanel"),
  { loading: PanelSkeleton },
);
const RefactorPanel = dynamic(
  () => import("@/components/refactor/RefactorPanel"),
  { loading: PanelSkeleton },
);
const SolutionPanel = dynamic(
  () => import("@/components/solution/SolutionPanel"),
  { loading: PanelSkeleton },
);

type TabKey =
  "results" | "hint" | "bigO" | "style" | "refactor" | "interview" | "solution";

const TABS: { key: TabKey; label: string }[] = [
  { key: "results", label: "Results" },
  { key: "hint", label: "Hint" },
  { key: "bigO", label: "Big-O" },
  { key: "style", label: "Style" },
  { key: "refactor", label: "Refactor" },
  { key: "interview", label: "Interview" },
  { key: "solution", label: "Solution" },
];

// The problem workspace's AI panel — a tabbed column (Results / Hint /
// Big-O / Refactor) replacing what used to be four panels always stacked
// on top of each other under the editor. Each panel component below is
// unchanged and still owns its own request/loading/error state; this is
// Tabs mount on their first visit, then stay mounted to preserve reports.
// Unopened tabs neither download their code nor start their own requests.
export default function AIPanelTabs({
  problemId,
  code,
  isSignedIn,
  submission,
  initialHintTier = 0,
  initialHintPenaltyPercent = 0,
  referenceSolution = null,
  onApplyRefactor,
}: {
  problemId: string;
  code: string;
  isSignedIn: boolean;
  submission: Submission | null;
  /** Only ever populated once the learner has solved this problem — the API
   *  withholds it until then, so its presence is the unlock condition. */
  referenceSolution?: ProblemDetail["referenceSolution"];
  /** Highest hint tier already unlocked on this problem, and the penalty
   *  accrued so far — from the problem payload, passed through to HintPanel. */
  initialHintTier?: number;
  initialHintPenaltyPercent?: number;
  onApplyRefactor: (code: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("results");
  const [visited, setVisited] = useState<Set<TabKey>>(
    () => new Set(["results"]),
  );
  const openTab = (tab: TabKey) => {
    setVisited((previous) => new Set([...previous, tab]));
    setActiveTab(tab);
  };

  // A fresh submission's verdict is the thing to see, whatever tab was open.
  useEffect(() => {
    if (submission) setActiveTab("results");
  }, [submission]);

  const resultsDotClass = submission
    ? submission.verdict === "ACCEPTED"
      ? "ai-tab-dot-ok"
      : "ai-tab-dot-bad"
    : "";

  return (
    <div className="ai-workspace-panel">
      <div className="ai-tabs-row">
        <div className="ai-tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`ai-tab ${activeTab === tab.key ? "is-active" : ""}`}
              onClick={() => openTab(tab.key)}
            >
              {tab.label}
              {tab.key === "results" && submission && (
                <i className={`ai-tab-dot ${resultsDotClass}`} />
              )}
            </button>
          ))}
        </div>

        <div className="ai-tabs-aside">
          <AiLanguagePicker />
        </div>
      </div>

      <div className="ai-tab-body">
        <div role="tabpanel" hidden={activeTab !== "results"}>
          {submission ? (
            <VerdictPanel submission={submission} />
          ) : (
            <div className="ai-tab-empty">
              <div className="ic">✷</div>
              Submit your code to see the full verdict here.
              <br />
              <span style={{ fontSize: 12 }}>
                Run (under the editor) checks the sample tests and costs
                nothing.
              </span>
            </div>
          )}
        </div>

        <div role="tabpanel" hidden={activeTab !== "hint"}>
          {visited.has("hint") && (
            <>
              {isSignedIn ? (
                <HintPanel
                  problemId={problemId}
                  code={code}
                  initialHintTier={initialHintTier}
                  initialHintPenaltyPercent={initialHintPenaltyPercent}
                />
              ) : (
                <div className="ai-tab-empty">
                  <div className="ic">✷</div>
                  Sign in to get hints on this problem.
                </div>
              )}
            </>
          )}
        </div>

        <div role="tabpanel" hidden={activeTab !== "bigO"}>
          {visited.has("bigO") && (
            <>
              {submission ? (
                <ComplexityAuditorPanel
                  key={submission.id}
                  submissionId={submission.id}
                  initialReport={submission.complexityReport}
                />
              ) : (
                <div className="ai-tab-empty">
                  <div className="ic">✷</div>
                  Submit your code to unlock a time/space complexity estimate.
                </div>
              )}
            </>
          )}
        </div>

        <div role="tabpanel" hidden={activeTab !== "style"}>
          {visited.has("style") && (
            <>
              {submission && submission.verdict === "ACCEPTED" ? (
                <CodeQualityPanel
                  key={submission.id}
                  submissionId={submission.id}
                />
              ) : (
                <div className="ai-tab-empty">
                  <div className="ic">✷</div>
                  How the code reads is worth asking once it works — this
                  unlocks with an Accepted submission.
                </div>
              )}
            </>
          )}
        </div>

        <div role="tabpanel" hidden={activeTab !== "refactor"}>
          {visited.has("refactor") && (
            <>
              {submission && submission.verdict === "ACCEPTED" ? (
                <RefactorPanel
                  key={submission.id}
                  submissionId={submission.id}
                  language={submission.language}
                  originalCode={submission.code}
                  initialSuggestions={submission.refactorSuggestions}
                  onApply={onApplyRefactor}
                />
              ) : (
                <div className="ai-tab-empty">
                  <div className="ic">✷</div>
                  Refactor suggestions unlock once you have an Accepted
                  submission on this problem.
                </div>
              )}
            </>
          )}
        </div>

        <div role="tabpanel" hidden={activeTab !== "interview"}>
          {visited.has("interview") && (
            <>
              {submission && submission.verdict === "ACCEPTED" ? (
                <FollowUpPanel
                  key={submission.id}
                  submissionId={submission.id}
                />
              ) : (
                <div className="ai-tab-empty">
                  <div className="ic">✷</div>
                  The interview questions come after an Accepted submission —
                  they are about the code that passed.
                </div>
              )}
            </>
          )}
        </div>

        <div role="tabpanel" hidden={activeTab !== "solution"}>
          {visited.has("solution") && (
            <>
              {referenceSolution ? (
                <SolutionPanel
                  solution={referenceSolution}
                  myCode={
                    submission?.verdict === "ACCEPTED"
                      ? submission.code
                      : undefined
                  }
                />
              ) : (
                <div className="ai-tab-empty">
                  <div className="ic">✷</div>
                  The reference solution unlocks once you have solved this
                  yourself.
                  <br />
                  <span style={{ fontSize: 12 }}>
                    Stuck? The Hint tab gets you moving without giving it away.
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
