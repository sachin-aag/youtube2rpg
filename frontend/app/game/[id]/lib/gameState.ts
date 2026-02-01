// Game state management for level progression

// Game configurations for different content sources
export interface GameConfig {
  id: string;
  title: string;
  questionFiles: string[];
  completionMessage: string;
  isUserCreated?: boolean;
  totalChapters?: number;
}

// Check if game ID is a UUID (user-created game from Supabase)
export function isUserCreatedGame(gameId: string): boolean {
  // UUID format: 8-4-4-4-12 hex characters
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(gameId);
}

// Cache for user-created game metadata
const userGameCache = new Map<string, { totalChapters: number; title: string }>();

// Fetch user-created game metadata from API
export async function fetchUserGameMetadata(gameId: string): Promise<{ totalChapters: number; title: string } | null> {
  // Check cache first
  if (userGameCache.has(gameId)) {
    return userGameCache.get(gameId)!;
  }

  try {
    const response = await fetch(`/api/games/${gameId}`);
    if (response.ok) {
      const game = await response.json();
      const metadata = {
        totalChapters: game.total_chapters || game.chapters?.length || 0,
        title: game.title,
      };
      userGameCache.set(gameId, metadata);
      return metadata;
    }
  } catch (error) {
    console.error("Failed to fetch game metadata:", error);
  }
  return null;
}

