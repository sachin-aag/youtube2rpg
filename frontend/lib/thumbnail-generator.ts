// Thumbnail generator with OpenAI DALL-E support
import OpenAI from "openai";

// Generate a simple SVG thumbnail with the book title
export function generatePlaceholderThumbnail(title: string): string {
  // Generate a color based on the title (deterministic)
  const hash = title.split("").reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  const hue = Math.abs(hash % 360);
  const saturation = 60 + (Math.abs(hash >> 8) % 20);
  const lightness = 35 + (Math.abs(hash >> 16) % 15);
  
  // Create gradient colors
  const color1 = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  const color2 = `hsl(${(hue + 30) % 360}, ${saturation}%, ${lightness - 10}%)`;
  
  // Truncate title for display
  const displayTitle = title.length > 40 ? title.substring(0, 37) + "..." : title;
  const lines = wrapText(displayTitle, 20);
  
  // Create SVG
  const svg = `
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color1}"/>
      <stop offset="100%" style="stop-color:${color2}"/>
    </linearGradient>
    <pattern id="pixels" width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" fill="rgba(0,0,0,0.1)"/>
      <rect width="4" height="4" fill="rgba(255,255,255,0.05)"/>
    </pattern>
  </defs>
  
  <!-- Background -->
  <rect width="400" height="300" fill="url(#bg)"/>
  <rect width="400" height="300" fill="url(#pixels)"/>
  
  <!-- Book icon -->
  <g transform="translate(175, 80)">
    <rect x="0" y="0" width="50" height="60" rx="2" fill="rgba(255,255,255,0.9)" stroke="rgba(0,0,0,0.2)" stroke-width="2"/>
    <rect x="5" y="5" width="40" height="2" fill="rgba(0,0,0,0.2)"/>
    <rect x="5" y="10" width="40" height="2" fill="rgba(0,0,0,0.2)"/>
    <rect x="5" y="15" width="30" height="2" fill="rgba(0,0,0,0.2)"/>
    <rect x="5" y="20" width="35" height="2" fill="rgba(0,0,0,0.2)"/>
    <rect x="5" y="25" width="40" height="2" fill="rgba(0,0,0,0.2)"/>
  </g>
  
  <!-- Title text -->
  ${lines.map((line, i) => `
    <text x="200" y="${170 + i * 28}" text-anchor="middle" 
          font-family="system-ui, sans-serif" font-size="20" font-weight="bold" 
          fill="white" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.5)">
      ${escapeXml(line)}
    </text>
  `).join("")}
  
  <!-- RPG badge -->
  <g transform="translate(320, 20)">
    <rect x="0" y="0" width="60" height="24" rx="4" fill="rgba(0,0,0,0.5)"/>
    <text x="30" y="17" text-anchor="middle" font-family="monospace" font-size="12" fill="#fbbf24">
      RPG
    </text>
  </g>
</svg>`.trim();

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// Helper to wrap text into lines
function wrapText(text: string, maxLength: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= maxLength) {
      currentLine += (currentLine ? " " : "") + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines.slice(0, 3); // Max 3 lines
}

// Helper to escape XML special characters
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Convert SVG data URL to a PNG blob (for storage)
export async function svgToBlob(svgDataUrl: string): Promise<Blob> {
  // In a browser context, we could use canvas to convert SVG to PNG
  // For server-side, we'll just return the SVG as-is
  const svgContent = decodeURIComponent(svgDataUrl.replace("data:image/svg+xml,", ""));
  return new Blob([svgContent], { type: "image/svg+xml" });
}

// Prompt template for AI thumbnail generation
export function getThumbnailPrompt(title: string, author?: string): string {
  return `A pixel-art style game cover thumbnail for "${title}"${author ? ` by ${author}` : ""}. 
Retro 16-bit video game art style. Dark purple/blue background with vibrant amber/gold accents. 
Fantasy RPG aesthetic with magical elements like glowing runes or sparkles.
Clean, iconic design with bold colors. No text in the image.
The image should evoke learning, knowledge, and adventure.`;
}

// Result type for thumbnail generation
export interface ThumbnailResult {
  buffer: Buffer;
  contentType: string;
  isAIGenerated: boolean;
}

// Generate thumbnail using OpenAI DALL-E and download the image
export async function generateThumbnailWithAI(title: string, author?: string): Promise<ThumbnailResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("OPENAI_API_KEY not set, falling back to placeholder thumbnail");
    return null;
  }

  try {
    const client = new OpenAI({ apiKey });
    const prompt = getThumbnailPrompt(title, author);
    
    console.log(`Generating AI thumbnail for: "${title}"`);
    
    const response = await client.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "url",
    });

    const imageUrl = response.data?.[0]?.url;
    
    if (!imageUrl) {
      console.warn("No image URL in DALL-E response");
      return null;
    }
    
    console.log(`AI thumbnail generated, downloading image...`);
    
    // Download the image from the temporary URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.error(`Failed to download image: ${imageResponse.status}`);
      return null;
    }
    
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`AI thumbnail downloaded successfully (${buffer.length} bytes)`);
    
    return {
      buffer,
      contentType: "image/png",
      isAIGenerated: true,
    };
  } catch (error) {
    console.error("Failed to generate AI thumbnail:", error);
    return null;
  }
}

// Generate placeholder thumbnail as buffer
export function generatePlaceholderThumbnailBuffer(title: string): ThumbnailResult {
  const svg = generatePlaceholderThumbnail(title);
  const svgContent = decodeURIComponent(svg.replace("data:image/svg+xml,", ""));
  
  return {
    buffer: Buffer.from(svgContent, "utf-8"),
    contentType: "image/svg+xml",
    isAIGenerated: false,
  };
}

// Generate thumbnail - tries AI first, falls back to placeholder
// Returns buffer and content type for storage
export async function generateThumbnailForStorage(title: string, author?: string): Promise<ThumbnailResult> {
  // Try AI generation first
  const aiResult = await generateThumbnailWithAI(title, author);
  if (aiResult) {
    return aiResult;
  }
  
  // Fall back to placeholder
  console.log("Using placeholder thumbnail");
  return generatePlaceholderThumbnailBuffer(title);
}
