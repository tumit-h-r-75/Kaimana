"use client";

/**
 * Site-wide dialogs and toasts, in place of window.confirm and alert.
 *
 * The browser's own boxes can't be styled, can't explain much, block the
 * page's JavaScript, and look like a phishing prompt on a dark site. These
 * are promise-based, so a call site reads the same as before:
 *
 *   if (!(await dialog.confirm({ title: "Delete this problem?", tone: "danger" }))) return;
 *
 * One dialog shows at a time (the rest queue behind it). It traps focus,
 * closes on Escape (as Cancel), gives focus back to whatever opened it, and
 * stops the page scrolling underneath. Toasts stack in a corner, announce
 * themselves politely to screen readers, and dismiss themselves.
 */

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import styles from "./dialog.module.css";

export type DialogTone = "danger" | "warning" | "info" | "success";

export interface ConfirmOptions {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: DialogTone;
}

export interface AlertOptions {
  title: string;
  message?: ReactNode;
  okLabel?: string;
  tone?: DialogTone;
}

export interface ToastOptions {
  title: string;
  message?: string;
  tone?: DialogTone;
  /** Makes the whole toast a link. */
  href?: string;
  /** Milliseconds on screen; 0 keeps it until dismissed. Default 5000. */
  duration?: number;
}

interface DialogApi {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: AlertOptions) => Promise<void>;
  toast: (options: ToastOptions) => void;
}

type Request = { id: number } & (
  | { kind: "confirm"; options: ConfirmOptions; resolve: (value: boolean) => void }
  | { kind: "alert"; options: AlertOptions; resolve: () => void }
);

interface Toast extends ToastOptions {
  id: number;
}

const DialogContext = createContext<DialogApi | null>(null);

export function useDialog(): DialogApi {
  const context = useContext(DialogContext);
  if (!context) throw new Error("useDialog must be used within a DialogProvider.");
  return context;
}

/* ------------------------------------------------------------------ icons */

// Drawn in, the way SweetAlert's icons are: a ring, then the mark.
function ToneIcon({ tone }: { tone: DialogTone }) {
  return (
    <svg className={`${styles.icon} ${styles[`tone_${tone}`]}`} viewBox="0 0 64 64" aria-hidden="true">
      <circle className={styles.iconRing} cx="32" cy="32" r="28" />
      {tone === "success" && <path className={styles.iconMark} d="m20 33 8 8 16-17" />}
      {tone === "danger" && <path className={styles.iconMark} d="M23 23l18 18M41 23 23 41" />}
      {tone === "warning" && (
        <>
          <path className={styles.iconMark} d="M32 18v17" />
          <path className={styles.iconMark} d="M32 44v.5" />
        </>
      )}
      {tone === "info" && (
        <>
          <path className={styles.iconMark} d="M32 29v16" />
          <path className={styles.iconMark} d="M32 20v.5" />
        </>
      )}
    </svg>
  );
}

/* ----------------------------------------------------------------- dialog */

