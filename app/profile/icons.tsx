// Line icons for the profile page, drawn on one 24px grid and stroked in
// currentColor so each takes the colour of whatever holds it.

type IconProps = { className?: string };

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const icon = (paths: string[]) =>
  function Icon({ className }: IconProps) {
    return (
      <svg {...base} className={className}>
        {paths.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    );
  };

export const IconMail = icon(["M3.5 6.5h17v11h-17z", "m4 7 8 6 8-6"]);
export const IconCalendar = icon(["M4 6h16v14H4z", "M4 10h16", "M8 3.5v4", "M16 3.5v4"]);
export const IconHome = icon(["M4 11 12 4l8 7", "M6 9.5V20h12V9.5"]);
export const IconUser = icon(["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M4.5 20.5c.7-3.6 3.7-5.5 7.5-5.5s6.8 1.9 7.5 5.5"]);
export const IconShield = icon(["M12 3 5 6v5.5c0 4.4 3 7.9 7 9.5 4-1.6 7-5.1 7-9.5V6z"]);
export const IconShieldCheck = icon(["M12 3 5 6v5.5c0 4.4 3 7.9 7 9.5 4-1.6 7-5.1 7-9.5V6z", "m9 12 2.2 2.2L15.5 10"]);
export const IconCheck = icon(["m5 12.5 4.5 4.5L19 7.5"]);
export const IconTrophy = icon(["M7 4h10v5a5 5 0 0 1-10 0z", "M7 5H4a3 3 0 0 0 3 5.5M17 5h3a3 3 0 0 1-3 5.5", "M12 14v3", "M8.5 21h7", "M9.5 17.6h5l.7 3.4H8.8z"]);
export const IconTarget = icon(["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z", "M12 12h.01"]);
export const IconGem = icon(["M6 4h12l4 5-10 12L2 9z", "M2 9h20", "M12 21 8.5 9 12 4l3.5 5z"]);
export const IconCode = icon(["m8 7-5 5 5 5", "m16 7 5 5-5 5"]);
export const IconStar = icon(["m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"]);
export const IconFlame = icon(["M12 21c3.9 0 6.5-2.6 6.5-6.2 0-3.4-2.3-5.6-3.8-7.3-.3 1.9-1.3 3.2-2.6 3.8C12.6 8 11.4 5.2 8.6 3c.2 3-1.4 4.8-2.6 6.4A7.6 7.6 0 0 0 5.5 14.8C5.5 18.4 8.1 21 12 21Z"]);
export const IconBolt = icon(["M13 2.5 5 13.5h6l-1 8 8-11h-6z"]);
export const IconDoc = icon(["M6 3h8l4 4v14H6z", "M14 3v4h4", "M9 12h6", "M9 16h6"]);
export const IconBulb = icon(["M9 18h6", "M10 21h4", "M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3Z"]);
export const IconCompass = icon(["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "m15.5 8.5-2 5-5 2 2-5z"]);
export const IconArrowRight = icon(["M5 12h14", "m13 6 6 6-6 6"]);
export const IconInfo = icon(["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M12 11v5", "M12 7.8h.01"]);
export const IconPlus = icon(["M12 5v14", "M5 12h14"]);
export const IconKey = icon(["M14.5 9.5a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z", "m13.2 12.8 7.3 7.2", "m17.5 17 2-2", "m15.5 15 1.5-1.5"]);
