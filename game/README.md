# HubermanRPG - Pokemon-Style Quiz Game

A Pokemon-style RPG game where you walk around and battle Huberman Lab podcast guests through quiz questions!

## Features

- **Grid-based Movement**: Walk around using Arrow Keys or WASD
- **NPC Encounters**: Meet podcast guests scattered around the map
- **Battle System**: Answer quiz questions to defeat guests
- **Difficulty Scoring**:
  - Easy: +10 XP (correct), -15 HP (wrong)
  - Medium: +20 XP (correct), -10 HP (wrong)
  - Hard: +30 XP (correct), -5 HP (wrong)
- **Combo Bonus**: +10 XP and HP if all 3 questions answered correctly
- **Leveling System**: Gain XP to level up and increase max HP
- **Collection**: Track which guests you've captured
- **Checkpoints**: Progress through areas by defeating guests

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
cd game
npm install
```

### Running the Game

```bash
npm run dev
```

This will start the development server at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

## Controls

- **Arrow Keys / WASD**: Move your character
- **SPACE**: Interact with nearby guests / Start battle
- **1-4 Keys**: Select answer options during battle
- **ENTER**: Confirm answer / Continue after feedback
- **ESC**: Close dialogs

## Project Structure

```
game/
├── src/
│   ├── main.ts              # Game initialization
│   ├── scenes/
│   │   ├── BootScene.ts     # Asset loading
│   │   ├── MenuScene.ts     # Main menu
│   │   ├── WorldScene.ts    # Overworld gameplay
│   │   ├── BattleScene.ts   # Quiz battles
│   │   ├── CollectionScene.ts # Guest collection view
│   │   └── HUDScene.ts      # UI overlay
│   ├── managers/
│   │   ├── GameStateManager.ts  # Save/load, HP, XP
│   │   └── QuestionLoader.ts    # Load quiz questions
│   ├── utils/
│   │   └── SpriteGenerator.ts   # Programmatic sprites
│   └── types/
│       └── index.ts         # TypeScript interfaces
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Technologies

- **Phaser 3**: Game engine
- **GridEngine**: Grid-based movement plugin
- **TypeScript**: Type safety
- **Vite**: Build tool

## Adding More Worlds

Currently supports the Huberman world. To add more:

1. Generate questions using the Python scripts in the parent directory
2. Place JSON files in `generated_questions/`
3. Questions are automatically loaded on game start

## Game Mechanics

### Health (HP)
- Start with 100 HP
- Lose HP for wrong answers (based on difficulty)
- Game over when HP reaches 0
- Reset to last checkpoint on game over

### Experience (XP)
- Gain XP for correct answers
- Level up every 200 XP
- Higher levels = more max HP

### Checkpoints
- Must talk to all guests in an area
- Need 60% correct answers to pass checkpoint
- Can retry guests if you got questions wrong

## Credits

- Inspired by Pokemon and LennyRPG
- Built with Phaser 3 and GridEngine
- Questions generated from Huberman Lab podcast transcripts
