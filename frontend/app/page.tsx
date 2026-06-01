"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "@/contexts/UserContext";

// Built-in games (hardcoded)
const BUILTIN_GAMES = [
  {
    id: "1",
    title: "Huberman Lab",
    subtitle: "Andrew Huberman",
    thumbnail: "/huberman.jpeg",
    progress: 0,
    isBuiltin: true,
    totalChapters: 64, // Approximate for progress calculation
  },
  {
    id: "3",
    title: "Learning Cursor",
    subtitle: "Cursor Documentation",
    thumbnail: "/cursor.png",
    progress: 0,
    isBuiltin: true,
    totalChapters: 26,
  },
  {
    id: "4",
    title: "The Art of War",
    subtitle: "Sun Tzu",
    thumbnail: "/art-of-war.jpeg",
    progress: 0,
    isBuiltin: true,
    totalChapters: 13,
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
  creator_id: string | null;
  is_public: boolean;
}

interface GameCard {
  id: string;
  title: string;
  subtitle?: string | null;
  thumbnail?: string | null;
  progress: number;
  isBuiltin?: boolean;
  isOwn?: boolean;
  isPublic?: boolean;
  totalChapters?: number;
}

const PlusIcon = () => (
  <svg className="h-10 w-10 text-zinc-500 group-hover:text-amber-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const NPCS_PER_LEVEL = 4;

// Calculate progress percentage from level and defeated NPCs
function calculateProgress(
  currentLevel: number,
  defeatedNpcs: string[],
  totalChapters: number
): number {
  if (totalChapters === 0) return 0;
  const totalLevels = Math.ceil(totalChapters / NPCS_PER_LEVEL);
  const completedLevels = currentLevel - 1;
  const currentLevelProgress = defeatedNpcs.length / NPCS_PER_LEVEL;
  const overallProgress = (completedLevels + currentLevelProgress) / totalLevels;
  return Math.min(Math.round(overallProgress * 100), 100);
}

export default function Home() {
  const { username, clearSession, openDisplayNameModal } = useUser();
  const [myGames, setMyGames] = useState<GameCard[]>([]);
  const [communityGames, setCommunityGames] = useState<GameCard[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch public community games (optional; requires Supabase)
  useEffect(() => {
    async function fetchGames() {
      try {
        const response = await fetch("/api/games?filter=public");
        if (response.ok) {
          const games: UserGame[] = await response.json();
          const community: GameCard[] = games.map((g) => ({
            id: g.id,
            title: g.title,
            subtitle: g.subtitle,
            thumbnail: g.thumbnail_url,
            progress: 0,
            isOwn: false,
            isPublic: g.is_public,
            totalChapters: g.total_chapters,
          }));
          setMyGames([]);
          setCommunityGames(community);
        }
      } catch (error) {
        console.error("Failed to fetch games:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchGames();
  }, []);

  // Built-in games with progress
  const builtinWithProgress = BUILTIN_GAMES.map((g) => {
    // For built-in games, check sessionStorage (they don't sync to DB)
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem(`youtube2rpg_game_state_${g.id}`);
        if (stored) {
          const state = JSON.parse(stored);
          return {
            ...g,
            progress: calculateProgress(
              state.level || 1,
              state.defeatedNpcs || [],
              g.totalChapters || 1
            ),
          };
        }
      } catch {
        // Ignore
      }
    }
    return g;
  });

  const myGamesWithProgress = myGames;
  const communityWithProgress = communityGames;

  // Render a game card
  const renderGameCard = (card: GameCard, badge: string) => (
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
        {/* Play button on hover */}
        <span
          className="pixel-shadow-sm absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-none border-2 border-amber-600 bg-amber-500 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          aria-hidden
        >
          <svg className="ml-0.5 h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M8 5v14l11-7L8 5z" />
          </svg>
        </span>
        
        {/* Private badge */}
        {card.isOwn && !card.isPublic && (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-none border border-purple-500/50 bg-purple-500/20 px-2 py-1 text-[8px] uppercase text-purple-400">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Private
          </span>
        )}
        
        <h3 className="text-xs font-bold uppercase text-white sm:text-sm line-clamp-1">{card.title}</h3>
        {card.subtitle ? (
          <p className="mt-1 text-[10px] uppercase text-amber-400/80 line-clamp-1">{card.subtitle}</p>
        ) : null}
        <p className="mt-2 text-[10px] uppercase text-zinc-500">{badge}</p>
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
  );

  return (
    <div className="font-pixel relative min-h-screen overflow-hidden bg-[#1a1b26] text-zinc-100" style={{ imageRendering: "pixelated" }}>
      {/* Animated Pixel Art Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Gradient overlay */}
        <div 
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, 0.1) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(251, 191, 36, 0.05) 0%, transparent 40%)",
          }}
        />
        
        {/* Floating pixel stars */}
        <div className="absolute h-2 w-2 bg-amber-400/60 animate-float-slow" style={{ top: "10%", left: "5%" }} />
        <div className="absolute h-1 w-1 bg-purple-400/80 animate-float-medium" style={{ top: "20%", left: "15%" }} />
        <div className="absolute h-2 w-2 bg-amber-300/50 animate-float-fast" style={{ top: "15%", left: "80%" }} />
        <div className="absolute h-1 w-1 bg-cyan-400/60 animate-float-slow" style={{ top: "30%", left: "90%" }} />
        <div className="absolute h-2 w-2 bg-purple-300/40 animate-float-medium" style={{ top: "50%", left: "3%" }} />
        <div className="absolute h-1 w-1 bg-amber-400/70 animate-float-fast" style={{ top: "60%", left: "95%" }} />
        <div className="absolute h-2 w-2 bg-cyan-300/50 animate-float-slow" style={{ top: "70%", left: "10%" }} />
        <div className="absolute h-1 w-1 bg-purple-400/60 animate-float-medium" style={{ top: "80%", left: "85%" }} />
        <div className="absolute h-2 w-2 bg-amber-300/40 animate-float-fast" style={{ top: "25%", left: "50%" }} />
        <div className="absolute h-1 w-1 bg-cyan-400/70 animate-float-slow" style={{ top: "45%", left: "70%" }} />
        <div className="absolute h-2 w-2 bg-purple-300/50 animate-float-medium" style={{ top: "85%", left: "40%" }} />
        <div className="absolute h-1 w-1 bg-amber-400/60 animate-float-fast" style={{ top: "5%", left: "60%" }} />
        
        {/* Drifting pixel clouds */}
        <div className="absolute animate-drift-slow opacity-20" style={{ top: "8%", left: "-10%" }}>
          <div className="flex gap-1">
            <div className="h-3 w-6 bg-zinc-400" />
            <div className="h-4 w-8 bg-zinc-400 -mt-1" />
            <div className="h-3 w-5 bg-zinc-400" />
          </div>
        </div>
        <div className="absolute animate-drift-medium opacity-15" style={{ top: "25%", left: "-15%" }}>
          <div className="flex gap-1">
            <div className="h-2 w-4 bg-zinc-500" />
            <div className="h-3 w-6 bg-zinc-500 -mt-1" />
            <div className="h-2 w-4 bg-zinc-500" />
          </div>
        </div>
        <div className="absolute animate-drift-fast opacity-10" style={{ top: "65%", left: "-20%" }}>
          <div className="flex gap-1">
            <div className="h-4 w-8 bg-zinc-400" />
            <div className="h-5 w-10 bg-zinc-400 -mt-1" />
            <div className="h-4 w-6 bg-zinc-400" />
          </div>
        </div>
        
        {/* Sparkle particles */}
        <div className="absolute h-1 w-1 bg-white/80 animate-sparkle" style={{ top: "12%", left: "25%", animationDelay: "0s" }} />
        <div className="absolute h-1 w-1 bg-white/80 animate-sparkle" style={{ top: "35%", left: "75%", animationDelay: "0.5s" }} />
        <div className="absolute h-1 w-1 bg-white/80 animate-sparkle" style={{ top: "55%", left: "20%", animationDelay: "1s" }} />
        <div className="absolute h-1 w-1 bg-white/80 animate-sparkle" style={{ top: "75%", left: "65%", animationDelay: "1.5s" }} />
        <div className="absolute h-1 w-1 bg-white/80 animate-sparkle" style={{ top: "22%", left: "88%", animationDelay: "2s" }} />
        <div className="absolute h-1 w-1 bg-white/80 animate-sparkle" style={{ top: "90%", left: "30%", animationDelay: "2.5s" }} />
      </div>
      
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <header className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-lg font-bold uppercase tracking-wide text-white sm:text-xl">
              Anything → RPG
            </h1>
            <p className="mt-1 text-[10px] uppercase leading-relaxed text-zinc-400 sm:text-xs">
              Turn any pdf or knowledge base into a fun rpg quiz
            </p>
          </div>
          <div className="group relative">
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className={username ? "text-amber-400" : "text-zinc-500"}>
                {username ?? "Guest"}
              </span>
            </button>

            <div className="invisible absolute right-0 top-full z-50 mt-1 w-44 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
              <div className="pixel-shadow rounded-none border-2 border-zinc-600 bg-zinc-800 py-1">
                <button
                  type="button"
                  onClick={openDisplayNameModal}
                  className="flex w-full items-center gap-2 px-3 py-2 text-[10px] uppercase text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
                >
                  {username ? "Change name" : "Set display name"}
                </button>
                {username && (
                  <button
                    type="button"
                    onClick={() => {
                      clearSession();
                      window.location.reload();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-[10px] uppercase text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
                  >
                    Clear name
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* My Worlds Section */}
        <section className="mb-10">
          <h2 className="mb-4 text-[10px] font-medium uppercase tracking-wider text-zinc-500 sm:text-xs">
            My Worlds
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Create Your Own Card */}
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

            {/* User's created games */}
            {myGamesWithProgress.map((card) => renderGameCard(card, "Your Creation"))}
          </div>
          
          {myGamesWithProgress.length === 0 && !loading && (
            <p className="mt-2 text-[10px] text-zinc-500">
              No worlds created yet. Upload a PDF to create your first RPG!
            </p>
          )}
        </section>

        {/* Featured Games Section */}
        <section className="mb-10">
          <h2 className="mb-4 text-[10px] font-medium uppercase tracking-wider text-zinc-500 sm:text-xs">
            Featured Games
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {builtinWithProgress.map((card) => renderGameCard(card, "Featured Game"))}
          </div>
        </section>

        {/* Community Worlds Section */}
        {communityWithProgress.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-[10px] font-medium uppercase tracking-wider text-zinc-500 sm:text-xs">
              Community Worlds
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {communityWithProgress.map((card) => renderGameCard(card, "Community"))}
            </div>
          </section>
        )}

        {/* Loading state */}
        {loading && (
          <div className="text-center text-xs text-zinc-500">
            Loading worlds...
          </div>
        )}
      </div>
    </div>
  );
}
