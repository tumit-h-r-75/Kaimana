"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { visualiseExecution, type TraceFrame, type TraceResult, type TraceValue } from "@/lib/api/submissions";
import { getErrorMessage } from "@/lib/api/client";
import type { Language } from "@/types/api";
import { callStackAt, numericGrid, numericList, pointersInto } from "@/lib/traceShapes";
import styles from "./ExecutionVisualizer.module.css";

/** Frames per second while playing. Slow enough to read a changing array. */
const PLAYBACK_FPS = 6;

function Bars({ values, pointers }: { values: number[]; pointers: { name: string; index: number }[] }) {
  const max = Math.max(...values.map(Math.abs), 1);
  return (
    <div className={styles.bars}>
      {values.map((value, index) => {
        const hit = pointers.filter((pointer) => pointer.index === index);
        return (
          <div key={index} className={styles.barCell}>
            <span className={styles.barValue}>{value}</span>
            <span
              className={`${styles.bar} ${hit.length ? styles.barMarked : ""}`}
              style={{ height: `${Math.max((Math.abs(value) / max) * 100, 3)}%` }}
            />
            <span className={styles.barIndex}>{index}</span>
            {hit.length > 0 && <span className={styles.pointer}>{hit.map((p) => p.name).join(",")}</span>}
          </div>
        );
      })}
    </div>
  );
}

