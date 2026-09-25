"use client";

// Where the confirmation link lands.
//
// It does one thing on arrival — spend the token — and says which of the
// three things happened: confirmed, already done, or the link is spent. The
// token is never displayed or stored; it goes from the URL straight back to
// the API.

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { verifyEmail } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/client";
import { PageLoader } from "@/components/ui/Loader";

function VerifyEmailBody() {
  const token = useSearchParams().get("token") ?? "";
  const [state, setState] = useState<"working" | "done" | "failed">("working");
  const [message, setMessage] = useState("");
  // React runs effects twice in development; the token is single-use, so the
  // second run would always report failure.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!token) {
      setState("failed");
      setMessage("This link is incomplete. Open it straight from the email — some mail apps cut the address short.");
      return;
    }
    verifyEmail(token)
      .then(() => setState("done"))
      .catch((error) => {
        setState("failed");
        setMessage(getErrorMessage(error, "This link did not work. Ask for a new one from your profile."));
      });
  }, [token]);

  return (
    <div className="auth-card">
      <BrandLogo />
      <p className="eyebrow">
        <b />
        EMAIL
      </p>

      {state === "working" && (
        <>
          <h1>Confirming…</h1>
          <p className="auth-copy">One moment.</p>
        </>
      )}

      {state === "done" && (
        <>
          <h1>Address confirmed.</h1>
          <p className="auth-copy">
            Thank you — a password reset or a contest reminder will now reach you where you expect it.
          </p>
          <Link className="button" href="/problems">
            Go and solve something <span aria-hidden="true">→</span>
          </Link>
        </>
      )}

      {state === "failed" && (
        <>
          <h1>That link did not work.</h1>
          <p className="auth-copy">{message}</p>
          <Link className="button" href="/profile">
            Open your profile <span aria-hidden="true">→</span>
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="auth-page">
      <section className="auth-form-side" style={{ gridColumn: "1 / -1" }}>
        <Suspense fallback={<PageLoader label="Opening your link…" />}>
          <VerifyEmailBody />
        </Suspense>
      </section>
    </main>
  );
}
