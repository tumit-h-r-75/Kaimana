import { SiteHeader } from "./_components/home/SiteHeader";
import { SiteFooter } from "./_components/home/SiteFooter";
import { HomeHero } from "./_components/home/HomeHero";
import { ProofBand } from "./_components/home/ProofBand";
import { FeatureBento } from "./_components/home/FeatureBento";
import { WorkspaceShowcase } from "./_components/home/WorkspaceShowcase";
import { HowItWorks } from "./_components/home/HowItWorks";
import { ModeFacets } from "./_components/home/ModeFacets";
import { HomeFaq } from "./_components/home/HomeFaq";
import { CallToAction } from "./_components/home/CallToAction";

/**
 * The homepage, in eight sections: the promise, what you can practise, what
 * the platform does for you, the workspace it does it in, the loop you
 * repeat, the other facets, the questions people ask, and the ask.
 */
export default function HomePage() {
  return (
    <main>
      <SiteHeader />

      {/* 1 */} <HomeHero />
      {/* 2 */} <ProofBand />
      {/* 3 */} <FeatureBento />
      {/* 4 */} <WorkspaceShowcase />
      {/* 5 */} <HowItWorks />
      {/* 6 */} <ModeFacets />
      {/* 7 */} <HomeFaq />
      {/* 8 */} <CallToAction />

      <SiteFooter />
    </main>
  );
}
