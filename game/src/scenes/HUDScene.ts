import Phaser from 'phaser';
import { GameStateManager } from '../managers/GameStateManager';

export class HUDScene extends Phaser.Scene {
  private levelText!: Phaser.GameObjects.Text;
  private xpBar!: Phaser.GameObjects.Graphics;
  private xpText!: Phaser.GameObjects.Text;
  private hpBar!: Phaser.GameObjects.Graphics;
  private hpText!: Phaser.GameObjects.Text;
  private capturedText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'HUDScene' });
  }

  create(): void {
    // Left panel - Player stats
    this.createStatsPanel();

    // Right panel - Action buttons
    this.createActionButtons();

    // Listen for updates
    const worldScene = this.scene.get('WorldScene');
    worldScene.events.on('updateHUD', this.updateStats, this);

    // Initial update
    this.updateStats();
  }

  private createStatsPanel(): void {
    const panel = this.add.container(10, 10);

    // Background
    const bg = this.add.rectangle(70, 80, 140, 160, 0x000000, 0.7);
    bg.setStrokeStyle(2, 0xe6d388);

    // Level
    this.levelText = this.add.text(15, 15, 'LEVEL 1', {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '10px',
      color: '#ffffff',
    });

    // XP bar
    const xpLabel = this.add.text(15, 40, 'XP', {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '8px',
      color: '#888888',
    });

    const xpBg = this.add.rectangle(80, 43, 100, 10, 0x333333);
    this.xpBar = this.add.graphics();
    
    this.xpText = this.add.text(15, 55, '0/200 XP', {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '8px',
      color: '#888888',
    });

    // HP bar
    const hpLabel = this.add.text(15, 75, 'HP', {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '8px',
      color: '#4caf50',
    });

    const hpBg = this.add.rectangle(80, 78, 100, 10, 0x333333);
    this.hpBar = this.add.graphics();
    
    this.hpText = this.add.text(15, 95, '100/100', {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '14px',
      color: '#4caf50',
    });

    // Captured count
    const capturedLabel = this.add.text(15, 125, 'CAPTURED', {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '8px',
      color: '#888888',
    });

    this.capturedText = this.add.text(15, 140, '0/63', {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '12px',
      color: '#ffd700',
    });

    panel.add([bg, this.levelText, xpLabel, xpBg, this.xpBar, this.xpText, 
               hpLabel, hpBg, this.hpBar, this.hpText, capturedLabel, this.capturedText]);
  }

  private createActionButtons(): void {
    const { width } = this.cameras.main;
    const startX = width - 110;
    
    // Collection button
    this.createButton(startX, 30, 'Collection', 0x4a4a6a, () => {
      this.scene.pause('WorldScene');
      this.scene.pause('HUDScene');
      this.scene.launch('CollectionScene');
    });

    // Leaderboard button (placeholder)
    this.createButton(startX, 75, 'Leaderboard', 0x4a4a6a, () => {
      console.log('Leaderboard clicked');
    });

    // Share Stats button (placeholder)
    this.createButton(startX, 120, 'Share Stats', 0x4a4a6a, () => {
      console.log('Share Stats clicked');
    });

    // Mute button
    this.createButton(startX, 165, 'Mute', 0x4a4a6a, () => {
      this.sound.mute = !this.sound.mute;
    });
  }

  private createButton(x: number, y: number, text: string, color: number, callback: () => void): void {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 100, 35, color);
    bg.setStrokeStyle(2, 0xe6d388);

    const label = this.add.text(0, 0, text, {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '8px',
      color: '#ffffff',
    });
    label.setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(100, 35);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      bg.setFillStyle(0x6a6a8a);
    });

    container.on('pointerout', () => {
      bg.setFillStyle(color);
    });

    container.on('pointerdown', callback);
  }

  private updateStats(): void {
    const state = GameStateManager.getState();

    // Update level
    this.levelText.setText(`LEVEL ${state.player.level}`);

    // Update XP bar
    const xpForLevel = state.player.xp % 200;
    const xpProgress = xpForLevel / 200;
    this.xpBar.clear();
    this.xpBar.fillStyle(0x3498db);
    this.xpBar.fillRect(30, 38, 100 * xpProgress, 10);
    this.xpText.setText(`${xpForLevel}/200 XP`);

    // Update HP bar
    const hpProgress = state.player.hp / state.player.maxHp;
    let hpColor = 0x4caf50;
    if (hpProgress < 0.5) hpColor = 0xff9800;
    if (hpProgress < 0.25) hpColor = 0xf44336;
    
    this.hpBar.clear();
    this.hpBar.fillStyle(hpColor);
    this.hpBar.fillRect(30, 73, 100 * hpProgress, 10);
    this.hpText.setText(`${state.player.hp}/${state.player.maxHp}`);
    this.hpText.setColor(hpProgress < 0.25 ? '#f44336' : hpProgress < 0.5 ? '#ff9800' : '#4caf50');

    // Update captured count
    this.capturedText.setText(`${state.totalCaptured}/${state.totalGuests}`);
  }
}
