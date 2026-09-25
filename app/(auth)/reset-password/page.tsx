"use client";

// The other end of the emailed link: ?token=… arrives here, the new password
// is typed twice, and the backend spends the token.
//
// The token is never shown, logged, or put in a field — it stays in the URL
// and goes straight back to the API. A used or expired one fails on submit
// with a message that says what to do next, because the only way to know it
// is spent is to ask the server.

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { resetPassword } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/client";
import { PageLoader } from "@/components/ui/Loader";
import { PasswordField } from "@/components/auth/PasswordField";

const MIN_LENGTH = 8;

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (status === "saving") return;
    if (password.length < MIN_LENGTH) return setError(`Use at least ${MIN_LENGTH} characters.`);
    if (password !== confirmation) return setError("The two passwords do not match.");

    setError("");
    setStatus("saving");
    try {
      await resetPassword({ token, newPassword: password });
      setStatus("done");
      // Every device was signed out by the reset, so there is nowhere to go
      // but the sign-in page — after a beat to read what happened.
      window.setTimeout(() => router.push("/signin"), 2200);
    } catch (resetError) {
      setError(getErrorMessage(resetError, "This link did not work. Ask for a new one."));
      setStatus("idle");
    }
  };

  if (!token) {
    return (
      <div className="auth-card">
        <BrandLogo />
        <p className="eyebrow">
          <b />
          PASSWORD HELP
        </p>
        <h1>This link is incomplete.</h1>
        <p className="auth-copy">
          Open the link straight from the email — some mail apps cut the address short. If it still fails, ask for a new one.
        </p>
        <Link className="button" href="/forgot-password">
          Send a new link <span aria-hidden="true">→</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <BrandLogo />
      <p className="eyebrow">
        <b />
        PASSWORD HELP
      </p>

      {status === "done" ? (
        <>
          <h1>Password changed.</h1>
          <p className="auth-copy">
            Every signed-in device was signed out, including any you do not recognise. Taking you to sign in…
          </p>
          <Link className="text-link" href="/signin">
            Sign in now <span aria-hidden="true">→</span>
          </Link>
        </>
      ) : (
        <>
          <h1>Set a new password.</h1>
          <p className="auth-copy">Choose something you have not used here before. At least {MIN_LENGTH} characters.</p>
          <form className="auth-form auth-form-anim" onSubmit={submit}>
            <PasswordField
              id="new-password"
              name="newPassword"
              label="New password"
              placeholder="New password"
              autoComplete="new-password"
              minLength={MIN_LENGTH}
              showStrength
              value={password}
              onValueChange={setPassword}
            />
            <PasswordField
              id="confirm-password"
              name="confirmPassword"
              label="Repeat the new password"
              placeholder="Repeat it"
              autoComplete="new-password"
              minLength={MIN_LENGTH}
              value={confirmation}
              onValueChange={setConfirmation}
            />
            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="button" disabled={status === "saving"}>
              {status === "saving" ? "Saving…" : "Save the new password"} <span aria-hidden="true">→</span>
            </button>
          </form>
          <p className="auth-divider">Link expired?</p>
          <Link className="text-link" href="/forgot-password">
            Send a new one <span aria-hidden="true">→</span>
          </Link>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="auth-page">
      <section className="auth-form-side" style={{ gridColumn: "1 / -1" }}>
        <Suspense fallback={<PageLoader label="Opening your link…" />}>
          <ResetPasswordForm />
        </Suspense>
      </section>
    </main>
  );
}
