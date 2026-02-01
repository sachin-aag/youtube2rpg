import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Supabase client for server-side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET /api/games - List games with filters
// Query params:
// - filter: "public" | "mine" | "all" (default: "all")
// - username: required for "mine" filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all";
    const username = searchParams.get("username");

    // Look up user ID if username provided
    let userId: string | null = null;
    if (username) {
      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("username", username)
        .single();
      if (user) {
        userId = user.id;
      }
    }

    let query = supabase
      .from("games")
      .select("*")
      .eq("status", "ready")
      .order("created_at", { ascending: false });

    // Apply filters
    if (filter === "public") {
      query = query.eq("is_public", true);
    } else if (filter === "mine" && userId) {
      query = query.eq("creator_id", userId);
    } else if (filter === "all" && userId) {
      // Show public games OR user's own games (including private ones)
      query = query.or(`is_public.eq.true,creator_id.eq.${userId}`);
    } else {
      // No user - show only public games
      query = query.eq("is_public", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching games:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error fetching games:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// DELETE /api/games?id=xxx - Delete a game
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Game ID required" }, { status: 400 });
    }

    const { error } = await supabase.from("games").delete().eq("id", id);

    if (error) {
      console.error("Error deleting game:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting game:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
