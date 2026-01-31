import OpenAI from "openai";
import { truncateForGeneration, type ParsedChapter } from "./pdf-parser";

// Question types matching existing game format
export interface QuestionOption {
  id: string;
  text: string;
  correct: boolean;
}

export interface GeneratedQuestion {
  question_text: string;
  options: QuestionOption[];
  difficulty: "easy" | "medium" | "hard";
  explanation: string;
  question_type: "factual" | "opinion" | "conceptual" | "application";
}

// Prompts adapted from Python version for book chapters
const INSIGHT_EXTRACTION_PROMPT = `You are an expert at extracting key insights from educational book content.

Given the following chapter from a book, extract the most important and memorable insights that would make good quiz questions.

Book Title: {title}
Chapter: {chapterTitle}
Author: {author}

CHAPTER CONTENT:
{content}

Extract 4-6 key insights that cover:
1. Core concepts and definitions introduced
2. Key facts, statistics, or examples
3. Important arguments or conclusions
4. Practical takeaways or recommendations

For each insight, note:
- The core fact or claim
- Any specific examples or evidence mentioned
- Whether it's more factual or conceptual

Format your response as a JSON array:
[
  {
    "insight": "Brief description of the key insight",
    "details": "Supporting details, examples, or evidence",
    "type": "factual" or "conceptual",
    "topic": "Brief topic category"
  }
]

Focus on insights that are:
- Specific enough to form clear quiz questions
- Interesting and educational
- Representative of the chapter's main value`;

const QUESTION_GENERATION_PROMPT = `You are creating quiz questions for an educational RPG game.

Book: {title}
Chapter: {chapterTitle}
Author: {author}

KEY INSIGHTS:
{insights}

Generate exactly 3 quiz questions based on these insights. Requirements:

1. QUESTION MIX:
   - Include both factual questions (testing knowledge) and conceptual questions (testing understanding)
   - Vary difficulty: 1 easy, 1 medium, 1 hard

2. QUESTION FORMAT:
   - Each question should have exactly 4 options (A, B, C, D)
   - EXACTLY ONE option must be correct - never multiple correct answers
   - Wrong options should be plausible but clearly incorrect
   - Avoid "all of the above" or "none of the above"

3. STYLE - CRITICAL:
   - Questions must be STANDALONE - they should make sense without context about the book
   - DO NOT use phrases like "According to the chapter", "The author mentions", "In this book"
   - Instead, ask direct questions about the concepts: "What is...", "Which of the following...", "How does..."
   - If referencing the author's perspective, use their name: "According to {author}..."
   - Questions should read like general knowledge questions

4. ATTRIBUTION:
   - When the insight is the author's opinion or recommendation, attribute it
   - For general facts or concepts, no attribution needed

Output as JSON:
{
  "questions": [
    {
      "id": 1,
      "type": "factual" or "conceptual",
      "difficulty": "easy" or "medium" or "hard",
      "question": "The question text (standalone, no book references)",
      "options": [
        {"id": "a", "text": "Option A text", "correct": true/false},
        {"id": "b", "text": "Option B text", "correct": true/false},
        {"id": "c", "text": "Option C text", "correct": true/false},
        {"id": "d", "text": "Option D text", "correct": true/false}
      ],
      "explanation": "Why the correct answer is right (1-2 sentences)"
    }
  ]
}

Make the questions interesting and educational - players should feel they learned something valuable!`;

// Get OpenAI client
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable not set");
  }
  return new OpenAI({ apiKey });
}

// Extract insights from chapter content
async function extractInsights(
  client: OpenAI,
  chapter: ParsedChapter,
  title: string,
  author: string
): Promise<Array<{ insight: string; details: string; type: string; topic: string }>> {
  const truncatedContent = truncateForGeneration(chapter.content);

  const prompt = INSIGHT_EXTRACTION_PROMPT
    .replace("{title}", title)
    .replace("{chapterTitle}", chapter.title)
    .replace("{author}", author || "Unknown")
    .replace("{content}", truncatedContent);

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are an expert at analyzing educational content and extracting key insights. Always respond with valid JSON.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    console.error("No content in OpenAI response for insights");
    return [];
  }

  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (parsed.insights && Array.isArray(parsed.insights)) {
      return parsed.insights;
    }
    return [];
  } catch (e) {
    console.error("Failed to parse insights JSON:", e);
    return [];
  }
}

// Generate questions from insights
async function generateQuestionsFromInsights(
  client: OpenAI,
  insights: Array<{ insight: string; details: string; type: string; topic: string }>,
  chapter: ParsedChapter,
  title: string,
  author: string
): Promise<GeneratedQuestion[]> {
  const insightsText = JSON.stringify(insights, null, 2);

  const prompt = QUESTION_GENERATION_PROMPT
    .replace(/{title}/g, title)
    .replace(/{chapterTitle}/g, chapter.title)
    .replace(/{author}/g, author || "Unknown")
    .replace("{insights}", insightsText);

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are an expert quiz creator for educational games. Always respond with valid JSON.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    console.error("No content in OpenAI response for questions");
    return [];
  }

  try {
    const parsed = JSON.parse(content);
    const questions = parsed.questions || [];

    return questions.map((q: {
      question: string;
      options: Array<{ id: string; text: string; correct: boolean }>;
      difficulty: string;
      explanation: string;
      type: string;
    }) => ({
      question_text: q.question,
      options: q.options,
      difficulty: q.difficulty as "easy" | "medium" | "hard",
      explanation: q.explanation,
      question_type: (q.type === "factual" ? "factual" : "conceptual") as "factual" | "opinion" | "conceptual" | "application",
    }));
  } catch (e) {
    console.error("Failed to parse questions JSON:", e);
    return [];
  }
}

// Main function to generate questions for a chapter
export async function generateQuestionsForChapter(
  chapter: ParsedChapter,
  title: string,
  author?: string
): Promise<GeneratedQuestion[]> {
  const client = getOpenAIClient();

  console.log(`Generating questions for chapter: ${chapter.title}`);

  // Stage 1: Extract insights
  const insights = await extractInsights(client, chapter, title, author || "Unknown");
  console.log(`Extracted ${insights.length} insights`);

  if (insights.length === 0) {
    console.warn("No insights extracted, skipping question generation");
    return [];
  }

  // Stage 2: Generate questions
  const questions = await generateQuestionsFromInsights(
    client,
    insights,
    chapter,
    title,
    author || "Unknown"
  );
  console.log(`Generated ${questions.length} questions`);

  return questions;
}

// Generate questions for all chapters
export async function generateQuestionsForAllChapters(
  chapters: ParsedChapter[],
  title: string,
  author?: string,
  onProgress?: (current: number, total: number) => void
): Promise<Map<number, GeneratedQuestion[]>> {
  const results = new Map<number, GeneratedQuestion[]>();

  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    
    if (onProgress) {
      onProgress(i + 1, chapters.length);
    }

    try {
      const questions = await generateQuestionsForChapter(chapter, title, author);
      results.set(chapter.chapterNumber, questions);
    } catch (e) {
      console.error(`Failed to generate questions for chapter ${chapter.chapterNumber}:`, e);
      results.set(chapter.chapterNumber, []);
    }

    // Small delay between API calls to avoid rate limiting
    if (i < chapters.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return results;
}
