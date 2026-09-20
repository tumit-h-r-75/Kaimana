"use client";

import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { useReveal } from "@/hooks/useReveal";
import styles from "./cta.module.css";

/**
 * Section 7. The ask.
 *
 * The diamond behind it is the brand mark at poster scale — the same four
 * facets, drawn large enough to read as a backdrop rather than a logo.
 */
export function Cta() {
  const reveal = useReveal<HTMLDivElement>();
  const { user, isLoading } = useAuth();
  const signedIn = !isLoading && Boolean(user);

  return (
    <section className={styles.section}>
      <div className="section-shell">
        <div ref={reveal.ref} className={`${styles.panel} ${reveal.className}`}>
          <svg className={styles.mark} viewBox="0 0 200 200" fill="none" stroke="currentColor" aria-hidden="true">
            <path d="M100 14 186 100 100 186 14 100Z" strokeWidth="2" />
            <path d="M43 57h114" strokeWidth="2" strokeOpacity=".7" />
            <path d="M43 57 100 186" strokeWidth="2" strokeOpacity=".45" />
            <path d="M157 57 100 186" strokeWidth="2" strokeOpacity=".45" />
          </svg>

          <div className={styles.inner}>
            <p className={styles.kicker}>Earn your edge</p>
            <h2>
              Pressure is the only thing
              <br />
              <span className={styles.accent}>that makes one.</span>
            </h2>
            <p className={styles.lede}>
              {signedIn
                ? "Your library, the next contest and your standing are all where you left them."
                : "Open a problem, submit it, and you will have a verdict, a complexity audit and your first gems before the kettle boils."}
            </p>

            <div className={styles.actions}>
              <Link className="button" href={signedIn ? "/problems" : "/signin?mode=register"}>
                {signedIn ? "Back to the library" : "Create a free account"} <span aria-hidden="true">→</span>
              </Link>
              <Link className="button-outline" href={signedIn ? "/contest" : "#loop"}>
                {signedIn ? "See live contests" : "See how it works"}
              </Link>
            </div>

            <p className={styles.fine}>Free forever · no card · nothing to install</p>
          </div>
        </div>
      </div>
    </section>
  );
}
