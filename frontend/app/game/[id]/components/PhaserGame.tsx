"use client";

import { useEffect, useRef, useState } from "react";
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

  // Store callbacks in refs to avoid re-creating the game when they change
  const onNpcInteractRef = useRef(onNpcInteract);
  const onNearbyNpcChangeRef = useRef(onNearbyNpcChange);

  // Keep refs updated
  useEffect(() => {
    onNpcInteractRef.current = onNpcInteract;
  }, [onNpcInteract]);

  useEffect(() => {
    onNearbyNpcChangeRef.current = onNearbyNpcChange;
  }, [onNearbyNpcChange]);

  // Poll for nearby NPC changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (sceneRef.current && onNearbyNpcChangeRef.current) {
        const nearbyNpc = sceneRef.current.getNearbyNpc();
        onNearbyNpcChangeRef.current(nearbyNpc);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !gameContainerRef.current) return;
    if (gameRef.current) return; // Already initialized - don't recreate

    const container = gameContainerRef.current;
    
    // Use requestAnimationFrame to ensure container is laid out
    const initGame = () => {
      const rect = container.getBoundingClientRect();
      
      // If container still has no size, retry
      if (rect.width === 0 || rect.height === 0) {
        requestAnimationFrame(initGame);
        return;
      }

      // Dynamically import Phaser (client-side only)
      import("phaser").then((Phaser) => {
        if (gameRef.current) return; // Double-check

        // Wrap the callback to always use the latest ref value
        const wrappedOnNpcInteract = (npcId: string) => {
          onNpcInteractRef.current(npcId);
        };

        const sceneConfig: GameSceneConfig = {
          gameId,
          mapImage,
          playerSprite,
          npcs,
          collisionJsonPath,
          onNpcInteract: wrappedOnNpcInteract,
        };

        // Create a scene instance with config already set
        const gameScene = new GameScene();

        const config: Phaser.Types.Core.GameConfig = {
          type: Phaser.AUTO,
          parent: container,
          width: rect.width,
          height: rect.height,
          backgroundColor: "#1a1b26",
          pixelArt: true,
          scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH,
          },
          physics: {
            default: "arcade",
            arcade: {
              gravity: { x: 0, y: 0 },
              debug: false,
            },
          },
          render: {
            antialias: false,
            pixelArt: true,
            roundPixels: true,
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
      }).catch((err) => {
        console.error("Failed to load Phaser:", err);
        setIsLoading(false);
      });
    };

    requestAnimationFrame(initGame);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
        sceneRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

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
