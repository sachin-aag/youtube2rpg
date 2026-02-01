import { createClient } from "@supabase/supabase-js";

// Database types for our schema
export interface User {
  id: string;
  username: string;
  created_at: string;
}

export interface Game {
  id: string;
  title: string;
  subtitle: string | null;
  thumbnail_url: string | null;
  total_chapters: number;
  created_at: string;
  status: "processing" | "ready" | "error";
  creator_id: string | null;
  is_public: boolean;
}

export interface UserProgress {
  id: string;
  user_id: string;
  game_id: string;
  current_level: number;
  defeated_npcs: string[];
  last_played_at: string;
  created_at: string;
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

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  game_id: string;
  score: number;
  current_level: number;
  total_npcs_defeated: number;
  updated_at: string;
  created_at: string;
  is_completed: boolean;
}

export interface LeaderboardEntryWithUser extends LeaderboardEntry {
  users: {
    username: string;
  };
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

// User helper functions
export async function getUserByUsername(username: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (error) {
    // Not found is expected for new users
    if (error.code !== "PGRST116") {
      console.error("Error fetching user:", error);
    }
    return null;
  }

  return data;
}

export async function createUser(username: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .insert({ username })
    .select()
    .single();

  if (error) {
    console.error("Error creating user:", error);
    return null;
  }

  return data;
}

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .single();

  if (error && error.code === "PGRST116") {
    // Not found means available
    return true;
  }

  return !data;
}

// Progress helper functions
export async function getUserProgress(
  userId: string,
  gameId: string
): Promise<UserProgress | null> {
  const { data, error } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("game_id", gameId)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("Error fetching progress:", error);
    }
    return null;
  }

  return data;
}

export async function getAllUserProgress(userId: string): Promise<UserProgress[]> {
  const { data, error } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching all progress:", error);
    return [];
  }

  return data || [];
}

export async function saveUserProgress(
  userId: string,
  gameId: string,
  currentLevel: number,
  defeatedNpcs: string[]
): Promise<UserProgress | null> {
  const { data, error } = await supabase
    .from("user_progress")
    .upsert(
      {
        user_id: userId,
        game_id: gameId,
        current_level: currentLevel,
        defeated_npcs: defeatedNpcs,
        last_played_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,game_id",
      }
    )
    .select()
    .single();

  if (error) {
    console.error("Error saving progress:", error);
    return null;
  }

  return data;
}

// Get games with filters for public/private and creator
export async function getPublicGames(): Promise<Game[]> {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("status", "ready")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching public games:", error);
    return [];
  }

  return data || [];
}

export async function getGamesByCreator(creatorId: string): Promise<Game[]> {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("status", "ready")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching creator games:", error);
    return [];
  }

  return data || [];
}

// Leaderboard helper functions

// Featured game IDs (string IDs, not UUIDs)
const FEATURED_GAME_IDS = ["1", "2", "3"];

export function isFeaturedGame(gameId: string): boolean {
  return FEATURED_GAME_IDS.includes(gameId);
}

export function isCommunityGame(gameId: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(gameId);
}

export async function getLeaderboard(
  gameId: string,
  limit: number = 50
): Promise<LeaderboardEntryWithUser[]> {
  const { data, error } = await supabase
    .from("leaderboard_entries")
    .select(`
      *,
      users (
        username
      )
    `)
    .eq("game_id", gameId)
    .order("score", { ascending: false })
    .order("updated_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }

  return (data as LeaderboardEntryWithUser[]) || [];
}

export async function getUserLeaderboardEntry(
  userId: string,
  gameId: string
): Promise<LeaderboardEntry | null> {
  const { data, error } = await supabase
    .from("leaderboard_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("game_id", gameId)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("Error fetching leaderboard entry:", error);
    }
    return null;
  }

  return data;
}

export async function saveLeaderboardEntry(
  userId: string,
  gameId: string,
  score: number,
  currentLevel: number,
  totalNpcsDefeated: number,
  isCompleted: boolean = false
): Promise<LeaderboardEntry | null> {
  const { data, error } = await supabase
    .from("leaderboard_entries")
    .upsert(
      {
        user_id: userId,
        game_id: gameId,
        score,
        current_level: currentLevel,
        total_npcs_defeated: totalNpcsDefeated,
        is_completed: isCompleted,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,game_id",
      }
    )
    .select()
    .single();

  if (error) {
    console.error("Error saving leaderboard entry:", error);
    return null;
  }

  return data;
}

export async function getUserRank(
  userId: string,
  gameId: string
): Promise<number | null> {
  // Get all entries for this game ordered by score
  const { data, error } = await supabase
    .from("leaderboard_entries")
    .select("user_id, score")
    .eq("game_id", gameId)
    .order("score", { ascending: false })
    .order("updated_at", { ascending: true });

  if (error) {
    console.error("Error fetching user rank:", error);
    return null;
  }

  const rank = data?.findIndex((entry) => entry.user_id === userId);
  return rank !== undefined && rank >= 0 ? rank + 1 : null;
}
