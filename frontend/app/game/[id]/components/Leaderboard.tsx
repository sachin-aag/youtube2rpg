"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/contexts/UserContext";

interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  currentLevel: number;
  totalNpcsDefeated: number;
  isCompleted: boolean;
  updatedAt: string;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  userRank: number | null;
  userEntry: {
    score: number;
    currentLevel: number;
    totalNpcsDefeated: number;
    isCompleted: boolean;
  } | null;
}

interface LeaderboardProps {
  gameId: string;
  isOpen: boolean;
  onClose: () => void;
}

// Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Trophy/medal icons for top 3
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 text-yellow-400">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 text-gray-300">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 text-amber-600">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 text-xs text-zinc-400 font-bold">
      {rank}
    </span>
  );
}

export default function Leaderboard({ gameId, isOpen, onClose }: LeaderboardProps) {
  const { username } = useUser();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url = username
        ? `/api/leaderboard/${gameId}?username=${encodeURIComponent(username)}`
        : `/api/leaderboard/${gameId}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch leaderboard");
      }

      const leaderboardData = await response.json();
      setData(leaderboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, [gameId, username]);

  // Fetch when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen, fetchLeaderboard]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div 
        className="mx-4 w-full max-w-lg max-h-[80vh] flex flex-col rounded-none border-4 border-amber-500 bg-zinc-900 shadow-[8px_8px_0_0_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-zinc-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <h2 className="text-lg font-bold uppercase text-white">Leaderboard</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs uppercase text-zinc-500">Loading leaderboard...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg className="w-12 h-12 text-red-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-red-400">{error}</p>
              <button
                type="button"
                onClick={fetchLeaderboard}
                className="mt-4 px-4 py-2 text-xs uppercase text-amber-400 border border-amber-400/50 hover:bg-amber-400/10 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {data && !loading && !error && (
            <>
              {/* User's rank if logged in */}
              {username && data.userRank && data.userEntry && (
                <div className="mb-4 p-3 rounded bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs uppercase text-amber-400">Your Rank</span>
                      <span className="text-lg font-bold text-white">#{data.userRank}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-zinc-400">
                        Score: <span className="text-amber-400 font-bold">{data.userEntry.score}%</span>
                      </span>
                      <span className="text-zinc-400">
                        Level: <span className="text-white font-bold">{data.userEntry.currentLevel}</span>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Leaderboard list */}
              {data.leaderboard.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <svg className="w-12 h-12 text-zinc-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-sm text-zinc-400">No players yet</p>
                  <p className="text-xs text-zinc-500 mt-1">Be the first to make the leaderboard!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.leaderboard.map((entry) => (
                    <div
                      key={`${entry.rank}-${entry.username}`}
                      className={`flex items-center gap-3 p-3 rounded ${
                        entry.username === username
                          ? "bg-amber-500/20 border border-amber-500/40"
                          : "bg-zinc-800/50"
                      } ${entry.rank <= 3 ? "border border-zinc-700" : ""}`}
                    >
                      {/* Rank */}
                      <RankBadge rank={entry.rank} />

                      {/* User info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold truncate ${
                            entry.username === username ? "text-amber-400" : "text-white"
                          }`}>
                            {entry.username}
                          </span>
                          {entry.isCompleted && (
                            <span className="px-1.5 py-0.5 text-[8px] uppercase bg-green-500/20 text-green-400 rounded">
                              Completed
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                          <span>Level {entry.currentLevel}</span>
                          <span>{entry.totalNpcsDefeated} NPCs</span>
                          <span>{formatRelativeTime(entry.updatedAt)}</span>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right">
                        <span className={`text-lg font-bold ${
                          entry.rank === 1 ? "text-yellow-400" :
                          entry.rank === 2 ? "text-gray-300" :
                          entry.rank === 3 ? "text-amber-600" :
                          "text-white"
                        }`}>
                          {entry.score}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-zinc-700 px-6 py-4">
          <p className="text-[10px] text-zinc-500 text-center">
            Rankings update in real-time as players complete quizzes
          </p>
        </div>
      </div>
    </div>
  );
}

// Leaderboard button component
export function LeaderboardButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-none border-2 border-zinc-600 bg-zinc-800 px-3 py-2 text-xs font-bold uppercase text-white transition hover:border-amber-400/60 hover:bg-zinc-700"
      title="Leaderboard"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <span className="hidden sm:inline">Leaderboard</span>
    </button>
  );
}
