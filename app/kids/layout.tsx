import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coding for Kids",
  description:
    "A guided coding course for ages 8–14. Learn sequences, loops and conditions through visual puzzles, then write real Python programs.",
};

export default function KidsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
