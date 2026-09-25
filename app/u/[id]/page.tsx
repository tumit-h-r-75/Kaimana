"use client";

// A solver's public page.
//
// The community feed and the leaderboard were full of names that led
// nowhere. This is where they lead: what someone has solved, what they write
// it in, what they work on, and their last few solutions — all of it already
// public, finally in one place.

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/app/_components/home/SiteHeader";
import { SiteFooter } from "@/app/_components/home/SiteFooter";
import { PageLoader } from "@/components/ui/Loader";
import { LANGUAGE_NAME, LanguageMark } from "@/components/ui/LanguageMark";
import { getPublicProfile, type PublicProfile } from "@/lib/api/profiles";
import { getErrorMessage } from "@/lib/api/client";
import styles from "./solver.module.css";

const icon = (children: React.ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const ICON = {
  check: icon(<><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>),
  trophy: icon(<><path d="M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M7 5.5H4.5V8a3 3 0 0 0 3 3M17 5.5h2.5V8a3 3 0 0 1-3 3M12 14v3.5M8.5 20h7" /></>),
  target: icon(<><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="0.8" /></>),
  flame: icon(<path d="M12 3s5 4 5 8.5a5 5 0 0 1-10 0C7 9 9 8 9.5 6.5 10 8 12 8.5 12 3Z" />),
  clock: icon(<><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 1.8" /></>),
  comment: icon(<path d="M5 5.5h14v10h-5.5L10 18v-2.5H5z" />),
};

function Avatar({ profile }: { profile: PublicProfile }) {
  if (profile.profilePicUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={styles.avatar} src={profile.profilePicUrl} alt="" />;
  }
  return <span className={`${styles.avatar} ${styles.avatarFallback}`}>{profile.name.slice(0, 1).toUpperCase()}</span>;
}

const since = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "long", year: "numeric" });

const ago = (iso: string) => {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 60) return `${Math.max(minutes, 1)}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
};

export default function SolverPage() {
  const id = String(useParams().id ?? "");
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getPublicProfile(id)
      .then((next) => !cancelled && setProfile(next))
      .catch((loadError) => !cancelled && setError(getErrorMessage(loadError, "No solver with that link.")));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <>
        <SiteHeader />
        <main className={`section-shell ${styles.page}`}>
          <div className={styles.empty}>
            <h1>Nobody here</h1>
            <p>{error}</p>
            <Link className="button" href="/community">
              Back to the community <span aria-hidden="true">→</span>
            </Link>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <SiteHeader />
        <PageLoader label="Opening the profile…" />
        <SiteFooter />
      </>
    );
  }

  const total = profile.solved.EASY + profile.solved.MEDIUM + profile.solved.HARD || 1;

  return (
    <>
      <SiteHeader />
      <main className={`section-shell ${styles.page}`}>
        <header className={styles.head}>
          <Avatar profile={profile} />
          <div className={styles.headText}>
            <p className={styles.kicker}>
              <i aria-hidden="true" /> Solver
            </p>
            <h1>{profile.name}</h1>
            <p className={styles.since}>
              Solving here since {since(profile.joinedAt)}
              {profile.rank ? ` · ranked #${profile.rank} of ${profile.totalRanked}` : ""}
            </p>
          </div>
          {profile.streakDays > 0 && (
            <span className={styles.streak}>
              {ICON.flame} {profile.streakDays}-day streak
            </span>
          )}
        </header>

        <section className={styles.stats} aria-label="Their numbers">
          <div className={styles.stat}>
            <span className={styles.statIcon}>{ICON.check}</span>
            <div>
              <b>{profile.solvedTotal}</b>
              <span>problems solved</span>
            </div>
          </div>
          <div className={styles.stat}>
            <span className={styles.statIcon}>{ICON.trophy}</span>
            <div>
              <b>{profile.score.toLocaleString()}</b>
              <span>points scored</span>
            </div>
          </div>
          <div className={styles.stat}>
            <span className={styles.statIcon}>{ICON.target}</span>
            <div>
              <b>{profile.acceptanceRate}%</b>
              <span>of {profile.submissions.toLocaleString()} submissions passed</span>
            </div>
          </div>
        </section>

        <div className={styles.columns}>
          <section className={styles.card} aria-labelledby="solver-mix">
            <h2 id="solver-mix">What they solve</h2>
            {/* The bar is the share of their solves at each level, which says
                more about someone than three separate counts. */}
            <div className={styles.mix} aria-hidden="true">
              <i className={styles.mixEasy} style={{ width: `${(profile.solved.EASY / total) * 100}%` }} />
              <i className={styles.mixMedium} style={{ width: `${(profile.solved.MEDIUM / total) * 100}%` }} />
              <i className={styles.mixHard} style={{ width: `${(profile.solved.HARD / total) * 100}%` }} />
            </div>
            <ul className={styles.mixKey}>
              <li>
                <i className={styles.mixEasy} /> Easy <b>{profile.solved.EASY}</b>
              </li>
              <li>
                <i className={styles.mixMedium} /> Medium <b>{profile.solved.MEDIUM}</b>
              </li>
              <li>
                <i className={styles.mixHard} /> Hard <b>{profile.solved.HARD}</b>
              </li>
            </ul>

            {profile.topics.length > 0 && (
              <>
                <h3>Strongest topics</h3>
                <div className={styles.tags}>
                  {profile.topics.map((topic) => (
                    <Link key={topic.tag} href={`/problems?topic=${encodeURIComponent(topic.tag)}`}>
                      {topic.tag} <b>{topic.solved}</b>
                    </Link>
                  ))}
                </div>
              </>
            )}

            {profile.languages.length > 0 && (
              <>
                <h3>Writes in</h3>
                <div className={styles.languages}>
                  {profile.languages.map((language) => (
                    <span key={language}>
                      <LanguageMark language={language as never} />
                      {LANGUAGE_NAME[language as keyof typeof LANGUAGE_NAME] ?? language}
                    </span>
                  ))}
                </div>
              </>
            )}
          </section>

          <section className={styles.card} aria-labelledby="solver-recent">
            <h2 id="solver-recent">Latest solutions</h2>
            {profile.recentSolutions.length === 0 ? (
              <p className={styles.muted}>Nothing public yet. Solutions appear here once a problem is accepted.</p>
            ) : (
              <ul className={styles.solutions}>
                {profile.recentSolutions.map((solution) => (
                  <li key={solution.id}>
                    <Link href={`/community/${solution.id}`}>
                      <span className={`${styles.level} ${styles[`level_${solution.problem.difficulty}`]}`}>
                        {solution.problem.difficulty.toLowerCase()}
                      </span>
                      <span className={styles.solutionText}>
                        <b>{solution.problem.title}</b>
                        <small>
                          <LanguageMark language={solution.language as never} />
                          {LANGUAGE_NAME[solution.language as keyof typeof LANGUAGE_NAME] ?? solution.language}
                          <i aria-hidden="true">·</i>
                          {ICON.clock} {solution.runtimeMs} ms
                          <i aria-hidden="true">·</i>
                          {ICON.comment} {solution.commentCount}
                          <i aria-hidden="true">·</i>
                          {ago(solution.createdAt)}
                        </small>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
