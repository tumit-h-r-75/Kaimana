import { SiteHeader } from "./_components/home/SiteHeader";
import { SiteFooter } from "./_components/home/SiteFooter";
import { Hero } from "./_components/home/Hero";
import { Loop } from "./_components/home/Loop";
import { Coach } from "./_components/home/Coach";
import { Arena } from "./_components/home/Arena";
import { Facets } from "./_components/home/Facets";
import { Faq } from "./_components/home/Faq";
import { Cta } from "./_components/home/Cta";

/**
 * The homepage, in seven sections.
 *
 * The order follows the argument rather than a feature list: what this is,
 * the loop it puts you in, the one thing nothing else on the page can stand
 * in for, the reason to come back on a Saturday, the rooms beyond the
 * problem list, the questions that stop people signing up, and the ask.
 *
 * Every visual is drawn from the design tokens. The previous version leaned
 * on five stock photographs, which carried most of the page's weight, said
 * nothing their headings did not, and pulled four unrelated colour schemes
 * onto a page built around a single accent.
 */
export default function HomePage() {
  return (
    <main>
      <SiteHeader />

      {/* 1 */} <Hero />
      {/* 2 */} <Loop />
      {/* 3 */} <Coach />
      {/* 4 */} <Arena />
      {/* 5 */} <Facets />
      {/* 6 */} <Faq />
      {/* 7 */} <Cta />

      <SiteFooter />
    </main>
  );
}
