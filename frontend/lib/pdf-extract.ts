// PDF text extraction using unpdf (works in Node.js without canvas/worker issues)
import { extractText, getDocumentProxy } from "unpdf";

export interface PDFExtractResult {
  text: string;
  numPages: number;
  info: {
    title?: string;
    author?: string;
    filename?: string;
  };
}

export async function extractTextFromPDF(buffer: Buffer, filename?: string): Promise<PDFExtractResult> {
  // Convert Buffer to Uint8Array
  const uint8Array = new Uint8Array(buffer);
  
  // Extract text using unpdf
  const { text, totalPages } = await extractText(uint8Array, { mergePages: true });
  
  // Try to get metadata
  let info: { title?: string; author?: string; filename?: string } = {};
  try {
    const pdf = await getDocumentProxy(uint8Array);
    const metadata = await pdf.getMetadata();
    info = {
      title: (metadata?.info as Record<string, string>)?.Title || undefined,
      author: (metadata?.info as Record<string, string>)?.Author || undefined,
    };
  } catch {
    // Metadata extraction failed, continue without it
  }
  
  // Add cleaned filename as fallback title source
  if (filename) {
    // Remove .pdf extension and clean up the filename
    const cleanedFilename = filename
      .replace(/\.pdf$/i, "")
      .replace(/[_-]/g, " ")  // Replace underscores and hyphens with spaces
      .replace(/\s+/g, " ")   // Normalize whitespace
      .trim();
    info.filename = cleanedFilename;
    console.log(`PDF filename for title fallback: "${cleanedFilename}"`);
  }
  
  return {
    text: Array.isArray(text) ? text.join("\n\n") : text,
    numPages: totalPages,
    info,
  };
}
