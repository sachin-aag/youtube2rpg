import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parsePDFText } from "@/lib/pdf-parser";
import { extractTextFromPDF } from "@/lib/pdf-extract";
import { generateQuestionsForChapter } from "@/lib/question-generator";
import { generateThumbnailForStorage } from "@/lib/thumbnail-generator";

// Supabase client for server-side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to send SSE events
function createSSEStream() {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array>;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
  });

  const send = (data: Record<string, unknown>) => {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  const close = () => {
    controller.close();
  };

  return { stream, send, close };
}

export async function POST(request: NextRequest) {
  const { stream, send, close } = createSSEStream();

  // Start processing in background
  (async () => {
    try {
      // Get the form data
      const formData = await request.formData();
      const file = formData.get("file") as File;
      const isPublic = formData.get("isPublic") !== "false"; // Default to true
      const username = formData.get("username") as string | null;

      if (!file) {
        send({ status: "error", message: "No file provided", error: "Please select a PDF file" });
        close();
        return;
      }

      if (file.type !== "application/pdf") {
        send({ status: "error", message: "Invalid file type", error: "Please upload a PDF file" });
        close();
        return;
      }

      // Look up creator by username
      let creatorId: string | null = null;
      if (username) {
        const { data: user } = await supabase
          .from("users")
          .select("id")
          .eq("username", username)
          .single();
        
        if (user) {
          creatorId = user.id;
        }
      }

      send({ status: "uploading", message: "Processing PDF...", progress: 5 });

      // Read file as buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Parse PDF
      send({ status: "parsing", message: "Extracting text from PDF...", progress: 10 });

      // Extract text using unpdf (no canvas dependency)
      const pdfData = await extractTextFromPDF(buffer, file.name);

      send({ status: "parsing", message: "Detecting chapters...", progress: 20 });

      console.log(`PDF extracted: ${pdfData.numPages} pages, ${pdfData.text.length} characters`);

      // Parse and detect chapters
      const parsed = parsePDFText(pdfData.text, pdfData.numPages, {
        title: pdfData.info?.title,
        author: pdfData.info?.author,
        filename: pdfData.info?.filename,
      });
      
      console.log(`Parsed: ${parsed.chapters.length} chapters, title: "${parsed.title}"`);

      // Send chapter preview
      const chapterPreviews = parsed.chapters.map((c) => ({
        chapterNumber: c.chapterNumber,
        title: c.title,
        contentPreview: c.content.slice(0, 150) + "...",
      }));

      send({
        status: "parsing",
        message: `Found ${parsed.chapters.length} chapters`,
        progress: 25,
        chapters: chapterPreviews,
      });

      // Create game record in Supabase
      send({ status: "generating", message: "Creating game...", progress: 30 });

      const { data: game, error: gameError } = await supabase
        .from("games")
        .insert({
          title: parsed.title,
          subtitle: parsed.author || null,
          total_chapters: parsed.chapters.length,
          status: "processing",
          creator_id: creatorId,
          is_public: isPublic,
        })
        .select()
        .single();

      if (gameError || !game) {
        console.error("Failed to create game:", gameError);
        send({
          status: "error",
          message: "Failed to create game",
          error: gameError?.message || "Database error",
        });
        close();
        return;
      }

      // Process chapters in parallel batches (3 at a time to avoid rate limits)
      const totalChapters = parsed.chapters.length;
      const BATCH_SIZE = 3;
      let processedChapters = 0;

      // First, create all chapter records in parallel
      send({
        status: "generating",
        message: `Creating ${totalChapters} chapter records...`,
        progress: 32,
      });

      const chapterRecords = await Promise.all(
        parsed.chapters.map(async (chapter) => {
          const { data: chapterRecord, error: chapterError } = await supabase
            .from("chapters")
            .insert({
              game_id: game.id,
              chapter_number: chapter.chapterNumber,
              chapter_title: chapter.title,
              content_preview: chapter.content.slice(0, 500),
            })
            .select()
            .single();

          if (chapterError || !chapterRecord) {
            console.error("Failed to create chapter:", chapterError);
            return null;
          }
          return { chapter, chapterRecord };
        })
      );

      // Filter out failed chapters
      const validChapters = chapterRecords.filter((c) => c !== null);

      // Process questions in parallel batches
      for (let i = 0; i < validChapters.length; i += BATCH_SIZE) {
        const batch = validChapters.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(validChapters.length / BATCH_SIZE);
        
        const chapterProgress = 35 + Math.floor((i / validChapters.length) * 55);
        
        send({
          status: "generating",
          message: `Generating questions (batch ${batchNum}/${totalBatches}): ${batch.map(c => c.chapter.title).join(", ")}`,
          progress: chapterProgress,
        });

        // Process batch in parallel
        await Promise.all(
          batch.map(async ({ chapter, chapterRecord }) => {
            try {
              console.log(`[Parallel] Generating questions for: ${chapter.title}`);
              const questions = await generateQuestionsForChapter(
                chapter,
                parsed.title,
                parsed.author
              );

              if (questions.length > 0) {
                const questionRecords = questions.map((q) => ({
                  chapter_id: chapterRecord.id,
                  question_text: q.question_text,
                  options: q.options,
                  difficulty: q.difficulty,
                  explanation: q.explanation,
                  question_type: q.question_type,
                }));

                const { error: questionsError } = await supabase
                  .from("questions")
                  .insert(questionRecords);

                if (questionsError) {
                  console.error("Failed to insert questions:", questionsError);
                }
              }
              console.log(`[Parallel] Completed: ${chapter.title} (${questions.length} questions)`);
            } catch (e) {
              console.error(`Failed to generate questions for chapter ${chapter.chapterNumber}:`, e);
            }
          })
        );

        processedChapters += batch.length;
      }

      // Generate thumbnail
      send({ status: "generating", message: "Generating thumbnail...", progress: 92 });

      // Generate AI thumbnail using DALL-E (falls back to placeholder if API fails)
      const thumbnailResult = await generateThumbnailForStorage(parsed.title, parsed.author);
      
      // Upload thumbnail to Supabase storage
      const fileExtension = thumbnailResult.contentType === "image/png" ? "png" : "svg";
      const fileName = `${game.id}.${fileExtension}`;
      
      const { error: uploadError } = await supabase.storage
        .from("thumbnails")
        .upload(fileName, thumbnailResult.buffer, {
          contentType: thumbnailResult.contentType,
          upsert: true,
        });

      let thumbnailUrl: string;
      
      if (uploadError) {
        console.error("Failed to upload thumbnail:", uploadError);
        // Fall back to data URL for SVG placeholder
        thumbnailUrl = `data:${thumbnailResult.contentType};base64,${thumbnailResult.buffer.toString("base64")}`;
      } else {
        // Get public URL from Supabase storage
        const { data: urlData } = supabase.storage
          .from("thumbnails")
          .getPublicUrl(fileName);
        thumbnailUrl = urlData.publicUrl;
        console.log(`Thumbnail uploaded to Supabase: ${thumbnailUrl}`);
      }

      // Update game with thumbnail and set status to ready
      const { error: updateError } = await supabase
        .from("games")
        .update({
          status: "ready",
          thumbnail_url: thumbnailUrl,
        })
        .eq("id", game.id);

      if (updateError) {
        console.error("Failed to update game:", updateError);
      }

      send({
        status: "complete",
        message: "Your RPG is ready!",
        progress: 100,
        gameId: game.id,
      });
    } catch (error) {
      console.error("Processing error:", error);
      send({
        status: "error",
        message: "Failed to process PDF",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      close();
    }
  })();

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