// Huberman Lab questions (all question files organized for levels - 4 per level)
const HUBERMAN_QUESTIONS = [
  // Level 1
  "/questions/001_How to Improve Memory  Focus Using Science Protoco_jC8Pu9HBd48_questions.json",
  "/questions/001_Using Play to Rewire  Improve Your Brain  Huberman_BRG4_KfTxbs_questions.json",
  "/questions/002_How to Heal From Post-Traumatic Stress Disorder PT_4RFEkGKKhdE_questions.json",
  "/questions/002_Science  Tools of Learning  Memory  Dr David Eagle_lEULFeUVYf0_questions.json",
  // Level 2
  "/questions/003_Dr Matt Walker Improve Sleep to Boost Mood  Emotio_S_SrHS8FvMM_questions.json",
  "/questions/003_Essentials Therapy Treating Trauma  Other Life Cha_iNL_BFlHYZ8_questions.json",
  "/questions/004_Build Muscle  Strength  Forge Your Life Path  Dori_qzXU390N3vs_questions.json",
  "/questions/004_Dr Paul Conti How to Improve Your Mental Health  H_qPKd99Pa2iU_questions.json",
  // Level 3
  "/questions/005_Erasing Fears  Traumas Based on the Modern Neurosc_31wjVhCcI5Y_questions.json",
  "/questions/005_Essentials Tools to Boost Attention  Memory  Dr We_RmwbNdyrilk_questions.json",
  "/questions/006_How to Overcome Addiction to Substances or Behavio_t6RCTP4fc9Q_questions.json",
  "/questions/007_Optimizing Workspace for Productivity Focus  Creat_23t_ynq2tmk_questions.json",
  // Level 4
  "/questions/008_Best Ways to Build Better Habits  Break Bad Ones_bdsc3Spm6Sw_questions.json",
  "/questions/009_Essentials Micronutrients for Health  Longevity  D_fh2dBmLN-ZM_questions.json",
  "/questions/010_Defining Healthy Masculinity  How to Build It  Ter_qGb7hYMlA3o_questions.json",
  "/questions/011_Essentials How to Optimize Your Hormones for Healt_fYhY-vC000A_questions.json",
  // Level 5
  "/questions/012_Transform Pain  Trauma Into Creative Expression  D_zHyvVajsqMw_questions.json",
  "/questions/013_How to Set  Achieve Goals  Huberman Lab Essentials_zYuw-8pwnp8_questions.json",
  "/questions/014_Improve Energy  Longevity by Optimizing Mitochondr_nMkQUlBtFlk_questions.json",
  "/questions/015_Essentials Build a Healthy Gut Microbiome  Dr Just_n_MVhE63ZQQ_questions.json",
  // Level 6
  "/questions/016_Master the Creative Process  Twyla Tharp_VnPQ4mLRG-c_questions.json",
  "/questions/017_The Science of Making  Breaking Habits  Huberman L_HXuj7wAt7u8_questions.json",
  "/questions/018_Dr Glen Jeffery Using Red Light to Improve Your He_iT8W6kaD-RA_questions.json",
  "/questions/019_Essentials Using Hypnosis to Enhance Mental  Physi_SOo4yNoaAoc_questions.json",
  // Level 7
  "/questions/020_Female Hormone Health PCOS Endometriosis Fertility_hMzfGZnaPN8_questions.json",
  "/questions/021_Essentials Science of Building Strong Social Bonds_25PtptE7mWk_questions.json",
  "/questions/022_How to Speak Clearly  With Confidence  Matt Abraha_ZtTUfMHuioA_questions.json",
  "/questions/023_Essentials Breathing for Mental  Physical Health_Y3NUEPNZDMA_questions.json",
  // Level 8
  "/questions/024_How Your Thoughts Are Built  How You Can Shape The_tb6ApBIXr1k_questions.json",
  "/questions/025_Erasing Fears  Traumas Using Modern Neuroscience_tpntW9Tte4M_questions.json",
  "/questions/026_How A Doctor Cured His Own Terminal Disease  Dr Da_PCbD3hFyfCk_questions.json",
  "/questions/027_Essentials The Biology of Slowing  Reversing Aging_Ykvkg2Jz3X8_questions.json",
  // Level 9
  "/questions/028_Improve Your Lymphatic System for Overall Health_KBkl3I645c8_questions.json",
  "/questions/029_The Science of Gratitude  How to Build a Gratitude_9gJLWk3W5GQ_questions.json",
  "/questions/030_How to Overcome Inner Resistance  Steven Pressfiel_cpKsogGdem4_questions.json",
  "/questions/032_Protect  Improve Your Hearing  Brain Health  Dr Ko_xGmGBFpmdhQ_questions.json",
  // Level 10
  "/questions/033_Time Perception Memory  Focus  Huberman Lab Essent_vXTK0Ac9i1Q_questions.json",
  "/questions/034_How to Make Yourself Unbreakable  DJ Shipley_WwRc2SEo-VI_questions.json",
  "/questions/035_Essentials How Humans Select  Keep Romantic Partne_VqiPNN4Jblk_questions.json",
  "/questions/036_Enhance Your Learning Speed  Health Using Neurosci_MlmFj1-mOtg_questions.json",
  // Level 11
  "/questions/037_Using Your Nervous System to Enhance Your Immune S_pN1UL1M9sqc_questions.json",
  "/questions/038_Build Your Ideal Physique  Dr Bret Contreras_7SIjcX5B1Vs_questions.json",
  "/questions/039_Essentials How to Exercise for Strength Gains  Hor_dy_iLCJggO0_questions.json",
  "/questions/040_How to Expand Your Consciousness  Dr Christof Koch_2t4vswC-3mY_questions.json",
  // Level 12
  "/questions/041_Food  Supplements for Brain Health  Cognitive Perf_cIla9axQRyM_questions.json",
  "/questions/042_Transform Your Metabolic Health  Longevity by Know_cjAvD-U5so0_questions.json",
  "/questions/043_Essentials Science of Mindsets for Health  Perform_alVWRl_X_AA_questions.json",
  "/questions/044_How to Set  Achieve Massive Goals  Alex Honnold_4TsOnsPDKKY_questions.json",
  // Level 13
  "/questions/045_Effects of Fasting  Time Restricted Eating on Fat_D61jJJPIQeo_questions.json",
  "/questions/047_Essentials Timing Light for Better Sleep Energy  M_2XMb3MD6g6Q_questions.json",
  "/questions/048_Curing Autism Epilepsy  Schizophrenia with Stem Ce_H4mMZ0vliMo_questions.json",
  "/questions/049_Controlling Your Dopamine for Motivation Focus  Sa_XeN6eGO6FVQ_questions.json",
  // Level 14
  "/questions/050_How to Rewire Your Brain  Learn Faster  Dr Michael_rcAyjg-oy84_questions.json",
  "/questions/051_Essentials Increase Strength  Endurance with Cooli_aZklQpFa2kE_questions.json",
  "/questions/052_How to Control Your Cortisol  Overcome Burnout_Ibj1k3IZTNU_questions.json",
  "/questions/053_ADHD  How Anyone Can Improve Their Focus  Huberman_LAwBdRR4wQk_questions.json",
  // Level 15
  "/questions/054_Male vs Female Brain Differences  How They Arise F_k8SBJzsIWAo_questions.json",
  "/questions/055_Essentials Psychedelics for Treating Mental Disord_OvHbhzArbfE_questions.json",
  "/questions/056_Health Effects  Risks of Kratom Opioids  Other Nat_gyE6Z4GLEeM_questions.json",
  "/questions/057_Healthy Eating  Eating Disorders - Anorexia Bulimi_mJv1_esiJ8g_questions.json",
  // Level 16 (partial - only 2 files)
  "/questions/058_How Nature  Other Physical Environments Impact You_ewnvjnuFTOY_questions.json",
  "/questions/061_Understanding  Conquering Depression  Huberman Lab_HWcphoKlbxY_questions.json",
];

