import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coding problems & algorithm practice",
  description: "Browse coding challenges by topic and difficulty. Practise Python, C++, JavaScript and TypeScript with a real judge and AI feedback.",
  alternates: { canonical: "/problems" },
};

export default function ProblemsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
