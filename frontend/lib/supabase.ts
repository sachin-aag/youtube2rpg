import { createClient } from "@supabase/supabase-js";

// Database types for our schema
export interface Game {
  id: string;
  title: string;
  subtitle: string | null;
  thumbnail_url: string | null;
  total_chapters: number;
  created_at: string;
  status: "processing" | "ready" | "error";
}

export interface Chapter {
  id: string;
  game_id: string;
  chapter_number: number;
  chapter_title: string;
  content_preview: string | null;
  created_at: string;
}

export interface Question {
  id: string;
  chapter_id: string;
  question_text: string;
  options: Array<{ id: string; text: string; correct: boolean }>;
  difficulty: "easy" | "medium" | "hard";
  explanation: string | null;
  question_type: "factual" | "opinion" | "conceptual" | "application";
  created_at: string;
}

// Supabase client for browser
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for games
export async function getGames(): Promise<Game[]> {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("status", "ready")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching games:", error);
    return [];
  }

  return data || [];
}

export async function getGameById(id: string): Promise<Game | null> {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching game:", error);
    return null;
  }

  return data;
}

export async function getChaptersForGame(gameId: string): Promise<Chapter[]> {
  const { data, error } = await supabase
    .from("chapters")
    .select("*")
    .eq("game_id", gameId)
    .order("chapter_number", { ascending: true });

  if (error) {
    console.error("Error fetching chapters:", error);
    return [];
  }

  return data || [];
}

export async function getQuestionsForChapter(chapterId: string): Promise<Question[]> {
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("chapter_id", chapterId);

  if (error) {
    console.error("Error fetching questions:", error);
    return [];
  }

  return data || [];
}

export async function createGame(game: Omit<Game, "id" | "created_at">): Promise<Game | null> {
  const { data, error } = await supabase
    .from("games")
    .insert(game)
    .select()
    .single();

  if (error) {
    console.error("Error creating game:", error);
    return null;
  }

  return data;
}

export async function updateGameStatus(
  gameId: string,
  status: Game["status"],
  updates?: Partial<Game>
): Promise<void> {
  const { error } = await supabase
    .from("games")
    .update({ status, ...updates })
    .eq("id", gameId);

  if (error) {
    console.error("Error updating game status:", error);
  }
}

export async function createChapter(chapter: Omit<Chapter, "id" | "created_at">): Promise<Chapter | null> {
  const { data, error } = await supabase
    .from("chapters")
    .insert(chapter)
    .select()
    .single();

  if (error) {
    console.error("Error creating chapter:", error);
    return null;
  }

  return data;
}

export async function createQuestions(
  questions: Array<Omit<Question, "id" | "created_at">>
): Promise<Question[]> {
  const { data, error } = await supabase
    .from("questions")
    .insert(questions)
    .select();

  if (error) {
    console.error("Error creating questions:", error);
    return [];
  }

  return data || [];
}

// Get questions for a specific game level (for gameplay)
export async function getQuestionsForGameLevel(
  gameId: string,
  level: number,
  npcIndex: number
): Promise<Question[]> {
  // Get all chapters for this game
  const chapters = await getChaptersForGame(gameId);
  
  // Calculate which chapter this corresponds to (4 NPCs per level)
  const chapterIndex = (level - 1) * 4 + npcIndex;
  
  if (chapterIndex >= chapters.length) {
    return [];
  }
  
  const chapter = chapters[chapterIndex];
  return getQuestionsForChapter(chapter.id);
}
