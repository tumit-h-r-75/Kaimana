"use client";

// Profile section for problem proposals: what sending one costs, the learner's
// gem balance, the way in to propose a problem, and the proposals they've sent.

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { ApiError, getErrorMessage } from "@/lib/api/client";
import { deleteProposal, getMyProposals, type MyProposalsResult, type ProposalSummary } from "@/lib/api/proposals";
import { DifficultyTag, ProposalStatusBadge } from "./ProposalBadges";
import styles from "./MyProposalsPanel.module.css";
import { useDialog } from "@/providers/DialogProvider";

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: MyProposalsResult };

const formatDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });

function ProposalRow({ proposal, isDeleting, onDelete }: { proposal: ProposalSummary; isDeleting: boolean; onDelete: () => void }) {
  return (
    <li className={styles.item}>
      <div className={styles.itemMain}>
        <Link href={`/profile/proposals/${proposal.id}`} className={styles.itemTitle}>
          {proposal.title}
        </Link>
        <div className={styles.itemMeta}>
          <DifficultyTag difficulty={proposal.difficulty} />
          <ProposalStatusBadge status={proposal.status} />
          <span className={styles.muted}>
            Sent {formatDate(proposal.submittedAt)} · {proposal.testCaseCount} {proposal.testCaseCount === 1 ? "test case" : "test cases"} ·{" "}
            {proposal.gemsSpent} gems spent{proposal.gemsRefunded ? `, ${proposal.gemsRefunded} refunded` : ""}
          </span>
        </div>
        {proposal.reviewNote && (
          <p className={styles.note}>
            <b>Note from the reviewer:</b> {proposal.reviewNote}
          </p>
        )}
        {proposal.status === "accepted" &&
          (proposal.problem?.isPublished ? (
            <p className={styles.accepted}>
              It&apos;s live in the problem library.{" "}
              <Link className="text-link" href={`/problems/${proposal.problem.slug}`}>
                Open the problem →
              </Link>
            </p>
          ) : (
            <p className={styles.accepted}>
              {proposal.problem ? "Added to the library — it goes live once an admin publishes it." : "Accepted by the admins."}
            </p>
          ))}
      </div>
      <div className={styles.itemActions}>
        <Link className="icon-button" href={`/profile/proposals/${proposal.id}`}>
          View
        </Link>
        {proposal.status !== "accepted" && (
          <>
            <Link className="icon-button" href={`/profile/proposals/${proposal.id}/edit`}>
              Edit
            </Link>
            <button type="button" className="icon-button icon-button-danger" disabled={isDeleting} onClick={onDelete}>
              {isDeleting ? "Deleting…" : "Delete"}
            </button>
          </>
        )}
      </div>
    </li>
  );
}

/** A code window with a plus on it: what the button beside it makes. */
function EditorArt() {
  return (
    <svg className={styles.art} viewBox="0 0 200 150" aria-hidden="true">
      <ellipse cx="100" cy="132" rx="84" ry="12" className={styles.artShadow} />
      <g transform="rotate(-6 100 70)">
        <rect x="34" y="18" width="136" height="100" rx="10" className={styles.artWindow} />
        <path d="M34 36h136" className={styles.artLine} />
        <circle cx="46" cy="27" r="2.6" className={styles.artDot} />
        <circle cx="55" cy="27" r="2.6" className={styles.artDot} />
        <circle cx="64" cy="27" r="2.6" className={styles.artDot} />
        <path d="m56 52-8 7 8 7M72 52l8 7-8 7M66 50l-4 18" className={styles.artCode} />
        <path d="M92 55h54M92 64h38M50 82h96M50 92h72M50 102h84" className={styles.artText} />
      </g>
      <circle cx="160" cy="108" r="17" className={styles.artPlusBg} />
      <path d="M160 100v16M152 108h16" className={styles.artPlus} />
    </svg>
  );
}

