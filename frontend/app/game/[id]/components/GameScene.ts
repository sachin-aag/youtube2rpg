import Phaser from "phaser";

export interface NpcData {
  id: string;
  name: string;
  sprite: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
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

export interface AudioSettings {
  musicEnabled: boolean;
  musicVolume: number;
  sfxEnabled: boolean;
  sfxVolume: number;
}

export interface GameSceneConfig {
  gameId: string;
  mapImage: string;
  playerSprite: string;
  npcs: NpcData[];
  collisionJsonPath?: string;
  onNpcInteract: (npcId: string) => void;
  // Music configuration
  musicUrl?: string;
  currentLevel?: number;
  audioSettings?: AudioSettings;
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

  // Background music
  private backgroundMusic: HTMLAudioElement | null = null;
  private musicAudioContext: AudioContext | null = null;
  private musicGainNode: GainNode | null = null;
  private musicFilterNode: BiquadFilterNode | null = null;
  private musicSourceNode: MediaElementAudioSourceNode | null = null;
  private currentLevel = 1;
  private audioSettings: AudioSettings = {
    musicEnabled: true,
    musicVolume: 0.5,
    sfxEnabled: true,
    sfxVolume: 0.5,
  };

  constructor() {
    super({ key: "GameScene" });
  }

  init(config: GameSceneConfig) {
    this.config = config;
    this.currentLevel = config.currentLevel || 1;
    if (config.audioSettings) {
      this.audioSettings = config.audioSettings;
    }
  }

