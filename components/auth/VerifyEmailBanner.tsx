"use client";

// A quiet line under the header for an account whose address has never been
// confirmed.
//
// It asks once and can be dismissed for the session — nothing on the site is
// gated on confirming, so a banner that could not be closed would be a
// nuisance rather than a prompt. It stays away entirely while the session is
// still loading, so it never flashes at someone who is already verified.

import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { resendVerification } from "@/lib/api/auth";
import styles from "./verifyEmailBanner.module.css";

const DISMISS_KEY = "kai-verify-banner-dismissed";

export function VerifyEmailBanner() {
  const { user, isLoading } = useAuth();
  const [hidden, setHidden] = useState(() => {
    try {
      return window.sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [state, setState] = useState<"idle" | "sent" | "recent" | "failed">("idle");
  const [sending, setSending] = useState(false);

  if (isLoading || !user || user.emailVerifiedAt || hidden) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Dismissed for this view only, which is fine.
    }
  };

  const resend = async () => {
    setSending(true);
    try {
      // The endpoint says whether the message actually left; saying "check
      // your inbox" when nothing was sent is how someone ends up waiting
      // for mail that is never coming.
      const result = await resendVerification();
      // "Already sent one" is the outcome most people hit on a second press,
      // and telling them that is not the same as telling them it failed.
      setState(result?.sent ? "sent" : result?.reason === "recent" ? "recent" : "failed");
    } catch {
      setState("failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.banner} role="status">
      <p>
        {state === "sent" ? (
          <>
            Check <b>{user.email}</b> for the confirmation link.
          </>
        ) : state === "recent" ? (
          <>
            A link went to <b>{user.email}</b> a moment ago — check your inbox, and your spam folder.
          </>
        ) : state === "failed" ? (
          <>Could not send it just now. It will be retried, or try again in a minute.</>
        ) : (
          <>
            Confirm <b>{user.email}</b> so a password reset can reach you.
          </>
        )}
      </p>
      {state !== "sent" && state !== "recent" && (
        <button type="button" onClick={resend} disabled={sending}>
          {sending ? "Sending…" : state === "failed" ? "Try again" : "Send the link"}
        </button>
      )}
      <button type="button" className={styles.close} onClick={dismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
