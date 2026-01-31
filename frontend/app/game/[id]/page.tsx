"use client";

import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { NpcData } from "./components/GameScene";

// Dynamically import PhaserGame to avoid SSR issues
const PhaserGame = dynamic(() => import("./components/PhaserGame"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[calc(100vh-60px)] items-center justify-center bg-[#1a1b26]">
      <p className="font-pixel text-sm uppercase text-zinc-500">Loading game engine...</p>
    </div>
  ),
});

const MAP_IMAGE = "/sprites/map/Sample1.png";
const PLAYER_SPRITE = "/sprites/characters/black-circle.png";
// Use Tiled JSON (supports both Tiled format and custom format)
const COLLISION_JSON = "/maps/Sample1.json";

const NPCS: NpcData[] = [
  { 
    id: "red", 
    name: "Wizard", 
    sprite: "/sprites/characters/wizard-spritesheet.png", 
    spriteConfig: { frameWidth: 274, frameHeight: 303, frameCount: 3, animationFrameRate: 1.5, animationDelay: 0 },
    x: 20, 
    y: 25, 
    scale: 0.25 
  },
  { 
    id: "blue", 
    name: "Critical Thinking", 
    sprite: "/sprites/characters/critical-thinking-spritesheet.png", 
    spriteConfig: { frameWidth: 364, frameHeight: 310, frameCount: 2, animationFrameRate: 2.2, animationDelay: 250 },
    x: 80, 
    y: 25, 
    scale: 0.25 
  },
  { 
    id: "green", 
    name: "Conceptual Understanding", 
    sprite: "/sprites/characters/conceptual-understanding-spritesheet.png", 
    spriteConfig: { frameWidth: 358, frameHeight: 332, frameCount: 2, animationFrameRate: 1.8, animationDelay: 500 },
    x: 20, 
    y: 75, 
    scale: 0.25 
  },
  { 
    id: "yellow", 
    name: "Procedural Skills", 
    sprite: "/sprites/characters/procedural-skills-spritesheet.png", 
    spriteConfig: { frameWidth: 346, frameHeight: 356, frameCount: 2, animationFrameRate: 2.5, animationDelay: 150 },
    x: 80, 
    y: 75, 
    scale: 0.25 
  },
];

export default function GameScreen() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [nearbyNpc, setNearbyNpc] = useState<NpcData | null>(null);

  const handleNpcInteract = useCallback(
    (npcId: string) => {
      router.push(`/game/${id}/npc/${npcId}`);
    },
    [router, id]
  );

  const handleNearbyNpcChange = useCallback((npc: NpcData | null) => {
    setNearbyNpc(npc);
  }, []);

  return (
    <div
      className="font-pixel relative min-h-screen overflow-hidden bg-[#1a1b26] text-zinc-100"
      style={{ imageRendering: "pixelated" }}
    >
      {/* Phaser Game Canvas */}
      <div className="absolute inset-0 pt-[60px]">
        <PhaserGame
          gameId={id}
          mapImage={MAP_IMAGE}
          playerSprite={PLAYER_SPRITE}
          npcs={NPCS}
          collisionJsonPath={COLLISION_JSON}
          onNpcInteract={handleNpcInteract}
          onNearbyNpcChange={handleNearbyNpcChange}
        />
      </div>

      {/* Overlay header */}
      <header className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between bg-zinc-900/90 px-4 py-3 backdrop-blur-sm">
        <div>
          <h1 className="text-sm font-bold uppercase tracking-wide text-white sm:text-lg">
            Episode {id} — Explore
          </h1>
          <p className="mt-0.5 text-[10px] text-zinc-500">
            Arrow keys or WASD to move
            {nearbyNpc && (
              <span className="text-amber-400"> · Press Enter to talk to {nearbyNpc.name}</span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-none border-2 border-zinc-600 bg-zinc-800 px-4 py-2 text-xs font-bold uppercase text-white transition hover:border-amber-400/60 hover:bg-zinc-700"
        >
          ← Back
        </button>
      </header>
    </div>
  );
}
