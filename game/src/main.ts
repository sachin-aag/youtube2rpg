import Phaser from 'phaser';
import { GridEngine } from 'grid-engine';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { WorldScene } from './scenes/WorldScene';
import { BattleScene } from './scenes/BattleScene';
import { CollectionScene } from './scenes/CollectionScene';
import { HUDScene } from './scenes/HUDScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  plugins: {
    scene: [
      {
        key: 'gridEngine',
        plugin: GridEngine,
        mapping: 'gridEngine',
      },
    ],
  },
  scene: [BootScene, MenuScene, WorldScene, BattleScene, CollectionScene, HUDScene],
  backgroundColor: '#1a1a2e',
};

const game = new Phaser.Game(config);

export default game;
