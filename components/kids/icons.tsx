// The Kids section's own icon set.
//
// Code Quest used system emoji as interface icons — a sparkle, a map, a
// finish flag, a medal, padlocks, one per world, one per badge. Emoji are
// drawn by the operating system, so the page looked different on every
// device and, on all of them, looked like clip art. These are drawn here,
// in one weight, and take their colour from the element around them.
//
// Written by scripts/make-kids-icons (a scratch tool), from drawings checked
// at both their display size and 4x before they were accepted.

interface IconProps {
  size?: number;
  className?: string;
}

/** sparkle */
export function SparkleIcon({ size = 24, className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="2.5" fill="currentColor"/><path d="M12 2v4 M22 12h-4 M12 22v-4 M2 12h4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><path d="M18.6 5.4l-2.8 2.8 M5.4 18.6l2.8-2.8 M5.4 5.4l2.8 2.8 M18.6 18.6l-2.8-2.8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

/** map */
export function MapIcon({ size = 24, className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true" focusable="false">
      <path d="M3 7 9 4.5 15 7 21 4.5V17l-6 2.5-6-2.5-6 2.5Z" fill="currentColor"/><path d="M9 4.5v12.5M15 7v12.5" stroke="#fff" strokeOpacity=".55" strokeWidth="1.2" fill="none"/><circle cx="12" cy="11.5" r="1.6" fill="#fff" fillOpacity=".75"/>
    </svg>
  );
}

/** flag */
export function FlagIcon({ size = 24, className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true" focusable="false">
      <rect x="4" y="4" width="14" height="8" rx="1" fill="currentColor"/><line x1="4" y1="4" x2="4" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

/** medal */
export function MedalIcon({ size = 24, className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true" focusable="false">
      <path d="M6.5 3.5 10 10.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/><path d="M17.5 3.5 14 10.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/><circle cx="12" cy="15" r="6.5" fill="currentColor"/><path d="m12 11.2 1.1 2.3 2.5.3-1.8 1.7.5 2.5-2.3-1.2-2.3 1.2.5-2.5-1.8-1.7 2.5-.3z" fill="#fff"/>
    </svg>
  );
}

/** lock */
export function LockIcon({ size = 24, className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true" focusable="false">
      <path d="M7 10a5 5 0 0110 0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><rect x="5" y="10" width="14" height="10" rx="2" fill="currentColor"/><circle cx="12" cy="16" r="1.5" fill="currentColor" opacity=".35"/>
    </svg>
  );
}

/** star-filled */
export function StarFilledIcon({ size = 24, className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true" focusable="false">
      <path d="M12 5l2.4 5h5.4l-4.4 3.2 1.6 5.3L12 15.2 7 18.5l1.6-5.3L4.2 10h5.4L12 5z" fill="currentColor"/>
    </svg>
  );
}

/** star-outline */
export function StarOutlineIcon({ size = 24, className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true" focusable="false">
      <path d="M12 5l2.4 5h5.4l-4.4 3.2 1.6 5.3L12 15.2 7 18.5l1.6-5.3L4.2 10h5.4L12 5z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  );
}

/** play */
export function PlayIcon({ size = 24, className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true" focusable="false">
      <path d="M7 5v14l10-7-10-7z" fill="currentColor"/>
    </svg>
  );
}

/** check */
export function CheckIcon({ size = 24, className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true" focusable="false">
      <path d="M6 11l3.5 3.5 6-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/** arrow-right */
export function ArrowRightIcon({ size = 24, className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true" focusable="false">
      <line x1="4" y1="12" x2="18" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><path d="M16 9l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/** trophy */
export function TrophyIcon({ size = 24, className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true" focusable="false">
      <path d="M 6 6 L 7 12 Q 7 14 9 15 L 15 15 Q 17 14 17 12 L 18 6 Z" fill="currentColor"/><path d="M 8 8 L 8.5 11.5 Q 8.5 13 9.5 13.5 L 14.5 13.5 Q 15.5 13 15.5 11.5 L 16 8 Z" fill="currentColor" opacity=".35"/><path d="M 7 8 Q 3 9 3 11.5 Q 3 13.5 7 14" stroke="currentColor" fill="none" strokeWidth="1.8" strokeLinecap="round"/><path d="M 17 8 Q 21 9 21 11.5 Q 21 13.5 17 14" stroke="currentColor" fill="none" strokeWidth="1.8" strokeLinecap="round"/><rect x="10.5" y="15" width="3" height="2.5" fill="currentColor"/><rect x="4" y="17.5" width="16" height="2" rx="0.5" fill="currentColor"/>
    </svg>
  );
}

/** spark-bolt */
export function SparkBoltIcon({ size = 24, className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true" focusable="false">
      <path d="M 13 3 L 10 9 L 13 9 L 9 20 L 15 11 L 12 11 L 15 3 Z" fill="currentColor"/><path d="M 12 5 L 10.5 8 L 12 8 L 11 16 L 13.5 10 L 12.5 10 L 13 5 Z" fill="currentColor" opacity=".35"/>
    </svg>
  );
}

/** sunny-meadow */
export function SunnyMeadowIcon({ size = 40, className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" width={size} height={size} fill="none" aria-hidden="true" focusable="false">
      <g opacity=".35"><circle cx="24" cy="26" r="6" fill="currentColor"/><line x1="24" y1="8" x2="24" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="31.5" y1="11" x2="28.5" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="16.5" y1="11" x2="19.5" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></g><path d="M 8 32 Q 16 18 24 16 Q 32 18 40 32 Z" fill="currentColor"/><g opacity=".35"><line x1="14" y1="32" x2="13" y2="28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="16" y1="32" x2="16" y2="28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="18" y1="32" x2="17" y2="28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="30" y1="32" x2="29" y2="28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="32" y1="32" x2="32" y2="28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="34" y1="32" x2="33" y2="28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></g>
    </svg>
  );
}

/** loop-lagoon */
export function LoopLagoonIcon({ size = 40, className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" width={size} height={size} fill="none" aria-hidden="true" focusable="false">
      <path d="M 24 12 A 10 10 0 0 1 34 22 A 10 10 0 0 1 24 32 A 10 10 0 0 1 14 22" stroke="currentColor" fill="none" strokeWidth="3" strokeLinecap="round"/><path d="M 22 12 L 24 9.5 L 26 12" stroke="currentColor" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M 16 36 Q 18 34 20 36" stroke="currentColor" opacity=".35" fill="none" strokeWidth="2" strokeLinecap="round"/><path d="M 28 36 Q 30 34 32 36" stroke="currentColor" opacity=".35" fill="none" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

/** crystal-caves */
export function CrystalCavesIcon({ size = 40, className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" width={size} height={size} fill="none" aria-hidden="true" focusable="false">
      <line x1="8" y1="40" x2="40" y2="40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><path d="M 16 32 L 14 37 L 16 40 L 18 37 L 16 32 Z" fill="currentColor"/><line x1="16" y1="32" x2="16" y2="40" stroke="currentColor" opacity=".35" strokeWidth="1.5"/><path d="M 24 20 L 21 34 L 24 40 L 27 34 L 24 20 Z" fill="currentColor"/><line x1="24" y1="20" x2="24" y2="40" stroke="currentColor" opacity=".35" strokeWidth="1.5"/><path d="M 32 28 L 29 37 L 32 40 L 35 37 L 32 28 Z" fill="currentColor"/><line x1="32" y1="28" x2="32" y2="40" stroke="currentColor" opacity=".35" strokeWidth="1.5"/>
    </svg>
  );
}

/** python-island */
export function PythonIslandIcon({ size = 40, className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" width={size} height={size} fill="none" aria-hidden="true" focusable="false">
      <line x1="8" y1="32" x2="40" y2="32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><line x1="10" y1="32" x2="10" y2="34.5" stroke="currentColor" opacity=".35" strokeWidth="2" strokeLinecap="round"/><line x1="38" y1="32" x2="38" y2="34.5" stroke="currentColor" opacity=".35" strokeWidth="2" strokeLinecap="round"/><path d="M 14 32 Q 14 24 24 21 Q 34 24 34 32 Z" fill="currentColor"/><path d="M 24 21 Q 23.5 16 24 10" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M 24 10 Q 18 8 16 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M 24 10 Q 30 8 32 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M 24 14 Q 18 12 15 16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M 24 14 Q 30 12 33 16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

/** star-station */
export function StarStationIcon({ size = 40, className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" width={size} height={size} fill="none" aria-hidden="true" focusable="false">
      <rect x="16" y="18" width="16" height="16" rx="3" fill="currentColor"/><path d="M16 20l-4-4 M32 20l4-4 M16 34l-4 4 M32 34l4 4" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="36" cy="12" r="2" fill="currentColor"/><circle cx="10" cy="36" r="2" fill="currentColor"/><circle cx="38" cy="36" r="2" fill="currentColor"/>
    </svg>
  );
}

/** trailblazer */
export function TrailblazerIcon({ size = 40, className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" width={size} height={size} fill="none" aria-hidden="true" focusable="false">
      <rect x="18" y="4" width="2.5" height="8" rx="1.2" fill="currentColor"/><rect x="27.5" y="4" width="2.5" height="8" rx="1.2" fill="currentColor"/><circle cx="24" cy="26" r="13" fill="currentColor" opacity=".3"/><circle cx="24" cy="26" r="13" fill="none" stroke="currentColor" strokeWidth="3"/><path d="M19 19v15" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none"/><path d="M20.5 19.5 31 23l-10.5 3.5Z" fill="currentColor"/>
    </svg>
  );
}

/** loop-legend */
export function LoopLegendIcon({ size = 40, className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" width={size} height={size} fill="none" aria-hidden="true" focusable="false">
      <rect x="18" y="4" width="2.5" height="8" rx="1.2" fill="currentColor"/><rect x="27.5" y="4" width="2.5" height="8" rx="1.2" fill="currentColor"/><circle cx="24" cy="26" r="13" fill="currentColor" opacity=".3"/><circle cx="24" cy="26" r="13" fill="none" stroke="currentColor" strokeWidth="3"/><path d="M24 19a7 7 0 1 1-6.4 4.2" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none"/><path d="m20.5 15.5 3.5 3.5-3.5 3.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

/** cave-explorer */
export function CaveExplorerIcon({ size = 40, className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" width={size} height={size} fill="none" aria-hidden="true" focusable="false">
      <rect x="18" y="4" width="2.5" height="8" rx="1.2" fill="currentColor"/><rect x="27.5" y="4" width="2.5" height="8" rx="1.2" fill="currentColor"/><circle cx="24" cy="26" r="13" fill="currentColor" opacity=".3"/><circle cx="24" cy="26" r="13" fill="none" stroke="currentColor" strokeWidth="3"/><path d="M24 17l-5 7 5 10 5-10z" fill="currentColor"/>
    </svg>
  );
}

/** python-pal */
export function PythonPalIcon({ size = 40, className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" width={size} height={size} fill="none" aria-hidden="true" focusable="false">
      <rect x="18" y="4" width="2.5" height="8" rx="1.2" fill="currentColor"/><rect x="27.5" y="4" width="2.5" height="8" rx="1.2" fill="currentColor"/><circle cx="24" cy="26" r="13" fill="currentColor" opacity=".3"/><circle cx="24" cy="26" r="13" fill="none" stroke="currentColor" strokeWidth="3"/><path d="M17.5 22q6.5-5 11 0t-8 6q6.5 3 8-1" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

/** star-coder */
export function StarCoderIcon({ size = 40, className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" width={size} height={size} fill="none" aria-hidden="true" focusable="false">
      <rect x="18" y="4" width="2.5" height="8" rx="1.2" fill="currentColor"/><rect x="27.5" y="4" width="2.5" height="8" rx="1.2" fill="currentColor"/><circle cx="24" cy="26" r="13" fill="currentColor" opacity=".3"/><circle cx="24" cy="26" r="13" fill="none" stroke="currentColor" strokeWidth="3"/><path d="m24 17 2.7 5.7 6.1.8-4.5 4.3 1.1 6.2L24 31l-5.4 3 1.1-6.2-4.5-4.3 6.1-.8z" fill="currentColor"/>
    </svg>
  );
}

/** A world's own picture, by world id (see lib/kids/curriculum.ts). */
export const WORLD_ICON: Record<string, (props: IconProps) => React.JSX.Element> = {
  meadow: SunnyMeadowIcon,
  lagoon: LoopLagoonIcon,
  caves: CrystalCavesIcon,
  island: PythonIslandIcon,
  station: StarStationIcon,
};

/** The medal a world hands out, by world id. */
export const BADGE_ICON: Record<string, (props: IconProps) => React.JSX.Element> = {
  meadow: TrailblazerIcon,
  lagoon: LoopLegendIcon,
  caves: CaveExplorerIcon,
  island: PythonPalIcon,
  station: StarCoderIcon,
};
