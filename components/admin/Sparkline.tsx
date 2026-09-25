// A fortnight in twenty pixels.
//
// Small enough to sit inside a stat tile without competing with the number
// it belongs to, and that is the whole point: the number says where things
// are, the line says which way they are moving.

const WIDTH = 72;
const HEIGHT = 22;

export default function Sparkline({ values, tone = "accent" }: { values: number[]; tone?: "accent" | "dim" }) {
  if (values.length < 2) return null;

  const peak = Math.max(...values);
  const floor = Math.min(...values);
  const span = peak - floor || 1;
  const step = WIDTH / (values.length - 1);

  const points = values.map((value, index) => {
    const x = index * step;
    // A flat series sits on the middle line rather than the floor, where it
    // would read as a collapse.
    const y = peak === floor ? HEIGHT / 2 : HEIGHT - 2 - ((value - floor) / span) * (HEIGHT - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const line = `M${points.join(" L")}`;
  const area = `${line} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`;
  const color = tone === "accent" ? "var(--accent)" : "var(--text-dim)";
  const id = `spark-${tone}-${values.length}-${Math.round(peak)}`;

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width={WIDTH} height={HEIGHT} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
