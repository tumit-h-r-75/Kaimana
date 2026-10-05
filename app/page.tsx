import { SiteHeader } from "./_components/home/SiteHeader";
import { SiteFooter } from "./_components/home/SiteFooter";
import { Hero } from "./_components/home/Hero";
import { Loop } from "./_components/home/Loop";
import { Coach } from "./_components/home/Coach";
import { Arena } from "./_components/home/Arena";
import { LearningSection } from "./_components/home/LearningSection";
import { Faq } from "./_components/home/Faq";
import { Cta } from "./_components/home/Cta";
import type { Metadata } from "next";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function HomePage() {
  return (
    <main>
      <SiteHeader />
      <Hero />
      <Loop />
      <Coach />
      <LearningSection />
      <Arena />
      <Faq />
      <Cta />
      <SiteFooter />
    </main>
  );
}
