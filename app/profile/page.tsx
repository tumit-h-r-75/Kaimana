"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "../_components/home/SiteHeader";
import { SiteFooter } from "../_components/home/SiteFooter";
import { useAuth } from "@/providers/AuthProvider";
import { getMyRank } from "@/lib/api/leaderboard";
import { getRecommendations, type Recommendations } from "@/lib/api/problems";
import { getMyAnalytics, getMyAnalyticsHistory, type AnalyticsHistoryEntry, type AnalyticsResult } from "@/lib/api/analytics";
import { PROPOSAL_COST_GEMS } from "@/lib/api/proposals";
import { updateProfile, changePassword, updateEmailPreferences, resendVerification } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/client";
import type { CurrentUser, MyRank } from "@/types/api";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MyProposalsPanel } from "@/components/proposals/MyProposalsPanel";
import {
  IconArrowRight,
  IconBolt,
  IconBulb,
  IconCalendar,
  IconCheck,
  IconCode,
  IconCompass,
  IconDoc,
  IconFlame,
  IconGem,
  IconHome,
  IconKey,
  IconMail,
  IconShield,
  IconShieldCheck,
  IconStar,
  IconTarget,
  IconTrophy,
  IconUser,
} from "./icons";
import styles from "./profile.module.css";

const MAX_AVATAR_BYTES = 4 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

