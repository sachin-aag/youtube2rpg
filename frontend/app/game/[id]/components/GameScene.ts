import Phaser from "phaser";

export interface NpcSpriteConfig {
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  animationFrameRate: number;
  animationDelay?: number; // optional delay in ms before starting animation
}

export interface NpcData {
  id: string;
  name: string;
  sprite: string;
  spriteConfig?: NpcSpriteConfig; // optional spritesheet configuration for animation
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  scale?: number; // optional scale factor for the sprite
}

export interface CollisionZone {
  id: string;
  type: "rectangle" | "circle";
  x: number; // percentage
  y: number; // percentage
  width?: number; // percentage (for rectangle)
  height?: number; // percentage (for rectangle)
  radius?: number; // percentage (for circle)
}

// Tiled JSON types
interface TiledObject {
  id: number;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  ellipse?: boolean;
  polygon?: { x: number; y: number }[];
}

interface TiledLayer {
  type: "objectgroup" | "imagelayer" | "tilelayer";
  name: string;
  objects?: TiledObject[];
  image?: string;
}

interface TiledMapData {
  width: number;
  height: number;
  tilewidth?: number;
  tileheight?: number;
  layers: TiledLayer[];
}

export interface PlayerSpriteConfig {
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  animationFrameRate: number;
}

export interface GameSceneConfig {
  gameId: string;
  mapImage: string;
  playerSprite: string;
  playerSpriteConfig?: PlayerSpriteConfig;
  npcs: NpcData[];
  collisionJsonPath?: string;
  onNpcInteract: (npcId: string) => void;
}

export class GameScene extends Phaser.Scene {
  private config!: GameSceneConfig;
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private npcs: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private interactionIndicators: Map<string, Phaser.GameObjects.Container> = new Map();
  private nearbyNpc: NpcData | null = null;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private moveSpeed = 200;
  private interactionDistance = 80;
  private mapSprite!: Phaser.GameObjects.Image;
  private collisionZones: CollisionZone[] = [];
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;

  // Sound
  private footstepTimer = 0;
  private footstepInterval = 250; // ms between footstep sounds
  private isMoving = false;
  private wasNearNpc = false;

  // Animation
  private playerDirection: "up" | "down" | "left" | "right" = "down";

  constructor() {
    super({ key: "GameScene" });
  }

  init(config: GameSceneConfig) {
    this.config = config;
  }

  preload() {
    if (!this.config) return;

    // Load map background
    this.load.image("map", this.config.mapImage);

    // Load player sprite (as spritesheet if config provided, otherwise as image)
    if (this.config.playerSpriteConfig) {
      this.load.spritesheet("player", this.config.playerSprite, {
        frameWidth: this.config.playerSpriteConfig.frameWidth,
        frameHeight: this.config.playerSpriteConfig.frameHeight,
      });
    } else {
      this.load.image("player", this.config.playerSprite);
    }

    // Load NPC sprites (as spritesheet if config provided, otherwise as image)
    for (const npc of this.config.npcs) {
      if (npc.spriteConfig) {
        this.load.spritesheet(`npc-${npc.id}`, npc.sprite, {
          frameWidth: npc.spriteConfig.frameWidth,
          frameHeight: npc.spriteConfig.frameHeight,
        });
      } else {
        this.load.image(`npc-${npc.id}`, npc.sprite);
      }
    }

    // Load collision JSON if provided
    if (this.config.collisionJsonPath) {
      this.load.json("collisionData", this.config.collisionJsonPath);
    }
  }

