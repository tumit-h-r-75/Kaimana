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
  const [sent, setSent] = useState(false);
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
      await resendVerification();
      setSent(true);
    } catch {
      // The endpoint answers the same way whatever happens, so there is
      // nothing useful to report on a failure either.
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.banner} role="status">
      <p>
        {sent ? (
          <>Check <b>{user.email}</b> for the confirmation link.</>
        ) : (
          <>
            Confirm <b>{user.email}</b> so a password reset can reach you.
          </>
        )}
      </p>
      {!sent && (
        <button type="button" onClick={resend} disabled={sending}>
          {sending ? "Sending…" : "Send the link"}
        </button>
      )}
      <button type="button" className={styles.close} onClick={dismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
