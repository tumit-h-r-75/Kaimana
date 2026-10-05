import type { Metadata } from "next";

export const metadata: Metadata = { title: "Solve a problem", alternates: { canonical: null }, robots: { index: false, follow: true } };

export default function ProblemWorkspaceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