  create() {
    if (!this.config) return;

    const { width, height } = this.scale;

    // Initialize sounds using Web Audio
    this.createSounds();

    // Add map background
    this.mapSprite = this.add.image(width / 2, height / 2, "map");
    this.scaleMap();

    // Create collision obstacles group
    this.obstacles = this.physics.add.staticGroup();

    // Load collision zones from JSON
    this.loadCollisionZones();

    // Add NPCs at percentage positions
    for (const npc of this.config.npcs) {
      const npcX = (npc.x / 100) * width;
      const npcY = (npc.y / 100) * height;
      const npcSprite = this.add.sprite(npcX, npcY, `npc-${npc.id}`);
      npcSprite.setData("npcData", npc);
      npcSprite.setDepth(40);
      
      // Apply custom scale if provided
      if (npc.scale) {
        npcSprite.setScale(npc.scale);
      }
      
      this.npcs.set(npc.id, npcSprite);

      // Create and play sprite animation if spritesheet config is provided
      if (npc.spriteConfig) {
        const animKey = `npc-${npc.id}-idle`;
        this.anims.create({
          key: animKey,
          frames: this.anims.generateFrameNumbers(`npc-${npc.id}`, { 
            start: 0, 
            end: npc.spriteConfig.frameCount - 1 
          }),
          frameRate: npc.spriteConfig.animationFrameRate,
          repeat: -1,
        });
        
        // Start animation with optional delay for desynchronization
        const delay = npc.spriteConfig.animationDelay || 0;
        if (delay > 0) {
          this.time.delayedCall(delay, () => {
            npcSprite.play(animKey);
          });
        } else {
          npcSprite.play(animKey);
        }
      } else {
        // Add idle animation to NPCs without spritesheet (gentle pulse)
        const baseScale = npc.scale || 1;
        this.tweens.add({
          targets: npcSprite,
          scaleX: baseScale * 1.05,
          scaleY: baseScale * 1.05,
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      }

      // Create interaction indicator
      const indicator = this.createInteractionIndicator(npcX, npcY - 40);
      indicator.setVisible(false);
      this.interactionIndicators.set(npc.id, indicator);
    }

    // Add player with physics - restore position if saved
    const savedPosition = this.getSavedPosition();
    const playerX = savedPosition ? (savedPosition.x / 100) * width : width / 2;
    const playerY = savedPosition ? (savedPosition.y / 100) * height : height / 2;

    this.player = this.physics.add.sprite(playerX, playerY, "player");
    this.player.setDepth(50);
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(24, 24); // Smaller hitbox for better collision feel

    // Create and play idle animation if using spritesheet
    if (this.config.playerSpriteConfig) {
      const { frameCount, animationFrameRate } = this.config.playerSpriteConfig;
      
      // Create idle animation
      this.anims.create({
        key: "player-idle",
        frames: this.anims.generateFrameNumbers("player", { start: 0, end: frameCount - 1 }),
        frameRate: animationFrameRate,
        repeat: -1, // Loop forever
      });

      // Play the idle animation
      this.player.play("player-idle");
      
      // Scale down the sprite to a reasonable size (the sprite is quite large)
      this.player.setScale(0.15);
    }

    // Add collision between player and obstacles
    this.physics.add.collider(this.player, this.obstacles);

    // Set up keyboard input
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      this.wasdKeys = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }

    // Enter key for interaction
    this.enterKey.on("down", () => {
      if (this.nearbyNpc) {
        this.playSound("interact");
        this.savePlayerPosition();
        this.config.onNpcInteract(this.nearbyNpc.id);
      }
    });

    // Handle resize
    this.scale.on("resize", this.handleResize, this);
  }

  private createSounds() {
    // Sounds are generated on-the-fly using Web Audio API in playSound()
    // No preloading needed for generated tones
  }

  private getPositionStorageKey(): string {
    return `game-position-${this.config.gameId}`;
  }

  private savePlayerPosition() {
    if (!this.player || typeof window === "undefined") return;
    const { width, height } = this.scale;
    // Save as percentage for responsiveness
    const position = {
      x: (this.player.x / width) * 100,
      y: (this.player.y / height) * 100,
    };
    sessionStorage.setItem(this.getPositionStorageKey(), JSON.stringify(position));
  }

  private getSavedPosition(): { x: number; y: number } | null {
    if (typeof window === "undefined") return null;
    try {
      const saved = sessionStorage.getItem(this.getPositionStorageKey());
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Invalid data
    }
    return null;
  }

  private playSound(type: "footstep" | "interact" | "nearby") {
    try {
      // Get audio context from WebAudioSoundManager
      const soundManager = this.sound as Phaser.Sound.WebAudioSoundManager;
      if (!soundManager || !("context" in soundManager)) return;

      const audioContext = soundManager.context;
      if (!audioContext || audioContext.state === "suspended") return;

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      switch (type) {
        case "footstep":
          oscillator.frequency.value = 100 + Math.random() * 50;
          oscillator.type = "triangle";
          gainNode.gain.value = 0.05;
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.05);
          break;
        case "interact":
          oscillator.frequency.value = 440;
          oscillator.type = "sine";
          gainNode.gain.value = 0.1;
          oscillator.start();
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          oscillator.stop(audioContext.currentTime + 0.2);
          break;
        case "nearby":
          oscillator.frequency.value = 660;
          oscillator.type = "sine";
          gainNode.gain.value = 0.08;
          oscillator.start();
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
          oscillator.stop(audioContext.currentTime + 0.15);
          break;
      }
    } catch {
      // Audio not supported or blocked
    }
  }

