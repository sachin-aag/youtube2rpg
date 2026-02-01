import { NextRequest, NextResponse } from "next/server";
import { getUserByUsername, createUser, checkUsernameAvailable } from "@/lib/supabase";

// GET /api/users?username=xxx - Get user by username
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { error: "Username parameter is required" },
      { status: 400 }
    );
  }

  const user = await getUserByUsername(username);

  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user });
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username } = body;

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Validate username format
    const trimmed = username.trim();
    
    if (trimmed.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }
    
    if (trimmed.length > 20) {
      return NextResponse.json(
        { error: "Username must be 20 characters or less" },
        { status: 400 }
      );
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      return NextResponse.json(
        { error: "Username can only contain letters, numbers, underscores, and hyphens" },
        { status: 400 }
      );
    }

    // Check if username is available
    const isAvailable = await checkUsernameAvailable(trimmed);
    
    if (!isAvailable) {
      // If username exists, return the existing user (simple login)
      const existingUser = await getUserByUsername(trimmed);
      if (existingUser) {
        return NextResponse.json({ user: existingUser });
      }
      
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 }
      );
    }

    // Create new user
    const user = await createUser(trimmed);

    if (!user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
