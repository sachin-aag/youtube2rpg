import Phaser from 'phaser';

/**
 * Generates a simple character sprite sheet programmatically
 * Creates 12 frames: 3 for each direction (down, left, right, up)
 */
export function generatePlayerSprite(scene: Phaser.Scene, color: number): Phaser.Textures.CanvasTexture {
  const frameWidth = 32;
  const frameHeight = 32;
  const frames = 12; // 3 frames x 4 directions
  
  const canvas = document.createElement('canvas');
  canvas.width = frameWidth * 3;
  canvas.height = frameHeight * 4;
  const ctx = canvas.getContext('2d')!;
  
  const directions = ['down', 'left', 'right', 'up'];
  
  directions.forEach((direction, dirIndex) => {
    for (let frame = 0; frame < 3; frame++) {
      const x = frame * frameWidth;
      const y = dirIndex * frameHeight;
      
      drawCharacter(ctx, x, y, frameWidth, frameHeight, color, direction, frame);
    }
  });
  
  const texture = scene.textures.createCanvas('playerCanvas', canvas.width, canvas.height);
  const textureCtx = texture!.getContext();
  textureCtx.drawImage(canvas, 0, 0);
  texture!.refresh();
  
  return texture!;
}

/**
 * Generates a guest NPC sprite with different color
 */
export function generateGuestSprite(scene: Phaser.Scene, color: number): Phaser.Textures.CanvasTexture {
  const frameWidth = 32;
  const frameHeight = 32;
  
  const canvas = document.createElement('canvas');
  canvas.width = frameWidth * 3;
  canvas.height = frameHeight * 4;
  const ctx = canvas.getContext('2d')!;
  
  const directions = ['down', 'left', 'right', 'up'];
  
  directions.forEach((direction, dirIndex) => {
    for (let frame = 0; frame < 3; frame++) {
      const x = frame * frameWidth;
      const y = dirIndex * frameHeight;
      
      drawCharacter(ctx, x, y, frameWidth, frameHeight, color, direction, frame, true);
    }
  });
  
  const textureKey = `guestCanvas_${Date.now()}_${Math.random()}`;
  const texture = scene.textures.createCanvas(textureKey, canvas.width, canvas.height);
  const textureCtx = texture!.getContext();
  textureCtx.drawImage(canvas, 0, 0);
  texture!.refresh();
  
  return texture!;
}

function drawCharacter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: number,
  direction: string,
  frame: number,
  isGuest: boolean = false
): void {
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  // Convert hex color to RGB
  const r = (color >> 16) & 255;
  const g = (color >> 8) & 255;
  const b = color & 255;
  const mainColor = `rgb(${r}, ${g}, ${b})`;
  const darkColor = `rgb(${Math.floor(r * 0.7)}, ${Math.floor(g * 0.7)}, ${Math.floor(b * 0.7)})`;
  const lightColor = `rgb(${Math.min(255, r + 50)}, ${Math.min(255, g + 50)}, ${Math.min(255, b + 50)})`;
  
  // Animation offset for walking
  const bobOffset = frame === 1 ? 0 : (frame === 0 ? -1 : 1);
  const legOffset = frame === 1 ? 0 : (frame === 0 ? 2 : -2);
  
  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(centerX, y + height - 4, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Body
  ctx.fillStyle = mainColor;
  ctx.fillRect(centerX - 6, centerY - 2 + bobOffset, 12, 14);
  
  // Body outline
  ctx.strokeStyle = darkColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(centerX - 6, centerY - 2 + bobOffset, 12, 14);
  
  // Head
  const headColor = isGuest ? '#ffecd2' : '#ffd5b5';
  ctx.fillStyle = headColor;
  ctx.beginPath();
  ctx.arc(centerX, centerY - 8 + bobOffset, 8, 0, Math.PI * 2);
  ctx.fill();
  
  // Head outline
  ctx.strokeStyle = '#d4a574';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Hair
  ctx.fillStyle = isGuest ? '#4a3728' : '#3d2914';
  if (direction === 'down' || direction === 'up') {
    ctx.fillRect(centerX - 7, centerY - 16 + bobOffset, 14, 6);
  } else {
    ctx.fillRect(centerX - 6, centerY - 16 + bobOffset, 12, 6);
  }
  
  // Eyes (only for front-facing)
  if (direction === 'down') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(centerX - 4, centerY - 9 + bobOffset, 2, 2);
    ctx.fillRect(centerX + 2, centerY - 9 + bobOffset, 2, 2);
    
    // Eye shine
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(centerX - 4, centerY - 9 + bobOffset, 1, 1);
    ctx.fillRect(centerX + 2, centerY - 9 + bobOffset, 1, 1);
  } else if (direction === 'left') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(centerX - 5, centerY - 8 + bobOffset, 2, 2);
  } else if (direction === 'right') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(centerX + 3, centerY - 8 + bobOffset, 2, 2);
  }
  
  // Legs
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(centerX - 5 + legOffset / 2, centerY + 12 + bobOffset, 4, 6);
  ctx.fillRect(centerX + 1 - legOffset / 2, centerY + 12 + bobOffset, 4, 6);
  
  // Feet
  ctx.fillStyle = '#1a252f';
  ctx.fillRect(centerX - 5 + legOffset / 2, centerY + 16 + bobOffset, 4, 3);
  ctx.fillRect(centerX + 1 - legOffset / 2, centerY + 16 + bobOffset, 4, 3);
  
  // Arms (different position based on direction)
  ctx.fillStyle = headColor;
  if (direction === 'left') {
    ctx.fillRect(centerX - 8, centerY + 2 + bobOffset, 3, 8);
    ctx.fillRect(centerX + 5, centerY + 4 + bobOffset, 3, 6);
  } else if (direction === 'right') {
    ctx.fillRect(centerX - 8, centerY + 4 + bobOffset, 3, 6);
    ctx.fillRect(centerX + 5, centerY + 2 + bobOffset, 3, 8);
  } else {
    ctx.fillRect(centerX - 9, centerY + 2 + bobOffset + legOffset / 2, 3, 8);
    ctx.fillRect(centerX + 6, centerY + 2 + bobOffset - legOffset / 2, 3, 8);
  }
}

