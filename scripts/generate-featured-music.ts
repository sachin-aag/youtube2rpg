/**
 * Script to generate background music for featured games using ElevenLabs API
 * 
 * Usage:
 *   cd frontend && npm run generate-music
 * 
 * Make sure ELEVENLABS_API_KEY is set in .env.local
 */

import * as fs from "fs";
import * as path from "path";

// Read .env.local manually to avoid module resolution issues
const envPath = path.join(__dirname, "../frontend/.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        process.env[key] = valueParts.join("=");
      }
    }
  }
}

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_MUSIC_API_URL = "https://api.elevenlabs.io/v1/music";
const MUSIC_LENGTH_MS = 120000; // 2 minutes
const OUTPUT_DIR = path.join(__dirname, "../frontend/public/music");

interface FeaturedGame {
  id: string;
  filename: string;
  prompt: string;
}

const FEATURED_GAMES: FeaturedGame[] = [
  {
    id: "1",
    filename: "huberman.mp3",
    prompt: `Ambient focus music with calm synths, subtle binaural undertones, 
      neuroscience-inspired soundscape, meditative yet engaging. 
      Think calm study music that promotes concentration and learning. 
      Instrumental only, no vocals, 90 BPM, suitable for studying and deep focus sessions.`,
  },
  {
    id: "3",
    filename: "learning-cursor.mp3",
    prompt: `Modern lo-fi electronic coding focus music. Soft synth pads, gentle rhythms, 
      tech startup vibes, productive atmosphere. Think of music you'd hear while coding 
      in a modern IDE or during a hackathon. 
      Instrumental only, no vocals, 85 BPM, perfect for programming and creative work.`,
  },
  {
    id: "4",
    filename: "art-of-war.mp3",
    prompt: `Ancient Chinese war drums and traditional erhu, strategic tension and timeless wisdom.
      Atmospheric bamboo flutes layered with soft percussion. Meditative yet powerful,
      evoking ancient military strategy and philosophy. Think of a wise general contemplating
      battle tactics in a serene temple. Epic and contemplative mood.
      Instrumental only, no vocals, 70 BPM, suitable for strategic thinking and learning.`,
  },
  {
    id: "battle",
    filename: "battle.mp3",
    prompt: `Intense RPG battle music with driving rhythm, urgent tension, and heroic energy.
      Think classic JRPG boss battle theme - fast tempo around 140 BPM, powerful drums,
      dramatic synth strings, building intensity. Creates excitement and stakes for quiz battles.
      Instrumental only, no vocals, energetic and competitive but not overwhelming.
      Loop-friendly with a consistent driving beat throughout.`,
  },
];

async function generateMusic(game: FeaturedGame): Promise<void> {
  const outputPath = path.join(OUTPUT_DIR, game.filename);

  // Check if file already exists
  if (fs.existsSync(outputPath)) {
    console.log(`[${game.id}] Music already exists: ${game.filename}, skipping...`);
    return;
  }

  console.log(`[${game.id}] Generating music for: ${game.filename}`);
  console.log(`[${game.id}] Prompt: ${game.prompt.slice(0, 100)}...`);

  try {
    const apiUrl = `${ELEVENLABS_MUSIC_API_URL}?output_format=mp3_44100_128`;
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY!,
      },
      body: JSON.stringify({
        prompt: game.prompt,
        music_length_ms: MUSIC_LENGTH_MS,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const audioData = Buffer.from(audioBuffer);

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Write the file
    fs.writeFileSync(outputPath, audioData);
    console.log(`[${game.id}] Successfully saved: ${outputPath} (${audioData.length} bytes)`);
  } catch (error) {
    console.error(`[${game.id}] Failed to generate music:`, error);
    throw error;
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("Featured Games Music Generator");
  console.log("=".repeat(60));

  if (!ELEVENLABS_API_KEY) {
    console.error("Error: ELEVENLABS_API_KEY is not set in environment");
    console.error("Make sure it's defined in frontend/.env.local");
    process.exit(1);
  }

  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log(`Music duration: ${MUSIC_LENGTH_MS / 1000} seconds`);
  console.log("");

  for (const game of FEATURED_GAMES) {
    try {
      await generateMusic(game);
    } catch (error) {
      console.error(`Failed to generate music for game ${game.id}, continuing...`);
    }
    
    // Small delay between API calls to avoid rate limiting
    if (FEATURED_GAMES.indexOf(game) < FEATURED_GAMES.length - 1) {
      console.log("Waiting 5 seconds before next generation...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  console.log("");
  console.log("=".repeat(60));
  console.log("Done!");
  console.log("=".repeat(60));
}

main().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});