function Grid({ rows }: { rows: number[][] }) {
  const max = Math.max(...rows.flat().map(Math.abs), 1);
  return (
    <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${rows[0].length}, minmax(0, 1fr))` }}>
      {rows.flatMap((row, r) =>
        row.map((cell, c) => (
          <span
            key={`${r}-${c}`}
            className={styles.cell}
            // Filled cells carry the accent; the opacity is the value, so a
            // DP table visibly fills in as the timeline advances.
            style={{ background: `color-mix(in srgb, var(--accent) ${(Math.abs(cell) / max) * 55}%, transparent)` }}
          >
            {cell}
          </span>
        )),
      )}
    </div>
  );
}

function ValueView({ value }: { value: TraceValue }) {
  if (value.t === "s") return <span className={styles.scalar}>{String(value.v)}</span>;
  if (value.t === "r") return <span className={styles.repr}>{value.v}</span>;
  if (value.t === "d") {
    return (
      <div className={styles.dict}>
        {value.v.map(([key, item]) => (
          <span key={key} className={styles.dictRow}>
            <b>{key}</b>
            <ValueView value={item} />
          </span>
        ))}
        {value.v.length < value.n && <span className={styles.more}>+{value.n - value.v.length} more</span>}
      </div>
    );
  }
  return (
    <div className={styles.chips}>
      {value.v.map((item, index) => (
        <ValueView key={index} value={item} />
      ))}
      {value.v.length < value.n && <span className={styles.more}>+{value.n - value.v.length} more</span>}
    </div>
  );
}

function FrameView({ frame }: { frame: TraceFrame }) {
  const entries = Object.entries(frame.v);
  if (!entries.length) return <p className={styles.empty}>No variables in scope yet.</p>;

  return (
    <div className={styles.vars}>
      {entries.map(([name, value]) => {
        const grid = numericGrid(value);
        const bars = grid ? null : numericList(value);
        return (
          <div key={name} className={styles.varRow}>
            <span className={styles.varName}>{name}</span>
            <div className={styles.varBody}>
              {grid ? <Grid rows={grid} /> : bars ? <Bars values={bars} pointers={pointersInto(frame, bars.length, name)} /> : <ValueView value={value} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ExecutionVisualizer({
  language,
  source,
  disabled,
  onLineChange,
}: {
  language: Language;
  source: string;
  disabled?: boolean;
  /** Fired as the timeline moves, so the editor can follow along. */
  onLineChange?: (line: number) => void;
}) {
  const [trace, setTrace] = useState<TraceResult | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  // Memoised so an empty trace doesn't hand the hooks below a fresh [] on
  // every render.
  const frames = useMemo(() => trace?.frames ?? [], [trace]);
  const frame = frames[index];
  const lastIndex = frames.length - 1;

  const run = useCallback(async () => {
    setStatus("loading");
    setMessage("");
    setPlaying(false);
    try {
      const result = await visualiseExecution({ language, source });
      setTrace(result);
      setIndex(0);
      // A run with no frames at all only happens when the code never
      // executed — a syntax error. Say that rather than showing an
      // empty scrubber.
      setStatus(result.frames.length ? "idle" : "error");
      if (!result.frames.length) setMessage(result.error ?? "This code produced no executable lines.");
    } catch (error) {
      setStatus("error");
      setMessage(getErrorMessage(error, "Could not visualise this run."));
    }
  }, [language, source]);

  useEffect(() => {
    if (!playing) return;
    if (index >= lastIndex) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => setIndex((current) => Math.min(current + 1, lastIndex)), 1000 / PLAYBACK_FPS);
    return () => clearTimeout(timer);
  }, [playing, index, lastIndex]);

  // Report the line separately from the frame change so a paused scrub still
  // moves the editor.
  const lastReported = useRef<number | null>(null);
  useEffect(() => {
    if (!frame || !onLineChange) return;
    if (lastReported.current === frame.l) return;
    lastReported.current = frame.l;
    onLineChange(frame.l);
  }, [frame, onLineChange]);

  const stack = useMemo(() => (frames.length ? callStackAt(frames, index) : []), [frames, index]);

  if (status === "loading") {
    return (
      <div className={styles.panel}>
        <p className={styles.loading}>Tracing your code… this runs it a second time, so it takes a moment.</p>
      </div>
    );
  }

  if (!trace || status === "error") {
    return (
      <div className={styles.panel}>
        <div className={styles.introRow}>
          <div>
            <h3 className={styles.title}>Execution Visualizer</h3>
            <p className={styles.intro}>
              Runs your code once more while recording every line, then lets you scrub through it. Python only.
            </p>
          </div>
          <button className="button button-small" onClick={run} disabled={disabled || language !== "python"}>
            Visualise
          </button>
        </div>
        {language !== "python" && <p className={styles.note}>Switch the editor to Python to use this.</p>}
        {status === "error" && message && <p className={styles.error}>{message}</p>}
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.introRow}>
        <h3 className={styles.title}>
          Execution Visualizer <span className={styles.lineTag}>line {frame?.l}</span>
        </h3>
        <button className="button-outline button-small" onClick={run} disabled={disabled}>
          Re-trace
        </button>
      </div>

      <div className={styles.controls}>
        <button onClick={() => setIndex((i) => Math.max(i - 1, 0))} disabled={index === 0} aria-label="Step back">
          ◀
        </button>
        <button onClick={() => setPlaying((p) => !p)} disabled={index >= lastIndex} aria-label={playing ? "Pause" : "Play"}>
          {playing ? "❚❚" : "▶"}
        </button>
        <button onClick={() => setIndex((i) => Math.min(i + 1, lastIndex))} disabled={index >= lastIndex} aria-label="Step forward">
          ▶|
        </button>
        <input
          className={styles.slider}
          type="range"
          min={0}
          max={Math.max(lastIndex, 0)}
          value={index}
          onChange={(event) => {
            setPlaying(false);
            setIndex(Number(event.target.value));
          }}
          aria-label="Execution timeline"
        />
        <span className={styles.counter}>
          {index + 1}/{frames.length}
        </span>
      </div>

      {(trace.truncated || trace.summarised) && (
        <p className={styles.note}>
          {trace.truncated && `Long run — showing every ${trace.stride}${trace.stride === 2 ? "nd" : trace.stride === 3 ? "rd" : "th"} line. `}
          {trace.summarised && "Large values are shown as summaries. "}
          Try a smaller input to see every step.
        </p>
      )}

      {stack.length > 1 && (
        <div className={styles.stack}>
          {stack.map((fn, depth) => (
            <span key={depth} className={styles.stackItem} style={{ marginLeft: depth * 14 }}>
              {fn}
              {depth === stack.length - 1 && <b className={styles.stackHere}>← here</b>}
            </span>
          ))}
        </div>
      )}

      {frame && <FrameView frame={frame} />}

      {trace.stdout && (
        <div className={styles.stdout}>
          <span className={styles.stdoutLabel}>Program output</span>
          <pre>{trace.stdout}</pre>
        </div>
      )}
      {trace.error && <p className={styles.error}>{trace.error}</p>}
    </div>
  );
}
