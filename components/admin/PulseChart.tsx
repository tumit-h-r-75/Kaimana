"use client";

// Fourteen days of the site, drawn.
//
// The overview used to say "531 submissions, 60% accepted", which is true
// and tells an admin nothing: a number with no yesterday cannot be up or
// down. This draws the same data as a series, so the shape of a week is
// visible at a glance — and stacks accepted under attempted, because the
// gap between the two bars is the part worth looking at.

import { useMemo, useState } from "react";
import type { PulseDay } from "@/lib/api/admin";
import styles from "./pulseChart.module.css";

type MetricId = "submissions" | "accepted" | "users";

const METRICS: { id: MetricId; label: string; noun: string }[] = [
  { id: "submissions", label: "Submissions", noun: "submissions" },
  { id: "accepted", label: "Accepted", noun: "accepted" },
  { id: "users", label: "New accounts", noun: "accounts" },
];

const RANGES = [7, 14] as const;

const dayLabel = new Intl.DateTimeFormat(undefined, { weekday: "short", timeZone: "UTC" });
const dateLabel = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", timeZone: "UTC" });

const sum = (days: PulseDay[], metric: MetricId) => days.reduce((total, day) => total + day[metric], 0);

export default function PulseChart({ days }: { days: PulseDay[] }) {
  const [metric, setMetric] = useState<MetricId>("submissions");
  const [range, setRange] = useState<number>(14);
  const [hovered, setHovered] = useState<number | null>(null);

  const shown = useMemo(() => days.slice(-range), [days, range]);
  const previous = useMemo(() => days.slice(Math.max(0, days.length - range * 2), days.length - range), [days, range]);

  // One scale for the whole chart, never zero, so a quiet week still draws
  // bars instead of dividing by nothing.
  const peak = Math.max(1, ...shown.map((day) => day[metric]));
  const total = sum(shown, metric);
  const before = sum(previous, metric);
  const delta = before > 0 ? Math.round(((total - before) / before) * 100) : null;
  const active = hovered === null ? null : shown[hovered];
  const noun = METRICS.find((entry) => entry.id === metric)?.noun ?? "";

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <div className={styles.headText}>
          <h2>Activity</h2>
          <p>
            <b>{total.toLocaleString()}</b> {noun} in {range} days
            {delta !== null && (
              <span className={delta >= 0 ? styles.up : styles.down}>
                {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}% vs the {range} before
              </span>
            )}
          </p>
        </div>

        <div className={styles.controls}>
          <div className={styles.segmented} role="group" aria-label="What to chart">
            {METRICS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                aria-pressed={metric === entry.id}
                className={metric === entry.id ? styles.segmentOn : styles.segment}
                onClick={() => setMetric(entry.id)}
              >
                {entry.label}
              </button>
            ))}
          </div>
          <div className={styles.segmented} role="group" aria-label="How many days">
            {RANGES.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={range === value}
                className={range === value ? styles.segmentOn : styles.segment}
                onClick={() => setRange(value)}
              >
                {value}d
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.plot} onMouseLeave={() => setHovered(null)}>
        <div className={styles.grid} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <b className={styles.peak} aria-hidden="true">
          {peak}
        </b>

        <ul className={styles.bars}>
          {shown.map((day, index) => {
            const value = day[metric];
            const height = (value / peak) * 100;
            // Only the attempted bar has a second layer worth drawing.
            const passed = metric === "submissions" && day.submissions > 0 ? (day.accepted / peak) * 100 : 0;
            const date = new Date(`${day.date}T00:00:00Z`);
            return (
              <li key={day.date} className={hovered === index ? styles.columnOn : styles.column}>
                <button
                  type="button"
                  className={styles.hit}
                  onMouseEnter={() => setHovered(index)}
                  onFocus={() => setHovered(index)}
                  onBlur={() => setHovered(null)}
                  aria-label={`${dateLabel.format(date)}: ${value} ${noun}`}
                >
                  <span className={styles.bar} style={{ height: `${Math.max(height, value > 0 ? 2 : 0)}%` }}>
                    {passed > 0 && <span className={styles.barPassed} style={{ height: `${(day.accepted / Math.max(day.submissions, 1)) * 100}%` }} />}
                  </span>
                </button>
                <span className={styles.tick}>{dayLabel.format(date).slice(0, 2)}</span>
              </li>
            );
          })}
        </ul>

        {active && (
          <div
            className={styles.tip}
            style={{ left: `${((hovered! + 0.5) / shown.length) * 100}%` }}
            role="status"
          >
            <b>{dateLabel.format(new Date(`${active.date}T00:00:00Z`))}</b>
            <span>
              {active.submissions} submitted · {active.accepted} accepted
            </span>
            <span>{active.users} new {active.users === 1 ? "account" : "accounts"}</span>
          </div>
        )}
      </div>

      {metric === "submissions" && (
        <p className={styles.legend}>
          <i className={styles.keyPassed} /> accepted
          <i className={styles.keyTotal} /> everything else the judge ran
        </p>
      )}
    </div>
  );
}