// Psychology of Money questions (by chapter)
const PSYCHOLOGY_OF_MONEY_QUESTIONS = [
  "/questions/psychology-of-money/00_Introduction_The_Greatest_Show_On_Earth.json",
  "/questions/psychology-of-money/01_No_Ones_Crazy.json",
  "/questions/psychology-of-money/02_Luck_and_Risk.json",
  "/questions/psychology-of-money/03_Never_Enough.json",
  "/questions/psychology-of-money/04_Confounding_Compounding.json",
  "/questions/psychology-of-money/05_Getting_Wealthy_vs_Staying_Wealthy.json",
  "/questions/psychology-of-money/06_Tails_You_Win.json",
  "/questions/psychology-of-money/07_Freedom.json",
  "/questions/psychology-of-money/08_Man_in_the_Car_Paradox.json",
  "/questions/psychology-of-money/09_Wealth_is_What_You_Dont_See.json",
  "/questions/psychology-of-money/10_Save_Money.json",
  "/questions/psychology-of-money/11_Reasonable_Greater_Than_Rational.json",
  "/questions/psychology-of-money/12_Surprise.json",
  "/questions/psychology-of-money/13_Room_for_Error.json",
  "/questions/psychology-of-money/14_Youll_Change.json",
  "/questions/psychology-of-money/15_Nothings_Free.json",
  "/questions/psychology-of-money/16_You_and_Me.json",
  "/questions/psychology-of-money/17_The_Seduction_of_Pessimism.json",
  "/questions/psychology-of-money/18_When_Youll_Believe_Anything.json",
  "/questions/psychology-of-money/19_All_Together_Now.json",
  "/questions/psychology-of-money/20_Confessions.json",
  "/questions/psychology-of-money/21_Postscript_A_Brief_History.json",
];

// Learning Cursor questions (by documentation page)
const LEARNING_CURSOR_QUESTIONS = [
  "/questions/learning-cursor/01_Concepts.json",
  "/questions/learning-cursor/02_Agent_Overview.json",
  "/questions/learning-cursor/03_Agent_Modes.json",
  "/questions/learning-cursor/04_Agent_Review.json",
  "/questions/learning-cursor/05_Agent_Terminal.json",
  "/questions/learning-cursor/06_Agent_Browser.json",
  "/questions/learning-cursor/07_Agent_Security.json",
  "/questions/learning-cursor/08_Agent_Hooks.json",
  "/questions/learning-cursor/09_Rules.json",
  "/questions/learning-cursor/10_Commands.json",
  "/questions/learning-cursor/11_Skills.json",
  "/questions/learning-cursor/12_Subagents.json",
  "/questions/learning-cursor/13_Semantic_Search.json",
  "/questions/learning-cursor/14_MCP.json",
  "/questions/learning-cursor/15_Tab.json",
  "/questions/learning-cursor/16_Cloud_Agents.json",
  "/questions/learning-cursor/17_CLI.json",
  "/questions/learning-cursor/18_Bugbot.json",
  "/questions/learning-cursor/19_Shared_Transcripts.json",
  "/questions/learning-cursor/20_Agent_Workflows.json",
  "/questions/learning-cursor/21_Building_MCP_Server.json",
  "/questions/learning-cursor/22_Web_Development.json",
  "/questions/learning-cursor/23_Data_Science.json",
  "/questions/learning-cursor/24_Large_Codebases.json",
  "/questions/learning-cursor/25_Mermaid_Diagrams.json",
  "/questions/learning-cursor/26_Bugbot_Rules.json",
];