  preload() {
    if (!this.config) return;

    // Load map background
    this.load.image("map", this.config.mapImage);

    // Load player sprite
    this.load.image("player", this.config.playerSprite);

    // Load NPC sprites
    for (const npc of this.config.npcs) {
      this.load.image(`npc-${npc.id}`, npc.sprite);
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

    // Initialize background music if URL provided
    if (this.config.musicUrl) {
      this.initBackgroundMusic(this.config.musicUrl);
    }

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
      this.npcs.set(npc.id, npcSprite);

      // Add idle animation to NPCs (gentle pulse)
      this.tweens.add({
        targets: npcSprite,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      // Create interaction indicator
      const indicator = this.createInteractionIndicator(npcX, npcY - 40);
      indicator.setVisible(false);
      this.interactionIndicators.set(npc.id, indicator);
    }

    // Add player with physics - restore position if saved
    const savedPosition = this.getSavedPosition();
    const playerX = savedPosition ? (savedPosition.x / 100) * width : width * 0.185;
    const playerY = savedPosition ? (savedPosition.y / 100) * height : height * 0.95;

    this.player = this.physics.add.sprite(playerX, playerY, "player");
    this.player.setDepth(50);
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(24, 24); // Smaller hitbox for better collision feel

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

  private initBackgroundMusic(musicUrl: string) {
    try {
      console.log("Initializing background music:", musicUrl);
      
      // Clean up any existing audio first
      if (this.backgroundMusic) {
        this.backgroundMusic.pause();
        this.backgroundMusic.src = "";
        this.backgroundMusic = null;
      }
      
      // Create audio element with the URL directly (more reliable)
      this.backgroundMusic = new Audio();
      this.backgroundMusic.loop = true;
      this.backgroundMusic.preload = "auto";
      
      // Set crossOrigin for external URLs (like Supabase) to enable Web Audio API processing
      // This must be set BEFORE setting the src
      if (musicUrl.startsWith("http")) {
        this.backgroundMusic.crossOrigin = "anonymous";
      }
      
      // Now set the source
      this.backgroundMusic.src = musicUrl;
      
      // Set volume immediately (simple playback)
      this.backgroundMusic.volume = this.audioSettings.musicVolume;

      // Handle successful load
      this.backgroundMusic.addEventListener("canplaythrough", () => {
        console.log("Background music loaded successfully");
        // Try simple playback first, then set up effects
        if (this.audioSettings.musicEnabled) {
          this.playBackgroundMusic();
        }
        // Set up audio nodes for effects (optional enhancement)
        if (this.backgroundMusic && !this.musicSourceNode) {
          this.setupAudioNodes();
        }
      }, { once: true });

      // Handle errors with fallback
      this.backgroundMusic.addEventListener("error", () => {
        const error = this.backgroundMusic?.error;
        // Only log as error if there's actual error info
        if (error?.code) {
          console.error("Background music error:", {
            code: error.code,
            message: error.message,
            url: musicUrl,
          });
          // Only retry for network errors (code 2) or decode errors (code 3)
          // Don't retry for MEDIA_ERR_ABORTED (code 1) as that's intentional
          if (error.code >= 2 && !musicUrl.includes("?retry=")) {
            console.log("Retrying with cache-busted URL...");
            setTimeout(() => {
              if (this.backgroundMusic) {
                this.backgroundMusic.pause();
                this.backgroundMusic.src = "";
              }
              this.backgroundMusic = null;
              this.initBackgroundMusic(musicUrl + "?retry=" + Date.now());
            }, 500);
          }
        } else {
          // Error event fired without proper error info - likely a transient issue
          console.log("Background music: transient error (no error code), continuing...");
        }
      });

      // Start loading
      this.backgroundMusic.load();
    } catch (e) {
      console.error("Failed to initialize background music:", e);
    }
  }

  private setupAudioNodes() {
    if (!this.backgroundMusic) return;
    
    try {
      // Skip Web Audio API setup for external URLs if CORS might fail
      // Just use simple playback which is more reliable
      const isExternalUrl = this.backgroundMusic.src.startsWith("http") && 
                           !this.backgroundMusic.src.includes(window.location.host);
      
      if (isExternalUrl) {
        console.log("Using simple playback for external audio (better CORS compatibility)");
        // For external URLs, just use simple HTML5 Audio playback
        // The intensity effects won't work, but playback is more reliable
        if (this.audioSettings.musicEnabled) {
          this.playBackgroundMusicSimple();
        }
        return;
      }
      
      // Create audio context and nodes for effects (local files only)
      this.musicAudioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      // Create gain node for volume control
      this.musicGainNode = this.musicAudioContext.createGain();
      
      // Create filter node for intensity effects
      this.musicFilterNode = this.musicAudioContext.createBiquadFilter();
      this.musicFilterNode.type = "lowshelf";
      this.musicFilterNode.frequency.value = 200;
      this.musicFilterNode.gain.value = 0;

      // Connect the audio element to the audio context
      this.musicSourceNode = this.musicAudioContext.createMediaElementSource(this.backgroundMusic);
      this.musicSourceNode
        .connect(this.musicFilterNode)
        .connect(this.musicGainNode)
        .connect(this.musicAudioContext.destination);
      
      // Apply initial settings
      this.applyMusicSettings();
      this.applyIntensityEffects();
      
      // Start playing if enabled
      if (this.audioSettings.musicEnabled) {
        this.playBackgroundMusic();
      }
    } catch (e) {
      console.error("Error setting up audio nodes:", e);
      // Fall back to simple playback without effects
      this.playBackgroundMusicSimple();
    }
  }

  private playBackgroundMusicSimple() {
    if (!this.backgroundMusic || !this.audioSettings.musicEnabled) return;
    
    this.backgroundMusic.volume = this.audioSettings.musicVolume;
    this.backgroundMusic.play().catch((e) => {
      console.log("Music autoplay blocked:", e);
    });
  }

  private musicAutoplayBlocked = false;
  private userInteractionHandler: (() => void) | null = null;

  private playBackgroundMusic() {
    if (!this.backgroundMusic || !this.audioSettings.musicEnabled) return;
    
    // Resume audio context if suspended (browser autoplay policy)
    if (this.musicAudioContext?.state === "suspended") {
      this.musicAudioContext.resume();
    }
    
    this.backgroundMusic.play().catch((e) => {
      console.log("Music autoplay blocked, waiting for user interaction:", e);
      this.musicAutoplayBlocked = true;
      this.setupUserInteractionHandler();
    });
  }

  private setupUserInteractionHandler() {
    if (this.userInteractionHandler) return; // Already set up
    
    this.userInteractionHandler = () => {
      if (this.musicAutoplayBlocked && this.backgroundMusic && this.audioSettings.musicEnabled) {
        // Resume audio context
        if (this.musicAudioContext?.state === "suspended") {
          this.musicAudioContext.resume();
        }
        
        // Try to play again
        this.backgroundMusic.play().then(() => {
          console.log("Music started after user interaction");
          this.musicAutoplayBlocked = false;
          this.removeUserInteractionHandler();
        }).catch(() => {
          // Still blocked, keep waiting
        });
      }
    };

    // Listen for any user interaction
    document.addEventListener("click", this.userInteractionHandler);
    document.addEventListener("keydown", this.userInteractionHandler);
    document.addEventListener("touchstart", this.userInteractionHandler);
  }

  private removeUserInteractionHandler() {
    if (this.userInteractionHandler) {
      document.removeEventListener("click", this.userInteractionHandler);
      document.removeEventListener("keydown", this.userInteractionHandler);
      document.removeEventListener("touchstart", this.userInteractionHandler);
      this.userInteractionHandler = null;
    }
  }

  private pauseBackgroundMusic() {
    if (!this.backgroundMusic) return;
    this.backgroundMusic.pause();
  }

  private applyMusicSettings() {
    if (!this.musicGainNode) return;
    
    const volume = this.audioSettings.musicEnabled 
      ? this.audioSettings.musicVolume 
      : 0;
    
    this.musicGainNode.gain.value = volume;
  }

  private applyIntensityEffects() {
    if (!this.backgroundMusic || !this.musicFilterNode || !this.musicGainNode) return;

    // Calculate intensity based on level (levels 1-16+)
    // intensity goes from 0 to ~1.5 for level 15+
    const intensity = Math.min((this.currentLevel - 1) / 10, 1.5);

    // Apply tempo increase (subtle, 1.0 to 1.15x speed)
    this.backgroundMusic.playbackRate = 1 + (intensity * 0.1);

    // Boost low frequencies as intensity increases
    this.musicFilterNode.frequency.value = 200 + (intensity * 100);
    this.musicFilterNode.gain.value = intensity * 4;

    // Slight volume boost with intensity (up to 20% more)
    const baseVolume = this.audioSettings.musicVolume;
    const boostedVolume = baseVolume * (1 + intensity * 0.2);
    
    if (this.audioSettings.musicEnabled) {
      this.musicGainNode.gain.value = Math.min(boostedVolume, 1);
    }
  }

  // Public method to set music URL (called when URL becomes available after scene start)
  setMusicUrl(musicUrl: string) {
    // If already playing this URL, don't reinitialize
    if (this.backgroundMusic?.src?.includes(musicUrl.split("?")[0])) {
      return;
    }
    this.initBackgroundMusic(musicUrl);
  }

  // Public method to update audio settings from React
  updateAudioSettings(settings: AudioSettings) {
    this.audioSettings = settings;
    this.applyMusicSettings();
    
    if (settings.musicEnabled && this.backgroundMusic?.paused) {
      this.playBackgroundMusic();
    } else if (!settings.musicEnabled && !this.backgroundMusic?.paused) {
      this.pauseBackgroundMusic();
    }
  }

  // Public method to update level (for intensity effects)
  updateLevel(level: number) {
    this.currentLevel = level;
    this.applyIntensityEffects();
  }

  // Clean up when scene is destroyed
  shutdown() {
    console.log("GameScene shutdown - cleaning up audio");
    this.removeUserInteractionHandler();
    this.musicAutoplayBlocked = false;
    
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.src = "";
      this.backgroundMusic.load(); // Reset the element
      this.backgroundMusic = null;
    }
    if (this.musicAudioContext && this.musicAudioContext.state !== "closed") {
      this.musicAudioContext.close().catch(() => {});
      this.musicAudioContext = null;
    }
    this.musicSourceNode = null;
    this.musicGainNode = null;
    this.musicFilterNode = null;
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
    // Check if SFX is enabled
    if (!this.audioSettings.sfxEnabled) return;
    
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

      // Apply SFX volume multiplier
      const volumeMultiplier = this.audioSettings.sfxVolume;

      switch (type) {
        case "footstep":
          oscillator.frequency.value = 100 + Math.random() * 50;
          oscillator.type = "triangle";
          gainNode.gain.value = 0.05 * volumeMultiplier;
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.05);
          break;
        case "interact":
          oscillator.frequency.value = 440;
          oscillator.type = "sine";
          gainNode.gain.value = 0.1 * volumeMultiplier;
          oscillator.start();
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          oscillator.stop(audioContext.currentTime + 0.2);
          break;
        case "nearby":
          oscillator.frequency.value = 660;
          oscillator.type = "sine";
          gainNode.gain.value = 0.08 * volumeMultiplier;
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
    if (nowMoving && !this.isMoving) {
      // Start walking animation
      this.tweens.add({
        targets: this.player,
        scaleX: 1.1,
        scaleY: 0.9,
        duration: 100,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    } else if (!nowMoving && this.isMoving) {
      // Stop walking animation
      this.tweens.killTweensOf(this.player);
      this.player.setScale(1, 1);
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
