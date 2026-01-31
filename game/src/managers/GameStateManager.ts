import { GameState, PlayerStats, GuestProgress, CheckpointData, SCORING } from '../types';

const STORAGE_KEY = 'hubermanrpg_save';
const INITIAL_HP = 100;
const INITIAL_MAX_HP = 100;

class GameStateManagerClass {
  private state: GameState;
  private static instance: GameStateManagerClass;

  private constructor() {
    this.state = this.createInitialState();
  }

  public static getInstance(): GameStateManagerClass {
    if (!GameStateManagerClass.instance) {
      GameStateManagerClass.instance = new GameStateManagerClass();
    }
    return GameStateManagerClass.instance;
  }

  private createInitialState(): GameState {
    return {
      player: {
        hp: INITIAL_HP,
        maxHp: INITIAL_MAX_HP,
        xp: 0,
        level: 1,
      },
      guests: new Map<string, GuestProgress>(),
      checkpoints: this.createCheckpoints(),
      currentCheckpoint: 'start',
      totalCaptured: 0,
      totalGuests: 63, // Approximate number of guests
    };
  }

  private createCheckpoints(): CheckpointData[] {
    return [
      {
        id: 'start',
        name: 'Starting Area',
        requiredGuests: [],
        requiredCorrectPercentage: 0,
        unlocked: true,
        position: { x: 20, y: 15 },
      },
      {
        id: 'checkpoint1',
        name: 'Science Zone',
        requiredGuests: [], // Will be populated based on area
        requiredCorrectPercentage: 60,
        unlocked: false,
        position: { x: 35, y: 15 },
      },
      {
        id: 'checkpoint2',
        name: 'Health District',
        requiredGuests: [],
        requiredCorrectPercentage: 60,
        unlocked: false,
        position: { x: 20, y: 5 },
      },
    ];
  }

  public initializeNewGame(): void {
    this.state = this.createInitialState();
    this.saveGame();
  }

  public getState(): GameState {
    return this.state;
  }

  public getPlayerStats(): PlayerStats {
    return { ...this.state.player };
  }

  // XP and Leveling
  public addXP(amount: number): void {
    this.state.player.xp += amount;
    
    // Check for level up
    const newLevel = Math.floor(this.state.player.xp / SCORING.XP_PER_LEVEL) + 1;
    
    if (newLevel > this.state.player.level) {
      this.levelUp(newLevel);
    }
    
    this.saveGame();
  }

  private levelUp(newLevel: number): void {
    const levelsGained = newLevel - this.state.player.level;
    this.state.player.level = newLevel;
    
    // Increase max HP on level up
    this.state.player.maxHp += levelsGained * 10;
    
    // Heal some HP on level up
    this.state.player.hp = Math.min(
      this.state.player.hp + levelsGained * 20,
      this.state.player.maxHp
    );
  }

  // HP Management
  public updateHP(amount: number): void {
    this.state.player.hp = Math.max(
      0,
      Math.min(this.state.player.hp + amount, this.state.player.maxHp)
    );
    this.saveGame();
  }

  public isPlayerDefeated(): boolean {
    return this.state.player.hp <= 0;
  }

  // Guest Progress
  public updateGuestProgress(
    guestId: string,
    progress: Partial<GuestProgress>
  ): void {
    const existing = this.state.guests.get(guestId) || {
      guestId,
      encountered: false,
      defeated: false,
      questionsAnswered: 0,
      questionsCorrect: 0,
      attempts: 0,
    };

    const updated: GuestProgress = {
      ...existing,
      ...progress,
      attempts: existing.attempts + 1,
    };

    this.state.guests.set(guestId, updated);

    // Update captured count
    if (updated.defeated && !existing.defeated) {
      this.state.totalCaptured++;
    }

    this.saveGame();
  }

  public getGuestProgress(guestId: string): GuestProgress | undefined {
    return this.state.guests.get(guestId);
  }

  public canRetryGuest(guestId: string): boolean {
    const progress = this.state.guests.get(guestId);
    if (!progress) return true;
    
    // Can retry if not all questions were correct
    return !progress.defeated || progress.questionsCorrect < progress.questionsAnswered;
  }

