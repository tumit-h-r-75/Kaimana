import { notFound } from "next/navigation";
import { WORLDS } from "@/lib/kids/curriculum";
import { KidsShell } from "@/components/kids/KidsShell";
import { WorldScreen } from "@/components/kids/world/WorldScreen";

// One world's own page. It used to redirect to /kids#world-x, which meant a
// world had no address worth sharing and nowhere to say what it teaches.
export default async function KidsWorldPage({ params }: { params: Promise<{ worldId: string }> }) {
  const { worldId } = await params;
  if (!WORLDS.some((world) => world.id === worldId)) notFound();

  return (
    <KidsShell>
      <WorldScreen worldId={worldId} />
    </KidsShell>
  );
}

export function generateStaticParams() {
  return WORLDS.map((world) => ({ worldId: world.id }));
}
