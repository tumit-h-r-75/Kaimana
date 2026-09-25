import { apiRequest } from "./client";
import { setTokens } from "@/lib/auth-storage";
import type { CurrentUser } from "@/types/api";

export const getCurrentUser = () => apiRequest<CurrentUser>("/api/auth/me");

export const logout = () => apiRequest<null>("/api/auth/logout", { method: "POST" });

// name and/or avatar — at least one must be set, enforced server-side.
// A FormData body always goes multipart (see client.ts), which is fine even
// when there's no file: the backend's avatarUpload middleware only engages
// once it actually sees a file field, and a plain text field on a
// multipart request parses the same as it would in JSON.
export const updateProfile = (input: { name?: string; avatarFile?: File | null }) => {
  const form = new FormData();
  if (input.name !== undefined) form.set("name", input.name);
  if (input.avatarFile) form.set("avatar", input.avatarFile);
  return apiRequest<CurrentUser>("/api/auth/me", { method: "PATCH", body: form });
};

// The backend rotates the session's tokens on a password change (so any
// session stolen with the old password dies) and returns the new pair —
// store it, or this session would be holding tokens that no longer work.
export const changePassword = async (input: { currentPassword: string; newPassword: string }) => {
  const result = await apiRequest<{ accessToken?: string; refreshToken?: string } | null>("/api/auth/change-password", { method: "POST", body: input });
  if (result?.accessToken && result.refreshToken) setTokens(result.accessToken, result.refreshToken);
  return result;
};

// Password recovery. Both endpoints are public — the person who needs them
// is by definition the one who cannot sign in.
//
// The request never reports whether the address has an account: a reply that
// differed would turn this into a way to test which emails are registered.
export const requestPasswordReset = (email: string) =>
  apiRequest<null>("/api/auth/forgot-password", { method: "POST", body: { email } });

export const resetPassword = (input: { token: string; newPassword: string }) =>
  apiRequest<null>("/api/auth/reset-password", { method: "POST", body: input });

// Which optional emails reach this account. The ones that answer something
// the user just did (a reset link, a password change) are not listed and
// always send.
export interface EmailPreferences {
  contestReminders: boolean;
  weeklyDigest: boolean;
}

export const updateEmailPreferences = (input: Partial<EmailPreferences>) =>
  apiRequest<{ emailPrefs: EmailPreferences }>("/api/auth/me/email-preferences", { method: "PATCH", body: input });

// Confirming the address on an account. Nothing is gated on it yet — it
// makes a reset link worth sending, which is reason enough.
export const verifyEmail = (token: string) =>
  apiRequest<{ email: string; verifiedAt: string }>("/api/auth/verify-email", { method: "POST", body: { token } });

export const resendVerification = () =>
  apiRequest<{ sent: boolean; reason?: "verified" | "recent" | "failed" }>("/api/auth/resend-verification", { method: "POST" });