// Game configurations
export const GAME_CONFIGS: Record<string, GameConfig> = {
  "1": {
    id: "1",
    title: "Huberman Lab",
    questionFiles: HUBERMAN_QUESTIONS,
    completionMessage: "You've mastered all the knowledge from Huberman Lab.",
  },
  "2": {
    id: "2",
    title: "The Psychology of Money",
    questionFiles: PSYCHOLOGY_OF_MONEY_QUESTIONS,
    completionMessage: "You've mastered The Psychology of Money by Morgan Housel!",
  },
  "3": {
    id: "3",
    title: "Learning Cursor",
    questionFiles: LEARNING_CURSOR_QUESTIONS,
    completionMessage: "You've mastered Cursor! Now go build something amazing with AI-assisted coding.",
  },
};

// Default config for unknown game IDs
const DEFAULT_CONFIG: GameConfig = {
  id: "default",
  title: "Unknown Game",
  questionFiles: HUBERMAN_QUESTIONS,
  completionMessage: "You've completed the game!",
};

export function getGameConfig(gameId: string): GameConfig {
  // For user-created games, return a placeholder config
  if (isUserCreatedGame(gameId)) {
    const cached = userGameCache.get(gameId);
    return {
      id: gameId,
      title: cached?.title || "Your Game",
      questionFiles: [], // Questions fetched from API
      completionMessage: "Congratulations! You've completed this game!",
      isUserCreated: true,
      totalChapters: cached?.totalChapters || 0,
    };
  }
  
  return GAME_CONFIGS[gameId] || DEFAULT_CONFIG;
}

// Async version that fetches metadata for user-created games
export async function getGameConfigAsync(gameId: string): Promise<GameConfig> {
  if (isUserCreatedGame(gameId)) {
    const metadata = await fetchUserGameMetadata(gameId);
    return {
      id: gameId,
      title: metadata?.title || "Your Game",
      questionFiles: [],
      completionMessage: "Congratulations! You've completed this game!",
      isUserCreated: true,
      totalChapters: metadata?.totalChapters || 0,
    };
  }
  
  return getGameConfig(gameId);
}

// Helper to get question files for a specific game
export function getQuestionFilesForGame(gameId: string): string[] {
  // User-created games don't have static question files
  if (isUserCreatedGame(gameId)) {
    return [];
  }
  return getGameConfig(gameId).questionFiles;
}

// Keep QUESTION_FILES for backward compatibility (defaults to Huberman)
export const QUESTION_FILES = HUBERMAN_QUESTIONS;

export const NPCS_PER_LEVEL = 4;

// Dynamic total levels based on game
export function getTotalLevels(gameId: string): number {
  // For user-created games, we need to fetch from cache or use a default
  if (isUserCreatedGame(gameId)) {
    const cached = userGameCache.get(gameId);
    if (cached) {
      return Math.ceil(cached.totalChapters / NPCS_PER_LEVEL);
    }
    // Will be updated after metadata is fetched
    return 1;
  }
  
  const files = getQuestionFilesForGame(gameId);
  return Math.ceil(files.length / NPCS_PER_LEVEL);
}

// Async version for user-created games
export async function getTotalLevelsAsync(gameId: string): Promise<number> {
  if (isUserCreatedGame(gameId)) {
    const metadata = await fetchUserGameMetadata(gameId);
    if (metadata) {
      return Math.ceil(metadata.totalChapters / NPCS_PER_LEVEL);
    }
    return 1;
  }
  
  return getTotalLevels(gameId);
}

// Keep static TOTAL_LEVELS for backward compatibility
export const TOTAL_LEVELS = Math.ceil(QUESTION_FILES.length / NPCS_PER_LEVEL);

