"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { getMyHostRequest } from "@/lib/api/hosts";
import { getMyProposals } from "@/lib/api/proposals";
import { usePendingReviews } from "@/components/admin/usePendingReviews";
import { useDismiss } from "@/hooks/useDismiss";
import type { CurrentUser } from "@/types/api";
import styles from "./siteHeader.module.css";

/**
 * The bell only rings for things that happened: a decision on one of your
 * problem proposals or on your request to host, and — for admins — the
 * review queues. There is no notification service behind it; these are the
 * records the account already has, read on demand.
 */

interface Note {
  key: string;
  at: string;
  title: string;
  detail: string;
  href: string;
}

const RECENT_DAYS = 30;
const TTL_MS = 120_000;
let cached: { userId: string; at: number; promise: Promise<Note[]> } | null = null;

function loadNotes(userId: string): Promise<Note[]> {
  if (cached && cached.userId === userId && Date.now() - cached.at < TTL_MS) return cached.promise;
  const since = Date.now() - RECENT_DAYS * 86_400_000;
  const promise = Promise.all([getMyProposals().catch(() => null), getMyHostRequest().catch(() => null)]).then(([proposals, host]) => {
    const notes: Note[] = [];
    for (const p of proposals?.items ?? []) {
      if (p.status === "pending" || !p.reviewedAt || Date.parse(p.reviewedAt) < since) continue;
      notes.push({
        key: `proposal-${p.id}-${p.status}`,
        at: p.reviewedAt,
        title: p.status === "accepted" ? "Your proposal was accepted" : "Your proposal was not accepted",
        detail: p.title,
        href: `/profile/proposals/${p.id}`,
      });
    }
    const request = host?.request;
    if (request && request.status !== "pending" && request.reviewedAt && Date.parse(request.reviewedAt) >= since) {
      notes.push({
        key: `host-${request.id}-${request.status}`,
        at: request.reviewedAt,
        title: request.status === "approved" ? "You can host contests now" : "Your host request was declined",
        detail: request.contestTitle,
        href: request.status === "approved" ? "/admin/contests" : "/host",
      });
    }
    return notes.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  });
  cached = { userId, at: Date.now(), promise };
  return promise;
}

const seenKey = (userId: string) => `kai-notes-seen:${userId}`;

// Per-browser, and allowed to fail: a private window just shows the dot again.
function readSeen(userId: string): number {
  try {
    return Number(window.localStorage.getItem(seenKey(userId))) || 0;
  } catch {
    return 0;
  }
}
function writeSeen(userId: string, at: number) {
  try {
    window.localStorage.setItem(seenKey(userId), String(at));
  } catch {
    // Not remembered, and that is all.
  }
}

const relative = (iso: string) => {
  const days = Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
};

export function NotificationBell({ user }: { user: CurrentUser }) {
  const userId = user.id ?? user._id ?? user.email;
  const isAdmin = user.role === "admin";
  const pending = usePendingReviews(isAdmin);
  const [notes, setNotes] = useState<Note[]>([]);
  const [seenAt, setSeenAt] = useState(0);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, rootRef, triggerRef);

  useEffect(() => {
    let cancelled = false;
    setSeenAt(readSeen(userId));
    void loadNotes(userId).then((result) => {
      if (!cancelled) setNotes(result);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const queue = (pending.hostRequests ?? 0) + (pending.proposals ?? 0);
  const unread = notes.filter((n) => Date.parse(n.at) > seenAt).length;
  // The review queue keeps the dot on for as long as it is not empty: it is
  // work waiting, not news.
  const hasDot = unread > 0 || queue > 0;

  // Opening the panel marks everything read (the dot goes), but the items
  // that were new when it opened stay highlighted until the next time.
  const [newSince, setNewSince] = useState(0);
  const toggle = () => {
    if (!open && notes.length) {
      const newest = Date.parse(notes[0].at);
      setNewSince(seenAt);
      setSeenAt(newest);
      writeSeen(userId, newest);
    }
    setOpen(!open);
  };

  const label = hasDot ? `Notifications, ${unread + (queue > 0 ? 1 : 0)} new` : "Notifications";

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
        {hasDot && <span className={styles.dot} aria-hidden="true" />}
      </button>

      {open && (
        <div className={`${styles.pop} ${styles.popWide}`}>
          <p className={styles.popHead}>Notifications</p>

          {isAdmin && queue > 0 && (
            <div className={styles.popList}>
              {(pending.hostRequests ?? 0) > 0 && (
                <Link href="/admin/host-requests" onClick={close}>
                  <span>
                    <b>{pending.hostRequests} host {pending.hostRequests === 1 ? "request" : "requests"} to review</b>
                    <small>Waiting in the admin</small>
                  </span>
                </Link>
              )}
              {(pending.proposals ?? 0) > 0 && (
                <Link href="/admin/proposals" onClick={close}>
                  <span>
                    <b>{pending.proposals} problem {pending.proposals === 1 ? "proposal" : "proposals"} to review</b>
                    <small>Waiting in the admin</small>
                  </span>
                </Link>
              )}
            </div>
          )}

          {notes.length > 0 ? (
            <div className={styles.popList}>
              {notes.map((note) => (
                <Link key={note.key} href={note.href} onClick={close} className={Date.parse(note.at) > newSince ? styles.unread : undefined}>
                  <span>
                    <b>{note.title}</b>
                    <small>
                      {note.detail} · {relative(note.at)}
                    </small>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            !(isAdmin && queue > 0) && (
              <p className={styles.popEmpty}>
                Nothing new. Decisions on your problem proposals and host requests will show up here.
              </p>
            )
          )}
        </div>
      )}
    </div>
  );
}
