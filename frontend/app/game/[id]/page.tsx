"use client";

import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import type { NpcData } from "./components/GameScene";
import { useSettings } from "@/contexts/SettingsContext";
import { SettingsModal, SettingsButton, MusicToggleButton } from "@/components/SettingsModal";
import {
  getGameState,
  advanceLevel,
  isLevelComplete,
  isGameComplete,
  isGameCompleteAsync,
  getTotalLevels,
  getTotalLevelsAsync,
  getGameConfig,
  getGameConfigAsync,
  isUserCreatedGame,
  fetchChapterNames,
  NPCS_PER_LEVEL,
  getQuestionFileForNpc,
  getNpcNameFromFileAsync,
  NPC_IDS,
  resetGameState,
  type GameConfig,
  type NpcId,
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
const PLAYER_SPRITE = "/sprites/characters/player-spritesheet.png";
const PLAYER_SPRITE_CONFIG = {
  frameWidth: 64,
  frameHeight: 64,
  frameCount: 16,
  animationFrameRate: 8, // 8 fps for smooth walking
  directional: true,
  framesPerDirection: 4,
  scale: 1.5, // Scale up slightly for visibility
};
// Use Tiled JSON (supports both Tiled format and custom format)
const COLLISION_JSON = "/maps/Sample1.json";

// Base NPC positions with spritesheet configs (names will be dynamic based on level)
const NPC_POSITIONS = [
  { 
    id: "red", 
    sprite: "/sprites/characters/wizard-spritesheet.png", 
    spriteConfig: { frameWidth: 274, frameHeight: 303, frameCount: 3, animationFrameRate: 1.5, animationDelay: 0 },
    x: 20, 
    y: 25, 
    scale: 0.25 
  },
  { 
    id: "blue", 
    sprite: "/sprites/characters/critical-thinking-spritesheet.png", 
    spriteConfig: { frameWidth: 364, frameHeight: 310, frameCount: 2, animationFrameRate: 2.2, animationDelay: 250 },
    x: 80, 
    y: 25, 
    scale: 0.25 
  },
  { 
    id: "green", 
    sprite: "/sprites/characters/conceptual-understanding-spritesheet.png", 
    spriteConfig: { frameWidth: 358, frameHeight: 332, frameCount: 2, animationFrameRate: 1.8, animationDelay: 500 },
    x: 20, 
    y: 75, 
    scale: 0.25 
  },
  { 
    id: "yellow", 
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
  const [gameState, setGameState] = useState({ level: 1, defeatedNpcs: [] as string[], gameId: id });
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [showGameComplete, setShowGameComplete] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [totalLevels, setTotalLevels] = useState(1);
  const [npcNames, setNpcNames] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [musicUrl, setMusicUrl] = useState<string | undefined>(undefined);
  
  const { settings } = useSettings();

  // Music URLs for built-in games
  const BUILTIN_MUSIC: Record<string, string> = {
    "1": "/music/huberman.mp3",
    "2": "/music/psychology-of-money.mp3",
    "3": "/music/learning-cursor.mp3",
  };

  // Load music URL for the game
  const loadMusicUrl = async (gameId: string) => {
    // Check if it's a built-in game
    if (BUILTIN_MUSIC[gameId]) {
      setMusicUrl(BUILTIN_MUSIC[gameId]);
      return;
    }

    // For user-created games, check if music exists
    if (isUserCreatedGame(gameId)) {
      try {
        const response = await fetch(`/api/music/generate?gameId=${gameId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.hasMusic && data.musicUrl) {
            setMusicUrl(data.musicUrl);
          }
        }
      } catch (error) {
        console.error("Failed to load music URL:", error);
      }
    }
  };

  // Load NPC names for current level
  const loadNpcNamesForLevel = async (gameId: string, level: number) => {
    if (isUserCreatedGame(gameId)) {
      // For user-created games, fetch chapter names from API
      const chapterNames = await fetchChapterNames(gameId);
      setNpcNames(chapterNames);
    } else {
      // For built-in games, fetch names from JSON files (extracts topic from title)
      const names: string[] = [];
      for (let i = 0; i < NPC_IDS.length; i++) {
        const npcId = NPC_IDS[i];
        const questionsFile = getQuestionFileForNpc(level, npcId, gameId);
        if (questionsFile) {
          const name = await getNpcNameFromFileAsync(questionsFile);
          names.push(name);
        } else {
          names.push(`Expert ${i + 1}`);
        }
      }
      setNpcNames(names);
    }
  };

  // Load game state on mount and when returning from NPC battle
  useEffect(() => {
    async function initGame() {
      setMounted(true);
      const state = getGameState(id);
      setGameState(state);

      // Load game config (async for user-created games)
      const config = await getGameConfigAsync(id);
      setGameConfig(config);
      
      const levels = await getTotalLevelsAsync(id);
      setTotalLevels(levels);

      // Load NPC names for current level
      await loadNpcNamesForLevel(id, state.level);

      // Load music URL
      loadMusicUrl(id);

      // Check if level is complete
      if (isLevelComplete(id)) {
        const complete = await isGameCompleteAsync(id);
        if (complete) {
          setShowGameComplete(true);
        } else {
          setShowLevelComplete(true);
        }
      }
    }
    
    initGame();
  }, [id]);

  // Get NPC data with names from current level's question files
  const npcs: NpcData[] = mounted
    ? NPC_POSITIONS.map((pos, index) => {
        // For user-created games, use chapter index; for built-in, use NPC index directly
        const nameIndex = isUserCreatedGame(id) 
          ? (gameState.level - 1) * NPCS_PER_LEVEL + index 
          : index;
        
        let name = npcNames[nameIndex] || `Expert ${index + 1}`;
        if (name.length > 25) {
          name = name.substring(0, 22) + "...";
        }
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

  const handleAdvanceLevel = useCallback(async () => {
    const newState = advanceLevel(id);
    setGameState(newState);
    setShowLevelComplete(false);
    // Reload NPC names for the new level
    await loadNpcNamesForLevel(id, newState.level);
  }, [id, loadNpcNamesForLevel]);

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
          playerSpriteConfig={PLAYER_SPRITE_CONFIG}
          npcs={npcs}
          collisionJsonPath={COLLISION_JSON}
          onNpcInteract={handleNpcInteract}
          onNearbyNpcChange={handleNearbyNpcChange}
          musicUrl={musicUrl}
          currentLevel={gameState.level}
          audioSettings={settings}
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
              <span className="text-amber-400"> · Press Enter to talk about {nearbyNpc.name}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MusicToggleButton />
          <SettingsButton onClick={() => setShowSettings(true)} />
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-none border-2 border-zinc-600 bg-zinc-800 px-4 py-2 text-xs font-bold uppercase text-white transition hover:border-amber-400/60 hover:bg-zinc-700"
          >
            ← Back
          </button>
        </div>
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
              {gameConfig?.completionMessage || "Great job completing this game!"}
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

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
