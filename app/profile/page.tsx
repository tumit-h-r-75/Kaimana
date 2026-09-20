"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "../_components/home/SiteHeader";
import { SiteFooter } from "../_components/home/SiteFooter";
import { useAuth } from "@/providers/AuthProvider";
import { getMyRank } from "@/lib/api/leaderboard";
import { getRecommendations, type Recommendations } from "@/lib/api/problems";
import { updateProfile, changePassword } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/client";
import type { MyRank } from "@/types/api";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MyProposalsPanel } from "@/components/proposals/MyProposalsPanel";
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

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;

function ProfileContent() {
  // Reuses the shared, Bearer-token-aware auth session instead of a
  // duplicate raw fetch — this is what the httpOnly-cookie-only version of
  // this page was missing, and why it could show "Authentication is
  // required" even right after a successful login on browsers that block
  // the cross-site cookie. See lib/api/client.ts and lib/auth-storage.ts.
  const { user } = useAuth();
  const [rank, setRank] = useState<MyRank | null>(null);
  const [reco, setReco] = useState<Recommendations | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  useEffect(() => {
    getMyRank().then(setRank).catch(() => setRank(null));
    // The same source the problem library uses for "what next". The profile
    // is the other place a learner asks that, so it answers with their own
    // numbers instead of a panel of encouragement with nothing behind it.
    getRecommendations().then(setReco).catch(() => setReco(null));
  }, []);

  if (!user) return null;

  const solved = reco?.stats.solvedByDifficulty;
  const totalSolved = rank?.problemsSolved ?? reco?.stats.solved ?? 0;
  // Bars are scaled against the busiest level, not against the library, so
  // an early account still shows shape instead of three empty tracks.
  const peak = solved ? Math.max(...DIFFICULTIES.map((d) => solved[d]), 1) : 1;

  return (
    <main className={`section-shell ${styles.page}`}>
      <header className={styles.hero}>
        <div className="avatar">
          {user.profilePicUrl ? (
            <Image src={user.profilePicUrl} alt={`${user.name} profile`} width={96} height={96} priority />
          ) : (
            user.name.slice(0, 1).toUpperCase()
          )}
        </div>

        <div className={styles.identity}>
          <p className="eyebrow">YOUR EDGE / PROFILE</p>
          <h1>{user.name}</h1>
          <p className={styles.email}>{user.email}</p>
          <div className={styles.pills}>
            <span className={`${styles.pill} ${styles.pillOn}`}>● {user.status}</span>
            <span className={styles.pill}>{user.role}</span>
            <span className={`${styles.pill} ${styles.pillGem}`}>◆ {user.gems ?? 0} gems</span>
            {user.createdAt && (
              <span className={styles.pill}>since {new Date(user.createdAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        <div className={styles.heroActions}>
          <Link className="button button-small" href="/problems">
            Continue solving <span aria-hidden="true">→</span>
          </Link>
          <Link className="button-outline button-small" href="/submissions">Submissions</Link>
        </div>
      </header>

      <nav className={styles.tabs} role="tablist" aria-label="Profile sections">
        {([["overview", "Overview"], ["account", "Account"], ["security", "Security"]] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={`${styles.tab} ${tab === key ? styles.tabOn : ""}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "overview" && (
        <>
          <section className={styles.stats}>
            <article className={styles.stat}>
              <b className={styles.statValue}>{totalSolved}</b>
              <span className={styles.statLabel}>Problems solved</span>
              <small className={styles.statNote}>{rank?.rank ? `Ranked #${rank.rank}` : "Not ranked yet"}</small>
            </article>
            <article className={styles.stat}>
              <b className={styles.statValue}>{rank?.totalScore ?? 0}</b>
              <span className={styles.statLabel}>Total score</span>
              <small className={styles.statNote}>Best accepted score per problem</small>
            </article>
            <article className={styles.stat}>
              <b className={styles.statValue}>{reco?.stats.attempted ?? 0}</b>
              <span className={styles.statLabel}>Problems attempted</span>
              <small className={styles.statNote}>Solved or still open</small>
            </article>
            <article className={styles.stat}>
              <b className={styles.statValue}>{user.gems ?? 0}</b>
              <span className={styles.statLabel}>Gems</span>
              <small className={styles.statNote}>Earned solving, spent on hints</small>
            </article>
          </section>

          <section className={styles.grid}>
            <article className={styles.panel}>
              <p className={styles.panelHead}>By difficulty</p>
              {solved ? (
                <div className={styles.bars}>
                  {DIFFICULTIES.map((d) => (
                    <div key={d} className={styles.barRow}>
                      <span className={styles.barHead}>
                        {d.toLowerCase()} <b>{solved[d]}</b>
                      </span>
                      <span className={styles.barTrack}>
                        <i
                          className={styles.barFill}
                          style={{ width: `${Math.max((solved[d] / peak) * 100, solved[d] ? 6 : 0)}%` }}
                        />
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.empty}>Solve something and the breakdown appears here.</p>
              )}
            </article>

            <article className={styles.panel}>
              <p className={styles.panelHead}>Where to push</p>
              {reco?.next ? (
                <div className={styles.focus}>
                  {reco.focusTag && <span className={styles.focusTag}>◆ {reco.focusTag}</span>}
                  <p className={styles.focusBody}>{reco.next.reason}</p>
                  <Link className="text-link" href={`/problems/${reco.next.slug}`}>
                    {reco.next.title} · {reco.next.difficulty.toLowerCase()} →
                  </Link>
                </div>
              ) : (
                <p className={styles.empty}>
                  Nothing to suggest yet — solve a problem and this points at whatever you are thinnest at.
                </p>
              )}
            </article>
          </section>
        </>
      )}

      {tab === "account" && (
        <section className={styles.grid}>
          <article className={styles.panel}>
            <p className={styles.panelHead}>Details</p>
            <div className={styles.rows}>
              <div className={styles.row}><span>Name</span><strong>{user.name}</strong></div>
              <div className={styles.row}><span>Email</span><strong>{user.email}</strong></div>
              <div className={styles.row}><span>Status</span><strong>{user.status}</strong></div>
              <div className={styles.row}><span>Access level</span><strong>{user.role}</strong></div>
            </div>
          </article>

          <article className={styles.panel}>
            <p className={styles.panelHead}>Edit profile</p>
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
                  style={{ marginTop: 14 }}
                  onClick={() => {
                    setProfileSaved(false);
                    setIsEditingProfile(true);
                  }}
                >
                  Edit profile
                </button>
              </>
            )}
          </article>
        </section>
      )}

      {tab === "security" && (
        <section className={styles.grid}>
          <article className={styles.panel}>
            <p className={styles.panelHead}>Password</p>
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
                      style={{ marginTop: 14 }}
                      onClick={() => {
                        setPasswordSaved(false);
                        setIsChangingPassword(true);
                      }}
                    >
                      Change password
                    </button>
                  </>
                )}
              </>
            )}
          </article>
        </section>
      )}

      <div style={{ marginTop: 22 }}>
        <MyProposalsPanel isAdmin={user.role === "admin"} />
      </div>
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