/**
 * Generates a basic tileset with grass, path, and obstacle tiles
 */
export function generateTileset(scene: Phaser.Scene): Phaser.Textures.CanvasTexture {
  const tileSize = 32;
  const tilesPerRow = 4;
  const rows = 2;
  
  const canvas = document.createElement('canvas');
  canvas.width = tileSize * tilesPerRow;
  canvas.height = tileSize * rows;
  const ctx = canvas.getContext('2d')!;
  
  // Tile 0: Grass
  drawGrassTile(ctx, 0, 0, tileSize);
  
  // Tile 1: Path/dirt
  drawPathTile(ctx, tileSize, 0, tileSize);
  
  // Tile 2: Tree/obstacle
  drawTreeTile(ctx, tileSize * 2, 0, tileSize);
  
  // Tile 3: Water
  drawWaterTile(ctx, tileSize * 3, 0, tileSize);
  
  // Tile 4: Flowers
  drawFlowerTile(ctx, 0, tileSize, tileSize);
  
  // Tile 5: Stone path
  drawStoneTile(ctx, tileSize, tileSize, tileSize);
  
  // Tile 6: Building wall
  drawWallTile(ctx, tileSize * 2, tileSize, tileSize);
  
  // Tile 7: Checkpoint marker
  drawCheckpointTile(ctx, tileSize * 3, tileSize, tileSize);
  
  const texture = scene.textures.createCanvas('tilesetCanvas', canvas.width, canvas.height);
  const textureCtx = texture!.getContext();
  textureCtx.drawImage(canvas, 0, 0);
  texture!.refresh();
  
  return texture!;
}

function drawGrassTile(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  // Base grass color
  ctx.fillStyle = '#7ec850';
  ctx.fillRect(x, y, size, size);
  
  // Grass variation
  ctx.fillStyle = '#6ab840';
  for (let i = 0; i < 8; i++) {
    const gx = x + Math.random() * size;
    const gy = y + Math.random() * size;
    ctx.fillRect(gx, gy, 2, 4);
  }
  
  // Lighter patches
  ctx.fillStyle = '#8fd860';
  for (let i = 0; i < 4; i++) {
    const gx = x + Math.random() * size;
    const gy = y + Math.random() * size;
    ctx.fillRect(gx, gy, 3, 3);
  }
}

