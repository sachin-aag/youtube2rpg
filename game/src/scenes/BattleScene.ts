import Phaser from 'phaser';
import { GuestData, GuestDisplayInfo, Question, SCORING } from '../types';
import { GameStateManager } from '../managers/GameStateManager';

interface BattleData {
  guest: GuestData;
  guestDisplayInfo: GuestDisplayInfo;
}

export class BattleScene extends Phaser.Scene {
  private guest!: GuestData;
  private guestDisplayInfo!: GuestDisplayInfo;
  private currentQuestionIndex: number = 0;
  private correctAnswers: number = 0;
  private questionsAnswered: number = 0;
  
  // UI Elements
  private playerHPBar!: Phaser.GameObjects.Graphics;
  private guestHPBar!: Phaser.GameObjects.Graphics;
  private questionContainer!: Phaser.GameObjects.Container;
  private feedbackContainer!: Phaser.GameObjects.Container;
  private playerHP: number = 100;
  private guestHP: number = 100;
  private guestMaxHP: number = 100;
  
  private answerButtons: Phaser.GameObjects.Container[] = [];
  private selectedAnswer: number = -1;
  private isShowingFeedback: boolean = false;

  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data: BattleData): void {
    this.guest = data.guest;
    this.guestDisplayInfo = data.guestDisplayInfo;
    this.currentQuestionIndex = 0;
    this.correctAnswers = 0;
    this.questionsAnswered = 0;
    this.selectedAnswer = -1;
    this.isShowingFeedback = false;
    
    // Get current player HP
    const state = GameStateManager.getState();
    this.playerHP = state.player.hp;
    
    // Calculate guest HP based on level (questions difficulty)
    this.guestMaxHP = 100;
    this.guestHP = this.guestMaxHP;
  }

  create(): void {
    // Background
    this.add.image(400, 300, 'battleBackground');
    
    // Battle transition animation
    this.playBattleIntro();
  }

  private playBattleIntro(): void {
    // Flash effect
    const flash = this.add.rectangle(400, 300, 800, 600, 0xffffff);
    flash.setAlpha(1);
    
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      repeat: 2,
      yoyo: true,
      onComplete: () => {
        flash.destroy();
        this.setupBattleUI();
      },
    });
  }

  private setupBattleUI(): void {
    // Guest info panel (top right)
    this.createGuestPanel();
    
    // Player info panel (bottom left)
    this.createPlayerPanel();
    
    // Create question container
    this.createQuestionContainer();
    
    // Create feedback container
    this.createFeedbackContainer();
    
    // Close button
    this.createCloseButton();
    
    // Show first question
    this.showQuestion(this.guest.questions[0]);
  }

  private createGuestPanel(): void {
    const panel = this.add.container(550, 80);
    
    // Name box
    const nameBox = this.add.rectangle(0, 0, 250, 70, 0xffffff, 0.9);
    nameBox.setStrokeStyle(3, 0x000000);
    
    // Guest name
    const name = this.add.text(-110, -25, this.guestDisplayInfo.name.toUpperCase(), {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '10px',
      color: '#000000',
    });
    
    // Level
    const level = this.add.text(80, -25, 'Lv' + this.calculateGuestLevel(), {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '10px',
      color: '#000000',
      backgroundColor: '#dddddd',
      padding: { x: 5, y: 2 },
    });
    
    // Title
    const title = this.add.text(-110, -5, this.guestDisplayInfo.title.substring(0, 25), {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '6px',
      color: '#666666',
    });
    
    // HP label
    const hpLabel = this.add.text(-110, 15, 'HP', {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '8px',
      color: '#f9a825',
    });
    
    // HP bar background
    const hpBg = this.add.rectangle(20, 18, 160, 12, 0x333333);
    
    // HP bar
    this.guestHPBar = this.add.graphics();
    this.updateHPBar(this.guestHPBar, 20, 18, 160, 12, this.guestHP, this.guestMaxHP);
    
    panel.add([nameBox, name, level, title, hpLabel, hpBg, this.guestHPBar]);
    
    // Guest sprite (larger portrait)
    const portrait = this.add.rectangle(650, 180, 120, 120, this.guestDisplayInfo.spriteColor);
    portrait.setStrokeStyle(3, 0x000000);
    
    // Animate guest entrance
    portrait.setScale(0);
    this.tweens.add({
      targets: portrait,
      scale: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });
  }

  private createPlayerPanel(): void {
    const panel = this.add.container(200, 320);
    
    // Name box
    const nameBox = this.add.rectangle(0, 0, 200, 60, 0xffffff, 0.9);
    nameBox.setStrokeStyle(3, 0x000000);
    
    // Player name
    const name = this.add.text(-85, -20, 'YOU', {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '12px',
      color: '#000000',
    });
    
    // Level
    const state = GameStateManager.getState();
    const level = this.add.text(50, -20, 'Lv' + state.player.level, {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '10px',
      color: '#000000',
      backgroundColor: '#dddddd',
      padding: { x: 5, y: 2 },
    });
    
    // HP label
    const hpLabel = this.add.text(-85, 5, 'HP', {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '8px',
      color: '#4caf50',
    });
    
    // HP bar background
    const hpBg = this.add.rectangle(10, 8, 120, 12, 0x333333);
    
    // HP bar
    this.playerHPBar = this.add.graphics();
    this.updateHPBar(this.playerHPBar, 10, 8, 120, 12, this.playerHP, state.player.maxHp);
    
    // HP text
    const hpText = this.add.text(50, 20, `${this.playerHP} / ${state.player.maxHp}`, {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '8px',
      color: '#000000',
    });
    
    panel.add([nameBox, name, level, hpLabel, hpBg, this.playerHPBar, hpText]);
    
    // Player sprite
    const playerSprite = this.add.sprite(120, 280, 'player', 7);
    playerSprite.setScale(3);
    
    // Animate player entrance
    playerSprite.setX(-100);
    this.tweens.add({
      targets: playerSprite,
      x: 120,
      duration: 500,
      ease: 'Power2',
    });
  }

  private createQuestionContainer(): void {
    this.questionContainer = this.add.container(400, 480);
    
    // Background
    const bg = this.add.rectangle(0, 0, 750, 200, 0x1a1a2e, 0.95);
    bg.setStrokeStyle(3, 0xe6d388);
    
    this.questionContainer.add(bg);
  }

  private createFeedbackContainer(): void {
    this.feedbackContainer = this.add.container(400, 480);
    this.feedbackContainer.setVisible(false);
    
    // Background
    const bg = this.add.rectangle(0, 0, 750, 200, 0x1a1a2e, 0.95);
    bg.setStrokeStyle(3, 0xe6d388);
    
    this.feedbackContainer.add(bg);
  }

  private createCloseButton(): void {
    const closeBtn = this.add.container(750, 30);
    
    const bg = this.add.circle(0, 0, 20, 0x333333);
    bg.setStrokeStyle(2, 0xffffff);
    
    const x = this.add.text(0, 0, 'X', {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '12px',
      color: '#ffffff',
    });
    x.setOrigin(0.5);
    
    closeBtn.add([bg, x]);
    closeBtn.setSize(40, 40);
    closeBtn.setInteractive({ useHandCursor: true });
    
    closeBtn.on('pointerdown', () => {
      this.endBattle(false);
    });
  }

  private showQuestion(question: Question): void {
    // Clear previous question
    this.questionContainer.removeAll(true);
    this.answerButtons = [];
    
    // Background
    const bg = this.add.rectangle(0, 0, 750, 200, 0x1a1a2e, 0.95);
    bg.setStrokeStyle(3, 0xe6d388);
    this.questionContainer.add(bg);
    
    // Question number and difficulty
    const questionNum = this.add.text(-350, -80, 
      `${String(this.currentQuestionIndex + 1).padStart(2, '0')}/${this.guest.questions.length}`, {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '10px',
      color: '#888888',
    });
    
    const difficultyColors: Record<string, string> = {
      easy: '#4caf50',
      medium: '#ff9800',
      hard: '#f44336',
    };
    
    const difficulty = this.add.text(-300, -80, question.difficulty.toUpperCase(), {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '10px',
      color: difficultyColors[question.difficulty],
    });
    
    // Question text
    const questionText = this.add.text(-350, -50, question.question, {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '10px',
      color: '#ffffff',
      wordWrap: { width: 320 },
      lineSpacing: 6,
    });
    
    this.questionContainer.add([questionNum, difficulty, questionText]);
    
    // Answer options
    question.options.forEach((option, index) => {
      const btn = this.createAnswerButton(index, option.text, 50, -60 + index * 40);
      btn.setData('correct', option.correct);
      btn.setData('optionId', option.id);
      this.answerButtons.push(btn);
      this.questionContainer.add(btn);
    });
    
    // Enter prompt
    const enterPrompt = this.add.text(0, 85, 'ENTER to confirm', {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '8px',
      color: '#666666',
    });
    enterPrompt.setOrigin(0.5);
    this.questionContainer.add(enterPrompt);
    
    // Keyboard navigation
    this.setupQuestionInput(question);
  }

  private createAnswerButton(index: number, text: string, x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    
    const bg = this.add.rectangle(150, 0, 300, 35, 0x333333);
    bg.setStrokeStyle(2, 0x555555);
    
    const numLabel = this.add.text(10, 0, `${index + 1}`, {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '10px',
      color: '#e6d388',
    });
    numLabel.setOrigin(0.5);
    
    const answerText = this.add.text(30, 0, text.substring(0, 40), {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '8px',
      color: '#ffffff',
    });
    answerText.setOrigin(0, 0.5);
    
    container.add([bg, numLabel, answerText]);
    container.setSize(300, 35);
    container.setInteractive({ useHandCursor: true });
    
    container.on('pointerover', () => {
      if (!this.isShowingFeedback) {
        this.selectAnswer(index);
      }
    });
    
    container.on('pointerdown', () => {
      if (!this.isShowingFeedback) {
        this.selectAnswer(index);
        this.confirmAnswer();
      }
    });
    
    container.setData('bg', bg);
    
    return container;
  }

  private setupQuestionInput(question: Question): void {
    // Number keys 1-4
    const keys = [
      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR),
    ];
    
    keys.forEach((key, index) => {
      key.once('down', () => {
        if (!this.isShowingFeedback && index < question.options.length) {
          this.selectAnswer(index);
          this.confirmAnswer();
        }
      });
    });
    
    // Arrow keys for navigation
    const upKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    const downKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    const enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    
    upKey.on('down', () => {
      if (!this.isShowingFeedback) {
        this.selectAnswer(Math.max(0, this.selectedAnswer - 1));
      }
    });
    
    downKey.on('down', () => {
      if (!this.isShowingFeedback) {
        this.selectAnswer(Math.min(question.options.length - 1, this.selectedAnswer + 1));
      }
    });
    
    enterKey.on('down', () => {
      if (this.isShowingFeedback) {
        this.nextQuestion();
      } else if (this.selectedAnswer >= 0) {
        this.confirmAnswer();
      }
    });
  }

  private selectAnswer(index: number): void {
    this.selectedAnswer = index;
    
    // Update visual selection
    this.answerButtons.forEach((btn, i) => {
      const bg = btn.getData('bg') as Phaser.GameObjects.Rectangle;
      if (i === index) {
        bg.setFillStyle(0x4a4a6a);
        bg.setStrokeStyle(2, 0xe6d388);
      } else {
        bg.setFillStyle(0x333333);
        bg.setStrokeStyle(2, 0x555555);
      }
    });
  }

  private confirmAnswer(): void {
    if (this.selectedAnswer < 0 || this.isShowingFeedback) return;
    
    const question = this.guest.questions[this.currentQuestionIndex];
    const selectedBtn = this.answerButtons[this.selectedAnswer];
    const isCorrect = selectedBtn.getData('correct') as boolean;
    
    this.questionsAnswered++;
    
    if (isCorrect) {
      this.correctAnswers++;
      this.handleCorrectAnswer(question);
    } else {
      this.handleWrongAnswer(question);
    }
  }

  private handleCorrectAnswer(question: Question): void {
    // Add XP
    const xpGain = SCORING.XP_GAIN[question.difficulty];
    GameStateManager.addXP(xpGain);
    
    // Damage guest
    const damage = 30 + (question.difficulty === 'hard' ? 20 : question.difficulty === 'medium' ? 10 : 0);
    this.guestHP = Math.max(0, this.guestHP - damage);
    this.updateHPBar(this.guestHPBar, 20, 18, 160, 12, this.guestHP, this.guestMaxHP);
    
    // Show feedback
    this.showFeedback(true, question.explanation, xpGain);
  }

  private handleWrongAnswer(question: Question): void {
    // Lose HP
    const hpLoss = SCORING.HP_PENALTY[question.difficulty];
    this.playerHP = Math.max(0, this.playerHP - hpLoss);
    GameStateManager.updateHP(-hpLoss);
    
    const state = GameStateManager.getState();
    this.updateHPBar(this.playerHPBar, 10, 8, 120, 12, this.playerHP, state.player.maxHp);
    
    // Show feedback
    this.showFeedback(false, question.explanation, hpLoss);
    
    // Check for game over
    if (this.playerHP <= 0) {
      this.time.delayedCall(2000, () => {
        this.gameOver();
      });
    }
  }

  private showFeedback(correct: boolean, explanation: string, points: number): void {
    this.isShowingFeedback = true;
    
    // Hide question container
    this.questionContainer.setVisible(false);
    
    // Clear and show feedback
    this.feedbackContainer.removeAll(true);
    
    // Background
    const bg = this.add.rectangle(0, 0, 750, 200, 0x1a1a2e, 0.95);
    bg.setStrokeStyle(3, 0xe6d388);
    
    // Result banner
    const bannerColor = correct ? 0x4caf50 : 0xf44336;
    const banner = this.add.rectangle(0, -60, 700, 40, bannerColor);
    
    const resultText = this.add.text(0, -60, correct ? 'CORRECT!' : 'WRONG!', {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '14px',
      color: '#ffffff',
    });
    resultText.setOrigin(0.5);
    
    // Points indicator
    const pointsText = this.add.text(280, -60, correct ? `+${points} XP` : `-${points} HP`, {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '10px',
      color: '#ffffff',
    });
    pointsText.setOrigin(0.5);
    
    // Explanation
    const explanationText = this.add.text(-330, -20, explanation, {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '8px',
      color: '#cccccc',
      wordWrap: { width: 660 },
      lineSpacing: 6,
    });
    
    // Continue prompt
    const continueText = this.add.text(0, 75, 'ENTER to continue', {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '10px',
      color: '#e6d388',
    });
    continueText.setOrigin(0.5);
    
    // Pulsing animation on continue
    this.tweens.add({
      targets: continueText,
      alpha: 0.5,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
    
    this.feedbackContainer.add([bg, banner, resultText, pointsText, explanationText, continueText]);
    this.feedbackContainer.setVisible(true);
  }

  private nextQuestion(): void {
    this.isShowingFeedback = false;
    this.selectedAnswer = -1;
    this.feedbackContainer.setVisible(false);
    this.questionContainer.setVisible(true);
    
    // Check if battle is over
    if (this.guestHP <= 0) {
      this.endBattle(true);
      return;
    }
    
    this.currentQuestionIndex++;
    
    if (this.currentQuestionIndex >= this.guest.questions.length) {
      // All questions answered
      this.checkBattleResult();
    } else {
      this.showQuestion(this.guest.questions[this.currentQuestionIndex]);
    }
  }

  private checkBattleResult(): void {
    const correctPercentage = (this.correctAnswers / this.questionsAnswered) * 100;
    
    // Apply combo bonus if all correct
    if (this.correctAnswers === this.guest.questions.length) {
      GameStateManager.addXP(SCORING.COMBO_BONUS);
      GameStateManager.updateHP(SCORING.COMBO_BONUS);
    }
    
    // Win if all questions answered correctly or guest HP is 0
    const won = this.guestHP <= 0 || this.correctAnswers === this.guest.questions.length;
    
    this.endBattle(won);
  }

  private endBattle(won: boolean): void {
    // Update guest progress
    GameStateManager.updateGuestProgress(this.guest.video_id, {
      encountered: true,
      defeated: won,
      questionsAnswered: this.questionsAnswered,
      questionsCorrect: this.correctAnswers,
    });
    
    // Transition back to world
    this.cameras.main.fadeOut(500, 0, 0, 0);
    
    this.time.delayedCall(500, () => {
      const worldScene = this.scene.get('WorldScene');
      worldScene.events.emit('battleComplete', { 
        guestId: this.guest.video_id, 
        won 
      });
      
      this.scene.stop();
      this.scene.resume('WorldScene');
    });
  }

  private gameOver(): void {
    // Show game over screen
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);
    
    const gameOverText = this.add.text(400, 250, 'GAME OVER', {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '32px',
      color: '#f44336',
    });
    gameOverText.setOrigin(0.5);
    
    const restartText = this.add.text(400, 320, 'Returning to last checkpoint...', {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '12px',
      color: '#ffffff',
    });
    restartText.setOrigin(0.5);
    
    // Reset to checkpoint after delay
    this.time.delayedCall(3000, () => {
      GameStateManager.resetToCheckpoint();
      this.scene.stop('HUDScene');
      this.scene.stop();
      this.scene.stop('WorldScene');
      this.scene.start('WorldScene');
      this.scene.launch('HUDScene');
    });
  }

  private updateHPBar(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    current: number,
    max: number
  ): void {
    graphics.clear();
    
    const percentage = current / max;
    const barWidth = width * percentage;
    
    // Color based on percentage
    let color = 0x4caf50; // Green
    if (percentage < 0.5) color = 0xff9800; // Orange
    if (percentage < 0.25) color = 0xf44336; // Red
    
    graphics.fillStyle(color);
    graphics.fillRect(x - width / 2, y - height / 2, barWidth, height);
  }

  private calculateGuestLevel(): number {
    // Calculate level based on average question difficulty
    const difficulties = this.guest.questions.map(q => q.difficulty);
    let level = 10;
    
    difficulties.forEach(d => {
      if (d === 'easy') level += 5;
      if (d === 'medium') level += 10;
      if (d === 'hard') level += 15;
    });
    
    return level;
  }
}