function EditProfileForm({ onDone }: { onDone: () => void }) {
  const { user, refresh } = useAuth();
  const avatarInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user?.name ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.profilePicUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    return () => {
      // Only revoke a blob: preview we created ourselves — the initial
      // preview is the user's existing (remote) profilePicUrl, which isn't
      // an object URL and must not be revoked.
      if (avatarFile && avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickAvatar = (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setError("Please choose a PNG, JPEG, WEBP, or GIF image.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError("That image is too large — please use one under 4 MB.");
      return;
    }
    if (avatarFile && avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile({ name: name.trim(), avatarFile });
      await refresh();
      onDone();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Could not update your profile."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={submit} style={{ marginTop: 18 }}>
      {error && <p className="form-error">{error}</p>}
      <div className="avatar-picker">
        <button
          type="button"
          className="avatar-picker-circle"
          onClick={() => avatarInput.current?.click()}
          aria-label={avatarPreview ? "Change profile photo" : "Add a profile photo"}
        >
          {avatarPreview ? (
            <Image src={avatarPreview} alt="" width={84} height={84} unoptimized />
          ) : (
            <span className="avatar-picker-placeholder">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="8" r="3.6" />
                <path d="M4.5 20c0-3.6 3-6 7.5-6s7.5 2.4 7.5 6" />
              </svg>
            </span>
          )}
          <span className="avatar-picker-badge">{avatarPreview ? "Change" : "Add photo"}</span>
        </button>
        <input
          ref={avatarInput}
          type="file"
          accept={ALLOWED_AVATAR_TYPES.join(",")}
          hidden
          onChange={(event) => pickAvatar(event.target.files?.[0])}
        />
        <div className="avatar-picker-copy">
          <p>Profile photo</p>
          <p className="avatar-picker-hint">PNG, JPEG, WEBP or GIF, up to 4 MB.</p>
        </div>
      </div>
      <label>
        <span className="avatar-picker-copy" style={{ display: "block", marginBottom: 6 }}><p>Name</p></span>
        <input required minLength={2} value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
        <button type="submit" className="button button-small" disabled={isSaving}>{isSaving ? "Saving…" : "Save changes"}</button>
        <button type="button" className="text-link" onClick={onDone} disabled={isSaving}>Cancel</button>
      </div>
    </form>
  );
}

function ChangePasswordForm({ onDone }: { onDone: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation don't match.");
      return;
    }
    setIsSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      onDone();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Could not change your password."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={submit} style={{ marginTop: 18 }}>
      {error && <p className="form-error">{error}</p>}
      <label>
        <span className="avatar-picker-copy" style={{ display: "block", marginBottom: 6 }}><p>Current password</p></span>
        <input required type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
      </label>
      <label>
        <span className="avatar-picker-copy" style={{ display: "block", marginBottom: 6 }}><p>New password</p></span>
        <input required minLength={8} type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
      </label>
      <label>
        <span className="avatar-picker-copy" style={{ display: "block", marginBottom: 6 }}><p>Confirm new password</p></span>
        <input required minLength={8} type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
      </label>
      <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
        <button type="submit" className="button button-small" disabled={isSaving}>{isSaving ? "Saving…" : "Update password"}</button>
        <button type="button" className="text-link" onClick={onDone} disabled={isSaving}>Cancel</button>
      </div>
    </form>
  );
}

type Tab = "overview" | "account" | "security";

const DIFFICULTIES = [
  { key: "EASY", label: "Easy", tone: styles.toneEasy },
  { key: "MEDIUM", label: "Medium", tone: styles.toneMedium },
  { key: "HARD", label: "Hard", tone: styles.toneHard },
] as const;

const TABS: { key: Tab; label: string; icon: typeof IconHome }[] = [
  { key: "overview", label: "Overview", icon: IconHome },
  { key: "account", label: "Account", icon: IconUser },
  { key: "security", label: "Security", icon: IconShield },
];

/* -------------------------------------------------------------- mini charts
   Small pictures of real numbers, drawn only when there is something to
   draw. None of them is decoration: a line with no data behind it would be
   a claim the page cannot back up. */

/**
 * The optional mail, and the switches for it.
 *
 * Transactional mail — a reset link, a notice that the password changed — is
 * deliberately absent: it answers something the account holder just did, and
 * an account you cannot be told about is not safer, it is only quieter.
 */
function EmailPreferencesPanel({ user }: { user: CurrentUser }) {
  const [confirmState, setConfirmState] = useState<"idle" | "sending" | "sent" | "recent" | "failed">("idle");
  const [prefs, setPrefs] = useState({
    contestReminders: user.emailPrefs?.contestReminders !== false,
    weeklyDigest: user.emailPrefs?.weeklyDigest !== false,
  });
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");

  const toggle = async (key: "contestReminders" | "weeklyDigest") => {
    const next = !prefs[key];
    // Flipped straight away: a switch that waits for the network feels
    // broken. It goes back if the save fails.
    setPrefs((previous) => ({ ...previous, [key]: next }));
    setSaving(key);
    setError("");
    try {
      await updateEmailPreferences({ [key]: next });
    } catch (saveError) {
      setPrefs((previous) => ({ ...previous, [key]: !next }));
      setError(getErrorMessage(saveError, "Could not save that. Try again."));
    } finally {
      setSaving(null);
    }
  };

  const rows: { key: "contestReminders" | "weeklyDigest"; label: string; hint: string }[] = [
    { key: "contestReminders", label: "Contest mail", hint: "A reminder before one you registered for, and the standings when it ends." },
    { key: "weeklyDigest", label: "Weekly summary", hint: "Mondays: what you solved, your streak, new problems and what is coming." },
  ];

  const sendConfirmation = async () => {
    setConfirmState("sending");
    try {
      const result = await resendVerification();
      setConfirmState(result?.sent ? "sent" : result?.reason === "recent" ? "recent" : "failed");
    } catch {
      setConfirmState("failed");
    }
  };

  return (
    <article className={styles.panel}>
      <p className={styles.kicker}>
        <i aria-hidden="true" /> Email
      </p>

      {/* Confirming is optional and nothing is gated on it, so it is stated
          once, here, rather than followed around the site. */}
      <div className={styles.prefRow}>
        <div>
          <b>{user.email}</b>
          <span>
            {user.emailVerifiedAt
              ? "Confirmed — a password reset will reach you here."
              : confirmState === "sent"
                ? "Link sent. Check your inbox, and your spam folder."
                : confirmState === "recent"
                  ? "A link went out a moment ago — check your inbox and spam."
                  : confirmState === "failed"
                    ? "Could not send it just now. Try again in a minute."
                    : "Not confirmed yet. Confirm it so a password reset can reach you."}
          </span>
        </div>
        {!user.emailVerifiedAt && confirmState !== "sent" && confirmState !== "recent" && (
          <button type="button" className="button-outline button-small" disabled={confirmState === "sending"} onClick={sendConfirmation}>
            {confirmState === "sending" ? "Sending…" : "Send the link"}
          </button>
        )}
      </div>
      {rows.map((row) => (
        <div key={row.key} className={styles.prefRow}>
          <div>
            <b>{row.label}</b>
            <span>{row.hint}</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={prefs[row.key]}
            aria-label={row.label}
            className={`${styles.switch}${prefs[row.key] ? ` ${styles.switchOn}` : ""}`}
            disabled={saving === row.key}
            onClick={() => toggle(row.key)}
          >
            <i />
          </button>
        </div>
      ))}
      {error && <p className="form-error">{error}</p>}
      <p className={styles.empty} style={{ marginTop: 6 }}>
        Password resets and security notices always send.
      </p>
    </article>
  );
}

function Sparkline({ values, label }: { values: number[]; label: string }) {
  if (values.length < 2 || values.every((v) => v === values[0])) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const points = values.map((v, i) => `${(i / (values.length - 1)) * 100},${36 - ((v - min) / span) * 30}`);
  return (
    <svg className={styles.spark} viewBox="0 0 100 40" preserveAspectRatio="none" role="img" aria-label={label}>
      <title>{label}</title>
      <polyline points={points.join(" ")} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function MiniBars({ values, label }: { values: [number, number, number]; label: string }) {
  const max = Math.max(...values);
  if (max === 0) return null;
  return (
    <span className={styles.miniBars} role="img" aria-label={label} title={label}>
      {values.map((v, i) => (
        <i key={i} className={DIFFICULTIES[i].tone} style={{ height: `${Math.max(12, (v / max) * 100)}%` }} />
      ))}
    </span>
  );
}

function Ring({ fraction, label }: { fraction: number; label: string }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  return (
    <svg className={styles.ring} viewBox="0 0 40 40" role="img" aria-label={label}>
      <title>{label}</title>
      <circle cx="20" cy="20" r={r} />
      <circle cx="20" cy="20" r={r} strokeDasharray={`${c * Math.min(1, fraction)} ${c}`} />
    </svg>
  );
}

/* --------------------------------------------------------------- milestones */

interface Milestone {
  key: string;
  label: string;
  icon: typeof IconCode;
}

// Earned from the account's own numbers — nothing here can be unlocked by
// anything but solving.
function milestonesFor(solved: number, hard: number, rank: number | null, streak: number): Milestone[] {
  const list: Milestone[] = [];
  if (solved >= 1) list.push({ key: "first", label: "First accepted solution", icon: IconCode });
  if (solved >= 10) list.push({ key: "ten", label: "10 problems solved", icon: IconStar });
  if (rank !== null && rank <= 10) list.push({ key: "top10", label: `Top 10 on the leaderboard (#${rank})`, icon: IconTrophy });
  if (hard >= 1) list.push({ key: "hard", label: "Solved a hard problem", icon: IconFlame });
  if (solved >= 25) list.push({ key: "twentyfive", label: "25 problems solved", icon: IconStar });
  if (streak >= 3) list.push({ key: "streak", label: `${streak}-day solving streak`, icon: IconBolt });
  return list;
}

function StatCard({
  icon,
  tone,
  value,
  label,
  note,
  viz,
  featured,
}: {
  icon: ReactNode;
  tone: string;
  value: number | string;
  label: string;
  note: string;
  viz?: ReactNode;
  featured?: boolean;
}) {
  return (
    <article className={`${styles.stat}${featured ? ` ${styles.statFeatured}` : ""}`}>
      <span className={`${styles.statIcon} ${tone}`}>{icon}</span>
      <div className={styles.statText}>
        <b>{value}</b>
        <span>{label}</span>
        <small>{note}</small>
      </div>
      {viz && <div className={styles.statViz}>{viz}</div>}
    </article>
  );
}

function ProfileContent() {
  // Reuses the shared, Bearer-token-aware auth session instead of a
  // duplicate raw fetch — see lib/api/client.ts and lib/auth-storage.ts.
  const { user } = useAuth();
  const [rank, setRank] = useState<MyRank | null>(null);
  const [reco, setReco] = useState<Recommendations | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResult | null>(null);
  const [history, setHistory] = useState<AnalyticsHistoryEntry[]>([]);
  const [tab, setTab] = useState<Tab>("overview");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    // Each source on its own: one failing leaves the rest of the page up.
    getMyRank().then(setRank).catch(() => setRank(null));
    getRecommendations().then(setReco).catch(() => setReco(null));
    getMyAnalytics().then(setAnalytics).catch(() => setAnalytics(null));
    getMyAnalyticsHistory(30).then(setHistory).catch(() => setHistory([]));
  }, []);

  if (!user) return null;

  const solved = reco?.stats.solvedByDifficulty ?? { EASY: 0, MEDIUM: 0, HARD: 0 };
  const totalSolved = rank?.problemsSolved ?? reco?.stats.solved ?? 0;
  const byDifficultyTotal = solved.EASY + solved.MEDIUM + solved.HARD;
  const gems = user.gems ?? 0;
  const milestones = milestonesFor(totalSolved, solved.HARD, rank?.rank ?? null, analytics?.currentStreakDays ?? 0);
  const shownMilestones = milestones.slice(0, 3);
  const extraMilestones = milestones.slice(3);
  const since = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" })
    : null;

  const onTabKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const index = TABS.findIndex((t) => t.key === tab);
    const next = TABS[(index + (event.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length];
    setTab(next.key);
    tabRefs.current[next.key]?.focus();
  };

  return (
    <main className={`section-shell ${styles.page}`}>
      {/* ------------------------------------------------------------ hero */}
      <header className={styles.hero}>
        <svg className={styles.heroArt} viewBox="0 0 600 240" preserveAspectRatio="none" aria-hidden="true">
          <path d="M250 240 C 330 150, 420 60, 600 20 L600 240 Z" />
          <path d="M330 240 C 400 170, 480 110, 600 90" />
        </svg>

        <div className={styles.avatar}>
          {user.profilePicUrl ? (
            <Image src={user.profilePicUrl} alt={`${user.name} profile`} width={112} height={112} priority />
          ) : (
            <span>{user.name.slice(0, 1).toUpperCase()}</span>
          )}
        </div>

        <div className={styles.identity}>
          <h1>
            {user.name}
            {user.role === "admin" && (
              <span className={styles.staff} title="Kaimana admin" aria-label="Kaimana admin">
                <IconShieldCheck />
              </span>
            )}
          </h1>
          <p className={styles.email}>
            <IconMail /> {user.email}
          </p>
          <div className={styles.pills}>
            <span className={`${styles.pill} ${user.status === "active" ? styles.pillOn : styles.pillOff}`}>
              <i aria-hidden="true" /> {user.status}
            </span>
            <span className={styles.pill}>
              <IconUser /> {user.role === "guest" ? "host" : user.role}
            </span>
            <span className={`${styles.pill} ${styles.pillGem}`}>
              <IconGem /> {gems} gems
            </span>
            {since && (
              <span className={styles.pill}>
                <IconCalendar /> since {since}
              </span>
            )}
          </div>
          {milestones.length > 0 && (
            <ul className={styles.milestones} aria-label="Milestones">
              {shownMilestones.map((m) => {
                const Icon = m.icon;
                return (
                  <li key={m.key} title={m.label}>
                    <Icon />
                    <span className="sr-only">{m.label}</span>
                  </li>
                );
              })}
              {extraMilestones.length > 0 && (
                <li className={styles.milestoneMore} title={extraMilestones.map((m) => m.label).join(", ")}>
                  +{extraMilestones.length}
                  <span className="sr-only">: {extraMilestones.map((m) => m.label).join(", ")}</span>
                </li>
              )}
            </ul>
          )}
        </div>

        <div className={styles.heroSide}>
          <p className={styles.motto}>
            <i aria-hidden="true" /> Keep solving. Keep growing.
          </p>
          <div className={styles.heroActions}>
            <Link className="button" href={reco?.resume ? `/problems/${reco.resume.slug}` : "/problems"}>
              {reco?.resume ? "Continue solving" : totalSolved > 0 ? "Keep solving" : "Start solving"} <span aria-hidden="true">→</span>
            </Link>
            <Link className={styles.ghostButton} href="/submissions">
              <IconDoc /> Submissions
            </Link>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------ tabs */}
      <div className={styles.tabs} role="tablist" aria-label="Profile sections" onKeyDown={onTabKey}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            ref={(node) => {
              tabRefs.current[key] = node;
            }}
            type="button"
            role="tab"
            aria-selected={tab === key}
            tabIndex={tab === key ? 0 : -1}
            className={`${styles.tab}${tab === key ? ` ${styles.tabOn}` : ""}`}
            onClick={() => setTab(key)}
          >
            <Icon /> {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <section className={styles.stats} aria-label="Your numbers">
            <StatCard
              featured
              icon={<IconCheck />}
              tone={styles.toneEasy}
              value={totalSolved}
              label="Problems solved"
              note={rank?.rank ? `Ranked #${rank.rank} of ${rank.totalRanked}` : "Not ranked yet"}
              viz={<Sparkline values={history.map((h) => h.problemsSolved)} label="Problems solved over the last 30 days" />}
            />
            <StatCard
              icon={<IconTrophy />}
              tone={styles.toneGem}
              value={rank?.totalScore ?? 0}
              label="Total score"
              note="Best accepted score per problem"
              viz={<MiniBars values={[solved.EASY, solved.MEDIUM, solved.HARD]} label={`Solved: ${solved.EASY} easy, ${solved.MEDIUM} medium, ${solved.HARD} hard`} />}
            />
            <StatCard
              icon={<IconTarget />}
              tone={styles.toneInfo}
              value={reco?.stats.attempted ?? 0}
              label="Problems attempted"
              note="Solved or still open"
              viz={<Sparkline values={(analytics?.activity ?? []).map((a) => a.count)} label="Submissions per day, recent activity" />}
            />
            <StatCard
              icon={<IconGem />}
              tone={styles.toneGem}
              value={gems}
              label="Gems"
              note="Earned solving, spent on hints"
              viz={
                <Ring
                  fraction={gems / PROPOSAL_COST_GEMS}
                  label={gems >= PROPOSAL_COST_GEMS ? "Enough gems to propose a problem" : `${gems} of the ${PROPOSAL_COST_GEMS} gems a proposal costs`}
                />
              }
            />
          </section>

          <section className={styles.grid}>
            <article className={styles.panel}>
              <p className={styles.kicker}>
                <i aria-hidden="true" /> Difficulty breakdown
              </p>
              {byDifficultyTotal > 0 ? (
                <div className={styles.bars}>
                  {DIFFICULTIES.map((d) => {
                    const count = solved[d.key];
                    const share = Math.round((count / byDifficultyTotal) * 100);
                    return (
                      <div key={d.key} className={styles.barRow}>
                        <span className={`${styles.barDot} ${d.tone}`} aria-hidden="true" />
                        <div className={styles.barBody}>
                          <span className={styles.barHead}>
                            {d.label}
                            <span>
                              <b>{count}</b>
                              <small>{share}%</small>
                            </span>
                          </span>
                          <span className={styles.barTrack}>
                            <i className={d.tone} style={{ width: `${count ? Math.max(share, 3) : 0}%` }} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className={styles.empty}>Solve something and the breakdown appears here.</p>
              )}
            </article>

            <article className={`${styles.panel} ${styles.pushPanel}`}>
              <svg className={styles.cubes} viewBox="0 0 160 140" aria-hidden="true">
                <path d="M80 18 116 38v40L80 98 44 78V38z" />
                <path d="M44 38 80 58l36-20M80 58v40" />
                <path d="M116 78 140 92v28l-24 14-24-14" />
                <path d="M92 92 116 106l24-14M116 106v28" />
              </svg>

              <div className={styles.pushHead}>
                <span className={styles.pushIcon}>
                  <IconCompass />
                </span>
                <p className={styles.kicker}>Where to push</p>
              </div>

              {reco?.next ? (
                <div className={styles.focus}>
                  {reco.focusTag && <span className={styles.focusTag}>{reco.focusTag}</span>}
                  <p className={styles.focusBody}>{reco.next.reason}</p>
                  <p className={styles.focusTitle}>
                    {reco.next.title} <small>· {reco.next.difficulty.toLowerCase()}</small>
                  </p>
                </div>
              ) : (
                <p className={styles.focusEmpty}>
                  <IconBulb /> Nothing to suggest yet — solve a problem and this points at whatever you are thinnest at.
                </p>
              )}
              {reco?.resume && (
                <p className={styles.resume}>
                  Left unfinished: <Link href={`/problems/${reco.resume.slug}`}>{reco.resume.title}</Link>
                </p>
              )}

              <Link
                className={styles.pushGo}
                href={reco?.next ? `/problems/${reco.next.slug}` : "/problems"}
                aria-label={reco?.next ? `Open ${reco.next.title}` : "Browse problems"}
              >
                <IconArrowRight />
              </Link>
            </article>
          </section>
        </>
      )}

      {tab === "account" && (
        <section className={styles.grid}>
          <article className={styles.panel}>
            <p className={styles.kicker}>
              <i aria-hidden="true" /> Details
            </p>
            <dl className={styles.rows}>
              <div className={styles.row}><dt>Name</dt><dd>{user.name}</dd></div>
              <div className={styles.row}><dt>Email</dt><dd>{user.email}</dd></div>
              <div className={styles.row}><dt>Status</dt><dd>{user.status}</dd></div>
              <div className={styles.row}><dt>Access level</dt><dd>{user.role === "guest" ? "contest host" : user.role}</dd></div>
              {since && <div className={styles.row}><dt>Member since</dt><dd>{since}</dd></div>}
            </dl>
          </article>

          <article className={styles.panel}>
            <p className={styles.kicker}>
              <i aria-hidden="true" /> Edit profile
            </p>
            {isEditingProfile ? (
              <EditProfileForm
                onDone={() => {
                  setIsEditingProfile(false);
                  setProfileSaved(true);
                }}
              />
            ) : (
              <>
                {profileSaved && <p className="form-success" style={{ marginBottom: 12 }}>Profile updated.</p>}
                <p className={styles.empty}>Change your display name or profile picture.</p>
                <button
                  type="button"
                  className="button button-small"
                  style={{ marginTop: 16 }}
                  onClick={() => {
                    setProfileSaved(false);
                    setIsEditingProfile(true);
                  }}
                >
                  <IconUser /> Edit profile
                </button>
              </>
            )}
          </article>
        </section>
      )}

      {tab === "security" && (
        <section className={styles.grid}>
          <article className={styles.panel}>
            <p className={styles.kicker}>
              <i aria-hidden="true" /> Password
            </p>
            {isChangingPassword ? (
              <ChangePasswordForm
                onDone={() => {
                  setIsChangingPassword(false);
                  setPasswordSaved(true);
                }}
              />
            ) : (
              <>
                {passwordSaved && <p className="form-success" style={{ marginBottom: 10 }}>Password updated.</p>}
                {user.hasPassword === false ? (
                  <p className={styles.empty}>Signed in with Google — there is no password on this account to change.</p>
                ) : (
                  <>
                    <p className={styles.empty}>Changing it signs out every other session.</p>
                    <button
                      type="button"
                      className="button button-small"
                      style={{ marginTop: 16 }}
                      onClick={() => {
                        setPasswordSaved(false);
                        setIsChangingPassword(true);
                      }}
                    >
                      <IconKey /> Change password
                    </button>
                  </>
                )}
              </>
            )}
          </article>

          <EmailPreferencesPanel user={user} />
        </section>
      )}

      <MyProposalsPanel isAdmin={user.role === "admin"} />
    </main>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <SiteHeader />
      <ProfileContent />
      <SiteFooter />
    </ProtectedRoute>
  );
}
