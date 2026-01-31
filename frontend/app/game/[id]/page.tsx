"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const MAP_IMAGE = "/sprites/map/Sample1.png";
const CHARACTER_SPRITE = "/sprites/characters/black-circle.png";
const MOVE_STEP = 12;
const CHARACTER_SIZE = 32;

// ~80px ≈ 2–3cm at typical screen DPI
const INTERACTION_DISTANCE = 80;

const NPCS = [
  { id: "red", name: "Red", sprite: "/sprites/characters/red-circle.png", left: "20%", top: "20%" },
  { id: "blue", name: "Blue", sprite: "/sprites/characters/blue-circle.png", left: "80%", top: "20%" },
  { id: "green", name: "Green", sprite: "/sprites/characters/green-circle.png", left: "20%", top: "80%" },
  { id: "yellow", name: "Yellow", sprite: "/sprites/characters/yellow-circle.png", left: "80%", top: "80%" },
];

function getNearbyNpc(
  playerX: number,
  playerY: number,
  width: number,
  height: number
): (typeof NPCS)[0] | null {
  const playerCenterX = playerX + CHARACTER_SIZE / 2;
  const playerCenterY = playerY + CHARACTER_SIZE / 2;
  for (const npc of NPCS) {
    const npcCenterX = (parseFloat(npc.left) * width) / 100;
    const npcCenterY = (parseFloat(npc.top) * height) / 100;
    const dist = Math.hypot(playerCenterX - npcCenterX, playerCenterY - npcCenterY);
    if (dist < INTERACTION_DISTANCE) return npc;
  }
  return null;
}

export default function GameScreen() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const nearbyNpc = containerSize.width > 0
    ? getNearbyNpc(position.x, position.y, containerSize.width, containerSize.height)
    : null;

  // Center character on mount, track container size for proximity
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width, height });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const hasInitialized = useRef(false);
  useEffect(() => {
    if (containerSize.width > 0 && !hasInitialized.current) {
      hasInitialized.current = true;
      setPosition({
        x: containerSize.width / 2 - CHARACTER_SIZE / 2,
        y: containerSize.height / 2 - CHARACTER_SIZE / 2,
      });
    }
  }, [containerSize.width, containerSize.height]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Enter" && nearbyNpc) {
        e.preventDefault();
        router.push(`/game/${id}/npc/${nearbyNpc.id}`);
        return;
      }
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) return;
      e.preventDefault();

      setPosition((prev) => {
        const container = containerRef.current;
        if (!container) return prev;
        const { width, height } = container.getBoundingClientRect();

        let nextX = prev.x;
        let nextY = prev.y;

        switch (e.code) {
          case "ArrowUp":
            nextY -= MOVE_STEP;
            break;
          case "ArrowDown":
            nextY += MOVE_STEP;
            break;
          case "ArrowLeft":
            nextX -= MOVE_STEP;
            break;
          case "ArrowRight":
            nextX += MOVE_STEP;
            break;
        }

        return {
          x: Math.max(0, Math.min(width - CHARACTER_SIZE, nextX)),
          y: Math.max(0, Math.min(height - CHARACTER_SIZE, nextY)),
        };
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nearbyNpc, router, id]);

  return (
    <div
      ref={containerRef}
      className="font-pixel relative min-h-screen overflow-hidden bg-[#1a1b26] text-zinc-100"
      style={{ imageRendering: "pixelated" }}
    >
      {/* Map background from Sample1.png */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Image
          src={MAP_IMAGE}
          alt="Game map"
          fill
          className="object-contain"
          style={{ imageRendering: "pixelated" }}
          sizes="100vw"
          unoptimized
        />
      </div>

      {/* Character marker - black circle (move with arrow keys) */}
      <div
        className="absolute z-10"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        <Image
          src={CHARACTER_SPRITE}
          alt="Player"
          width={CHARACTER_SIZE}
          height={CHARACTER_SIZE}
          style={{ imageRendering: "pixelated" }}
          unoptimized
        />
      </div>

      {/* NPCs - one in each quarter of the map */}
      {NPCS.map((npc) => (
        <div
          key={npc.id}
          className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
          style={{
            left: npc.left,
            top: npc.top,
          }}
        >
          <Image
            src={npc.sprite}
            alt={npc.name}
            width={CHARACTER_SIZE}
            height={CHARACTER_SIZE}
            style={{ imageRendering: "pixelated" }}
            unoptimized
          />
          {/* Question mark popup when player is nearby */}
          {nearbyNpc?.id === npc.id && (
            <div
              className="absolute left-1/2 -top-10 -translate-x-1/2 animate-bounce rounded bg-amber-500 px-2 py-0.5 text-lg font-bold text-black"
              style={{ imageRendering: "pixelated" }}
            >
              ?
            </div>
          )}
        </div>
      ))}

      {/* Overlay header */}
      <header className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between bg-zinc-900/80 px-4 py-3 backdrop-blur-sm">
        <div>
          <h1 className="text-sm font-bold uppercase tracking-wide text-white sm:text-lg">
            Episode {id} — Explore
          </h1>
          <p className="mt-0.5 text-[10px] text-zinc-500">
            Arrow keys to move
            {nearbyNpc && " · Enter to talk"}
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
    </div>
  );
}
