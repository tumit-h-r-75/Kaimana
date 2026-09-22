// Each judged language's own mark, drawn small, so a list of languages reads
// at a glance. Used by the footer, the submission history and the community.

export type LanguageKey = "python" | "cpp" | "javascript" | "typescript";

export const LANGUAGE_NAME: Record<LanguageKey, string> = {
  python: "Python",
  cpp: "C++",
  javascript: "JavaScript",
  typescript: "TypeScript",
};

export function LanguageMark({ language, className }: { language: string; className?: string }) {
  switch (language) {
    case "python":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path fill="#4B8BBE" d="M11.9 2C7 2 7.3 4.1 7.3 4.1v2.2h4.7V7H5.4S2 6.6 2 11.9s2.9 5.1 2.9 5.1h1.8v-2.5s-.1-2.9 2.9-2.9h4.9s2.8 0 2.8-2.7V4.7S17.7 2 11.9 2Zm-2.7 1.6a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8Z" />
          <path fill="#FFD43B" d="M12.1 22c4.9 0 4.6-2.1 4.6-2.1v-2.2H12V17h6.6s3.4.4 3.4-4.9-2.9-5.1-2.9-5.1h-1.8v2.5s.1 2.9-2.9 2.9H9.5s-2.8 0-2.8 2.7v4.2S6.3 22 12.1 22Zm2.7-1.6a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8Z" />
        </svg>
      );
    case "cpp":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path fill="#3F7FC1" d="M12 1.8 21 7v10l-9 5.2L3 17V7z" />
          <text x="12" y="15.6" fill="#fff" fontSize="8.4" fontWeight="700" textAnchor="middle" fontFamily="Inter, Arial, sans-serif">
            C++
          </text>
        </svg>
      );
    case "javascript":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="3" fill="#F0DB4F" />
          <text x="19" y="19" fill="#1A1A1A" fontSize="9" fontWeight="800" textAnchor="end" fontFamily="Inter, Arial, sans-serif">
            JS
          </text>
        </svg>
      );
    case "typescript":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="3" fill="#3178C6" />
          <text x="19" y="19" fill="#fff" fontSize="9" fontWeight="800" textAnchor="end" fontFamily="Inter, Arial, sans-serif">
            TS
          </text>
        </svg>
      );
    default:
      return null;
  }
}
