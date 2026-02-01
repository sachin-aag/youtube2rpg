import { NextRequest, NextResponse } from "next/server";
import {
  getLeaderboard,
  saveLeaderboardEntry,
  getUserLeaderboardEntry,
  getUserRank,
  getUserByUsername,
  isFeaturedGame,
  isCommunityGame,
  getGameById,
} from "@/lib/supabase";

// Featured games metadata (same as in page.tsx)
const FEATURED_GAMES: Record<string, { title: string; totalChapters: number }> = {
  "1": { title: "Huberman Lab", totalChapters: 64 },
  "3": { title: "Learning Cursor", totalChapters: 26 },
  "4": { title: "The Art of War", totalChapters: 13 },
};

const NPCS_PER_LEVEL = 4;

// Calculate score from level and defeated NPCs
function calculateScore(
  currentLevel: number,
  defeatedNpcs: number,
  totalChapters: number
): number {
  if (totalChapters === 0) return 0;
  const totalLevels = Math.ceil(totalChapters / NPCS_PER_LEVEL);
  const completedLevels = currentLevel - 1;
  const currentLevelProgress = defeatedNpcs / NPCS_PER_LEVEL;
  const overallProgress = (completedLevels + currentLevelProgress) / totalLevels;
  return Math.min(Math.round(overallProgress * 100), 100);
}

// GET /api/leaderboard/[gameId] - Get leaderboard for a game
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const username = searchParams.get("username");

  // Validate game ID - must be featured or community
  if (!isFeaturedGame(gameId) && !isCommunityGame(gameId)) {
    return NextResponse.json(
      { error: "Invalid game ID. Leaderboard only available for featured and community games." },
      { status: 400 }
    );
  }

  // For community games, verify the game exists and is public
  if (isCommunityGame(gameId)) {
    const game = await getGameById(gameId);
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }
    if (!game.is_public) {
      return NextResponse.json(
        { error: "Leaderboard not available for private games" },
        { status: 403 }
      );
    }
  }

  // Fetch leaderboard
  const leaderboard = await getLeaderboard(gameId, limit);

  // If username provided, also get user's rank
  let userRank: number | null = null;
  let userEntry = null;

  if (username) {
    const user = await getUserByUsername(username);
    if (user) {
      userRank = await getUserRank(user.id, gameId);
      userEntry = await getUserLeaderboardEntry(user.id, gameId);
    }
  }

  return NextResponse.json({
    leaderboard: leaderboard.map((entry, index) => ({
      rank: index + 1,
      username: entry.users.username,
      score: entry.score,
      currentLevel: entry.current_level,
      totalNpcsDefeated: entry.total_npcs_defeated,
      isCompleted: entry.is_completed,
      updatedAt: entry.updated_at,
    })),
    userRank,
    userEntry: userEntry
      ? {
          score: userEntry.score,
          currentLevel: userEntry.current_level,
          totalNpcsDefeated: userEntry.total_npcs_defeated,
          isCompleted: userEntry.is_completed,
        }
      : null,
  });
}

// POST /api/leaderboard/[gameId] - Update leaderboard entry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;

  try {
    const body = await request.json();
    const { username, currentLevel, defeatedNpcs } = body;

    if (!username) {
      return NextResponse.json(
        { error: "username is required" },
        { status: 400 }
      );
    }

    if (typeof currentLevel !== "number" || currentLevel < 1) {
      return NextResponse.json(
        { error: "currentLevel must be a positive number" },
        { status: 400 }
      );
    }

    if (!Array.isArray(defeatedNpcs)) {
      return NextResponse.json(
        { error: "defeatedNpcs must be an array" },
        { status: 400 }
      );
    }

    // Validate game ID
    if (!isFeaturedGame(gameId) && !isCommunityGame(gameId)) {
      return NextResponse.json(
        { error: "Invalid game ID. Leaderboard only available for featured and community games." },
        { status: 400 }
      );
    }

    // Get total chapters for score calculation
    let totalChapters = 0;

    if (isFeaturedGame(gameId)) {
      totalChapters = FEATURED_GAMES[gameId]?.totalChapters || 0;
    } else {
      const game = await getGameById(gameId);
      if (!game) {
        return NextResponse.json({ error: "Game not found" }, { status: 404 });
      }
      if (!game.is_public) {
        return NextResponse.json(
          { error: "Leaderboard not available for private games" },
          { status: 403 }
        );
      }
      totalChapters = game.total_chapters;
    }

    // Get user
    const user = await getUserByUsername(username);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate score
    const totalNpcsDefeated = defeatedNpcs.length;
    const score = calculateScore(currentLevel, totalNpcsDefeated, totalChapters);
    const isCompleted = score >= 100;

    // Save leaderboard entry
    const entry = await saveLeaderboardEntry(
      user.id,
      gameId,
      score,
      currentLevel,
      totalNpcsDefeated,
      isCompleted
    );

    if (!entry) {
      return NextResponse.json(
        { error: "Failed to save leaderboard entry" },
        { status: 500 }
      );
    }

    // Get updated rank
    const rank = await getUserRank(user.id, gameId);

    return NextResponse.json({
      success: true,
      entry: {
        score: entry.score,
        currentLevel: entry.current_level,
        totalNpcsDefeated: entry.total_npcs_defeated,
        isCompleted: entry.is_completed,
      },
      rank,
    });
  } catch (error) {
    console.error("Error in POST /api/leaderboard/[gameId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
