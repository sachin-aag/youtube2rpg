"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import DialoguePage from "../../components/dialogue";
import {
  getGameState,
  getQuestionFileForNpc,
  getNpcNameFromFile,
  getNpcNameAsync,
  isUserCreatedGame,
  NPC_IDS,
  type NpcId,
} from "../../lib/gameState";

export default function NpcInteractionPage() {
  const params = useParams();
  const gameId = params.id as string;
  const npcIdParam = params.npcId as string;
  const [mounted, setMounted] = useState(false);
  const [gameState, setGameState] = useState({ level: 1, defeatedNpcs: [] as NpcId[], gameId });
  const [npcName, setNpcName] = useState("Loading...");
  const [questionsFile, setQuestionsFile] = useState<string | null>(null);

  // Validate npcId
  const npcId: NpcId = NPC_IDS.includes(npcIdParam as NpcId) 
    ? (npcIdParam as NpcId) 
    : "red"; // fallback

  useEffect(() => {
    setMounted(true);
    const state = getGameState(gameId);
    setGameState(state);
    
    // Load NPC name (async for user-created games)
    async function loadNpcData() {
      if (isUserCreatedGame(gameId)) {
        // For user-created games, fetch name from API
        const name = await getNpcNameAsync(state.level, npcId, gameId);
        setNpcName(name);
        // questionsFile stays null - dialogue component will fetch from API
        setQuestionsFile(null);
      } else {
        // For built-in games, use static question files
        const file = getQuestionFileForNpc(state.level, npcId, gameId);
        setQuestionsFile(file);
        setNpcName(getNpcNameFromFile(file));
      }
    }
    
    loadNpcData();
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
      npcId={npcId}
      npcName={npcName}
      questionsFile={questionsFile || ""}
      isAlreadyDefeated={isDefeated}
      currentLevel={gameState.level}
      isUserCreatedGame={isUserCreatedGame(gameId)}
    />
  );
}
