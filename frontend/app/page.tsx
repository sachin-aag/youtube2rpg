"use client";

import { useState } from "react";
import Link from "next/link";

const PLACEHOLDER_CARDS = [
  { id: 1, title: "Podcast 1", progress: 72 },
  { id: 2, title: "Podcast 2", progress: 45 },
  { id: 3, title: "Podcast 3", progress: 90 },
  { id: 4, title: "Podcast 4", progress: 28 },
  { id: 5, title: "Podcast 5", progress: 61 },
];

const ScoreIcon = () => (
  <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6L12 2z" />
  </svg>
);

const GamesIcon = () => (
  <svg className="h-5 w-5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v2H6v-2H4v-2h2V9h2v2h2v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
  </svg>
);

export default function Home() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const totalScore = 0;
  const totalGames = 0;

  return (
    <div className="font-pixel min-h-screen bg-[#1a1b26] text-zinc-100" style={{ imageRendering: "pixelated" }}>
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header with stats */}
        <header className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-lg font-bold uppercase tracking-wide text-white sm:text-xl">
              YouTube → RPG
            </h1>
            <p className="mt-1 text-[10px] uppercase leading-relaxed text-zinc-400 sm:text-xs">
              Turn any video into a tabletop adventure
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="pixel-shadow flex items-center gap-2 rounded-none border-2 border-zinc-600 bg-zinc-800 px-4 py-2.5">
              <ScoreIcon />
              <p className="text-sm font-bold tabular-nums text-white">{totalScore}</p>
            </div>
            {/* <div className="flex items-center gap-2 rounded-xl border border-zinc-700/80 bg-zinc-800/60 px-4 py-2.5">
              <GamesIcon />
                <p className="text-lg font-bold tabular-nums text-white">{totalGames}</p>
            </div> */}
          </div>
        </header>

        {/* Input + Generate */}
        {/* <section className="mb-14">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <input
              type="url"
              placeholder="Paste YouTube link..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-3 text-white placeholder-zinc-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 sm:py-3.5"
            />
            <button
              type="button"
              className="shrink-0 rounded-xl bg-emerald-600 px-6 py-3 font-medium text-white transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#0d1117] sm:py-3.5"
            >
              Generate
            </button>
          </div>
        </section> */}

        {/* Cards grid - 4 per row */}
        <section>
          <h2 className="mb-4 text-[10px] font-medium uppercase tracking-wider text-zinc-500 sm:text-xs">
            Generated content
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PLACEHOLDER_CARDS.map((card) => (
              <Link
                key={card.id}
                href={`/game/${card.id}`}
                className="pixel-shadow group relative block rounded-none border-2 border-zinc-600 bg-zinc-800 p-5 transition hover:border-amber-400/60 hover:bg-zinc-700/80"
              >
                <span
                  className="pixel-shadow-sm absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-none border-2 border-amber-600 bg-amber-500 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  aria-hidden
                >
                  <svg className="ml-0.5 h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path d="M8 5v14l11-7L8 5z" />
                  </svg>
                </span>
                <h3 className="text-xs font-bold uppercase text-white sm:text-sm">{card.title}</h3>
                <p className="mt-2 text-[10px] uppercase text-zinc-500">Ready to explore</p>
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
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
