"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CurrentUser } from "@/types/api";
import { useDismiss } from "@/hooks/useDismiss";
import { IconGem } from "./icons";
import styles from "./siteHeader.module.css";

/**
 * Everything about the signed-in account, behind the avatar: profile,
 * analytics, submissions, the admin or host panel, and sign out. Keeping it
 * in one control is what lets the navigation stay visible on a laptop.
 */
export function AccountMenu({
  user,
  roleBadge,
  adminLink,
  onSignOut,
  isSigningOut,
  onOpen,
}: {
  user: CurrentUser;
  roleBadge: string | null;
  adminLink: { href: string; label: string } | null;
  onSignOut: () => void;
  isSigningOut: boolean;
  /** Lets the header shut its mobile drawer, so two panels never overlap. */
  onOpen?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const pathname = usePathname();
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, rootRef, triggerRef);

  useEffect(() => setOpen(false), [pathname]);

  const toggle = () => {
    if (!open) onOpen?.();
    setOpen(!open);
  };

  const initial = user.name.slice(0, 1).toUpperCase();
  const hasGems = typeof user.gems === "number";
  const isHere = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  const links = [
    { href: "/profile", label: "Profile" },
    { href: "/analytics", label: "Analytics" },
    { href: "/submissions", label: "Submissions" },
  ];

  return (
    <div className={styles.popRoot} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.account}${open ? ` ${styles.isOpen}` : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="account-panel"
        onClick={toggle}
      >
        {user.profilePicUrl ? (
          <Image className={styles.avatar} src={user.profilePicUrl} alt="" width={34} height={34} />
        ) : (
          <span className={`${styles.avatar} ${styles.avatarFallback}`} aria-hidden="true">
            {initial}
          </span>
        )}
        <svg className={styles.caret} viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
        <span className="sr-only">Account menu for {user.name}</span>
      </button>

      {open && (
        <div id="account-panel" className={styles.pop} role="menu" aria-label="Account">
          <div className={styles.popWho}>
            <div className={styles.popName}>
              <b>{user.name}</b>
              {roleBadge && <span className={styles.roleBadge}>{roleBadge}</span>}
            </div>
            <span>{user.email}</span>
            {hasGems && (
              <span className={styles.popGems}>
                <IconGem size={12} /> {user.gems} gems
              </span>
            )}
          </div>

          <div className={styles.popList}>
            {links.map((link) => (
              <Link key={link.href} role="menuitem" href={link.href} className={isHere(link.href) ? styles.here : undefined}>
                {link.label}
              </Link>
            ))}
          </div>

          {adminLink && (
            <div className={styles.popList}>
              <Link role="menuitem" href={adminLink.href} className={styles.popAccent}>
                {adminLink.label}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          )}

          <div className={styles.popList}>
            <button type="button" role="menuitem" className={styles.popDanger} onClick={onSignOut} disabled={isSigningOut}>
              {isSigningOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
