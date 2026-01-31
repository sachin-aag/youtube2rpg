import Phaser from 'phaser';
import { GridEngine, Direction } from 'grid-engine';
import { GameStateManager } from '../managers/GameStateManager';
import { QuestionLoader } from '../managers/QuestionLoader';
import { GuestDisplayInfo, GuestData } from '../types';

declare module 'phaser' {
  interface Scene {
    gridEngine: GridEngine;
  }
}

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private guests: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private guestLabels: Map<string, Phaser.GameObjects.Text> = new Map();
  private dialogBox!: Phaser.GameObjects.Container;
  private currentInteraction: GuestDisplayInfo | null = null;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasd: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key } | null = null;
  private spaceKey: Phaser.Input.Keyboard.Key | null = null;
  private isDialogOpen: boolean = false;
  private guestDataMap: Map<string, GuestData> = new Map();
  private mapWidth: number = 40;
  private mapHeight: number = 30;
  private isReady: boolean = false;

  constructor() {
    super({ key: 'WorldScene' });
  }

  async create(): Promise<void> {
    // Load questions and create guest list
    await this.loadGuestData();
    
    // Create tilemap
    this.createTilemap();
    
    // Create player
    this.createPlayer();
    
    // Create guests
    this.createGuests();
    
    // Setup camera
    this.cameras.main.startFollow(this.player, true);
    this.cameras.main.setZoom(1.5);
    this.cameras.main.setBounds(0, 0, this.mapWidth * 32, this.mapHeight * 32);
    
    // Setup input
    this.setupInput();
    
    // Create dialog box
    this.createDialogBox();
    
    // Listen for battle end
    this.events.on('battleComplete', this.onBattleComplete, this);
    
    // Mark scene as ready
    this.isReady = true;
  }

  private async loadGuestData(): Promise<void> {
    const questionLoader = QuestionLoader.getInstance();
    const guests = await questionLoader.loadAllQuestions();
    
    guests.forEach((guest) => {
      this.guestDataMap.set(guest.video_id, guest);
    });
  }

  private createTilemap(): void {
    // Create a visual tilemap using tileSprites
    const tileSize = 32;
    
    // Add grass background
    const grassBg = this.add.tileSprite(
      0, 0,
      this.mapWidth * tileSize,
      this.mapHeight * tileSize,
      'grass'
    );
    grassBg.setOrigin(0, 0);
    grassBg.setDepth(0);
    
    // Add path in cross pattern
    for (let x = 18; x <= 22; x++) {
      for (let y = 0; y < this.mapHeight; y++) {
        const pathTile = this.add.image(x * tileSize + 16, y * tileSize + 16, 'path');
        pathTile.setDepth(0);
      }
    }
    for (let y = 13; y <= 17; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        if (x < 18 || x > 22) {
          const pathTile = this.add.image(x * tileSize + 16, y * tileSize + 16, 'path');
          pathTile.setDepth(0);
        }
      }
    }
    
    // Add border trees
    const treePositions: {x: number, y: number}[] = [];
    for (let x = 0; x < this.mapWidth; x++) {
      treePositions.push({x, y: 0});
      treePositions.push({x, y: this.mapHeight - 1});
    }
    for (let y = 1; y < this.mapHeight - 1; y++) {
      treePositions.push({x: 0, y});
      treePositions.push({x: this.mapWidth - 1, y});
    }
    
    // Add random trees
    for (let i = 0; i < 30; i++) {
      const x = 5 + Math.floor(Math.random() * (this.mapWidth - 10));
      const y = 5 + Math.floor(Math.random() * (this.mapHeight - 10));
      // Avoid paths
      if ((x >= 17 && x <= 23) || (y >= 12 && y <= 18)) continue;
      treePositions.push({x, y});
    }
    
    treePositions.forEach(pos => {
      const tree = this.add.image(pos.x * tileSize + 16, pos.y * tileSize + 16, 'tree');
      tree.setDepth(1);
    });
    
    // Create collision map for GridEngine
    const collisionMap: boolean[][] = [];
    for (let y = 0; y < this.mapHeight; y++) {
      collisionMap[y] = [];
      for (let x = 0; x < this.mapWidth; x++) {
        // Border collision
        const isBorder = x === 0 || x === this.mapWidth - 1 || y === 0 || y === this.mapHeight - 1;
        // Tree positions
        const isTree = treePositions.some(pos => pos.x === x && pos.y === y);
        collisionMap[y][x] = isBorder || isTree;
      }
    }
    
    // Store collision map in data
    this.data.set('collisionMap', collisionMap);
    
    // Initialize GridEngine with a simple tilemap
    // GridEngine needs a tilemap with proper tile indices
    // 0 = walkable, 1 = collision
    const tilemapData: number[][] = [];
    for (let y = 0; y < this.mapHeight; y++) {
      const row: number[] = [];
      for (let x = 0; x < this.mapWidth; x++) {
        row.push(collisionMap[y][x] ? 1 : 0);
      }
      tilemapData.push(row);
    }
    
    const map = this.make.tilemap({
      data: tilemapData,
      tileWidth: 32,
      tileHeight: 32,
    });
    
    // GridEngine needs a tileset
    const tileset = map.addTilesetImage('grass', 'grass', 32, 32);
    if (tileset) {
      const layer = map.createLayer(0, tileset, 0, 0);
      if (layer) {
        layer.setVisible(false); // We use our own tile sprites
        // Set collision property for GridEngine
        layer.forEachTile((tile) => {
          if (tile.index === 1) {
            tile.properties = { ge_collide: true };
          }
        });
      }
    }
    
    // Initialize GridEngine with collision config
    this.gridEngine.create(map, {
      characters: [],
      collisionTilePropertyName: 'ge_collide',
    });
  }

  private createPlayer(): void {
    // Start position
    const startX = 20;
    const startY = 15;
    
    this.player = this.add.sprite(0, 0, 'player', 1);
    this.player.setDepth(3);
    
    this.gridEngine.addCharacter({
      id: 'player',
      sprite: this.player,
      startPosition: { x: startX, y: startY },
      speed: 3,
    });
  }

  private createGuests(): void {
    const guestPositions = this.calculateGuestPositions();
    
    let index = 0;
    this.guestDataMap.forEach((guestData, videoId) => {
      if (index >= guestPositions.length) return;
      
      const guestName = this.extractGuestName(guestData);
      if (!guestName) {
        index++;
        return;
      }
      
      const position = guestPositions[index];
      const color = this.getGuestColor(index);
      
      // Generate guest sprite texture
      const textureKey = `guest-${videoId}`;
      this.generateGuestTexture(textureKey, color);
      
      // Create guest sprite
      const guestSprite = this.add.sprite(0, 0, textureKey, 0);
      guestSprite.setDepth(2);
      
      // Add to GridEngine
      this.gridEngine.addCharacter({
        id: videoId,
        sprite: guestSprite,
        startPosition: position,
        speed: 2,
      });
      
      // Create name label above guest
      const label = this.add.text(
        position.x * 32 + 16,
        position.y * 32 - 10,
        guestName,
        {
          fontFamily: 'Press Start 2P, monospace',
          fontSize: '6px',
          color: '#ffffff',
          backgroundColor: '#000000aa',
          padding: { x: 2, y: 2 },
        }
      );
      label.setOrigin(0.5);
      label.setDepth(4);
      
      this.guests.set(videoId, guestSprite);
      this.guestLabels.set(videoId, label);
      
      // Store display info
      const displayInfo: GuestDisplayInfo = {
        id: videoId,
        name: guestName,
        title: this.extractGuestTitle(guestData),
        position,
        spriteColor: color,
      };
      guestSprite.setData('displayInfo', displayInfo);
      
      index++;
    });
  }

  private generateGuestTexture(key: string, color: number): void {
    const graphics = this.add.graphics();
    
    // Draw a simple character
    // Shadow
    graphics.fillStyle(0x000000, 0.3);
    graphics.fillEllipse(16, 28, 20, 8);
    
    // Body
    graphics.fillStyle(color);
    graphics.fillRect(10, 10, 12, 14);
    
    // Head
    graphics.fillStyle(0xffecd2);
    graphics.fillCircle(16, 4, 8);
    
    // Hair
    graphics.fillStyle(0x4a3728);
    graphics.fillRect(9, -4, 14, 6);
    
    // Eyes
    graphics.fillStyle(0x000000);
    graphics.fillRect(12, 2, 2, 2);
    graphics.fillRect(18, 2, 2, 2);
    
    // Legs
    graphics.fillStyle(0x2c3e50);
    graphics.fillRect(11, 24, 4, 6);
    graphics.fillRect(17, 24, 4, 6);
    
    graphics.generateTexture(key, 32, 32);
    graphics.destroy();
    
    // Add frame
    const texture = this.textures.get(key);
    texture.add(0, 0, 0, 0, 32, 32);
  }

  private calculateGuestPositions(): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = [];
    
    // Create a grid of positions avoiding edges, center, and paths
    const safePositions: { x: number; y: number }[] = [];
    
    for (let x = 3; x < this.mapWidth - 3; x++) {
      for (let y = 3; y < this.mapHeight - 3; y++) {
        // Avoid center spawn area
        if (Math.abs(x - 20) < 3 && Math.abs(y - 15) < 3) continue;
        
        // Avoid paths
        if (x >= 17 && x <= 23) continue;
        if (y >= 12 && y <= 18) continue;
        
        safePositions.push({ x, y });
      }
    }
    
    // Shuffle and pick positions
    const shuffled = safePositions.sort(() => Math.random() - 0.5);
    
    // Take positions with minimum spacing
    for (const pos of shuffled) {
      if (positions.length >= 20) break; // Limit guests
      
      const tooClose = positions.some(p => 
        Math.abs(p.x - pos.x) < 4 && Math.abs(p.y - pos.y) < 4
      );
      
      if (!tooClose) {
        positions.push(pos);
      }
    }
    
    return positions;
  }

  private extractGuestName(guestData: GuestData): string | null {
    // First try the guest field
    if (guestData.guest) {
      return guestData.guest;
    }
    
    // Extract from title after the pipe character
    const title = guestData.title;
    const pipeIndex = title.lastIndexOf('|');
    if (pipeIndex !== -1) {
      return title.substring(pipeIndex + 1).trim();
    }
    
    // Look for "Dr." or common name patterns
    const drMatch = title.match(/Dr\.?\s+[\w\s]+/);
    if (drMatch) {
      return drMatch[0].trim();
    }
    
    return null;
  }

  private extractGuestTitle(guestData: GuestData): string {
    const title = guestData.title;
    const pipeIndex = title.indexOf('|');
    if (pipeIndex !== -1) {
      return title.substring(0, pipeIndex).trim();
    }
    return title.substring(0, 40) + '...';
  }

  private getGuestColor(index: number): number {
    const colors = [
      0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6,
      0x1abc9c, 0xe91e63, 0x00bcd4, 0xff9800, 0x795548,
    ];
    return colors[index % colors.length];
  }

  private setupInput(): void {
    if (!this.input.keyboard) {
      console.error('Keyboard input not available');
      return;
    }
    
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    this.spaceKey.on('down', () => {
      if (this.isDialogOpen && this.currentInteraction) {
        this.startBattle(this.currentInteraction);
      } else {
        this.checkForInteraction();
      }
    });
  }

  private createDialogBox(): void {
    this.dialogBox = this.add.container(400, 520);
    this.dialogBox.setDepth(100);
    this.dialogBox.setScrollFactor(0);
    this.dialogBox.setVisible(false);
    
    // Background
    const bg = this.add.rectangle(0, 0, 600, 120, 0xffffff);
    bg.setStrokeStyle(4, 0x000000);
    
    // Guest portrait placeholder
    const portrait = this.add.rectangle(-250, 0, 80, 80, 0xcccccc);
    portrait.setStrokeStyle(2, 0x000000);
    
    // Name text
    const nameText = this.add.text(-200, -40, '', {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '12px',
      color: '#000000',
    });
    
    // Title text
    const titleText = this.add.text(-200, -20, '', {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '8px',
      color: '#666666',
    });
    
    // Message text
    const messageText = this.add.text(-200, 10, 'is ready to battle!', {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '10px',
      color: '#000000',
      wordWrap: { width: 380 },
    });
    
    // Prompt text
    const promptText = this.add.text(0, 45, 'SPACE to battle • Walk away to cancel', {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '8px',
      color: '#888888',
    });
    promptText.setOrigin(0.5);
    
    this.dialogBox.add([bg, portrait, nameText, titleText, messageText, promptText]);
    this.dialogBox.setData('nameText', nameText);
    this.dialogBox.setData('titleText', titleText);
    this.dialogBox.setData('portrait', portrait);
  }

  private checkForInteraction(): void {
    const playerPos = this.gridEngine.getPosition('player');
    
    // Check all guests
    for (const [guestId, guestSprite] of this.guests) {
      const guestPos = this.gridEngine.getPosition(guestId);
      
      const distance = Math.abs(playerPos.x - guestPos.x) + Math.abs(playerPos.y - guestPos.y);
      
      if (distance <= 1) {
        const displayInfo = guestSprite.getData('displayInfo') as GuestDisplayInfo;
        this.showDialog(displayInfo);
        return;
      }
    }
  }

  private showDialog(guest: GuestDisplayInfo): void {
    this.currentInteraction = guest;
    this.isDialogOpen = true;
    
    const nameText = this.dialogBox.getData('nameText') as Phaser.GameObjects.Text;
    const titleText = this.dialogBox.getData('titleText') as Phaser.GameObjects.Text;
    const portrait = this.dialogBox.getData('portrait') as Phaser.GameObjects.Rectangle;
    
    nameText.setText(guest.name);
    titleText.setText(guest.title.substring(0, 35) + '...');
    portrait.setFillStyle(guest.spriteColor);
    
    this.dialogBox.setVisible(true);
    
    // Animate in
    this.dialogBox.setY(650);
    this.tweens.add({
      targets: this.dialogBox,
      y: 520,
      duration: 200,
      ease: 'Back.easeOut',
    });
  }

  private hideDialog(): void {
    if (!this.isDialogOpen) return;
    
    this.tweens.add({
      targets: this.dialogBox,
      y: 650,
      duration: 150,
      ease: 'Power2',
      onComplete: () => {
        this.dialogBox.setVisible(false);
        this.isDialogOpen = false;
        this.currentInteraction = null;
      },
    });
  }

  private startBattle(guest: GuestDisplayInfo): void {
    const guestData = this.guestDataMap.get(guest.id);
    if (!guestData) return;
    
    this.hideDialog();
    
    // Transition to battle
    this.cameras.main.fadeOut(500, 0, 0, 0);
    
    this.time.delayedCall(500, () => {
      this.scene.pause();
      this.scene.launch('BattleScene', { 
        guest: guestData,
        guestDisplayInfo: guest,
      });
    });
  }

  private onBattleComplete(data: { guestId: string; won: boolean }): void {
    this.cameras.main.fadeIn(500, 0, 0, 0);
    
    if (data.won) {
      // Remove defeated guest from map
      const guestSprite = this.guests.get(data.guestId);
      const guestLabel = this.guestLabels.get(data.guestId);
      
      if (guestSprite) {
        // Victory animation
        this.tweens.add({
          targets: guestSprite,
          alpha: 0,
          scale: 0,
          duration: 500,
          onComplete: () => {
            this.gridEngine.removeCharacter(data.guestId);
            guestSprite.destroy();
          },
        });
      }
      
      if (guestLabel) {
        this.tweens.add({
          targets: guestLabel,
          alpha: 0,
          duration: 500,
          onComplete: () => guestLabel.destroy(),
        });
      }
      
      this.guests.delete(data.guestId);
      this.guestLabels.delete(data.guestId);
    }
    
    // Update HUD
    this.events.emit('updateHUD');
  }

  update(): void {
    // Don't run update until scene is ready
    if (!this.isReady) return;
    
    if (this.isDialogOpen) {
      // Check if player moved away
      if (this.currentInteraction) {
        const playerPos = this.gridEngine.getPosition('player');
        const guestId = this.currentInteraction.id;
        
        // Check if guest still exists
        if (!this.gridEngine.hasCharacter(guestId)) {
          this.hideDialog();
          return;
        }
        
        const guestPos = this.gridEngine.getPosition(guestId);
        const distance = Math.abs(playerPos.x - guestPos.x) + Math.abs(playerPos.y - guestPos.y);
        
        if (distance > 2) {
          this.hideDialog();
        }
      }
      return;
    }
    
    // Handle movement (with null checks)
    if (!this.cursors || !this.wasd) return;
    
    // Check which direction keys are pressed
    const leftPressed = this.cursors.left.isDown || this.wasd.A.isDown;
    const rightPressed = this.cursors.right.isDown || this.wasd.D.isDown;
    const upPressed = this.cursors.up.isDown || this.wasd.W.isDown;
    const downPressed = this.cursors.down.isDown || this.wasd.S.isDown;
    
    // Debug: log movement state
    const moving = this.gridEngine.isMoving('player');
    if (leftPressed || rightPressed || upPressed || downPressed) {
      console.log('Key pressed, isMoving:', moving);
    }
    
    // Only move if not already moving
    if (!moving) {
      if (leftPressed) {
        console.log('Starting move LEFT');
        this.gridEngine.move('player', Direction.LEFT);
      } else if (rightPressed) {
        console.log('Starting move RIGHT');
        this.gridEngine.move('player', Direction.RIGHT);
      } else if (upPressed) {
        console.log('Starting move UP');
        this.gridEngine.move('player', Direction.UP);
      } else if (downPressed) {
        console.log('Starting move DOWN');
        this.gridEngine.move('player', Direction.DOWN);
      }
    }
    
    // Update player animation
    const direction = this.gridEngine.getFacingDirection('player');
    const isMoving = this.gridEngine.isMoving('player');
    
    if (isMoving) {
      this.player.anims.play(`player-walk-${direction}`, true);
    } else {
      this.player.anims.play(`player-idle-${direction}`, true);
    }
    
    // Update guest labels position
    this.guestLabels.forEach((label, guestId) => {
      if (this.gridEngine.hasCharacter(guestId)) {
        const pos = this.gridEngine.getPosition(guestId);
        label.setPosition(pos.x * 32 + 16, pos.y * 32 - 10);
      }
    });
  }
}
