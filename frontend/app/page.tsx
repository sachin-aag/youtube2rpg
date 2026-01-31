"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

// Built-in games (hardcoded)
const BUILTIN_GAMES = [
  {
    id: "1",
    title: "Huberman Lab",
    subtitle: "Andrew Huberman",
    thumbnail: "/huberman.jpeg",
    progress: 0,
    isBuiltin: true,
  },
  {
    id: "2",
    title: "The Psychology of Money",
    subtitle: "Morgan Housel",
    thumbnail: "/psychology-of-money.jpeg",
    progress: 0,
    isBuiltin: true,
  },
];

interface UserGame {
  id: string;
  title: string;
  subtitle: string | null;
  thumbnail_url: string | null;
  total_chapters: number;
  created_at: string;
  status: string;
}

interface GameCard {
  id: string;
  title: string;
  subtitle?: string | null;
  thumbnail?: string | null;
  progress: number;
  isBuiltin?: boolean;
}

const ScoreIcon = () => (
  <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6L12 2z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="h-10 w-10 text-zinc-500 group-hover:text-amber-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

export default function Home() {
  const [userGames, setUserGames] = useState<GameCard[]>([]);
  const [loading, setLoading] = useState(true);
  const totalScore = 0;

  // Fetch user-created games from API
  useEffect(() => {
    async function fetchGames() {
      try {
        const response = await fetch("/api/games");
        if (response.ok) {
          const games: UserGame[] = await response.json();
          const mapped: GameCard[] = games.map((g) => ({
            id: g.id,
            title: g.title,
            subtitle: g.subtitle,
            thumbnail: g.thumbnail_url,
            progress: 0, // Could calculate from session storage
          }));
          setUserGames(mapped);
        }
      } catch (error) {
        console.error("Failed to fetch games:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchGames();
  }, []);

  // Combine built-in and user games
  const allGames = [...BUILTIN_GAMES, ...userGames];

  return (
    <div className="font-pixel min-h-screen bg-[#1a1b26] text-zinc-100" style={{ imageRendering: "pixelated" }}>
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header with stats */}
        <header className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-lg font-bold uppercase tracking-wide text-white sm:text-xl">
              Anything → RPG
            </h1>
            <p className="mt-1 text-[10px] uppercase leading-relaxed text-zinc-400 sm:text-xs">
              Turn any pdf or knowledge base into a fun rpg quiz
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="pixel-shadow flex items-center gap-2 rounded-none border-2 border-zinc-600 bg-zinc-800 px-4 py-2.5">
              <ScoreIcon />
              <p className="text-sm font-bold tabular-nums text-white">{totalScore}</p>
            </div>
          </div>
        </header>

        {/* Cards grid */}
        <section>
          <h2 className="mb-4 text-[10px] font-medium uppercase tracking-wider text-zinc-500 sm:text-xs">
            Your Games
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Create Your Own Card - Always first */}
            <Link
              href="/create"
              className="pixel-shadow group relative flex flex-col items-center justify-center rounded-none border-2 border-dashed border-zinc-600 bg-zinc-800/50 p-8 text-center transition hover:border-amber-400 hover:bg-zinc-800"
            >
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-none border-2 border-zinc-600 bg-zinc-700 group-hover:border-amber-500 group-hover:bg-amber-500/20 transition-colors">
                <PlusIcon />
              </div>
              <h3 className="text-xs font-bold uppercase text-zinc-300 group-hover:text-amber-400 transition-colors">
                Create Your Own
              </h3>
              <p className="mt-1 text-[10px] text-zinc-500">
                Upload a PDF to get started
              </p>
            </Link>

            {/* Game Cards */}
            {allGames.map((card) => (
              <Link
                key={card.id}
                href={`/game/${card.id}`}
                className="pixel-shadow group relative block rounded-none border-2 border-zinc-600 bg-zinc-800 overflow-hidden transition hover:border-amber-400/60 hover:bg-zinc-700/80"
              >
                {/* Thumbnail */}
                {card.thumbnail ? (
                  <div className="relative h-32 w-full overflow-hidden border-b-2 border-zinc-600">
                    <Image
                      src={card.thumbnail}
                      alt={card.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      style={{ imageRendering: "auto" }}
                    />
                  </div>
                ) : (
                  <div className="flex h-32 w-full items-center justify-center border-b-2 border-zinc-600 bg-gradient-to-br from-zinc-700 to-zinc-800">
                    <svg className="h-12 w-12 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 7V3.5L18.5 9H13z" />
                    </svg>
                  </div>
                )}
                
                <div className="p-5">
                  <span
                    className="pixel-shadow-sm absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-none border-2 border-amber-600 bg-amber-500 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    aria-hidden
                  >
                    <svg className="ml-0.5 h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path d="M8 5v14l11-7L8 5z" />
                    </svg>
                  </span>
                  <h3 className="text-xs font-bold uppercase text-white sm:text-sm line-clamp-1">{card.title}</h3>
                  {card.subtitle ? (
                    <p className="mt-1 text-[10px] uppercase text-amber-400/80 line-clamp-1">{card.subtitle}</p>
                  ) : null}
                  <p className="mt-2 text-[10px] uppercase text-zinc-500">
                    {card.isBuiltin ? "Featured Game" : "Your Creation"}
                  </p>
                  <div className="mt-3">
                    <div
                      className="h-3 w-full overflow-hidden rounded-none border-2 border-zinc-600 bg-zinc-700"
                      role="progressbar"
                      aria-valuenow={card.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full rounded-none transition-[width] duration-500 ease-out"
                        style={{
                          width: `${card.progress}%`,
                          background: "repeating-linear-gradient(90deg, #facc15 0px, #facc15 4px, #eab308 4px, #eab308 8px)",
                        }}
                      />
                    </div>
                    <p className="mt-1.5 text-right text-[10px] font-bold tabular-nums text-amber-400">
                      {card.progress}%
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Loading state */}
          {loading && (
            <div className="mt-4 text-center text-xs text-zinc-500">
              Loading your games...
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
