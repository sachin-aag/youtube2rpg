"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import DialoguePage from "../../components/dialogue";
import {
  getGameState,
  getQuestionFileForNpc,
  getNpcNameAsync,
  getGameConfigAsync,
  isUserCreatedGame,
  NPC_IDS,
  type NpcId,
} from "../../lib/gameState";

// NPC data with spritesheet info for dialogue
interface NpcDialogueData {
  name: string;
  sprite: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
}

const NPCS: Record<string, NpcDialogueData> = {
  red: { 
    name: "Wizard", 
    sprite: "/sprites/characters/wizard-spritesheet.png",
    frameWidth: 274,
    frameHeight: 303,
    frameCount: 3,
  },
  blue: { 
    name: "Critical Thinking", 
    sprite: "/sprites/characters/critical-thinking-spritesheet.png",
    frameWidth: 364,
    frameHeight: 310,
    frameCount: 2,
  },
  green: { 
    name: "Conceptual Understanding", 
    sprite: "/sprites/characters/conceptual-understanding-spritesheet.png",
    frameWidth: 358,
    frameHeight: 332,
    frameCount: 2,
  },
  yellow: { 
    name: "Procedural Skills", 
    sprite: "/sprites/characters/procedural-skills-spritesheet.png",
    frameWidth: 346,
    frameHeight: 356,
    frameCount: 2,
  },
};

// Player spritesheet info
const PLAYER_SPRITE = {
  sprite: "/sprites/characters/player-spritesheet.png",
  frameWidth: 64,
  frameHeight: 64,
  backFrameIndex: 12, // First frame of "walk up" row (back view)
};

export default function NpcInteractionPage() {
  const params = useParams();
  const gameId = params.id as string;
  const npcIdParam = params.npcId as string;
  const [mounted, setMounted] = useState(false);
  const [gameState, setGameState] = useState({ level: 1, defeatedNpcs: [] as NpcId[], gameId });
  const [npcName, setNpcName] = useState("Loading...");
  const [gameName, setGameName] = useState("Game");
  const [questionsFile, setQuestionsFile] = useState<string | null>(null);

  // Validate npcId
  const npcId: NpcId = NPC_IDS.includes(npcIdParam as NpcId) 
    ? (npcIdParam as NpcId) 
    : "red"; // fallback

  // Get sprite data for the NPC
  const npcSpriteData = NPCS[npcId] ?? NPCS.red;

  useEffect(() => {
    setMounted(true);
    const state = getGameState(gameId);
    setGameState(state);
    
    // Load game name and NPC data
    async function loadData() {
      // Load game config for title
      const config = await getGameConfigAsync(gameId);
      setGameName(config.title);
      
      // Fetch NPC name from JSON title (works for both built-in and user-created games)
      const name = await getNpcNameAsync(state.level, npcId, gameId);
      setNpcName(name);
      
      if (isUserCreatedGame(gameId)) {
        // For user-created games, questionsFile stays null - dialogue component will fetch from API
        setQuestionsFile(null);
      } else {
        // For built-in games, set the question file path
        const file = getQuestionFileForNpc(state.level, npcId, gameId);
        setQuestionsFile(file);
      }
    }
    
    loadData();
  }, [gameId, npcId]);

  const isDefeated = gameState.defeatedNpcs.includes(npcId);

  if (!mounted) {
    return (
      <div className="font-pixel flex min-h-screen items-center justify-center bg-[#5a9c4a]">
        <p className="text-sm uppercase text-white">Loading...</p>
      </div>
    );
  }

  return (
    <DialoguePage
      gameId={gameId}
      gameName={gameName}
      npcId={npcId}
      npcName={npcName}
      npcSprite={npcSpriteData.sprite}
      npcFrameWidth={npcSpriteData.frameWidth}
      npcFrameHeight={npcSpriteData.frameHeight}
      npcFrameCount={npcSpriteData.frameCount}
      playerSprite={PLAYER_SPRITE.sprite}
      playerFrameWidth={PLAYER_SPRITE.frameWidth}
      playerFrameHeight={PLAYER_SPRITE.frameHeight}
      playerFrameIndex={PLAYER_SPRITE.backFrameIndex}
      questionsFile={questionsFile || ""}
      isAlreadyDefeated={isDefeated}
      currentLevel={gameState.level}
      isUserCreatedGame={isUserCreatedGame(gameId)}
    />
  );
}
