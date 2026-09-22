"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { CurrentUser } from "@/types/api";
import { IconGem } from "./icons";

/**
 * Everything about the signed-in account, behind the avatar.
 *
 * The header used to lay all of it out in a row — gems, avatar, name, role
 * badge, a Sign out button — beside a nav of up to eight links. There was no
 * room for that, which is why the nav collapsed into a hamburger at 1320px
 * and why the stylesheet carried a stack of fixes for the row shrinking into
 * itself. Folding the account into one control is what lets the navigation
 * stay visible on an ordinary laptop.
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

  // Close on navigation, outside click and Escape — the three ways people
  // expect a menu to go away. Escape hands focus back to the trigger so a
  // keyboard user is not left on a node that just disappeared.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    if (!open) onOpen?.();
    setOpen((v) => !v);
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
    <div className="account-menu" ref={rootRef}>
      {hasGems && (
        <Link href="/profile" className="header-gems" title="Gems — earned by solving, spent on hints">
          <IconGem /> {user.gems}
        </Link>
      )}

      <button
        ref={triggerRef}
        type="button"
        className={`account-trigger${open ? " is-open" : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="account-panel"
        onClick={toggle}
      >
        {user.profilePicUrl ? (
          <Image className="header-avatar" src={user.profilePicUrl} alt="" width={32} height={32} />
        ) : (
          <span className="header-avatar header-avatar-fallback" aria-hidden="true">{initial}</span>
        )}
        <span className="account-caret" aria-hidden="true" />
        <span className="sr-only">Account menu for {user.name}</span>
      </button>

      {open && (
        <div id="account-panel" className="account-panel" role="menu" aria-label="Account">
          <div className="account-panel-head">
            <div className="account-panel-who">
              <b>{user.name}</b>
              {roleBadge && <span className="header-role-badge">{roleBadge}</span>}
            </div>
            <span className="account-panel-email">{user.email}</span>
            {hasGems && (
              <span className="account-panel-gems">
                <IconGem size={12} /> {user.gems} gems
              </span>
            )}
          </div>

          <div className="account-panel-links">
            {links.map((link) => (
              <Link
                key={link.href}
                role="menuitem"
                href={link.href}
                className={isHere(link.href) ? "is-active" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {adminLink && (
            <div className="account-panel-links">
              <Link role="menuitem" href={adminLink.href} className="account-panel-admin">
                {adminLink.label}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          )}

          <button
            type="button"
            role="menuitem"
            className="account-panel-signout"
            onClick={onSignOut}
            disabled={isSigningOut}
          >
            {isSigningOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
