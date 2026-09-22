import { apiRequest } from "./client";

export type NotificationType =
  | "proposal.accepted"
  | "proposal.rejected"
  | "proposal.submitted"
  | "host.approved"
  | "host.rejected"
  | "host.requested"
  | "comment.new"
  | "role.changed"
  | "contest.published"
  | "problem.published";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  createdAt: string;
}

export interface NotificationList {
  items: AppNotification[];
  unreadCount: number;
  /** When the user last opened their notifications, or null if never. */
  seenAt: string | null;
}

export const getNotifications = (limit = 20) => apiRequest<NotificationList>(`/api/notifications?limit=${limit}`);

export const markNotificationsSeen = () => apiRequest<{ seenAt: string }>("/api/notifications/seen", { method: "POST" });
