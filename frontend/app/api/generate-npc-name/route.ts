import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Structured response type
interface NpcNameResponse {
  name: string;
  theme: string;
  personality: string;
}

// Initialize OpenAI client (only if API key is available)
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Cache for generated names to avoid repeated API calls
const nameCache = new Map<string, NpcNameResponse>();

export async function POST(request: NextRequest) {
  try {
    const { title } = await request.json();

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = title.toLowerCase().trim();
    if (nameCache.has(cacheKey)) {
      return NextResponse.json(nameCache.get(cacheKey));
    }

    // If no OpenAI API key, fall back to simple extraction
    if (!openai) {
      const fallbackResponse = simpleFallbackResponse(title);
      nameCache.set(cacheKey, fallbackResponse);
      return NextResponse.json(fallbackResponse);
    }

    // Call OpenAI with JSON mode for structured output
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a creative naming assistant for an educational RPG game. 
Your task is to create a short, memorable NPC character based on the topic title provided.

You MUST respond with a valid JSON object in this exact format:
{
  "name": "Creative Name Here",
  "theme": "MainTheme",
  "personality": "TraitWord"
}

Rules for name:
- Exactly 2-3 words, captures the essence of the topic
- Sounds like a character title (e.g., "Mind Sharpener", "Dream Weaver", "Habit Architect")
- Creative but relevant, avoid generic words like "Expert", "Guide"
- Capitalize each word

Rules for theme: 1-2 words describing the main concept (e.g., "Memory", "Sleep", "Habits")

Rules for personality: 1-2 words describing a trait (e.g., "Wise", "Serene", "Disciplined")

Examples:
- "How to Improve Memory & Focus" → {"name": "Mind Sharpener", "theme": "Memory", "personality": "Focused"}
- "The Science of Sleep" → {"name": "Dream Weaver", "theme": "Sleep", "personality": "Serene"}
- "No One's Crazy" (about finance) → {"name": "Wealth Philosopher", "theme": "Money", "personality": "Understanding"}`,
        },
        {
          role: "user",
          content: `Generate an NPC character JSON for this topic: "${title}"`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 100,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    
    if (content) {
      try {
        const parsed = JSON.parse(content) as NpcNameResponse;
        
        // Validate the parsed response has required fields
        if (parsed.name && parsed.theme && parsed.personality) {
          nameCache.set(cacheKey, parsed);
          return NextResponse.json(parsed);
        }
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
      }
    }

    // Fallback if parsing failed
    const fallbackResponse = simpleFallbackResponse(title);
    nameCache.set(cacheKey, fallbackResponse);
    return NextResponse.json(fallbackResponse);
    
  } catch (error) {
    console.error("Error generating NPC name:", error);
    
    // Return a fallback on error
    try {
      const body = await request.clone().json();
      const fallbackResponse = simpleFallbackResponse(body.title || "Unknown Topic");
      return NextResponse.json(fallbackResponse);
    } catch {
      return NextResponse.json(simpleFallbackResponse("Unknown Topic"));
    }
  }
}

// Simple fallback response when AI is not available
function simpleFallbackResponse(title: string): NpcNameResponse {
  // Remove common prefixes and suffixes
  const clean = title
    .split("|")[0]
    .split(" with ")[0]
    .split(" - ")[0]
    .replace(/[&]/g, " and ")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const stopwords = new Set([
    "how", "to", "the", "a", "an", "and", "or", "of", "for", "in", "on", "with",
    "your", "you", "using", "based", "from", "into", "by", "dr", "huberman",
    "lab", "essentials", "science", "tools", "protocols", "modern", "can",
  ]);

  const topicWords = new Set([
    "memory", "focus", "sleep", "mood", "health", "mental", "brain", "learning",
    "trauma", "stress", "habits", "dopamine", "hormones", "aging", "energy",
    "exercise", "strength", "fasting", "nutrition", "breathing", "meditation",
    "creativity", "goals", "motivation", "gratitude", "relationships",
  ]);

  const personalityWords = ["Wise", "Focused", "Calm", "Energetic", "Mysterious", "Disciplined"];

  const words = clean.toLowerCase().split(" ");
  const meaningful = words.filter(w => w.length > 2 && !stopwords.has(w));
  
  // Find the main theme
  const theme = meaningful.find(w => topicWords.has(w)) || meaningful[0] || "Knowledge";
  const capitalizedTheme = theme.charAt(0).toUpperCase() + theme.slice(1);
  
  // Take first 2-3 meaningful words and capitalize for name
  const selected = meaningful.slice(0, 2).map(w => 
    w.charAt(0).toUpperCase() + w.slice(1)
  );
  const name = selected.join(" ") || "Wise One";
  
  // Random personality from list
  const personality = personalityWords[Math.floor(Math.random() * personalityWords.length)];

  return {
    name,
    theme: capitalizedTheme,
    personality,
  };
}
