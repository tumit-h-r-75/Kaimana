import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kaimana | Build your coding edge",
  description: "Practice problems, compete in live contests, and grow with Kaimana.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