function DialogView({ request, onClose }: { request: Request; onClose: (confirmed: boolean) => void }) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const primaryRef = useRef<HTMLButtonElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const isConfirm = request.kind === "confirm";
  const tone = request.options.tone ?? (isConfirm ? "warning" : "info");

  useEffect(() => {
    // A destructive confirm starts on Cancel, so an Enter pressed out of
    // habit doesn't delete anything.
    (tone === "danger" && cancelRef.current ? cancelRef.current : primaryRef.current)?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose(false);
        return;
      }
      if (event.key !== "Tab" || !cardRef.current) return;
      // Keep Tab inside the dialog.
      const focusable = Array.from(cardRef.current.querySelectorAll<HTMLElement>("button, a[href]"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, tone]);

  const options = request.options;
  const primaryLabel =
    request.kind === "confirm" ? (request.options.confirmLabel ?? "Confirm") : (request.options.okLabel ?? "OK");

  return (
    <div className={styles.overlay} onMouseDown={(event) => event.target === event.currentTarget && onClose(false)}>
      <div
        ref={cardRef}
        className={styles.card}
        role={isConfirm ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby="kai-dialog-title"
        aria-describedby={options.message ? "kai-dialog-message" : undefined}
      >
        <ToneIcon tone={tone} />
        <h2 id="kai-dialog-title" className={styles.title}>
          {options.title}
        </h2>
        {options.message && (
          <div id="kai-dialog-message" className={styles.message}>
            {options.message}
          </div>
        )}
        <div className={styles.buttons}>
          {request.kind === "confirm" && (
            <button ref={cancelRef} type="button" className={styles.cancel} onClick={() => onClose(false)}>
              {request.options.cancelLabel ?? "Cancel"}
            </button>
          )}
          <button
            ref={primaryRef}
            type="button"
            className={`${styles.primary}${tone === "danger" ? ` ${styles.primaryDanger}` : ""}`}
            onClick={() => onClose(true)}
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- toasts */

function ToastView({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const [paused, setPaused] = useState(false);
  const duration = toast.duration ?? 5000;
  const dismiss = useCallback(() => onDismiss(toast.id), [onDismiss, toast.id]);

  useEffect(() => {
    if (!duration || paused) return;
    const timer = window.setTimeout(dismiss, duration);
    return () => window.clearTimeout(timer);
  }, [duration, paused, dismiss]);

  const body = (
    <>
      <ToneIcon tone={toast.tone ?? "info"} />
      <span className={styles.toastText}>
        <b>{toast.title}</b>
        {toast.message && <span>{toast.message}</span>}
      </span>
    </>
  );

  return (
    <div
      className={`${styles.toast} ${styles[`tone_${toast.tone ?? "info"}`]}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {toast.href ? (
        <Link href={toast.href} className={styles.toastBody} onClick={dismiss}>
          {body}
        </Link>
      ) : (
        <div className={styles.toastBody}>{body}</div>
      )}
      <button type="button" className={styles.toastClose} onClick={dismiss} aria-label="Dismiss">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
      {duration > 0 && !paused && <i className={styles.toastTimer} style={{ animationDuration: `${duration}ms` }} />}
    </div>
  );
}

/* --------------------------------------------------------------- provider */

export function DialogProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Request[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const nextId = useRef(1);

  useEffect(() => setMounted(true), []);

  const current = queue[0] ?? null;

  // While a dialog is up: remember what had focus, and hold the page still.
  useEffect(() => {
    if (!current) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
      returnFocusRef.current?.focus?.();
    };
  }, [current]);

  const close = useCallback(
    (confirmed: boolean) => {
      if (!current) return;
      if (current.kind === "confirm") current.resolve(confirmed);
      else current.resolve();
      setQueue((items) => items.slice(1));
    },
    [current],
  );

  const dismissToast = useCallback((id: number) => setToasts((items) => items.filter((t) => t.id !== id)), []);

  const api = useMemo<DialogApi>(
    () => ({
      confirm: (options) =>
        new Promise<boolean>((resolve) => setQueue((items) => [...items, { id: nextId.current++, kind: "confirm", options, resolve }])),
      alert: (options) =>
        new Promise<void>((resolve) => setQueue((items) => [...items, { id: nextId.current++, kind: "alert", options, resolve }])),
      toast: (options) => {
        const id = nextId.current++;
        // Four at most; the oldest makes room.
        setToasts((items) => [...items.slice(-3), { ...options, id }]);
      },
    }),
    [],
  );

  return (
    <DialogContext.Provider value={api}>
      {children}
      {mounted &&
        createPortal(
          <>
            {current && <DialogView key={current.id} request={current} onClose={close} />}
            <div className={styles.toasts} role="status" aria-live="polite">
              {toasts.map((toast) => (
                <ToastView key={toast.id} toast={toast} onDismiss={dismissToast} />
              ))}
            </div>
          </>,
          document.body,
        )}
    </DialogContext.Provider>
  );
}