// NPC IDs in order
export const NPC_IDS = ["red", "blue", "green", "yellow"] as const;
export type NpcId = (typeof NPC_IDS)[number];

// NPC display info (constant across levels)
export const NPC_INFO: Record<NpcId, { spriteCol: number; spriteRow: number }> = {
  red: { spriteCol: 2, spriteRow: 0 },
  blue: { spriteCol: 3, spriteRow: 0 },
  green: { spriteCol: 4, spriteRow: 0 },
  yellow: { spriteCol: 5, spriteRow: 0 },
};

export interface GameState {
  level: number;
  defeatedNpcs: NpcId[];
  gameId: string;
}

const STORAGE_KEY_PREFIX = "youtube2rpg_game_state_";
const USERNAME_STORAGE_KEY = "youtube2rpg_username";

export function getStorageKey(gameId: string): string {
  return `${STORAGE_KEY_PREFIX}${gameId}`;
}

// Get username from localStorage (used for database sync)
function getStoredUsername(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USERNAME_STORAGE_KEY);
}

export function getGameState(gameId: string): GameState {
  if (typeof window === "undefined") {
    return { level: 1, defeatedNpcs: [], gameId };
  }

  try {
    const stored = sessionStorage.getItem(getStorageKey(gameId));
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...parsed, gameId };
    }
  } catch {
    // Invalid data
  }

  return { level: 1, defeatedNpcs: [], gameId };
}

// Async version that loads from database first, then falls back to local
export async function getGameStateAsync(gameId: string): Promise<GameState> {
  const username = getStoredUsername();
  
  // If no username, just use local state
  if (!username) {
    return getGameState(gameId);
  }

  // Only sync user-created games to database
  if (!isUserCreatedGame(gameId)) {
    return getGameState(gameId);
  }

  try {
    const response = await fetch(
      `/api/progress?username=${encodeURIComponent(username)}&gameId=${gameId}`
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.progress) {
        const state: GameState = {
          level: data.progress.current_level,
          defeatedNpcs: data.progress.defeated_npcs || [],
          gameId,
        };
        // Update local cache
        saveGameStateLocal(state);
        return state;
      }
    }
  } catch (error) {
    console.error("Failed to load progress from database:", error);
  }

  // Fall back to local state
  return getGameState(gameId);
}

// Save only to local storage (no database sync)
function saveGameStateLocal(state: GameState): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(getStorageKey(state.gameId), JSON.stringify(state));
  } catch {
    // Storage full or unavailable
  }
}

// Save to both local storage and database
export function saveGameState(state: GameState): void {
  // Always save locally first for immediate UI updates
  saveGameStateLocal(state);
  
  // Sync to database in background (only for user-created games)
  syncToDatabase(state);
}

// Sync state to database (non-blocking)
async function syncToDatabase(state: GameState): Promise<void> {
  const username = getStoredUsername();
  
  // Only sync if we have a username and it's a user-created game
  if (!username || !isUserCreatedGame(state.gameId)) {
    return;
  }

  try {
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        gameId: state.gameId,
        currentLevel: state.level,
        defeatedNpcs: state.defeatedNpcs,
      }),
    });
  } catch (error) {
    console.error("Failed to sync progress to database:", error);
    // Silent fail - local state is still saved
  }
}

export function markNpcDefeated(gameId: string, npcId: NpcId): GameState {
  const state = getGameState(gameId);

  // Don't add if already defeated
  if (state.defeatedNpcs.includes(npcId)) {
    return state;
  }

  state.defeatedNpcs.push(npcId);
  saveGameState(state);

  return state;
}

export function advanceLevel(gameId: string): GameState {
  const state = getGameState(gameId);

  // Check if all NPCs defeated
  if (state.defeatedNpcs.length >= NPCS_PER_LEVEL) {
    state.level += 1;
    state.defeatedNpcs = [];
    saveGameState(state);
    // Clear saved position so player starts fresh at new level
    clearPlayerPosition(gameId);
  }

  return state;
}

export function isLevelComplete(gameId: string): boolean {
  const state = getGameState(gameId);
  return state.defeatedNpcs.length >= NPCS_PER_LEVEL;
}

