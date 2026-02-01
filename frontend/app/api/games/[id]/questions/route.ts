import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Supabase client for server-side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET /api/games/[id]/questions?level=1&npc=0 - Get questions for a specific level and NPC
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const level = parseInt(searchParams.get("level") || "1", 10);
    const npcIndex = parseInt(searchParams.get("npc") || "0", 10);

    // Get all chapters for this game ordered by chapter number
    const { data: chapters, error: chaptersError } = await supabase
      .from("chapters")
      .select("id, chapter_number, chapter_title")
      .eq("game_id", id)
      .order("chapter_number", { ascending: true });

    if (chaptersError || !chapters) {
      return NextResponse.json({ error: "Failed to fetch chapters" }, { status: 500 });
    }

    // Calculate which chapter this corresponds to (4 NPCs per level)
    const chapterIndex = (level - 1) * 4 + npcIndex;

    if (chapterIndex >= chapters.length) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    const chapter = chapters[chapterIndex];

    // Get questions for this chapter
    const { data: questions, error: questionsError } = await supabase
      .from("questions")
      .select("*")
      .eq("chapter_id", chapter.id);

    if (questionsError) {
      return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
    }

    // Format questions to match existing game format
    const formattedQuestions = (questions || []).map((q, index) => ({
      id: index + 1,
      type: q.question_type,
      difficulty: q.difficulty,
      question: q.question_text,
      options: q.options,
      explanation: q.explanation,
    }));

    return NextResponse.json({
      chapter_title: chapter.chapter_title,
      chapter_number: chapter.chapter_number,
      questions: formattedQuestions,
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