  // Checkpoint Management
  public canPassCheckpoint(checkpointId: string): { canPass: boolean; reason?: string } {
    const checkpoint = this.state.checkpoints.find(cp => cp.id === checkpointId);
    if (!checkpoint) {
      return { canPass: false, reason: 'Checkpoint not found' };
    }

    if (checkpoint.unlocked) {
      return { canPass: true };
    }

    // Check if all required guests are defeated
    const requiredGuests = this.getGuestsInArea(checkpointId);
    let totalQuestions = 0;
    let correctQuestions = 0;
    let allEncountered = true;

    requiredGuests.forEach(guestId => {
      const progress = this.state.guests.get(guestId);
      if (!progress || !progress.encountered) {
        allEncountered = false;
      } else {
        totalQuestions += progress.questionsAnswered;
        correctQuestions += progress.questionsCorrect;
      }
    });

    if (!allEncountered) {
      return { 
        canPass: false, 
        reason: 'You must talk to all guests in this area first!' 
      };
    }

    const correctPercentage = totalQuestions > 0 
      ? (correctQuestions / totalQuestions) * 100 
      : 0;

    if (correctPercentage < checkpoint.requiredCorrectPercentage) {
      return { 
        canPass: false, 
        reason: `You need ${checkpoint.requiredCorrectPercentage}% correct answers. Current: ${Math.floor(correctPercentage)}%` 
      };
    }

    // Unlock the checkpoint
    checkpoint.unlocked = true;
    this.state.currentCheckpoint = checkpointId;
    this.saveGame();

    return { canPass: true };
  }

  private getGuestsInArea(checkpointId: string): string[] {
    // This would be based on area definitions
    // For now, return guests based on checkpoint
    const checkpoint = this.state.checkpoints.find(cp => cp.id === checkpointId);
    return checkpoint?.requiredGuests || [];
  }

  public resetToCheckpoint(): void {
    const checkpoint = this.state.checkpoints.find(
      cp => cp.id === this.state.currentCheckpoint
    );

    // Reset HP to max
    this.state.player.hp = this.state.player.maxHp;

    // Keep XP and level
    // Keep guest progress but reset defeated status for incomplete attempts

    this.saveGame();
  }

  // Save/Load
  public saveGame(): void {
    const saveData = {
      player: this.state.player,
      guests: Array.from(this.state.guests.entries()),
      checkpoints: this.state.checkpoints,
      currentCheckpoint: this.state.currentCheckpoint,
      totalCaptured: this.state.totalCaptured,
      totalGuests: this.state.totalGuests,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
  }

  public loadGame(): boolean {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) return false;

    try {
      const data = JSON.parse(savedData);
      
      this.state = {
        player: data.player,
        guests: new Map(data.guests),
        checkpoints: data.checkpoints,
        currentCheckpoint: data.currentCheckpoint,
        totalCaptured: data.totalCaptured,
        totalGuests: data.totalGuests,
      };

      return true;
    } catch (e) {
      console.error('Failed to load save:', e);
      return false;
    }
  }

  public hasSavedGame(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }

  public deleteSave(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.createInitialState();
  }

  // Stats for display
  public getStats() {
    let totalQuestionsAnswered = 0;
    let totalQuestionsCorrect = 0;
    let guestsEncountered = 0;
    let guestsDefeated = 0;

    this.state.guests.forEach(progress => {
      totalQuestionsAnswered += progress.questionsAnswered;
      totalQuestionsCorrect += progress.questionsCorrect;
      if (progress.encountered) guestsEncountered++;
      if (progress.defeated) guestsDefeated++;
    });

    return {
      level: this.state.player.level,
      xp: this.state.player.xp,
      hp: this.state.player.hp,
      maxHp: this.state.player.maxHp,
      totalQuestionsAnswered,
      totalQuestionsCorrect,
      accuracy: totalQuestionsAnswered > 0 
        ? Math.round((totalQuestionsCorrect / totalQuestionsAnswered) * 100) 
        : 0,
      guestsEncountered,
      guestsDefeated,
      totalGuests: this.state.totalGuests,
    };
  }
}

// Export singleton instance
export const GameStateManager = GameStateManagerClass.getInstance();
