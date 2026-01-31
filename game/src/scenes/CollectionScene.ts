import Phaser from 'phaser';
import { GameStateManager } from '../managers/GameStateManager';
import { QuestionLoader } from '../managers/QuestionLoader';
import { GuestData } from '../types';

export class CollectionScene extends Phaser.Scene {
  private guestCards: Phaser.GameObjects.Container[] = [];
  private scrollY: number = 0;
  private contentHeight: number = 0;

  constructor() {
    super({ key: 'CollectionScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    // Title
    this.add.text(width / 2, 40, 'COLLECTION', {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '24px',
      color: '#e6d388',
    }).setOrigin(0.5);

    // Stats
    const state = GameStateManager.getState();
    this.add.text(width / 2, 80, `Captured: ${state.totalCaptured} / ${state.totalGuests}`, {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '12px',
      color: '#888888',
    }).setOrigin(0.5);

    // Create collection grid
    this.createCollectionGrid();

    // Back button
    this.createBackButton();

    // Scroll handling
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number) => {
      this.scrollY = Phaser.Math.Clamp(
        this.scrollY + deltaY * 0.5,
        0,
        Math.max(0, this.contentHeight - height + 150)
      );
      this.updateScrollPosition();
    });
  }

  private async createCollectionGrid(): Promise<void> {
    const questionLoader = QuestionLoader.getInstance();
    const guests = await questionLoader.loadAllQuestions();
    const state = GameStateManager.getState();

    const startY = 120;
    const cardWidth = 180;
    const cardHeight = 100;
    const padding = 20;
    const columns = 4;

    let row = 0;
    let col = 0;

    guests.forEach((guest: GuestData) => {
      const x = 80 + col * (cardWidth + padding);
      const y = startY + row * (cardHeight + padding);

      const progress = state.guests.get(guest.video_id);
      const card = this.createGuestCard(x, y, guest, progress?.defeated || false);
      this.guestCards.push(card);

      col++;
      if (col >= columns) {
        col = 0;
        row++;
      }
    });

    this.contentHeight = startY + (row + 1) * (cardHeight + padding);
  }

  private createGuestCard(
    x: number,
    y: number,
    guest: GuestData,
    captured: boolean
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Card background
    const bg = this.add.rectangle(0, 0, 180, 100, captured ? 0x2d4a3e : 0x333333);
    bg.setStrokeStyle(2, captured ? 0x4caf50 : 0x555555);

    // Guest name
    const guestName = this.extractGuestName(guest);
    const name = this.add.text(0, -30, guestName || 'Unknown', {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '8px',
      color: captured ? '#ffffff' : '#666666',
      wordWrap: { width: 160 },
      align: 'center',
    });
    name.setOrigin(0.5);

    // Status icon
    const statusIcon = this.add.text(0, 20, captured ? '★' : '?', {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '24px',
      color: captured ? '#ffd700' : '#444444',
    });
    statusIcon.setOrigin(0.5);

    container.add([bg, name, statusIcon]);

    // Make interactive
    container.setSize(180, 100);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      bg.setStrokeStyle(3, 0xe6d388);
    });

    container.on('pointerout', () => {
      bg.setStrokeStyle(2, captured ? 0x4caf50 : 0x555555);
    });

    container.on('pointerdown', () => {
      if (captured) {
        this.showGuestDetails(guest);
      }
    });

    return container;
  }

  private extractGuestName(guest: GuestData): string | null {
    if (guest.guest) {
      return guest.guest;
    }

    const title = guest.title;
    const pipeIndex = title.lastIndexOf('|');
    if (pipeIndex !== -1) {
      return title.substring(pipeIndex + 1).trim();
    }

    return null;
  }

  private showGuestDetails(guest: GuestData): void {
    const { width, height } = this.cameras.main;

    // Overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);
    overlay.setInteractive();

    // Details panel
    const panel = this.add.container(width / 2, height / 2);

    const bg = this.add.rectangle(0, 0, 600, 400, 0x2a2a4a);
    bg.setStrokeStyle(3, 0xe6d388);

    // Guest name
    const guestName = this.extractGuestName(guest) || 'Unknown Guest';
    const name = this.add.text(0, -160, guestName, {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '16px',
      color: '#e6d388',
    });
    name.setOrigin(0.5);

    // Episode title
    const title = this.add.text(0, -130, guest.title.substring(0, 50) + '...', {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '8px',
      color: '#888888',
    });
    title.setOrigin(0.5);

    // Summary
    const summaryLabel = this.add.text(-270, -100, 'Summary:', {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '10px',
      color: '#ffffff',
    });

    const summary = this.add.text(-270, -80, guest.summary || 'No summary available.', {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '8px',
      color: '#cccccc',
      wordWrap: { width: 540 },
      lineSpacing: 4,
    });

    // Key takeaways
    const takeawaysLabel = this.add.text(-270, 20, 'Key Takeaways:', {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '10px',
      color: '#ffffff',
    });

    let takeawaysText = 'No takeaways available.';
    if (guest.key_takeaways && guest.key_takeaways.length > 0) {
      takeawaysText = guest.key_takeaways.slice(0, 3).map(t => '• ' + t.substring(0, 60)).join('\n');
    }

    const takeaways = this.add.text(-270, 40, takeawaysText, {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '8px',
      color: '#cccccc',
      wordWrap: { width: 540 },
      lineSpacing: 4,
    });

    // Close button
    const closeBtn = this.add.text(270, -170, 'X', {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#f44336',
      padding: { x: 8, y: 4 },
    });
    closeBtn.setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
      overlay.destroy();
      panel.destroy();
    });

    panel.add([bg, name, title, summaryLabel, summary, takeawaysLabel, takeaways, closeBtn]);
  }

  private createBackButton(): void {
    const backBtn = this.add.container(60, 40);

    const bg = this.add.rectangle(0, 0, 100, 40, 0x4a4a6a);
    bg.setStrokeStyle(2, 0xe6d388);

    const text = this.add.text(0, 0, '< BACK', {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '10px',
      color: '#ffffff',
    });
    text.setOrigin(0.5);

    backBtn.add([bg, text]);
    backBtn.setSize(100, 40);
    backBtn.setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      this.scene.stop();
      this.scene.resume('WorldScene');
      this.scene.resume('HUDScene');
    });
  }

  private updateScrollPosition(): void {
    this.guestCards.forEach(card => {
      card.setY(card.y - this.scrollY);
    });
  }
}
