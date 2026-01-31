import Phaser from 'phaser';
import { GameStateManager } from '../managers/GameStateManager';

export class MenuScene extends Phaser.Scene {
  private titleText!: Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;
  private startButton!: Phaser.GameObjects.Container;
  private continueButton!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    // Title
    this.titleText = this.add.text(width / 2, 120, 'HubermanRPG', {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '48px',
      color: '#e6d388',
      stroke: '#000000',
      strokeThickness: 6,
    });
    this.titleText.setOrigin(0.5);

    // Subtitle
    this.subtitleText = this.add.text(width / 2, 180, "Catch 'Em All!", {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '16px',
      color: '#8fd860',
    });
    this.subtitleText.setOrigin(0.5);

    // Create animated player preview
    const playerPreview = this.add.sprite(width / 2, 300, 'player', 1);
    playerPreview.setScale(4);
    
    // Animate player preview
    this.tweens.add({
      targets: playerPreview,
      y: 290,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // New Game button
    this.startButton = this.createButton(width / 2, 420, 'NEW GAME', () => {
      this.startNewGame();
    });

    // Continue button (if save exists)
    const hasSave = GameStateManager.hasSavedGame();
    if (hasSave) {
      this.continueButton = this.createButton(width / 2, 480, 'CONTINUE', () => {
        this.continueGame();
      });
    }

    // Instructions
    this.add.text(width / 2, height - 60, 'Arrow Keys / WASD to move', {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '10px',
      color: '#666666',
    }).setOrigin(0.5);

    this.add.text(width / 2, height - 40, 'SPACE to interact', {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '10px',
      color: '#666666',
    }).setOrigin(0.5);
  }

  private createButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    
    const bg = this.add.rectangle(0, 0, 250, 50, 0x4a4a6a);
    bg.setStrokeStyle(3, 0xe6d388);
    
    const label = this.add.text(0, 0, text, {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '14px',
      color: '#ffffff',
    });
    label.setOrigin(0.5);
    
    container.add([bg, label]);
    container.setSize(250, 50);
    container.setInteractive({ useHandCursor: true });
    
    container.on('pointerover', () => {
      bg.setFillStyle(0x6a6a8a);
      this.tweens.add({
        targets: container,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
      });
    });
    
    container.on('pointerout', () => {
      bg.setFillStyle(0x4a4a6a);
      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
      });
    });
    
    container.on('pointerdown', callback);
    
    return container;
  }

  private startNewGame(): void {
    GameStateManager.initializeNewGame();
    this.scene.start('WorldScene');
    this.scene.launch('HUDScene');
  }

  private continueGame(): void {
    GameStateManager.loadGame();
    this.scene.start('WorldScene');
    this.scene.launch('HUDScene');
  }
}
