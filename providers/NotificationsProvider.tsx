"use client";

/**
 * Keeps the signed-in user's notifications current while the site is open.
 *
 * The backend runs on serverless functions, which can't hold a socket open,
 * so "live" here means polling: every 30 seconds while the tab is visible,
 * every 90 while it is hidden, and at once when the tab comes back into
 * view or the window regains focus. It lives in the root layout, so it
 * keeps running across page changes instead of restarting with each header.
 *
 * Something new arriving while you are here shows as a toast. If the tab is
 * in the background and you have allowed it, it shows as a desktop
 * notification instead.
 */

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getNotifications, markNotificationsSeen, type AppNotification, type NotificationType } from "@/lib/api/notifications";
import { useAuth } from "./AuthProvider";
import { useDialog, type DialogTone } from "./DialogProvider";

const VISIBLE_INTERVAL_MS = 30_000;
const HIDDEN_INTERVAL_MS = 90_000;

type DesktopPermission = NotificationPermission | "unsupported";

interface NotificationsState {
  items: AppNotification[];
  unreadCount: number;
  /** When the list was last opened — items after it are the new ones. */
  seenAt: string | null;
  loaded: boolean;
  markSeen: () => void;
  refresh: () => void;
  desktop: DesktopPermission;
  enableDesktop: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsState | null>(null);

export function useNotifications(): NotificationsState {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error("useNotifications must be used within a NotificationsProvider.");
  return context;
}

const TONE: Record<NotificationType, DialogTone> = {
  "proposal.accepted": "success",
  "host.approved": "success",
  "proposal.rejected": "warning",
  "host.rejected": "warning",
  "proposal.submitted": "info",
  "host.requested": "info",
  "comment.new": "info",
  "role.changed": "info",
  "contest.published": "info",
  "problem.published": "info",
};

// These change what the account can do or how many gems it holds, which the
// header shows — so the session is re-read when one arrives.
const CHANGES_ACCOUNT: NotificationType[] = ["role.changed", "host.approved", "proposal.rejected"];

const desktopSupported = () => typeof window !== "undefined" && "Notification" in window;

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user, isLoading, refresh: refreshSession } = useAuth();
  const dialog = useDialog();
  const router = useRouter();
  const userId = user ? (user.id ?? user._id ?? user.email) : null;

  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [seenAt, setSeenAt] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [desktop, setDesktop] = useState<DesktopPermission>("unsupported");

  // Ids already on screen or announced, so each notification is toasted at
  // most once however many polls return it. Empty until the first load,
  // which fills it silently — nothing already waiting pops up as "new".
  const knownIds = useRef<Set<string> | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    if (desktopSupported()) setDesktop(Notification.permission);
  }, []);

  const announce = useCallback(
    (fresh: AppNotification[]) => {
      if (!fresh.length) return;
      if (fresh.some((n) => CHANGES_ACCOUNT.includes(n.type))) void refreshSession();

      const background = document.visibilityState === "hidden";
      for (const n of fresh.slice(0, 3)) {
        if (background && desktopSupported() && Notification.permission === "granted") {
          const note = new Notification(n.title, { body: n.body, tag: n.id, icon: "/icon.svg" });
          note.onclick = () => {
            window.focus();
            if (n.href) router.push(n.href);
            note.close();
          };
        } else {
          dialog.toast({ title: n.title, message: n.body, href: n.href, tone: TONE[n.type] ?? "info" });
        }
      }
    },
    [dialog, refreshSession, router],
  );

  const poll = useCallback(async () => {
    if (!userId || inFlight.current) return;
    inFlight.current = true;
    try {
      const result = await getNotifications(20);
      setItems(result.items);
      setUnreadCount(result.unreadCount);
      setSeenAt(result.seenAt);
      setLoaded(true);

      if (knownIds.current === null) {
        knownIds.current = new Set(result.items.map((n) => n.id));
        return;
      }
      const seen = result.seenAt ? Date.parse(result.seenAt) : 0;
      const fresh = result.items.filter((n) => !knownIds.current!.has(n.id) && Date.parse(n.createdAt) > seen);
      result.items.forEach((n) => knownIds.current!.add(n.id));
      announce(fresh);
    } catch {
      // A missed poll is retried on the next tick; nothing to show for it.
    } finally {
      inFlight.current = false;
    }
  }, [userId, announce]);

  // A different account, or none: start over.
  useEffect(() => {
    knownIds.current = null;
    setItems([]);
    setUnreadCount(0);
    setSeenAt(null);
    setLoaded(false);
  }, [userId]);

  useEffect(() => {
    if (isLoading || !userId) return;
    let timer: number | undefined;
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(
        () => void poll().finally(schedule),
        document.visibilityState === "hidden" ? HIDDEN_INTERVAL_MS : VISIBLE_INTERVAL_MS,
      );
    };
    const now = () => void poll().finally(schedule);
    const onVisible = () => document.visibilityState === "visible" && now();

    now();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", now);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", now);
    };
  }, [isLoading, userId, poll]);

  const markSeen = useCallback(() => {
    if (!userId) return;
    setUnreadCount(0);
    void markNotificationsSeen()
      .then((result) => setSeenAt(result.seenAt))
      .catch(() => undefined);
  }, [userId]);

  const enableDesktop = useCallback(async () => {
    if (!desktopSupported()) return;
    const permission = await Notification.requestPermission();
    setDesktop(permission);
  }, []);

  const value = useMemo<NotificationsState>(
    () => ({ items, unreadCount, seenAt, loaded, markSeen, refresh: () => void poll(), desktop, enableDesktop }),
    [items, unreadCount, seenAt, loaded, markSeen, poll, desktop, enableDesktop],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}
