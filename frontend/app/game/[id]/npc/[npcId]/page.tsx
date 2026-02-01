"use client";

import { useParams } from "next/navigation";
import DialoguePage from "../../components/dialogue";

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
  const id = params.id as string;
  const npcId = params.npcId as string;
  const npc = NPCS[npcId] ?? { 
    name: "Unknown NPC", 
    sprite: "/sprites/characters/wizard-spritesheet.png",
    frameWidth: 274,
    frameHeight: 303,
    frameCount: 3,
  };

  return (
    <DialoguePage
      gameId={id}
      npcName={npc.name}
      npcSprite={npc.sprite}
      npcFrameWidth={npc.frameWidth}
      npcFrameHeight={npc.frameHeight}
      npcFrameCount={npc.frameCount}
      playerSprite={PLAYER_SPRITE.sprite}
      playerFrameWidth={PLAYER_SPRITE.frameWidth}
      playerFrameHeight={PLAYER_SPRITE.frameHeight}
      playerFrameIndex={PLAYER_SPRITE.backFrameIndex}
    />
  );
}