function drawPathTile(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  // Base dirt color
  ctx.fillStyle = '#c4a76c';
  ctx.fillRect(x, y, size, size);
  
  // Dirt variation
  ctx.fillStyle = '#b89860';
  for (let i = 0; i < 6; i++) {
    const dx = x + Math.random() * size;
    const dy = y + Math.random() * size;
    ctx.fillRect(dx, dy, 4, 2);
  }
  
  // Small stones
  ctx.fillStyle = '#8b7355';
  for (let i = 0; i < 3; i++) {
    const sx = x + Math.random() * size;
    const sy = y + Math.random() * size;
    ctx.beginPath();
    ctx.arc(sx, sy, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTreeTile(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  // Grass base
  drawGrassTile(ctx, x, y, size);
  
  // Tree trunk
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(x + size / 2 - 3, y + size / 2, 6, size / 2);
  
  // Tree top (multiple circles for foliage)
  ctx.fillStyle = '#2e7d32';
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 3, 10, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#388e3c';
  ctx.beginPath();
  ctx.arc(x + size / 2 - 6, y + size / 3 + 4, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + size / 2 + 6, y + size / 3 + 4, 6, 0, Math.PI * 2);
  ctx.fill();
  
  // Highlights
  ctx.fillStyle = '#4caf50';
  ctx.beginPath();
  ctx.arc(x + size / 2 - 3, y + size / 3 - 3, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawWaterTile(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  // Base water color
  ctx.fillStyle = '#2196f3';
  ctx.fillRect(x, y, size, size);
  
  // Water waves
  ctx.fillStyle = '#64b5f6';
  for (let i = 0; i < 3; i++) {
    const wy = y + 8 + i * 10;
    ctx.beginPath();
    ctx.moveTo(x, wy);
    ctx.quadraticCurveTo(x + size / 4, wy - 3, x + size / 2, wy);
    ctx.quadraticCurveTo(x + (size * 3) / 4, wy + 3, x + size, wy);
    ctx.lineTo(x + size, wy + 2);
    ctx.lineTo(x, wy + 2);
    ctx.fill();
  }
  
  // Sparkles
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + 8, y + 6, 2, 2);
  ctx.fillRect(x + 20, y + 18, 2, 2);
}

function drawFlowerTile(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  // Grass base
  drawGrassTile(ctx, x, y, size);
  
  // Flowers
  const flowerColors = ['#e91e63', '#ffeb3b', '#ff5722', '#9c27b0'];
  for (let i = 0; i < 4; i++) {
    const fx = x + 6 + Math.random() * (size - 12);
    const fy = y + 6 + Math.random() * (size - 12);
    
    // Stem
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(fx, fy, 1, 4);
    
    // Flower
    ctx.fillStyle = flowerColors[i % flowerColors.length];
    ctx.beginPath();
    ctx.arc(fx, fy - 1, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Center
    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath();
    ctx.arc(fx, fy - 1, 1, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawStoneTile(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  // Base stone color
  ctx.fillStyle = '#9e9e9e';
  ctx.fillRect(x, y, size, size);
  
  // Stone pattern
  ctx.strokeStyle = '#757575';
  ctx.lineWidth = 1;
  
  // Horizontal lines
  ctx.beginPath();
  ctx.moveTo(x, y + size / 2);
  ctx.lineTo(x + size, y + size / 2);
  ctx.stroke();
  
  // Vertical lines (offset)
  ctx.beginPath();
  ctx.moveTo(x + size / 2, y);
  ctx.lineTo(x + size / 2, y + size / 2);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(x, y + size / 2);
  ctx.lineTo(x, y + size);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(x + size, y + size / 2);
  ctx.lineTo(x + size, y + size);
  ctx.stroke();
}

function drawWallTile(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  // Base wall color
  ctx.fillStyle = '#78909c';
  ctx.fillRect(x, y, size, size);
  
  // Brick pattern
  ctx.strokeStyle = '#546e7a';
  ctx.lineWidth = 1;
  
  for (let row = 0; row < 4; row++) {
    const yPos = y + row * 8;
    const offset = row % 2 === 0 ? 0 : size / 2;
    
    ctx.strokeRect(x + offset, yPos, size / 2, 8);
    ctx.strokeRect(x + offset - size / 2, yPos, size / 2, 8);
    ctx.strokeRect(x + offset + size / 2, yPos, size / 2, 8);
  }
  
  // Highlights
  ctx.fillStyle = '#90a4ae';
  ctx.fillRect(x + 2, y + 2, size / 2 - 4, 2);
  ctx.fillRect(x + size / 2 + 2, y + 10, size / 2 - 4, 2);
}

function drawCheckpointTile(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  // Path base
  drawPathTile(ctx, x, y, size);
  
  // Checkpoint marker
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.moveTo(x + size / 2, y + 4);
  ctx.lineTo(x + size / 2 + 8, y + size / 2);
  ctx.lineTo(x + size / 2, y + size - 4);
  ctx.lineTo(x + size / 2 - 8, y + size / 2);
  ctx.closePath();
  ctx.fill();
  
  // Outline
  ctx.strokeStyle = '#ff8f00';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Inner glow
  ctx.fillStyle = '#ffecb3';
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, 4, 0, Math.PI * 2);
  ctx.fill();
}
