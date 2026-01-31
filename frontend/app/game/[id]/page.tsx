"use client";

import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import type { NpcData } from "./components/GameScene";
import {
  getGameState,
  advanceLevel,
  isLevelComplete,
  isGameComplete,
  getTotalLevels,
  getGameConfig,
  NPCS_PER_LEVEL,
  getQuestionFileForNpc,
  getNpcNameFromFile,
  NPC_IDS,
  resetGameState,
} from "./lib/gameState";

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

// Base NPC positions (names will be dynamic based on level)
const NPC_POSITIONS = [
  { id: "red", sprite: "/sprites/characters/red-circle.png", x: 20, y: 25 },
  { id: "blue", sprite: "/sprites/characters/blue-circle.png", x: 80, y: 25 },
  { id: "green", sprite: "/sprites/characters/green-circle.png", x: 20, y: 75 },
  { id: "yellow", sprite: "/sprites/characters/yellow-circle.png", x: 80, y: 75 },
];

export default function GameScreen() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [nearbyNpc, setNearbyNpc] = useState<NpcData | null>(null);
  const [gameState, setGameState] = useState({ level: 1, defeatedNpcs: [] as string[], gameId: id });
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [showGameComplete, setShowGameComplete] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load game state on mount and when returning from NPC battle
  useEffect(() => {
    setMounted(true);
    const state = getGameState(id);
    setGameState(state);

    // Check if level is complete
    if (isLevelComplete(id)) {
      if (isGameComplete(id)) {
        setShowGameComplete(true);
      } else {
        setShowLevelComplete(true);
      }
    }
  }, [id]);

  // Get game config for this game
  const gameConfig = getGameConfig(id);
  const totalLevels = getTotalLevels(id);

  // Get NPC data with names from current level's question files
  const npcs: NpcData[] = mounted
    ? NPC_POSITIONS.map((pos, index) => {
        const npcId = NPC_IDS[index];
        const questionsFile = getQuestionFileForNpc(gameState.level, npcId, id);
        const name = questionsFile ? getNpcNameFromFile(questionsFile) : `Expert ${index + 1}`;
        return { ...pos, name };
      })
    : NPC_POSITIONS.map((pos) => ({ ...pos, name: "Loading..." }));

  const handleNpcInteract = useCallback(
    (npcId: string) => {
      router.push(`/game/${id}/npc/${npcId}`);
    },
    [router, id]
  );

  const handleNearbyNpcChange = useCallback((npc: NpcData | null) => {
    setNearbyNpc(npc);
  }, []);

  const handleAdvanceLevel = useCallback(() => {
    const newState = advanceLevel(id);
    setGameState(newState);
    setShowLevelComplete(false);
  }, [id]);

  const handleRestartGame = useCallback(() => {
    resetGameState(id);
    const newState = getGameState(id);
    setGameState(newState);
    setShowGameComplete(false);
  }, [id]);

  if (!mounted) {
    return (
      <div className="font-pixel flex min-h-screen items-center justify-center bg-[#1a1b26]">
        <p className="text-sm uppercase text-zinc-500">Loading...</p>
      </div>
    );
  }

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
          npcs={npcs}
          collisionJsonPath={COLLISION_JSON}
          onNpcInteract={handleNpcInteract}
          onNearbyNpcChange={handleNearbyNpcChange}
        />
      </div>

      {/* Overlay header */}
      <header className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between bg-zinc-900/90 px-4 py-3 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold uppercase tracking-wide text-white sm:text-lg">
              Level {gameState.level}
            </h1>
            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
              {gameState.defeatedNpcs.length}/{NPCS_PER_LEVEL} Defeated
            </span>
          </div>
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

      {/* Level Complete Modal */}
      {showLevelComplete && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="mx-4 max-w-md rounded-lg border-4 border-amber-500 bg-zinc-900 p-8 text-center shadow-[8px_8px_0_0_rgba(0,0,0,0.5)]">
            <p className="text-2xl font-bold uppercase text-amber-400">Level {gameState.level} Complete!</p>
            <p className="mt-4 text-sm text-zinc-300">
              You defeated all {NPCS_PER_LEVEL} experts!
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              {gameState.level < totalLevels
                ? `Ready for Level ${gameState.level + 1}?`
                : "You've completed all levels!"}
            </p>
            <button
              type="button"
              onClick={handleAdvanceLevel}
              className="mt-6 rounded border-2 border-amber-500 bg-amber-400 px-8 py-3 font-bold uppercase text-black shadow-[3px_3px_0_0_rgba(0,0,0,0.4)] transition hover:bg-amber-300"
            >
              {gameState.level < totalLevels ? `Start Level ${gameState.level + 1}` : "Continue"}
            </button>
          </div>
        </div>
      )}

      {/* Game Complete Modal */}
      {showGameComplete && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="mx-4 max-w-md rounded-lg border-4 border-green-500 bg-zinc-900 p-8 text-center shadow-[8px_8px_0_0_rgba(0,0,0,0.5)]">
            <p className="text-2xl font-bold uppercase text-green-400">Congratulations!</p>
            <p className="mt-4 text-sm text-zinc-300">
              You completed all {totalLevels} levels!
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              {gameConfig.completionMessage}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={handleRestartGame}
                className="rounded border-2 border-amber-500 bg-amber-400 px-6 py-3 font-bold uppercase text-black shadow-[3px_3px_0_0_rgba(0,0,0,0.4)] transition hover:bg-amber-300"
              >
                Play Again
              </button>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="rounded border-2 border-zinc-600 bg-zinc-700 px-6 py-3 font-bold uppercase text-white shadow-[3px_3px_0_0_rgba(0,0,0,0.4)] transition hover:bg-zinc-600"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
