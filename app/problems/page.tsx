import { Suspense } from "react";
import { SiteHeader } from "@/app/_components/home/SiteHeader";
import { SiteFooter } from "@/app/_components/home/SiteFooter";
import { PageSkeleton } from "@/components/ui/Loader";
import { getPublicProblems } from "@/lib/api/public-problems";
import ProblemsContent from "./ProblemsContent";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ProblemsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const stringValue = (key: string) =>
    typeof params[key] === "string" ? (params[key] as string) : "";
  const query = stringValue("q");
  const rawDifficulty = stringValue("difficulty");
  const difficulty = ["EASY", "MEDIUM", "HARD"].includes(rawDifficulty)
    ? rawDifficulty
    : null;
  const topic = stringValue("topic") || null;
  const rawPage = Number(stringValue("page"));
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;
  const initialQuery = JSON.stringify([query, difficulty, topic, page]);
  return (
    <>
      <SiteHeader />
      <Suspense fallback={<PageSkeleton />}>
        <Catalogue
          query={query}
          difficulty={difficulty}
          topic={topic}
          page={page}
          initialQuery={initialQuery}
        />
      </Suspense>
      <SiteFooter />
    </>
  );
}

async function Catalogue({
  query,
  difficulty,
  topic,
  page,
  initialQuery,
}: {
  query: string;
  difficulty: string | null;
  topic: string | null;
  page: number;
  initialQuery: string;
}) {
  const initialResult = await getPublicProblems({
    search: query,
    difficulty: difficulty ?? undefined,
    tags: topic ?? undefined,
    page,
    limit: 20,
  });
  return (
    <ProblemsContent
      initialResult={initialResult}
      initialQuery={initialQuery}
    />
  );
}
