import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kaimana | Build your coding edge",
  description: "Practice problems, compete in live contests, and grow with Kaimana.",
  applicationName: "Kaimana",
  icons: { icon: "/icon.svg" },
  keywords: ["coding practice", "programming contests", "algorithm problems"],
  openGraph: {
    title: "Kaimana | Build your coding edge",
    description: "Practice problems, compete in live contests, and grow with Kaimana.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
