import { NextRequest, NextResponse } from "next/server";
import {
  getUserProgress,
  saveUserProgress,
  getAllUserProgress,
  getUserByUsername,
} from "@/lib/supabase";

// GET /api/progress?userId=xxx&gameId=xxx - Get progress for a specific game
// GET /api/progress?userId=xxx - Get all progress for a user
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const gameId = searchParams.get("gameId");
  const username = searchParams.get("username");

  // Allow lookup by username instead of userId
  let resolvedUserId = userId;
  if (!resolvedUserId && username) {
    const user = await getUserByUsername(username);
    if (user) {
      resolvedUserId = user.id;
    }
  }

  if (!resolvedUserId) {
    return NextResponse.json(
      { error: "userId or username parameter is required" },
      { status: 400 }
    );
  }

  if (gameId) {
    // Get progress for specific game
    const progress = await getUserProgress(resolvedUserId, gameId);
    return NextResponse.json({ progress });
  } else {
    // Get all progress for user
    const progressList = await getAllUserProgress(resolvedUserId);
    return NextResponse.json({ progress: progressList });
  }
}

// POST /api/progress - Save/update progress
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, username, gameId, currentLevel, defeatedNpcs } = body;

    // Allow using username instead of userId
    let resolvedUserId = userId;
    if (!resolvedUserId && username) {
      const user = await getUserByUsername(username);
      if (user) {
        resolvedUserId = user.id;
      }
    }

    if (!resolvedUserId) {
      return NextResponse.json(
        { error: "userId or username is required" },
        { status: 400 }
      );
    }

    if (!gameId) {
      return NextResponse.json(
        { error: "gameId is required" },
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

    const progress = await saveUserProgress(
      resolvedUserId,
      gameId,
      currentLevel,
      defeatedNpcs
    );

    if (!progress) {
      return NextResponse.json(
        { error: "Failed to save progress" },
        { status: 500 }
      );
    }

    return NextResponse.json({ progress });
  } catch (error) {
    console.error("Error in POST /api/progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
