"use client";

// The charts that read the submissions themselves.
//
// The trend chart above these plots one snapshot a day, and a snapshot only
// exists for a day its owner opened the page. These five read the runs: a
// series you can scrub across, the week as a grid of hours, the shape of
// what someone is good at, and what a solve usually costs them in tries.
//
// Everything is hand-drawn SVG. A charting library would be four hundred
// kilobytes to draw five shapes, and none of them would match the site.
//
// Named insightCharts, and not the obvious thing: with this same file
// called advanced.tsx, `next build` finished compiling and then failed to
// find app/analytics/page.tsx#default in the React client manifest. Same
// contents, different name, clean build — so the name stays.

import { Fragment, useId, useMemo, useRef, useState } from "react";
import type { AnalyticsInsights, HeatCell, InsightDay, LanguageInsight, TagInsight } from "@/lib/api/analytics";
import styles from "./analytics.module.css";
import { formatDay } from "./charts";

/* ------------------------------------------------------------ the series */

type SeriesKey = "submissions" | "accepted" | "problems";

const SERIES_META: Record<SeriesKey, { label: string; colour: string; fill: boolean }> = {
  submissions: { label: "Submissions", colour: "var(--text-dim)", fill: true },
  accepted: { label: "Accepted", colour: "var(--accent)", fill: true },
  problems: { label: "Problems passed", colour: "var(--warn)", fill: false },
};

const W = 760;
const H = 260;
const PAD = { top: 18, right: 18, bottom: 34, left: 42 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

/** A rounded top for the scale, so the gridline labels are whole numbers. */
function niceMax(value: number) {
  if (value <= 4) return Math.max(value, 2);
  const exponent = Math.pow(10, Math.floor(Math.log10(value)));
  const fraction = value / exponent;
  const step = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 4 ? 4 : fraction <= 6 ? 6 : fraction <= 8 ? 8 : 10;
  return step * exponent;
}

/** Catmull-Rom through the points, as cubic beziers: a line that reads as a trend. */
function smoothPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return "";
  if (points.length === 2) return `M${points[0].x},${points[0].y} L${points[1].x},${points[1].y}`;
  let path = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return path;
}

