// World configuration for themed maps per level group

export interface WorldTheme {
  id: string;
  name: string;
  mapImage: string;
  collisionJsonPath: string;
  backgroundColor: string;
  // Tint color for the map (hex number for Phaser)
  mapTint: number;
  // Ambient color overlay (subtle atmosphere)
  ambientColor: string;
}

// World themes - each world covers 4 levels
export const WORLD_THEMES: WorldTheme[] = [
  {
    id: "forest",
    name: "Enchanted Forest",
    mapImage: "/sprites/map/Sample1.png",
    collisionJsonPath: "/maps/world1-forest.json",
    backgroundColor: "#1a3d1a",
    mapTint: 0xffffff, // No tint - original green forest colors
    ambientColor: "rgba(34, 139, 34, 0.05)", // Forest green ambient
  },
  {
    id: "desert",
    name: "Scorching Desert",
    mapImage: "/sprites/map/Sample1.png",
    collisionJsonPath: "/maps/world2-desert.json",
    backgroundColor: "#3d2d1a",
    mapTint: 0xffd699, // Warm sandy tint
    ambientColor: "rgba(255, 200, 100, 0.08)", // Desert warm ambient
  },
  {
    id: "castle",
    name: "Ancient Castle",
    mapImage: "/sprites/map/Sample1.png",
    collisionJsonPath: "/maps/world3-castle.json",
    backgroundColor: "#1a1a2e",
    mapTint: 0xc9b8ff, // Purple/stone tint
    ambientColor: "rgba(100, 80, 150, 0.1)", // Castle purple ambient
  },
  {
    id: "ice",
    name: "Frozen Realm",
    mapImage: "/sprites/map/Sample1.png",
    collisionJsonPath: "/maps/world4-ice.json",
    backgroundColor: "#1a2d3d",
    mapTint: 0xb8e0ff, // Cool ice blue tint
    ambientColor: "rgba(150, 200, 255, 0.1)", // Ice blue ambient
  },
];

// Get the world theme for a given level
// Levels 1-4: Forest, 5-8: Desert, 9-12: Castle, 13-16: Ice, then cycles
export function getWorldForLevel(level: number): WorldTheme {
  const worldIndex = Math.floor((level - 1) / 4) % WORLD_THEMES.length;
  return WORLD_THEMES[worldIndex];
}

// Get world number (1-4) from level
export function getWorldNumber(level: number): number {
  return (Math.floor((level - 1) / 4) % WORLD_THEMES.length) + 1;
}

// Get level within current world (1-4)
export function getLevelInWorld(level: number): number {
  return ((level - 1) % 4) + 1;
}

// Format world and level display string
export function formatWorldLevel(level: number): string {
  const world = getWorldForLevel(level);
  const levelInWorld = getLevelInWorld(level);
  return `${world.name} - Stage ${levelInWorld}`;
}
