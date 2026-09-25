"use client";

// "I cannot get in." The one page on the site whose visitor has no session
// and no password, so it is deliberately the simplest thing here: one field,
// one button, one answer.
//
// That answer is the same whether or not the address has an account. Telling
// a stranger "no account with that email" would make this page a tool for
// finding out who is registered.

import Link from "next/link";
import { useState } from "react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { requestPasswordReset } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (status === "sending") return;
    setError("");
    setStatus("sending");
    try {
      await requestPasswordReset(email.trim());
      setStatus("sent");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Could not send the reset link. Try again in a moment."));
      setStatus("idle");
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-form-side" style={{ gridColumn: "1 / -1" }}>
        <div className="auth-card">
          <BrandLogo />
          <p className="eyebrow">
            <b />
            PASSWORD HELP
          </p>

          {status === "sent" ? (
            <>
              <h1>Check your inbox.</h1>
              <p className="auth-copy">
                If <b>{email.trim()}</b> has an account, a link to set a new password is on its way. It works once and expires in 30 minutes.
              </p>
              <p className="auth-copy" style={{ minHeight: 0 }}>
                Nothing arrived? Look in spam, then{" "}
                <button type="button" className="link-button" onClick={() => setStatus("idle")}>
                  try another address
                </button>
                .
              </p>
              <Link className="text-link" href="/signin">
                Back to sign in <span aria-hidden="true">→</span>
              </Link>
            </>
          ) : (
            <>
              <h1>Forgot your password?</h1>
              <p className="auth-copy">Enter the email on your account and we will send you a link to set a new one.</p>
              <form className="auth-form auth-form-anim" onSubmit={submit}>
                <label className="sr-only" htmlFor="forgot-email">
                  Email address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                {error && <p className="form-error">{error}</p>}
                <button type="submit" className="button" disabled={status === "sending"}>
                  {status === "sending" ? "Sending…" : "Send the link"} <span aria-hidden="true">→</span>
                </button>
              </form>
              <p className="auth-divider">Remembered it?</p>
              <Link className="text-link" href="/signin">
                Back to sign in <span aria-hidden="true">→</span>
              </Link>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
