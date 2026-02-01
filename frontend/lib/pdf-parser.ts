// PDF parsing and chapter detection
// Note: pdf-parse is a CommonJS module, so we use dynamic import in API routes

export interface ParsedChapter {
  chapterNumber: number;
  title: string;
  content: string;
  pageStart?: number;
  pageEnd?: number;
}

export interface ParsedPDF {
  title: string;
  author?: string;
  totalPages: number;
  chapters: ParsedChapter[];
}

// Common chapter heading patterns
const CHAPTER_PATTERNS = [
  // "Chapter 1: Title" or "Chapter 1 - Title" or "Chapter One" (anywhere in line)
  /(?:chapter|chapitre|kapitel)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)[\s:.\-–—]+([^(\n]+)/i,
  // "1. Chapter 1: Title" pattern (numbered list with chapter)
  /^\d+\.\s*(?:chapter|chapitre|kapitel)\s+(\d+)[\s:.\-–—]+([^(\n]+)/i,
  // "Part 1: Title" or "Part I" or "Part One"
  /(?:part)\s+(\d+|one|two|three|four|[ivxIVX]+)[\s:.\-–—]+(.+)?$/i,
  // "Section 1: Title"
  /(?:section)\s+(\d+)[\s:.\-–—]+(.+)?$/i,
  // "Appendix A: Title"
  /(?:appendix)\s+([A-Z])[\s:.\-–—]+([^(\n]+)/i,
  // "1. Title" at start of line (numbered sections with substantial title)
  /^(\d{1,2})\.?\s+([A-Z][a-zA-Z\s:]{10,80})$/m,
  // Roman numerals: "I. Title" or "II. Title"
  /^([IVXLC]+)\.?\s+([A-Z][a-zA-Z\s]{5,50})$/m,
];

// Word to number conversion for "Chapter One" style
const WORD_TO_NUM: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
};

// Roman numeral to number conversion
function romanToNum(roman: string): number {
  const romanMap: Record<string, number> = {
    I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000
  };
  let result = 0;
  const upper = roman.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    const current = romanMap[upper[i]] || 0;
    const next = romanMap[upper[i + 1]] || 0;
    if (current < next) {
      result -= current;
    } else {
      result += current;
    }
  }
  return result;
}

// Parse chapter number from string
function parseChapterNumber(str: string): number {
  const lower = str.toLowerCase();
  if (WORD_TO_NUM[lower]) {
    return WORD_TO_NUM[lower];
  }
  if (/^[IVXLC]+$/i.test(str)) {
    return romanToNum(str);
  }
  const num = parseInt(str, 10);
  return isNaN(num) ? 0 : num;
}

// Detect chapters from PDF text
export function detectChapters(text: string): ParsedChapter[] {
  const lines = text.split("\n");
  const chapters: ParsedChapter[] = [];
  let currentChapter: ParsedChapter | null = null;
  let contentBuffer: string[] = [];
  const seenChapterNumbers = new Set<number>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      if (currentChapter) {
        contentBuffer.push("");
      }
      continue;
    }
    
    // Skip TOC-like entries (short lines with page numbers)
    if (/\d+\s*pages?/i.test(line) && line.length < 150) {
      continue;
    }

    // Check if this line matches a chapter pattern
    let isChapterHeading = false;
    
    for (const pattern of CHAPTER_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        const chapterNum = parseChapterNumber(match[1]);
        
        // Skip if we've already seen this chapter number (likely TOC entry)
        if (seenChapterNumbers.has(chapterNum)) {
          continue;
        }
        
        // Save previous chapter
        if (currentChapter && contentBuffer.join("").trim().length > 100) {
          currentChapter.content = contentBuffer.join("\n").trim();
          chapters.push(currentChapter);
        }

        // Start new chapter
        let title = match[2]?.trim() || `Chapter ${chapterNum}`;
        // Clean up title - remove trailing metadata
        title = title.replace(/\s*\(code\).*$/i, "").replace(/\s*\[.*$/i, "").trim();
        
        currentChapter = {
          chapterNumber: chapterNum || chapters.length + 1,
          title: title,
          content: "",
        };
        contentBuffer = [];
        isChapterHeading = true;
        seenChapterNumbers.add(chapterNum);
        console.log(`Detected chapter ${chapterNum}: ${title}`);
        break;
      }
    }

    // If not a chapter heading, add to content buffer
    if (!isChapterHeading && currentChapter) {
      contentBuffer.push(line);
    } else if (!isChapterHeading && !currentChapter && chapters.length === 0) {
      // Content before first chapter - could be introduction
      if (line.length > 50) {
        currentChapter = {
          chapterNumber: 0,
          title: "Introduction",
          content: "",
        };
        contentBuffer = [line];
      }
    }
  }

  // Save last chapter
  if (currentChapter && contentBuffer.join("").trim().length > 100) {
    currentChapter.content = contentBuffer.join("\n").trim();
    chapters.push(currentChapter);
  }

  console.log(`Total chapters detected: ${chapters.length}`);
  return chapters;
}

