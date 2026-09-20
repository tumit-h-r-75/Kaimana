import ProblemList from "@/components/problems/ProblemList";
import NextUpCard from "@/components/problems/NextUpCard";
import { SiteHeader } from "@/app/_components/home/SiteHeader";
import { SiteFooter } from "@/app/_components/home/SiteFooter";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function ProblemsPage() {
  return (
    <ProtectedRoute>
      <SiteHeader />
      <main className="section-shell workspace">
        <section>
          <p className="eyebrow">
            <b />
            PROBLEM SET
          </p>
          <h1>Pick a problem to solve.</h1>
          <p>Filter by difficulty or search by title. Solved problems are marked once you get an Accepted verdict.</p>
        </section>
        <NextUpCard />
        <ProblemList />
      </main>
      <SiteFooter />
    </ProtectedRoute>
  );
}