export function SeriesChart({ daily }: { daily: InsightDay[] }) {
  const gradientId = useId().replace(/:/g, "");
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hidden, setHidden] = useState<Set<SeriesKey>>(new Set());
  const [hover, setHover] = useState<number | null>(null);

  const shown = (Object.keys(SERIES_META) as SeriesKey[]).filter((key) => !hidden.has(key));

  const model = useMemo(() => {
    if (daily.length < 2) return null;
    const peak = niceMax(Math.max(1, ...daily.flatMap((day) => shown.map((key) => day[key]))));
    const step = PLOT_W / (daily.length - 1);
    const at = (index: number, value: number) => ({
      x: PAD.left + index * step,
      y: PAD.top + PLOT_H - (value / peak) * PLOT_H,
    });
    const lines = shown.map((key) => {
      const points = daily.map((day, index) => at(index, day[key]));
      const line = smoothPath(points);
      return {
        key,
        points,
        line,
        area: `${line} L${points[points.length - 1].x.toFixed(1)},${PAD.top + PLOT_H} L${points[0].x.toFixed(1)},${PAD.top + PLOT_H} Z`,
      };
    });
    return { peak, step, lines, ticks: [0, peak / 2, peak] };
  }, [daily, shown]);

  if (!model) {
    return <p className={styles.emptyState}>Two days of submissions and this chart appears.</p>;
  }

  // The pointer picks the nearest day, anywhere in the plot — there is
  // nothing to aim at, which is the point.
  const onMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const box = svgRef.current?.getBoundingClientRect();
    if (!box) return;
    const x = ((event.clientX - box.left) / box.width) * W;
    const index = Math.round((x - PAD.left) / model.step);
    setHover(Math.min(Math.max(index, 0), daily.length - 1));
  };

  const active = hover === null ? null : daily[hover];
  const activeX = hover === null ? 0 : PAD.left + hover * model.step;

  return (
    <div className={styles.chartWrap}>
      <div className={styles.legend}>
        {(Object.keys(SERIES_META) as SeriesKey[]).map((key) => {
          const meta = SERIES_META[key];
          const off = hidden.has(key);
          return (
            <button
              key={key}
              type="button"
              className={`${styles.legendChip}${off ? ` ${styles.legendOff}` : ""}`}
              aria-pressed={!off}
              onClick={() =>
                setHidden((previous) => {
                  const next = new Set(previous);
                  // Something has to stay on the chart.
                  if (next.has(key)) next.delete(key);
                  else if (previous.size < 2) next.add(key);
                  return next;
                })
              }
            >
              <i style={{ background: meta.colour }} />
              {meta.label}
            </button>
          );
        })}
      </div>

      <svg
        ref={svgRef}
        className={styles.chart}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Submissions, accepted runs and problems passed, day by day"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          {model.lines.map((series) => (
            <linearGradient key={series.key} id={`${gradientId}-${series.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES_META[series.key].colour} stopOpacity=".3" />
              <stop offset="100%" stopColor={SERIES_META[series.key].colour} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {model.ticks.map((tick) => {
          const y = PAD.top + PLOT_H - (tick / model.peak) * PLOT_H;
          return (
            <g key={tick}>
              <line className={styles.gridLine} x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} vectorEffect="non-scaling-stroke" />
              <text className={styles.axisText} x={PAD.left - 8} y={y + 3.5} textAnchor="end">
                {Math.round(tick)}
              </text>
            </g>
          );
        })}

        {model.lines.map((series) => (
          <g key={series.key}>
            {SERIES_META[series.key].fill && <path d={series.area} fill={`url(#${gradientId}-${series.key})`} />}
            <path
              d={series.line}
              fill="none"
              stroke={SERIES_META[series.key].colour}
              strokeWidth={series.key === "submissions" ? 1.6 : 2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ))}

        {active && (
          <>
            <line className={styles.crosshair} x1={activeX} x2={activeX} y1={PAD.top} y2={PAD.top + PLOT_H} vectorEffect="non-scaling-stroke" />
            {model.lines.map((series) => (
              <circle
                key={series.key}
                cx={activeX}
                cy={series.points[hover!].y}
                r="4.5"
                fill="var(--bg)"
                stroke={SERIES_META[series.key].colour}
                strokeWidth="2"
              />
            ))}
          </>
        )}

        <text className={styles.axisText} x={PAD.left} y={H - 10}>
          {formatDay(daily[0].date)}
        </text>
        <text className={styles.axisText} x={W - PAD.right} y={H - 10} textAnchor="end">
          {formatDay(daily[daily.length - 1].date)}
        </text>
      </svg>

      {active && (
        <div
          className={`${styles.tooltip} ${styles.tooltipInline}`}
          style={{ left: `${Math.min(Math.max((activeX / W) * 100, 12), 88)}%`, top: "22%" }}
        >
          <b>{formatDay(active.date, { weekday: "short", month: "short", day: "numeric" })}</b>
          {shown.map((key) => (
            <span key={key}>
              {active[key]} {SERIES_META[key].label.toLowerCase()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------- the heatmap */

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

const hourLabel = (hour: number) => {
  if (hour === 0) return "12am";
  if (hour === 12) return "12pm";
  return hour > 12 ? `${hour - 12}pm` : `${hour}am`;
};

/** The week as a grid of hours: when the work happens, and when it lands. */
export function WeekHeatmap({ cells, timeZone }: { cells: HeatCell[]; timeZone: string }) {
  const [hover, setHover] = useState<{ day: number; hour: number } | null>(null);

  const { grid, peak, busiest, sharpest } = useMemo(() => {
    const byKey = new Map<string, HeatCell>();
    let peakCount = 0;
    let busiestCell: HeatCell | null = null;
    // The best accept rate among hours with enough runs to mean anything:
    // three is not a pattern, but one accepted run out of one certainly is
    // not either.
    let sharpestCell: HeatCell | null = null;
    for (const cell of cells) {
      byKey.set(`${cell.day}-${cell.hour}`, cell);
      if (cell.count > peakCount) {
        peakCount = cell.count;
        busiestCell = cell;
      }
      if (cell.count >= 3) {
        const rate = cell.accepted / cell.count;
        if (!sharpestCell || rate > sharpestCell.accepted / sharpestCell.count) sharpestCell = cell;
      }
    }
    return { grid: byKey, peak: Math.max(peakCount, 1), busiest: busiestCell, sharpest: sharpestCell };
  }, [cells]);

  if (cells.length === 0) {
    return <p className={styles.emptyState}>Nothing submitted in this window yet.</p>;
  }

  const active = hover ? grid.get(`${hover.day}-${hover.hour}`) ?? null : null;

  return (
    <div>
      <div className={styles.heatScroll}>
        <div className={styles.heatGrid} onMouseLeave={() => setHover(null)}>
          <span />
          {HOURS.map((hour) => (
            <span key={`h-${hour}`} className={styles.heatHour}>
              {hour % 6 === 0 ? hourLabel(hour) : ""}
            </span>
          ))}

          {DAY_NAMES.map((name, day) => (
            <Fragment key={name}>
              <span className={styles.heatDay}>{name}</span>
              {HOURS.map((hour) => {
                const cell = grid.get(`${day}-${hour}`);
                // A square with one run in it still has to be visible, so the
                // ramp starts well above zero rather than at it.
                const strength = cell ? Math.round(14 + (cell.count / peak) * 76) : 0;
                const on = hover?.day === day && hover?.hour === hour;
                return (
                  <button
                    key={`${day}-${hour}`}
                    type="button"
                    className={`${styles.heatCell}${on ? ` ${styles.heatCellOn}` : ""}`}
                    style={{ background: cell ? `color-mix(in srgb, var(--accent) ${strength}%, var(--surface-hi))` : undefined }}
                    onMouseEnter={() => setHover({ day, hour })}
                    onFocus={() => setHover({ day, hour })}
                    onBlur={() => setHover(null)}
                    aria-label={`${name} ${hourLabel(hour)}: ${cell?.count ?? 0} submissions`}
                  />
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      <p className={styles.heatRead} aria-live="polite">
        {active ? (
          <>
            <b>
              {DAY_NAMES[active.day]} {hourLabel(active.hour)}
            </b>
            {" — "}
            {active.count} submission{active.count === 1 ? "" : "s"}, {active.accepted} accepted
          </>
        ) : hover ? (
          <>
            <b>
              {DAY_NAMES[hover.day]} {hourLabel(hover.hour)}
            </b>
            {" — nothing yet"}
          </>
        ) : (
          <>
            {busiest && (
              <>
                You submit most on <b>{DAY_NAMES[busiest.day]}</b> around <b>{hourLabel(busiest.hour)}</b>
              </>
            )}
            {sharpest && (
              <>
                {" · your sharpest hour is "}
                <b>
                  {DAY_NAMES[sharpest.day]} {hourLabel(sharpest.hour)}
                </b>{" "}
                ({Math.round((sharpest.accepted / sharpest.count) * 100)}% accepted)
              </>
            )}
          </>
        )}
      </p>
      <p className={styles.heatZone}>Hours are yours — {timeZone.replace(/_/g, " ")}.</p>
    </div>
  );
}

/* ------------------------------------------------------------- the radar */

const RADAR_SIZE = 260;
const RADAR_R = 92;

/** Solve rate per tag, as a shape. Six-ish spokes is where this stays readable. */
export function TagRadar({ tags }: { tags: TagInsight[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = tags.slice(0, 6);

  if (shown.length < 3) {
    return <p className={styles.emptyState}>Solve problems across a few more topics and this fills in.</p>;
  }

  const centre = RADAR_SIZE / 2;
  const angleOf = (index: number) => (index / shown.length) * Math.PI * 2 - Math.PI / 2;
  const pointAt = (index: number, radius: number) => ({
    x: centre + Math.cos(angleOf(index)) * radius,
    y: centre + Math.sin(angleOf(index)) * radius,
  });

  const shape = shown
    .map((tag, index) => {
      const point = pointAt(index, (Math.max(tag.solveRate, 4) / 100) * RADAR_R);
      return `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    })
    .join(" ");

  const active = hover === null ? null : shown[hover];

  return (
    <div className={styles.radarWrap}>
      <svg viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`} className={styles.radar} role="img" aria-label="Solve rate by topic">
        {[0.25, 0.5, 0.75, 1].map((ring) => (
          <circle key={ring} className={styles.radarRing} cx={centre} cy={centre} r={RADAR_R * ring} />
        ))}
        {shown.map((tag, index) => {
          const end = pointAt(index, RADAR_R);
          return <line key={tag.tag} className={styles.radarSpoke} x1={centre} y1={centre} x2={end.x} y2={end.y} />;
        })}

        <path className={styles.radarShape} d={`${shape} Z`} />

        {shown.map((tag, index) => {
          const point = pointAt(index, (Math.max(tag.solveRate, 4) / 100) * RADAR_R);
          const label = pointAt(index, RADAR_R + 18);
          return (
            <g key={tag.tag}>
              <circle
                className={`${styles.radarDot}${hover === index ? ` ${styles.radarDotOn}` : ""}`}
                cx={point.x}
                cy={point.y}
                r={hover === index ? 5.5 : 3.5}
                onMouseEnter={() => setHover(index)}
                onMouseLeave={() => setHover(null)}
              />
              <text
                className={styles.radarLabel}
                x={label.x}
                y={label.y}
                textAnchor={label.x > centre + 6 ? "start" : label.x < centre - 6 ? "end" : "middle"}
                dominantBaseline="middle"
                onMouseEnter={() => setHover(index)}
                onMouseLeave={() => setHover(null)}
              >
                {tag.tag}
              </text>
            </g>
          );
        })}
      </svg>

      <p className={styles.radarRead} aria-live="polite">
        {active ? (
          <>
            <b>{active.tag}</b> — solved {active.solved} of {active.attempted} ({active.solveRate}%)
          </>
        ) : (
          <>Hover a topic. The further out, the higher the share you solve.</>
        )}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------- the donut */

const LANGUAGE_LABELS: Record<string, string> = {
  python: "Python",
  cpp: "C++",
  javascript: "JavaScript",
  typescript: "TypeScript",
};

const DONUT_TONES = ["var(--accent)", "var(--warn)", "var(--error)", "color-mix(in srgb, var(--accent) 45%, var(--text-dim))"];

/** Language mix, with the hovered slice read out in the hole. */
export function LanguageDonut({ languages }: { languages: LanguageInsight[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const total = languages.reduce((sum, entry) => sum + entry.count, 0);

  if (total === 0) return <p className={styles.emptyState}>No submissions yet.</p>;

  const size = 200;
  const radius = 78;
  const centre = size / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const active = hover === null ? null : languages[hover];
  const leader = languages[0];

  return (
    <div className={styles.donutWrap}>
      <div className={styles.donutFigure}>
        <svg viewBox={`0 0 ${size} ${size}`} className={styles.donut} role="img" aria-label="Submissions by language">
          {languages.map((entry, index) => {
            const share = entry.count / total;
            const dash = share * circumference;
            const element = (
              <circle
                key={entry.language}
                className={`${styles.donutArc}${hover !== null && hover !== index ? ` ${styles.donutArcDim}` : ""}`}
                cx={centre}
                cy={centre}
                r={radius}
                fill="none"
                stroke={DONUT_TONES[index % DONUT_TONES.length]}
                strokeWidth={hover === index ? 26 : 20}
                strokeDasharray={`${dash.toFixed(2)} ${(circumference - dash).toFixed(2)}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${centre} ${centre})`}
                onMouseEnter={() => setHover(index)}
                onMouseLeave={() => setHover(null)}
              />
            );
            offset += dash;
            return element;
          })}
        </svg>

        <div className={styles.donutHole}>
          <b>{active ? Math.round((active.count / total) * 100) : Math.round((leader.count / total) * 100)}%</b>
          <span>{LANGUAGE_LABELS[(active ?? leader).language] ?? (active ?? leader).language}</span>
        </div>
      </div>

      <ul className={styles.donutKeys}>
        {languages.map((entry, index) => (
          <li
            key={entry.language}
            className={hover === index ? styles.donutKeyOn : undefined}
            onMouseEnter={() => setHover(index)}
            onMouseLeave={() => setHover(null)}
          >
            <i style={{ background: DONUT_TONES[index % DONUT_TONES.length] }} />
            <span>{LANGUAGE_LABELS[entry.language] ?? entry.language}</span>
            <b>{entry.count}</b>
            <small>
              {entry.count > 0 ? Math.round((entry.accepted / entry.count) * 100) : 0}% accepted
              {entry.avgRuntimeMs !== null && entry.accepted > 0 ? ` · ${entry.avgRuntimeMs}ms avg` : ""}
            </small>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* --------------------------------------------------------- the histogram */

/** How many tries a solved problem usually costs. */
export function AttemptsHistogram({ attempts }: { attempts: AnalyticsInsights["attempts"] }) {
  const [hover, setHover] = useState<number | null>(null);
  const total = attempts.reduce((sum, row) => sum + row.problems, 0);

  if (total === 0) return <p className={styles.emptyState}>Solve a problem and this fills in.</p>;

  const peak = Math.max(...attempts.map((row) => row.problems), 1);
  const firstTry = attempts.find((row) => row.attempts === 1)?.problems ?? 0;

  return (
    <div>
      <ul className={styles.histogram} onMouseLeave={() => setHover(null)}>
        {attempts.map((row) => {
          const share = Math.round((row.problems / total) * 100);
          return (
            <li key={row.attempts}>
              <button
                type="button"
                className={styles.histBar}
                onMouseEnter={() => setHover(row.attempts)}
                onFocus={() => setHover(row.attempts)}
                onBlur={() => setHover(null)}
                aria-label={`${row.problems} problems took ${row.attempts}${row.capped ? " or more" : ""} attempts`}
              >
                <span className={styles.histTrack}>
                  <span
                    className={hover === row.attempts ? styles.histFillOn : styles.histFill}
                    style={{ height: `${Math.max((row.problems / peak) * 100, 3)}%` }}
                  />
                </span>
                <b>{row.problems}</b>
                <small>
                  {row.attempts}
                  {row.capped ? "+" : ""} {row.attempts === 1 && !row.capped ? "try" : "tries"}
                </small>
                {hover === row.attempts && <i className={styles.histShare}>{share}%</i>}
              </button>
            </li>
          );
        })}
      </ul>
      <p className={styles.histRead}>
        <b>{Math.round((firstTry / total) * 100)}%</b> of the problems you have solved went through on the first try.
      </p>
    </div>
  );
}