// Fallback: Split by page count or character count if no chapters detected
export function splitBySize(text: string, targetChapters: number = 10): ParsedChapter[] {
  const chapters: ParsedChapter[] = [];
  
  // Ensure we have at least some content
  if (text.length < 100) {
    return [{
      chapterNumber: 1,
      title: "Section 1",
      content: text,
    }];
  }
  
  // Calculate target size per chapter
  const targetChapterSize = Math.ceil(text.length / targetChapters);
  
  // Split by paragraphs (double newlines) or single newlines if needed
  let paragraphs = text.split(/\n\n+/);
  if (paragraphs.length < targetChapters) {
    paragraphs = text.split(/\n+/);
  }
  
  // If still not enough paragraphs, split by sentences
  if (paragraphs.length < targetChapters) {
    paragraphs = text.split(/(?<=[.!?])\s+/);
  }
  
  let currentContent: string[] = [];
  let currentSize = 0;
  let chapterNum = 1;

  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    currentContent.push(paragraph);
    currentSize += paragraph.length;

    // Create a new chapter if we've reached target size and haven't hit max chapters yet
    const isLastParagraph = i === paragraphs.length - 1;
    const shouldSplit = currentSize >= targetChapterSize && chapters.length < targetChapters - 1;
    
    if (shouldSplit || isLastParagraph) {
      if (currentContent.length > 0) {
        chapters.push({
          chapterNumber: chapterNum,
          title: `Section ${chapterNum}`,
          content: currentContent.join("\n\n").trim(),
        });
        chapterNum++;
        currentContent = [];
        currentSize = 0;
      }
    }
  }

  // If we still don't have enough chapters, force split the largest ones
  while (chapters.length < targetChapters && chapters.length > 0) {
    // Find the largest chapter
    const largestIndex = chapters.reduce((maxIdx, ch, idx, arr) => 
      ch.content.length > arr[maxIdx].content.length ? idx : maxIdx, 0
    );
    
    const largest = chapters[largestIndex];
    if (largest.content.length < 200) break; // Stop if chapters are too small
    
    // Split the largest chapter in half
    const midPoint = Math.floor(largest.content.length / 2);
    const splitPoint = largest.content.indexOf(' ', midPoint);
    const actualSplit = splitPoint > 0 ? splitPoint : midPoint;
    
    const firstHalf = largest.content.slice(0, actualSplit).trim();
    const secondHalf = largest.content.slice(actualSplit).trim();
    
    // Replace and insert
    chapters.splice(largestIndex, 1, 
      { chapterNumber: largest.chapterNumber, title: `Section ${largest.chapterNumber}a`, content: firstHalf },
      { chapterNumber: largest.chapterNumber + 0.5, title: `Section ${largest.chapterNumber}b`, content: secondHalf }
    );
  }
  
  // Renumber chapters sequentially
  return chapters.map((ch, idx) => ({
    ...ch,
    chapterNumber: idx + 1,
    title: `Section ${idx + 1}`,
  }));
}

