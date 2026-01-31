// Game state management for level progression

// All question files organized for levels (4 per level)
export const QUESTION_FILES = [
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

export const NPCS_PER_LEVEL = 4;
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

export function getStorageKey(gameId: string): string {
  return `${STORAGE_KEY_PREFIX}${gameId}`;
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

export function saveGameState(state: GameState): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(getStorageKey(state.gameId), JSON.stringify(state));
  } catch {
    // Storage full or unavailable
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
  return state.level > TOTAL_LEVELS;
}

export function getQuestionFileForNpc(level: number, npcId: NpcId): string | null {
  const npcIndex = NPC_IDS.indexOf(npcId);
  
  // Invalid NPC ID
  if (npcIndex === -1) {
    return null;
  }
  
  const fileIndex = (level - 1) * NPCS_PER_LEVEL + npcIndex;

  // Out of bounds check
  if (fileIndex < 0 || fileIndex >= QUESTION_FILES.length) {
    return null;
  }

  return QUESTION_FILES[fileIndex];
}

export function getNpcNameFromFile(questionsFile: string | null | undefined): string {
  if (!questionsFile) {
    return "Unknown Expert";
  }
  
  // Extract a readable name from the filename
  // Format: "/questions/001_How to Improve Memory  Focus..._videoId_questions.json"
  const filename = questionsFile.split("/").pop() || "";
  const match = filename.match(/^\d+_(.+?)_[a-zA-Z0-9_-]+_questions\.json$/);
  if (match) {
    // Clean up the name (replace double spaces, truncate if too long)
    let name = match[1].replace(/  /g, " ").trim();
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
