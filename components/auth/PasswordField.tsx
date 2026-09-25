"use client";

// The password box, with the three things a bare <input type="password">
// cannot tell you: what you typed, whether Caps Lock is on, and whether the
// thing you just invented is any good.
//
// It stays an uncontrolled field as far as the form is concerned — it keeps
// its `name`, so FormData still picks it up — and only mirrors the value
// into state to draw the meter.

import { useId, useState } from "react";

interface PasswordFieldProps {
  id: string;
  name?: string;
  label: string;
  placeholder: string;
  autoComplete: "current-password" | "new-password";
  /** The meter belongs on a password being chosen, not one being recalled. */
  showStrength?: boolean;
  minLength?: number;
  required?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
}

const EyeIcon = ({ off }: { off: boolean }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="m4 20 16-16" />}
  </svg>
);

/**
 * Four steps, from what it is made of rather than from a score nobody can
 * act on: length first, because length is what actually helps, then whether
 * there is more than one kind of character in it.
 */
function strengthOf(password: string) {
  if (!password) return { level: 0, label: "", hint: "" };
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) => pattern.test(password)).length;
  if (password.length < 8) return { level: 1, label: "Too short", hint: "Eight characters is the minimum." };
  if (password.length >= 14 && kinds >= 2) return { level: 4, label: "Strong", hint: "That will do nicely." };
  if (password.length >= 11 || kinds >= 3) return { level: 3, label: "Good", hint: "A couple more characters would make it strong." };
  return { level: 2, label: "Weak", hint: "Longer beats stranger — try a few words together." };
}

export function PasswordField({
  id,
  name = "password",
  label,
  placeholder,
  autoComplete,
  showStrength = false,
  minLength = 8,
  required = true,
  value,
  onValueChange,
}: PasswordFieldProps) {
  const [internal, setInternal] = useState("");
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const describedBy = useId();

  const password = value ?? internal;
  const strength = strengthOf(password);

  return (
    <div className="auth-password">
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <div className="auth-password-row">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-describedby={showStrength && password ? describedBy : undefined}
          value={value}
          onChange={(event) => {
            setInternal(event.target.value);
            onValueChange?.(event.target.value);
          }}
          onKeyUp={(event) => setCapsLock(event.getModifierState?.("CapsLock") ?? false)}
          onBlur={() => setCapsLock(false)}
        />
        <button
          type="button"
          className="auth-password-toggle"
          onClick={() => setVisible((previous) => !previous)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          <EyeIcon off={visible} />
        </button>
      </div>

      {capsLock && (
        <p className="auth-password-caps" role="status">
          Caps Lock is on.
        </p>
      )}

      {showStrength && password && (
        <div className="auth-strength" id={describedBy}>
          <span className={`auth-strength-bars level-${strength.level}`} aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span className="auth-strength-text">
            <b>{strength.label}</b> {strength.hint}
          </span>
        </div>
      )}
    </div>
  );
}