// Extract title from PDF metadata or first lines
export function extractTitle(text: string, metadata?: { title?: string; author?: string; filename?: string }): { title: string; author?: string } {
  // Priority 1: Use PDF metadata title if available and valid
  if (metadata?.title) {
    const cleanTitle = metadata.title.trim();
    // Skip generic/empty metadata titles
    if (cleanTitle.length > 3 && 
        !cleanTitle.toLowerCase().includes("untitled") &&
        !cleanTitle.toLowerCase().includes("microsoft word") &&
        cleanTitle !== "Document") {
      console.log(`Using PDF metadata title: "${cleanTitle}"`);
      return {
        title: cleanTitle,
        author: metadata.author?.trim(),
      };
    }
  }

  // Priority 2: Use filename if available (most reliable for user-uploaded files)
  if (metadata?.filename && metadata.filename.length > 3) {
    console.log(`Using PDF filename as title: "${metadata.filename}"`);
    return {
      title: metadata.filename,
      author: metadata.author?.trim(),
    };
  }

  // Priority 3: Try to extract from first few lines of text
  const lines = text.split("\n").slice(0, 30);
  let author: string | undefined;
  
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    
    // Skip empty lines, page markers, and very short lines
    if (!trimmed || trimmed.length < 4) continue;
    if (/^--\s*\d+\s*(of|\/)\s*\d+\s*--$/i.test(trimmed)) continue; // Page markers like "-- 1 of 482 --"
    if (/^page\s+\d+$/i.test(trimmed)) continue;
    
    // Look for a line that looks like a title
    if (
      trimmed.length >= 5 &&
      trimmed.length < 120 &&
      /^[A-Z]/.test(trimmed) &&
      !/[.!?:,]$/.test(trimmed) && // No sentence-ending punctuation
      !/^\d+\./.test(trimmed) && // Not a numbered list
      !/^(chapter|section|part|table|contents)/i.test(trimmed) // Not chapter headings
    ) {
      // Check if next line might be a subtitle or author
      const nextLine = lines[i + 1]?.trim();
      if (nextLine && nextLine.length > 3 && nextLine.length < 100) {
        // Look for author patterns
        if (/^(by\s+)?[A-Z][a-z]+(\s+[A-Z][a-z]+)+$/i.test(nextLine)) {
          author = nextLine.replace(/^by\s+/i, "");
        }
      }
      
      console.log(`Extracted title from text: "${trimmed}"`);
      return { title: trimmed, author };
    }
  }

  console.log("Could not extract title, using fallback");
  return { title: "Untitled Document" };
}

// Main parsing function
export function parsePDFText(
  text: string,
  numPages: number,
  metadata?: { title?: string; author?: string; filename?: string }
): ParsedPDF {
  const { title, author } = extractTitle(text, metadata);
  
  // Try to detect chapters
  let chapters = detectChapters(text);

  // If no chapters found or less than 4 (need 4 for 1 level), try splitting by size
  if (chapters.length < 4 || chapters.every(c => c.content.length < 300)) {
    console.log("No chapters detected or too few, splitting by size");
    // Minimum 4 chapters for 1 level, scale up with page count
    const minChapters = Math.max(4, Math.min(20, Math.ceil(numPages / 10)));
    chapters = splitBySize(text, minChapters);
  }

  // Filter out very short chapters but keep at least 4
  const filteredChapters = chapters.filter(c => c.content.length >= 100);
  chapters = filteredChapters.length >= 4 ? filteredChapters : chapters.slice(0, Math.max(4, chapters.length));

  // If still no meaningful chapters, create one chapter from whole text
  if (chapters.length === 0) {
    chapters = [{
      chapterNumber: 1,
      title: title,
      content: text.slice(0, 50000), // Limit content size
    }];
  }

  // Limit content per chapter (for API token limits)
  chapters = chapters.map(c => ({
    ...c,
    content: c.content.slice(0, 20000), // ~5k tokens max per chapter
  }));

  return {
    title,
    author,
    totalPages: numPages,
    chapters,
  };
}

// Truncate text for question generation (similar to Python version)
export function truncateForGeneration(text: string, maxChars: number = 15000): string {
  if (text.length <= maxChars) {
    return text;
  }

  // Take beginning and end portions
  const portionSize = Math.floor(maxChars / 2);
  const beginning = text.slice(0, portionSize);
  const ending = text.slice(-portionSize);

  return `${beginning}\n\n[... middle portion truncated for length ...]\n\n${ending}`;
}