export function isGameComplete(gameId: string): boolean {
  const state = getGameState(gameId);
  const totalLevels = getTotalLevels(gameId);
  return state.level > totalLevels;
}

// Async version for user-created games
export async function isGameCompleteAsync(gameId: string): Promise<boolean> {
  const state = getGameState(gameId);
  const totalLevels = await getTotalLevelsAsync(gameId);
  return state.level > totalLevels;
}

export function getQuestionFileForNpc(level: number, npcId: NpcId, gameId?: string): string | null {
  const npcIndex = NPC_IDS.indexOf(npcId);
  
  // Invalid NPC ID
  if (npcIndex === -1) {
    return null;
  }
  
  // Use game-specific question files if gameId provided
  const questionFiles = gameId ? getQuestionFilesForGame(gameId) : QUESTION_FILES;
  
  const fileIndex = (level - 1) * NPCS_PER_LEVEL + npcIndex;

  // Out of bounds check
  if (fileIndex < 0 || fileIndex >= questionFiles.length) {
    return null;
  }

  return questionFiles[fileIndex];
}

export function getNpcNameFromFile(questionsFile: string | null | undefined): string {
  if (!questionsFile) {
    return "Unknown Expert";
  }
  
  const filename = questionsFile.split("/").pop() || "";
  
  // Check if it's a Psychology of Money chapter
  // Format: "00_Introduction_The_Greatest_Show_On_Earth.json"
  const pomMatch = filename.match(/^\d{2}_(.+)\.json$/);
  if (pomMatch) {
    // Clean up the name (replace underscores with spaces, truncate if too long)
    let name = pomMatch[1].replace(/_/g, " ").trim();
    if (name.length > 30) {
      name = name.substring(0, 27) + "...";
    }
    return name;
  }
  
  // Check if it's a Huberman Lab episode
  // Format: "/questions/001_How to Improve Memory  Focus..._videoId_questions.json"
  const hubermanMatch = filename.match(/^\d+_(.+?)_[a-zA-Z0-9_-]+_questions\.json$/);
  if (hubermanMatch) {
    // Clean up the name (replace double spaces, truncate if too long)
    let name = hubermanMatch[1].replace(/  /g, " ").trim();
    if (name.length > 30) {
      name = name.substring(0, 27) + "...";
    }
    return name;
  }
  
  return "Unknown Expert";
}

// Cache for user game chapter names
const chapterNameCache = new Map<string, string[]>();

// Fetch chapter names for user-created games
export async function fetchChapterNames(gameId: string): Promise<string[]> {
  if (chapterNameCache.has(gameId)) {
    return chapterNameCache.get(gameId)!;
  }

  try {
    const response = await fetch(`/api/games/${gameId}`);
    if (response.ok) {
      const game = await response.json();
      const names = (game.chapters || []).map((c: { chapter_title: string }) => c.chapter_title);
      chapterNameCache.set(gameId, names);
      return names;
    }
  } catch (error) {
    console.error("Failed to fetch chapter names:", error);
  }
  return [];
}

// Get NPC name for user-created games (async)
export async function getNpcNameAsync(
  level: number,
  npcId: NpcId,
  gameId: string
): Promise<string> {
  if (!isUserCreatedGame(gameId)) {
    const questionsFile = getQuestionFileForNpc(level, npcId, gameId);
    return getNpcNameFromFile(questionsFile);
  }

  // For user-created games, fetch chapter names from API
  const npcIndex = NPC_IDS.indexOf(npcId);
  if (npcIndex === -1) return "Unknown Expert";

  const chapterIndex = (level - 1) * NPCS_PER_LEVEL + npcIndex;
  const chapterNames = await fetchChapterNames(gameId);

  if (chapterIndex < chapterNames.length) {
    let name = chapterNames[chapterIndex];
    if (name.length > 30) {
      name = name.substring(0, 27) + "...";
    }
    return name;
  }

  return "Unknown Expert";
}

export function resetGameState(gameId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(getStorageKey(gameId));
  clearPlayerPosition(gameId);
}

export function clearPlayerPosition(gameId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(`game-position-${gameId}`);
}
