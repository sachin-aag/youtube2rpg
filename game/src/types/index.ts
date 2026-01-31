// Question types matching the generated JSON structure
export interface QuestionOption {
  id: string;
  text: string;
  correct: boolean;
}

export interface Question {
  id: number;
  type: 'factual' | 'opinion';
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: QuestionOption[];
  explanation: string;
}

export interface GuestData {
  video_id: string;
  title: string;
  url: string;
  channel?: string;
  thumbnail?: string;
  duration: number;
  guest: string | null;
  summary?: string;
  key_takeaways?: string[];
  questions: Question[];
}

// Game state types
export interface PlayerStats {
  hp: number;
  maxHp: number;
  xp: number;
  level: number;
}

export interface GuestProgress {
  guestId: string;
  encountered: boolean;
  defeated: boolean;
  questionsAnswered: number;
  questionsCorrect: number;
  attempts: number;
}

export interface CheckpointData {
  id: string;
  name: string;
  requiredGuests: string[];
  requiredCorrectPercentage: number;
  unlocked: boolean;
  position: { x: number; y: number };
}

export interface GameState {
  player: PlayerStats;
  guests: Map<string, GuestProgress>;
  checkpoints: CheckpointData[];
  currentCheckpoint: string;
  totalCaptured: number;
  totalGuests: number;
}

// Difficulty scoring constants
export const SCORING = {
  XP_GAIN: {
    easy: 10,
    medium: 20,
    hard: 30,
  },
  HP_PENALTY: {
    easy: 15,
    medium: 10,
    hard: 5,
  },
  COMBO_BONUS: 10,
  XP_PER_LEVEL: 200,
} as const;

// NPC/Guest display info
export interface GuestDisplayInfo {
  id: string;
  name: string;
  title: string;
  position: { x: number; y: number };
  spriteColor: number;
}
