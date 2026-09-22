"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { usePendingReviews } from "@/components/admin/usePendingReviews";
import { useDismiss } from "@/hooks/useDismiss";
import { useNotifications } from "@/providers/NotificationsProvider";
import type { NotificationType } from "@/lib/api/notifications";
import type { CurrentUser } from "@/types/api";
import styles from "./siteHeader.module.css";

/**
 * The bell in the site header. Its list comes from NotificationsProvider,
 * which keeps it current while the site is open; opening it marks
 * everything read. Admins also see the review queues, which keep the dot on
 * for as long as there is work waiting.
 */

const relative = (iso: string) => {
  const minutes = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
};

const MARK: Record<NotificationType, string> = {
  "proposal.accepted": "ok",
  "host.approved": "ok",
  "proposal.rejected": "warn",
  "host.rejected": "warn",
  "proposal.submitted": "info",
  "host.requested": "info",
  "comment.new": "info",
  "role.changed": "info",
  "contest.published": "info",
  "problem.published": "info",
};

export function NotificationBell({ user }: { user: CurrentUser }) {
  const isAdmin = user.role === "admin";
  const pending = usePendingReviews(isAdmin);
  const { items, unreadCount, seenAt, loaded, markSeen, desktop, enableDesktop } = useNotifications();
  const [open, setOpen] = useState(false);
  // Items newer than this were unread when the panel opened; they stay
  // highlighted while it is open even though opening marked them read.
  const [newSince, setNewSince] = useState<number>(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, rootRef, triggerRef);

  const hosts = pending.hostRequests ?? 0;
  const proposals = pending.proposals ?? 0;
  const queue = hosts + proposals;
  const hasDot = unreadCount > 0 || queue > 0;

  const toggle = () => {
    if (!open) {
      setNewSince(seenAt ? Date.parse(seenAt) : 0);
      if (unreadCount > 0) markSeen();
    }
    setOpen(!open);
  };

  const label = unreadCount > 0 ? `Notifications, ${unreadCount} unread` : queue > 0 ? "Notifications, reviews waiting" : "Notifications";

  return (
    <div className={styles.popRoot} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.round}${open ? ` ${styles.isOpen}` : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={label}
        onClick={toggle}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 16V11a6 6 0 1 1 12 0v5l1.6 2H4.4L6 16Z" />
          <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
        </svg>
        {unreadCount > 0 ? (
          <span className={styles.count} aria-hidden="true">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : (
          hasDot && <span className={styles.dot} aria-hidden="true" />
        )}
      </button>

      {open && (
        <div className={`${styles.pop} ${styles.popWide}`}>
          <p className={styles.popHead}>Notifications</p>

          {isAdmin && queue > 0 && (
            <div className={styles.popList}>
              {hosts > 0 && (
                <Link href="/admin/host-requests" onClick={close}>
                  <span>
                    <b>
                      {hosts} host {hosts === 1 ? "request" : "requests"} to review
                    </b>
                    <small>Waiting in the admin</small>
                  </span>
                </Link>
              )}
              {proposals > 0 && (
                <Link href="/admin/proposals" onClick={close}>
                  <span>
                    <b>
                      {proposals} problem {proposals === 1 ? "proposal" : "proposals"} to review
                    </b>
                    <small>Waiting in the admin</small>
                  </span>
                </Link>
              )}
            </div>
          )}

          {!loaded ? (
            <p className={styles.popEmpty}>Loading…</p>
          ) : items.length > 0 ? (
            <div className={`${styles.popList} ${styles.noteList}`}>
              {items.map((note) => {
                const isNew = Date.parse(note.createdAt) > newSince;
                const content = (
                  <>
                    <i className={`${styles.noteMark} ${styles[`mark_${MARK[note.type] ?? "info"}`]}`} aria-hidden="true" />
                    <span>
                      <b>{note.title}</b>
                      {note.body && <small>{note.body}</small>}
                      <small className={styles.noteTime}>{relative(note.createdAt)}</small>
                    </span>
                  </>
                );
                return note.href ? (
                  <Link key={note.id} href={note.href} onClick={close} className={isNew ? styles.unread : undefined}>
                    {content}
                  </Link>
                ) : (
                  <div key={note.id} className={`${styles.noteStatic}${isNew ? ` ${styles.unread}` : ""}`}>
                    {content}
                  </div>
                );
              })}
            </div>
          ) : (
            !(isAdmin && queue > 0) && (
              <p className={styles.popEmpty}>
                Nothing yet. Decisions on your proposals and host requests, comments on your solutions, and new contests and problems
                show up here.
              </p>
            )
          )}

          {desktop === "default" && (
            <div className={styles.popList}>
              <button type="button" onClick={() => void enableDesktop()}>
                <span>
                  <b>Get desktop alerts</b>
                  <small>For news that arrives while this tab is in the background</small>
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
