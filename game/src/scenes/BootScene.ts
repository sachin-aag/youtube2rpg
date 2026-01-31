import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Create loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);
    
    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '16px',
      color: '#e6d388',
    });
    loadingText.setOrigin(0.5, 0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xe6d388, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });
  }

  create(): void {
    // Generate placeholder sprites in create (after scene is ready)
    this.generatePlaceholderAssets();
    
    // Generate battle background
    this.generateBattleBackground();
    
    // Create player animations
    this.createAnimations();

    // Go to menu scene
    this.scene.start('MenuScene');
  }

  private generatePlaceholderAssets(): void {
    // Generate player sprite sheet using graphics
    this.generateCharacterSprite('player', 0x4a90d9);
    
    // Generate tileset
    this.generateTileset();
  }

  private generateCharacterSprite(key: string, color: number): void {
    const frameWidth = 32;
    const frameHeight = 32;
    
    // Create a render texture for the sprite sheet
    const rt = this.add.renderTexture(0, 0, frameWidth * 3, frameHeight * 4);
    rt.setVisible(false);
    
    const graphics = this.add.graphics();
    
    const directions = ['down', 'left', 'right', 'up'];
    
    directions.forEach((direction, dirIndex) => {
      for (let frame = 0; frame < 3; frame++) {
        const x = frame * frameWidth + frameWidth / 2;
        const y = dirIndex * frameHeight + frameHeight / 2;
        
        graphics.clear();
        this.drawCharacter(graphics, 0, 0, color, direction, frame);
        rt.draw(graphics, x, y);
      }
    });
    
    graphics.destroy();
    
    // Save as texture
    rt.saveTexture(key);
    rt.destroy();
    
    // Add as sprite sheet
    this.textures.get(key).add('__BASE', 0, 0, 0, frameWidth * 3, frameHeight * 4);
  }

  private drawCharacter(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    color: number,
    direction: string,
    frame: number
  ): void {
    const bobOffset = frame === 1 ? 0 : (frame === 0 ? -1 : 1);
    const legOffset = frame === 1 ? 0 : (frame === 0 ? 2 : -2);
    
    // Shadow
    graphics.fillStyle(0x000000, 0.3);
    graphics.fillEllipse(x, y + 12, 20, 8);
    
    // Body
    graphics.fillStyle(color);
    graphics.fillRect(x - 6, y - 6 + bobOffset, 12, 14);
    
    // Head
    graphics.fillStyle(0xffd5b5);
    graphics.fillCircle(x, y - 12 + bobOffset, 8);
    
    // Hair
    graphics.fillStyle(0x3d2914);
    graphics.fillRect(x - 7, y - 20 + bobOffset, 14, 6);
    
    // Eyes (front facing only)
    if (direction === 'down') {
      graphics.fillStyle(0x000000);
      graphics.fillRect(x - 4, y - 13 + bobOffset, 2, 2);
      graphics.fillRect(x + 2, y - 13 + bobOffset, 2, 2);
    } else if (direction === 'left') {
      graphics.fillStyle(0x000000);
      graphics.fillRect(x - 5, y - 12 + bobOffset, 2, 2);
    } else if (direction === 'right') {
      graphics.fillStyle(0x000000);
      graphics.fillRect(x + 3, y - 12 + bobOffset, 2, 2);
    }
    
    // Legs
    graphics.fillStyle(0x2c3e50);
    graphics.fillRect(x - 5 + legOffset / 2, y + 8 + bobOffset, 4, 6);
    graphics.fillRect(x + 1 - legOffset / 2, y + 8 + bobOffset, 4, 6);
    
    // Feet
    graphics.fillStyle(0x1a252f);
    graphics.fillRect(x - 5 + legOffset / 2, y + 12 + bobOffset, 4, 3);
    graphics.fillRect(x + 1 - legOffset / 2, y + 12 + bobOffset, 4, 3);
  }

  private generateTileset(): void {
    const tileSize = 32;
    
    // Create individual tile textures
    this.createGrassTile(tileSize);
    this.createPathTile(tileSize);
    this.createTreeTile(tileSize);
  }

  private createGrassTile(size: number): void {
    const graphics = this.add.graphics();
    
    // Base grass
    graphics.fillStyle(0x7ec850);
    graphics.fillRect(0, 0, size, size);
    
    // Grass details
    graphics.fillStyle(0x6ab840);
    for (let i = 0; i < 8; i++) {
      graphics.fillRect(Math.random() * size, Math.random() * size, 2, 4);
    }
    
    graphics.generateTexture('grass', size, size);
    graphics.destroy();
  }

  private createPathTile(size: number): void {
    const graphics = this.add.graphics();
    
    // Base path
    graphics.fillStyle(0xc4a76c);
    graphics.fillRect(0, 0, size, size);
    
    // Variation
    graphics.fillStyle(0xb89860);
    for (let i = 0; i < 4; i++) {
      graphics.fillRect(Math.random() * size, Math.random() * size, 4, 2);
    }
    
    graphics.generateTexture('path', size, size);
    graphics.destroy();
  }

  private createTreeTile(size: number): void {
    const graphics = this.add.graphics();
    
    // Grass base
    graphics.fillStyle(0x7ec850);
    graphics.fillRect(0, 0, size, size);
    
    // Trunk
    graphics.fillStyle(0x5d4037);
    graphics.fillRect(size / 2 - 3, size / 2, 6, size / 2);
    
    // Foliage
    graphics.fillStyle(0x2e7d32);
    graphics.fillCircle(size / 2, size / 3, 10);
    
    graphics.fillStyle(0x388e3c);
    graphics.fillCircle(size / 2 - 6, size / 3 + 4, 6);
    graphics.fillCircle(size / 2 + 6, size / 3 + 4, 6);
    
    graphics.generateTexture('tree', size, size);
    graphics.destroy();
  }

  private generateBattleBackground(): void {
    const graphics = this.add.graphics();
    
    // Draw grass field background
    graphics.fillStyle(0x7ec850);
    graphics.fillRect(0, 0, 800, 600);
    
    // Add some grass details
    graphics.fillStyle(0x6ab840);
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 800;
      const y = Math.random() * 600;
      graphics.fillRect(x, y, 4, 8);
    }
    
    // Draw battle arena circles
    graphics.lineStyle(4, 0x5a9830);
    graphics.strokeEllipse(600, 180, 200, 80);
    graphics.strokeEllipse(200, 350, 200, 80);
    
    // Fill arena with lighter color
    graphics.fillStyle(0x8fd860, 0.5);
    graphics.fillEllipse(600, 180, 200, 80);
    graphics.fillEllipse(200, 350, 200, 80);

    graphics.generateTexture('battleBackground', 800, 600);
    graphics.destroy();
  }

  private createAnimations(): void {
    // We need to create the sprite sheet frames manually since we used renderTexture
    const texture = this.textures.get('player');
    
    // Add frames to the texture (3 columns x 4 rows)
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) {
        const frameIndex = row * 3 + col;
        texture.add(frameIndex, 0, col * 32, row * 32, 32, 32);
      }
    }
    
    // Create player animations
    this.anims.create({
      key: 'player-walk-down',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 2 }),
      frameRate: 8,
      repeat: -1,
    });
    
    this.anims.create({
      key: 'player-walk-left',
      frames: this.anims.generateFrameNumbers('player', { start: 3, end: 5 }),
      frameRate: 8,
      repeat: -1,
    });
    
    this.anims.create({
      key: 'player-walk-right',
      frames: this.anims.generateFrameNumbers('player', { start: 6, end: 8 }),
      frameRate: 8,
      repeat: -1,
    });
    
    this.anims.create({
      key: 'player-walk-up',
      frames: this.anims.generateFrameNumbers('player', { start: 9, end: 11 }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: 'player-idle-down',
      frames: [{ key: 'player', frame: 1 }],
      frameRate: 1,
    });
    
    this.anims.create({
      key: 'player-idle-left',
      frames: [{ key: 'player', frame: 4 }],
      frameRate: 1,
    });
    
    this.anims.create({
      key: 'player-idle-right',
      frames: [{ key: 'player', frame: 7 }],
      frameRate: 1,
    });
    
    this.anims.create({
      key: 'player-idle-up',
      frames: [{ key: 'player', frame: 10 }],
      frameRate: 1,
    });
  }
}