export function MyProposalsPanel({ isAdmin }: { isAdmin: boolean }) {
  const dialog = useDialog();
  const { refresh } = useAuth();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const load = useCallback(() => {
    getMyProposals()
      .then((data) => setState({ status: "ready", data }))
      .catch((requestError) => setState({ status: "error", message: getErrorMessage(requestError, "Could not load your proposals.") }));
  }, []);

  useEffect(load, [load]);

  const remove = async (proposal: ProposalSummary) => {
    const refundNote = proposal.status === "pending" ? " It hasn't been reviewed yet, so the gems it cost come back to you." : "";
    if (
      !(await dialog.confirm({
        title: `Delete "${proposal.title}"?`,
        message: `${refundNote.trim() ? `${refundNote.trim()} ` : ""}This can't be undone.`,
        confirmLabel: "Delete proposal",
        tone: "danger",
      }))
    )
      return;
    setDeletingId(proposal.id);
    setFeedback(null);
    try {
      const result = await deleteProposal(proposal.id);
      setFeedback({
        tone: "success",
        text: `Deleted "${proposal.title}".${result.gemsRefunded ? ` ${result.gemsRefunded} gems were returned to you.` : ""}`,
      });
      // The site header shows the gem balance.
      if (result.gemsRefunded) void refresh();
    } catch (requestError) {
      setFeedback({
        tone: "error",
        text: requestError instanceof ApiError ? requestError.message : getErrorMessage(requestError, "Could not delete this proposal."),
      });
    } finally {
      setDeletingId(null);
      load();
    }
  };

  // The panel has three parts that change with the data: the cost and gem
  // meter under the heading, the action beside it, and the list below.
  let summary: ReactNode = null;
  let action: ReactNode = null;
  let list: ReactNode = null;

  if (state.status === "loading") {
    summary = <p className={styles.muted}>Loading your proposals…</p>;
  } else if (state.status === "error") {
    summary = <p className="form-error">{state.message}</p>;
    action = (
      <button type="button" className="icon-button" onClick={load}>
        Retry
      </button>
    );
  } else {
    const { gems, cost, rejectRefund, maxPending, pendingCount, canPropose, items } = state.data;
    const enough = gems >= cost;
    const progress = Math.min(100, Math.round((gems / cost) * 100));

    summary = (
      <>
        <p className={styles.locked}>
          Sending a proposal costs <b>{cost} gems</b>. If it&apos;s rejected, {rejectRefund} come back. If you delete it before it&apos;s reviewed, all {cost}{" "}
          come back. An accepted proposal keeps the full cost.
        </p>

        <div className={styles.meter}>
          <div className={styles.meterRow}>
            <span>
              <span className={styles.gems}>◆ {gems}</span> / {cost} gems
            </span>
            <span>{enough ? "Enough to send a proposal" : `${cost - gems} more to go`}</span>
          </div>
          <div
            className={`${styles.bar}${enough ? ` ${styles.barDone}` : ""}`}
            role="progressbar"
            aria-label="Gems toward sending a proposal"
            aria-valuemin={0}
            aria-valuemax={cost}
            aria-valuenow={Math.min(gems, cost)}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
      </>
    );

    action = canPropose ? (
      <Link className="button" href="/profile/proposals/new">
        Propose a problem <span aria-hidden="true">→</span>
      </Link>
    ) : enough ? (
      <p className={styles.locked}>
        You have {pendingCount} proposals waiting for review — the most you can have at once is {maxPending}. You can send another once one is reviewed.
      </p>
    ) : (
      <div className={styles.earn}>
        <p className={styles.locked}>
          Earn {cost - gems} more {cost - gems === 1 ? "gem" : "gems"} to send a proposal. You get gems for your first Accepted solution on each problem: Easy 10,
          Medium 20, Hard 30.
        </p>
        <Link className="text-link" href="/problems">
          Solve problems →
        </Link>
      </div>
    );

    list =
      items.length === 0 ? (
        <p className={styles.empty}>You haven&apos;t proposed any problems yet.</p>
      ) : (
        <ul className={styles.list} aria-label="Your proposals">
          {items.map((proposal) => (
            <ProposalRow key={proposal.id} proposal={proposal} isDeleting={deletingId === proposal.id} onDelete={() => remove(proposal)} />
          ))}
        </ul>
      );
  }

  return (
    <section id="proposals" className={styles.panel} aria-labelledby="proposals-title">
      <div className={styles.top}>
        <span className={styles.iconTile} aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="m8 7-5 5 5 5M16 7l5 5-5 5" />
          </svg>
        </span>

        <div className={styles.copy}>
          <span className={styles.kicker}>Problem proposals</span>
          <h2 id="proposals-title" className={styles.title}>
            Propose a problem for the library
          </h2>
          <p className={styles.lead}>
            Send the admins a problem of your own — statement, limits and test cases. If they accept it, it joins the Kaimana problem library.
          </p>
          {summary}
        </div>

        <div className={styles.aside}>
          {action}
          <EditorArt />
        </div>
      </div>

      {isAdmin && (
        <p className={styles.adminNote}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5M12 7.8h.01" />
          </svg>
          <span>
            As an admin you can also add problems directly in the{" "}
            <Link className="text-link" href="/admin/problems/new">
              problem manager
            </Link>
            .
          </span>
        </p>
      )}

      {feedback && (
        <p className={feedback.tone === "success" ? "form-success" : "form-error"} role={feedback.tone === "error" ? "alert" : "status"}>
          {feedback.text}
        </p>
      )}

      {list}
    </section>
  );
}
