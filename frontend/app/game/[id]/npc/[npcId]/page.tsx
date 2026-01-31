"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import DialoguePage from "../../components/dialogue";
import {
  getGameState,
  getQuestionFileForNpc,
  getNpcNameFromFile,
  NPC_IDS,
  type NpcId,
} from "../../lib/gameState";

export default function NpcInteractionPage() {
  const params = useParams();
  const gameId = params.id as string;
  const npcIdParam = params.npcId as string;
  const [mounted, setMounted] = useState(false);
  const [gameState, setGameState] = useState({ level: 1, defeatedNpcs: [] as NpcId[], gameId });

  // Validate npcId
  const npcId: NpcId = NPC_IDS.includes(npcIdParam as NpcId) 
    ? (npcIdParam as NpcId) 
    : "red"; // fallback

  useEffect(() => {
    setMounted(true);
    setGameState(getGameState(gameId));
  }, [gameId]);

  // Compute derived values only after mount
  const { questionsFile, npcName, isDefeated } = useMemo(() => {
    const file = getQuestionFileForNpc(gameState.level, npcId);
    const name = getNpcNameFromFile(file);
    const defeated = gameState.defeatedNpcs.includes(npcId);
    return { questionsFile: file, npcName: name, isDefeated: defeated };
  }, [npcId, gameState.level, gameState.defeatedNpcs]);

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
    />
  );
}
