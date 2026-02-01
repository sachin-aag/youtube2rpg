"use client";

import { useEffect, useRef, useState } from "react";
import { GameScene, type GameSceneConfig, type NpcData, type AudioSettings, type PlayerSpriteConfig } from "./GameScene";

interface PhaserGameProps {
  gameId: string;
  mapImage: string;
  playerSprite: string;
  playerSpriteConfig?: PlayerSpriteConfig;
  npcs: NpcData[];
  collisionJsonPath?: string;
  onNpcInteract: (npcId: string) => void;
  onNearbyNpcChange?: (npc: NpcData | null) => void;
  // Music and settings
  musicUrl?: string;
  currentLevel?: number;
  audioSettings?: AudioSettings;
  // World theming
  mapTint?: number;
  worldName?: string;
}

export default function PhaserGame({
  gameId,
  mapImage,
  playerSprite,
  playerSpriteConfig,
  npcs,
  collisionJsonPath,
  onNpcInteract,
  onNearbyNpcChange,
  musicUrl,
  currentLevel,
  audioSettings,
  mapTint,
  worldName,
}: PhaserGameProps) {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<GameScene | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Store callbacks in refs to avoid re-creating the game when they change
  const onNpcInteractRef = useRef(onNpcInteract);
  const onNearbyNpcChangeRef = useRef(onNearbyNpcChange);
  const audioSettingsRef = useRef(audioSettings);
  const currentLevelRef = useRef(currentLevel);

  // Keep refs updated
  useEffect(() => {
    onNpcInteractRef.current = onNpcInteract;
  }, [onNpcInteract]);

  useEffect(() => {
    onNearbyNpcChangeRef.current = onNearbyNpcChange;
  }, [onNearbyNpcChange]);

  // Update audio settings in the game scene when they change
  useEffect(() => {
    audioSettingsRef.current = audioSettings;
    if (sceneRef.current && audioSettings) {
      sceneRef.current.updateAudioSettings(audioSettings);
    }
  }, [audioSettings]);

  // Update level in the game scene when it changes
  useEffect(() => {
    currentLevelRef.current = currentLevel;
    if (sceneRef.current && currentLevel !== undefined) {
      sceneRef.current.updateLevel(currentLevel);
    }
  }, [currentLevel]);

  // Initialize music when URL becomes available (may be loaded after scene starts)
  useEffect(() => {
    if (sceneRef.current && musicUrl) {
      sceneRef.current.setMusicUrl(musicUrl);
    }
  }, [musicUrl]);

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
          playerSpriteConfig,
          npcs,
          collisionJsonPath,
          onNpcInteract: wrappedOnNpcInteract,
          musicUrl,
          currentLevel: currentLevelRef.current,
          audioSettings: audioSettingsRef.current,
          mapTint,
          worldName,
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
      if (sceneRef.current) {
        sceneRef.current.shutdown();
      }
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
