"use client";

import { useParams } from "next/navigation";
import DialoguePage from "../../components/dialogue";

// NPC data with sprite sheet positions (column, row for sprite sheet)
const NPCS: Record<string, { name: string; spriteCol: number; spriteRow: number }> = {
  red: { name: "Elena Verna", spriteCol: 2, spriteRow: 0 },
  blue: { name: "Kyle Poyar", spriteCol: 3, spriteRow: 0 },
  green: { name: "Leah Tharin", spriteCol: 4, spriteRow: 0 },
  yellow: { name: "Wes Bush", spriteCol: 5, spriteRow: 0 },
};

export default function NpcInteractionPage() {
  const params = useParams();
  const id = params.id as string;
  const npcId = params.npcId as string;
  const npc = NPCS[npcId] ?? { name: "Unknown NPC", spriteCol: 0, spriteRow: 0 };

  return (
    <DialoguePage
      gameId={id}
      npcName={npc.name}
      npcSpriteCol={npc.spriteCol}
      npcSpriteRow={npc.spriteRow}
    />
  );
}
