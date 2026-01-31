"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { GameScene, type GameSceneConfig, type NpcData } from "./GameScene";

interface PhaserGameProps {
  gameId: string;
  mapImage: string;
  playerSprite: string;
  npcs: NpcData[];
  collisionJsonPath?: string;
  onNpcInteract: (npcId: string) => void;
  onNearbyNpcChange?: (npc: NpcData | null) => void;
}

export default function PhaserGame({
  gameId,
  mapImage,
  playerSprite,
  npcs,
  collisionJsonPath,
  onNpcInteract,
  onNearbyNpcChange,
}: PhaserGameProps) {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<GameScene | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Poll for nearby NPC changes
  useEffect(() => {
    if (!onNearbyNpcChange) return;

    const interval = setInterval(() => {
      if (sceneRef.current) {
        const nearbyNpc = sceneRef.current.getNearbyNpc();
        onNearbyNpcChange(nearbyNpc);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [onNearbyNpcChange]);

  useEffect(() => {
    if (typeof window === "undefined" || !gameContainerRef.current) return;

    // Dynamically import Phaser (client-side only)
    import("phaser").then((Phaser) => {
      if (gameRef.current) return; // Already initialized

      const container = gameContainerRef.current;
      if (!container) return;

      const { width, height } = container.getBoundingClientRect();

      const sceneConfig: GameSceneConfig = {
        gameId,
        mapImage,
        playerSprite,
        npcs,
        collisionJsonPath,
        onNpcInteract,
      };

      // Create a scene instance with config already set
      const gameScene = new GameScene();

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: container,
        width: width,
        height: height,
        backgroundColor: "#1a1b26",
        pixelArt: true, // Enables crisp pixel art rendering
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        physics: {
          default: "arcade",
          arcade: {
            gravity: { x: 0, y: 0 },
            debug: true, // Shows collision boxes in green
          },
        },
        scene: [], // Don't auto-add scenes
      };

      const game = new Phaser.Game(config);
      gameRef.current = game;

      // Add and start scene with config after game is ready
      game.events.once("ready", () => {
        game.scene.add("GameScene", gameScene, true, sceneConfig);
        sceneRef.current = gameScene;
        setIsLoading(false);
      });
    });

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
        sceneRef.current = null;
      }
    };
  }, [gameId, mapImage, playerSprite, npcs, collisionJsonPath, onNpcInteract]);

  return (
    <div className="relative h-full w-full">
      <div
        ref={gameContainerRef}
        className="h-full w-full"
        style={{ minHeight: "calc(100vh - 60px)" }}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1b26]">
          <p className="font-pixel text-sm uppercase text-zinc-500">Loading game...</p>
        </div>
      )}
    </div>
  );
}