  private loadCollisionZones() {
    const { width, height } = this.scale;

    if (!this.cache.json.exists("collisionData")) return;

    const data = this.cache.json.get("collisionData");

    // Check if it's Tiled JSON format (has layers array)
    if (data && data.layers) {
      this.loadTiledCollisions(data, width, height);
    }
    // Custom format (has zones array)
    else if (data && data.zones) {
      this.collisionZones = data.zones;
      for (const zone of this.collisionZones) {
        this.createCollisionBody(zone, width, height);
      }
    }
  }

  private loadTiledCollisions(tiledData: TiledMapData, sceneWidth: number, sceneHeight: number) {
    // Get the map dimensions from Tiled (in pixels)
    const mapWidth = tiledData.width * (tiledData.tilewidth || 32);
    const mapHeight = tiledData.height * (tiledData.tileheight || 32);

    // Find collision object layers
    for (const layer of tiledData.layers) {
      if (layer.type === "objectgroup" && layer.name?.toLowerCase().includes("collision")) {
        for (const obj of layer.objects || []) {
          // Convert Tiled pixel coordinates to percentage
          const xPercent = (obj.x / mapWidth) * 100;
          const yPercent = (obj.y / mapHeight) * 100;

          if (obj.ellipse) {
            // Circle/ellipse - use average of width/height as radius
            const radiusPercent = ((obj.width + obj.height) / 4 / Math.min(mapWidth, mapHeight)) * 100;
            const zone: CollisionZone = {
              id: obj.name || `tiled-circle-${obj.id}`,
              type: "circle",
              x: xPercent + (obj.width / mapWidth) * 50, // Center X
              y: yPercent + (obj.height / mapHeight) * 50, // Center Y
              radius: radiusPercent,
            };
            this.collisionZones.push(zone);
            this.createCollisionBody(zone, sceneWidth, sceneHeight);
          } else {
            // Rectangle
            const widthPercent = (obj.width / mapWidth) * 100;
            const heightPercent = (obj.height / mapHeight) * 100;
            const zone: CollisionZone = {
              id: obj.name || `tiled-rect-${obj.id}`,
              type: "rectangle",
              x: xPercent,
              y: yPercent,
              width: widthPercent,
              height: heightPercent,
            };
            this.collisionZones.push(zone);
            this.createCollisionBody(zone, sceneWidth, sceneHeight);
          }
        }
      }
    }
  }

