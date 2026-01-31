"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

const NPCS: Record<string, { name: string; sprite: string }> = {
  red: { name: "Red", sprite: "/sprites/characters/red-circle.png" },
  blue: { name: "Blue", sprite: "/sprites/characters/blue-circle.png" },
  green: { name: "Green", sprite: "/sprites/characters/green-circle.png" },
  yellow: { name: "Yellow", sprite: "/sprites/characters/yellow-circle.png" },
};

export default function NpcInteractionPage() {
  const params = useParams();
  const id = params.id as string;
  const npcId = params.npcId as string;
  const npc = NPCS[npcId] ?? { name: "Unknown", sprite: "" };

  return (
    <div
      className="font-pixel min-h-screen bg-[#1a1b26] text-zinc-100"
      style={{ imageRendering: "pixelated" }}
    >
      <div className="mx-auto max-w-2xl px-6 py-10">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-lg font-bold uppercase tracking-wide text-white">
            Talk to {npc.name}
          </h1>
          <Link
            href={`/game/${id}`}
            className="rounded-none border-2 border-zinc-600 bg-zinc-800 px-4 py-2 text-xs font-bold uppercase text-white transition hover:border-amber-400/60 hover:bg-zinc-700"
          >
            ← Back to map
          </Link>
        </header>

        <section className="rounded-none border-2 border-zinc-600 bg-zinc-800 p-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            {npc?.sprite && (
              <div className="shrink-0">
                <Image
                  src={npc.sprite}
                  alt={npc.name}
                  width={64}
                  height={64}
                  style={{ imageRendering: "pixelated" }}
                  unoptimized
                />
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm text-zinc-300">
                You are now talking with <strong className="text-white">{npc.name}</strong>.
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                This is the interaction page. Add dialog, quests, or other content here.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
