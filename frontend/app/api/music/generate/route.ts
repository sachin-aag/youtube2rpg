import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Supabase client for server-side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ElevenLabs API configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_MUSIC_API_URL = "https://api.elevenlabs.io/v1/music";

// Music duration: 2 minutes in milliseconds
const MUSIC_LENGTH_MS = 120000;

// Featured game music prompts
const FEATURED_GAME_PROMPTS: Record<string, string> = {
  "1": "Ambient focus music with calm synths, subtle binaural undertones, neuroscience-inspired soundscape, meditative yet engaging, instrumental only, no vocals, 90 BPM, suitable for studying and concentration",
  "3": "Modern lo-fi electronic, coding focus music, soft synth pads, gentle rhythms, tech startup vibes, productive atmosphere, instrumental only, no vocals, 85 BPM, perfect for programming",
  "4": "Ancient Chinese war drums and erhu, strategic tension and wisdom, atmospheric bamboo flutes, meditative yet powerful, think ancient military strategy and philosophy, instrumental only, no vocals, 70 BPM, epic and contemplative",
};

// Generate a music prompt based on game title and theme
function generateMusicPrompt(title: string, subtitle?: string): string {
  // Check if it's a featured game
  const featuredPrompt = Object.entries(FEATURED_GAME_PROMPTS).find(
    ([, prompt]) => prompt.toLowerCase().includes(title.toLowerCase())
  );
  if (featuredPrompt) {
    return featuredPrompt[1];
  }

  // Generate a custom prompt based on title
  const theme = subtitle || title;
  return `Ambient background music inspired by "${title}"${subtitle ? ` by ${subtitle}` : ""}. 
    Create an engaging instrumental track that captures the essence of learning about ${theme}. 
    The music should be calm yet motivating, suitable for focus and concentration. 
    Use soft synths, gentle rhythms, and a contemplative mood. 
    Instrumental only, no vocals, 85-95 BPM, perfect for educational gaming.`;
}

export async function POST(request: NextRequest) {
  try {
    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { error: "ElevenLabs API key not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { gameId, title, subtitle, customPrompt } = body;

    if (!gameId) {
      return NextResponse.json(
        { error: "gameId is required" },
        { status: 400 }
      );
    }

    // Check if game already has music
    const { data: existingGame } = await supabase
      .from("games")
      .select("music_url")
      .eq("id", gameId)
      .single();

    if (existingGame?.music_url) {
      return NextResponse.json({
        success: true,
        musicUrl: existingGame.music_url,
        message: "Music already exists for this game",
      });
    }

    // Generate the prompt
    const prompt = customPrompt || generateMusicPrompt(title || "Educational Game", subtitle);

    console.log(`Generating music for game ${gameId} with prompt:`, prompt.substring(0, 100) + "...");

    // Call ElevenLabs Music API
    // output_format is a query parameter, music_length_ms is in the body
    const apiUrl = `${ELEVENLABS_MUSIC_API_URL}?output_format=mp3_44100_128`;
    
    console.log(`Calling ElevenLabs API: ${apiUrl}`);
    console.log(`Request body: ${JSON.stringify({ prompt: prompt.substring(0, 50) + "...", music_length_ms: MUSIC_LENGTH_MS })}`);
    
    let response;
    try {
      response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          prompt,
          music_length_ms: MUSIC_LENGTH_MS,
        }),
      });
    } catch (fetchError) {
      console.error("Failed to call ElevenLabs API:", fetchError);
      return NextResponse.json(
        { error: "Failed to connect to ElevenLabs API" },
        { status: 503 }
      );
    }

    console.log(`ElevenLabs API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", response.status, errorText);
      return NextResponse.json(
        { error: `ElevenLabs API error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    // Get the audio data
    const audioBuffer = await response.arrayBuffer();
    const audioData = Buffer.from(audioBuffer);

    console.log(`Generated music: ${audioData.length} bytes`);

    // Upload to Supabase storage
    const fileName = `${gameId}.mp3`;
    const { error: uploadError } = await supabase.storage
      .from("music")
      .upload(fileName, audioData, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("Failed to upload music:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload music to storage" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("music")
      .getPublicUrl(fileName);
    
    const musicUrl = urlData.publicUrl;
    console.log(`Music uploaded to Supabase: ${musicUrl}`);

    // Update game record with music URL
    const { error: updateError } = await supabase
      .from("games")
      .update({ music_url: musicUrl })
      .eq("id", gameId);

    if (updateError) {
      console.error("Failed to update game with music URL:", updateError);
      // Don't fail the request - music is already uploaded
    }

    return NextResponse.json({
      success: true,
      musicUrl,
      message: "Music generated successfully",
    });
  } catch (error) {
    console.error("Music generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// GET endpoint to check music status for a game
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get("gameId");

  if (!gameId) {
    return NextResponse.json(
      { error: "gameId is required" },
      { status: 400 }
    );
  }

  try {
    const { data: game, error } = await supabase
      .from("games")
      .select("music_url")
      .eq("id", gameId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      hasMusic: !!game?.music_url,
      musicUrl: game?.music_url || null,
    });
  } catch (error) {
    console.error("Error checking music status:", error);
    return NextResponse.json(
      { error: "Failed to check music status" },
      { status: 500 }
    );
  }
}