  private createCollisionBody(zone: CollisionZone, sceneWidth: number, sceneHeight: number) {
    const x = (zone.x / 100) * sceneWidth;
    const y = (zone.y / 100) * sceneHeight;

    if (zone.type === "rectangle" && zone.width && zone.height) {
      const w = (zone.width / 100) * sceneWidth;
      const h = (zone.height / 100) * sceneHeight;

      // Create invisible rectangle obstacle
      const rect = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0xff0000, 0);
      this.obstacles.add(rect);

      // Debug: uncomment to see collision zones
      // rect.setFillStyle(0xff0000, 0.3);
    } else if (zone.type === "circle" && zone.radius) {
      const r = (zone.radius / 100) * Math.min(sceneWidth, sceneHeight);

      // Create invisible circle obstacle
      const circle = this.add.circle(x, y, r, 0xff0000, 0);
      this.physics.add.existing(circle, true);
      this.obstacles.add(circle);
    }
  }

  private scaleMap() {
    const { width, height } = this.scale;
    const scaleX = width / this.mapSprite.width;
    const scaleY = height / this.mapSprite.height;
    const scale = Math.min(scaleX, scaleY);
    this.mapSprite.setScale(scale);
    this.mapSprite.setPosition(width / 2, height / 2);
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    const { width, height } = gameSize;

    if (this.mapSprite) {
      this.scaleMap();
    }

    // Reposition NPCs
    for (const npc of this.config.npcs) {
      const npcSprite = this.npcs.get(npc.id);
      const indicator = this.interactionIndicators.get(npc.id);
      if (npcSprite) {
        const npcX = (npc.x / 100) * width;
        const npcY = (npc.y / 100) * height;
        npcSprite.setPosition(npcX, npcY);
        if (indicator) {
          indicator.setPosition(npcX, npcY - 40);
        }
      }
    }

    // Rebuild collision zones on resize
    this.obstacles.clear(true, true);
    for (const zone of this.collisionZones) {
      this.createCollisionBody(zone, width, height);
    }
  }

  private createInteractionIndicator(x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 24, 28, 0xf59e0b, 1);
    bg.setStrokeStyle(2, 0xd97706);

    const text = this.add.text(0, 0, "?", {
      fontSize: "18px",
      fontFamily: "monospace",
      color: "#000000",
      fontStyle: "bold",
    });
    text.setOrigin(0.5, 0.5);

    container.add([bg, text]);
    container.setDepth(100);

    this.tweens.add({
      targets: container,
      y: y - 8,
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    return container;
  }

  update(time: number, delta: number) {
    if (!this.config || !this.cursors || !this.player) return;

    // Movement with velocity (Arrow keys + WASD)
    let velocityX = 0;
    let velocityY = 0;

    const leftDown = this.cursors.left.isDown || this.wasdKeys?.A.isDown;
    const rightDown = this.cursors.right.isDown || this.wasdKeys?.D.isDown;
    const upDown = this.cursors.up.isDown || this.wasdKeys?.W.isDown;
    const downDown = this.cursors.down.isDown || this.wasdKeys?.S.isDown;

    if (leftDown) {
      velocityX = -this.moveSpeed;
      this.playerDirection = "left";
    } else if (rightDown) {
      velocityX = this.moveSpeed;
      this.playerDirection = "right";
    }

    if (upDown) {
      velocityY = -this.moveSpeed;
      this.playerDirection = "up";
    } else if (downDown) {
      velocityY = this.moveSpeed;
      this.playerDirection = "down";
    }

    // Normalize diagonal movement
    if (velocityX !== 0 && velocityY !== 0) {
      velocityX *= 0.707;
      velocityY *= 0.707;
    }

    // Apply velocity via physics
    this.player.setVelocity(velocityX, velocityY);

    // Check if moving for animation and sound
    const nowMoving = velocityX !== 0 || velocityY !== 0;

    // Player walking animation (scale pulse)
    const baseScale = this.config.playerSpriteConfig ? 0.15 : 1;
    if (nowMoving && !this.isMoving) {
      // Start walking animation
      this.tweens.add({
        targets: this.player,
        scaleX: baseScale * 1.1,
        scaleY: baseScale * 0.9,
        duration: 100,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    } else if (!nowMoving && this.isMoving) {
      // Stop walking animation
      this.tweens.killTweensOf(this.player);
      this.player.setScale(baseScale, baseScale);
    }

    // Footstep sounds
    if (nowMoving) {
      this.footstepTimer += delta;
      if (this.footstepTimer >= this.footstepInterval) {
        this.playSound("footstep");
        this.footstepTimer = 0;
      }
    } else {
      this.footstepTimer = 0;
    }

    this.isMoving = nowMoving;

    // Check proximity to NPCs
    this.checkNpcProximity();
  }

  private checkNpcProximity() {
    let foundNpc: NpcData | null = null;

    for (const npc of this.config.npcs) {
      const npcSprite = this.npcs.get(npc.id);
      if (!npcSprite) continue;

      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        npcSprite.x,
        npcSprite.y
      );

      const indicator = this.interactionIndicators.get(npc.id);

      if (distance < this.interactionDistance) {
        foundNpc = npc;
        indicator?.setVisible(true);
      } else {
        indicator?.setVisible(false);
      }
    }

    // Play sound when entering NPC proximity
    if (foundNpc && !this.wasNearNpc) {
      this.playSound("nearby");
    }
    this.wasNearNpc = !!foundNpc;

    this.nearbyNpc = foundNpc;
  }

  getNearbyNpc(): NpcData | null {
    return this.nearbyNpc;
  }
}
