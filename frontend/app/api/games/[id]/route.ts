import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Supabase client for server-side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET /api/games/[id] - Get game details with chapters
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get game
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("*")
      .eq("id", id)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Get chapters with questions
    const { data: chapters, error: chaptersError } = await supabase
      .from("chapters")
      .select(`
        *,
        questions (*)
      `)
      .eq("game_id", id)
      .order("chapter_number", { ascending: true });

    if (chaptersError) {
      console.error("Error fetching chapters:", chaptersError);
      return NextResponse.json({ error: chaptersError.message }, { status: 500 });
    }

    return NextResponse.json({
      ...game,
      chapters: chapters || [],
    });
  } catch (error) {
    console.error("Error fetching game:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
