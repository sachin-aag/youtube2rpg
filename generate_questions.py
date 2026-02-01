"""
Generate quiz questions from YouTube transcript JSON files.

Usage:
    python generate_questions.py --input huberman_transcripts/ --output generated_questions/
    
    # Process a single file
    python generate_questions.py --input huberman_transcripts/001_*.json --output generated_questions/
    
Environment:
    OPENAI_API_KEY: Your OpenAI API key
"""

import argparse
import json
import os
import re
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from openai import OpenAI

from prompts import INSIGHT_EXTRACTION_PROMPT, QUESTION_GENERATION_PROMPT

# Load environment variables from .env file
load_dotenv()


def get_client() -> OpenAI:
    """Initialize OpenAI client."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ValueError(
            "OPENAI_API_KEY environment variable not set. "
            "Run: export OPENAI_API_KEY='your-key-here'"
        )
    return OpenAI(api_key=api_key)


def clean_text(text: str) -> str:
    """
    Light cleaning of transcript text:
    - Remove filler words (um, uh)
    - Clean up spacing
    """
    # Remove standalone filler words (with word boundaries)
    text = re.sub(r'\b(um|uh|uhm|hmm)\b', '', text, flags=re.IGNORECASE)
    # Clean up any double spaces created
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def is_sponsor_segment(text: str) -> bool:
    """
    Detect if text is part of a sponsor/ad segment.
    """
    sponsor_keywords = [
        r'\bag1\b', r'\bathletic greens\b', r'\blmnt\b', r'\belement\b',
        r'\binsidetracker\b', r'\beight sleep\b', r'\bwhoop\b',
        r'\bour sponsors\b', r'\btoday\'s sponsor\b', r'\bsponsored by\b',
        r'\buse code\b', r'\bdiscount code\b', r'\bpromo code\b',
        r'\bdrinklmnt\b', r'\bathleticgreens\b'
    ]
    text_lower = text.lower()
    return any(re.search(pattern, text_lower) for pattern in sponsor_keywords)


def merge_transcript_chunks(transcript: list[dict], skip_sponsors: bool = True) -> str:
    """
    Merge fragmented transcript chunks into coherent paragraphs.
    
    The raw transcript has tiny chunks like:
        {"text": "welcome to the", "start": 0.32}
        {"text": "huberman Lab podcast", "start": 1.2}
    
    This merges them into readable paragraphs with timestamps.
    
    Cleaning applied:
    - Skip [Music] / [Sound] annotations
    - Remove filler words (um, uh)
    - Optionally skip sponsor segments
    """
    if not transcript:
        return ""
    
    merged_text = []
    current_paragraph = []
    current_start = transcript[0].get("start", 0)
    skip_until_time = 0  # Used to skip sponsor segments
    
    for i, chunk in enumerate(transcript):
        text = chunk.get("text", "").strip()
        chunk_start = chunk.get("start", 0)
        
        # Skip if we're in a sponsor segment
        if skip_sponsors and chunk_start < skip_until_time:
            continue
        
        # Skip music/sound annotations
        if text.startswith("[") and text.endswith("]"):
            continue
        
        # Detect and skip sponsor segments (skip ~60 seconds when detected)
        if skip_sponsors and is_sponsor_segment(text):
            skip_until_time = chunk_start + 60
            # Flush current paragraph before skipping
            if current_paragraph:
                timestamp = f"[{int(current_start // 60)}:{int(current_start % 60):02d}]"
                paragraph_text = clean_text(" ".join(current_paragraph))
                if paragraph_text:
                    merged_text.append(f"{timestamp} {paragraph_text}")
                current_paragraph = []
            continue
        
        # Clean and add text
        cleaned = clean_text(text)
        if cleaned:
            current_paragraph.append(cleaned)
        
        # Create paragraph breaks roughly every 30 seconds or at natural breaks
        next_start = transcript[i + 1].get("start", 0) if i + 1 < len(transcript) else float("inf")
        time_gap = next_start - chunk_start
        
        # Paragraph break conditions
        should_break = (
            time_gap > 2.0 or  # Long pause
            len(" ".join(current_paragraph)) > 500 or  # Long paragraph
            text.endswith((".", "?", "!")) and len(current_paragraph) > 5
        )
        
        if should_break and current_paragraph:
            timestamp = f"[{int(current_start // 60)}:{int(current_start % 60):02d}]"
            paragraph_text = " ".join(current_paragraph)
            # Final cleanup
            paragraph_text = re.sub(r"\s+", " ", paragraph_text).strip()
            if paragraph_text:
                merged_text.append(f"{timestamp} {paragraph_text}")
            current_paragraph = []
            current_start = next_start
    
    # Add any remaining text
    if current_paragraph:
        timestamp = f"[{int(current_start // 60)}:{int(current_start % 60):02d}]"
        paragraph_text = " ".join(current_paragraph)
        paragraph_text = re.sub(r"\s+", " ", paragraph_text).strip()
        if paragraph_text:
            merged_text.append(f"{timestamp} {paragraph_text}")
    
    return "\n\n".join(merged_text)


def extract_guest_name(title: str) -> Optional[str]:
    """
    Extract guest name from video title if present.
    
    Huberman Lab title patterns:
    - "Topic | Dr. Name" -> Dr. Name
    - "Dr. Name: Topic | Huberman Lab Guest Series" -> Dr. Name
    - "Topic Based on Neuroscience" -> None (solo episode)
    """
    # Pattern 1: Guest name after pipe (most common)
    # "How to Improve Memory | Dr. Charan Ranganath"
    match = re.search(r'\|\s*(Dr\.?\s+[A-Z][a-z]+\s+[A-Z][a-z]+)', title)
    if match:
        return match.group(1).strip()
    
    # Pattern 2: Guest name at start with colon
    # "Dr. Matt Walker: Improve Sleep..."
    match = re.search(r'^(Dr\.?\s+[A-Z][a-z]+\s+[A-Z][a-z]+)\s*:', title)
    if match:
        return match.group(1).strip()
    
    # Pattern 3: Non-Dr guest after pipe
    # "Topic | Robert Greene"
    match = re.search(r'\|\s*([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s*\||$)', title)
    if match:
        guest = match.group(1).strip()
        # Exclude "Huberman Lab" or "Guest Series"
        if "Huberman" not in guest and "Series" not in guest:
            return guest
    
    return None


def truncate_transcript(text: str, max_tokens: int = 80000) -> str:
    """
    Truncate transcript to fit within token limits.
    Rough estimate: 1 token ≈ 4 characters
    """
    max_chars = max_tokens * 4
    if len(text) <= max_chars:
        return text
    
    # Take beginning and end portions
    portion_size = max_chars // 2
    beginning = text[:portion_size]
    ending = text[-portion_size:]
    
    return f"{beginning}\n\n[... middle portion truncated for length ...]\n\n{ending}"


def extract_insights(client: OpenAI, transcript_text: str, title: str, guest: Optional[str], model: str = "gpt-4o-mini") -> list[dict]:
    """
    Stage 1: Extract key insights from the transcript.
    """
    truncated = truncate_transcript(transcript_text)
    
    prompt = INSIGHT_EXTRACTION_PROMPT.format(
        title=title,
        guest=guest or "Solo episode (Andrew Huberman only)",
        transcript=truncated
    )
    
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are an expert at analyzing educational content and extracting key insights. Always respond with valid JSON."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        response_format={"type": "json_object"}
    )
    
    content = response.choices[0].message.content
    try:
        # Handle both array and object responses
        parsed = json.loads(content)
        if isinstance(parsed, list):
            return parsed
        elif isinstance(parsed, dict) and "insights" in parsed:
            return parsed["insights"]
        else:
            return list(parsed.values())[0] if parsed else []
    except json.JSONDecodeError:
        print(f"  Warning: Failed to parse insights JSON, using raw content")
        return []


def generate_questions(client: OpenAI, insights: list[dict], title: str, guest: Optional[str], model: str = "gpt-4o-mini") -> dict:
    """
    Stage 2: Generate quiz questions from insights.
    """
    insights_text = json.dumps(insights, indent=2)
    
    prompt = QUESTION_GENERATION_PROMPT.format(
        title=title,
        guest=guest or "Solo episode (Andrew Huberman only)",
        insights=insights_text
    )
    
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are an expert quiz creator for educational games. Always respond with valid JSON."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
        response_format={"type": "json_object"}
    )
    
    content = response.choices[0].message.content
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        print(f"  Warning: Failed to parse questions JSON")
        return {"questions": []}


def process_transcript_file(client: OpenAI, input_path: Path, output_dir: Path, model: str = "gpt-4o-mini") -> dict:
    """
    Process a single transcript file and generate questions.
    """
    print(f"\nProcessing: {input_path.name}")
    
    # Load transcript
    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    video_id = data.get("video_id", "unknown")
    title = data.get("title", "Unknown Title")
    transcript = data.get("transcript", [])
    
    if not transcript:
        print(f"  Skipping: No transcript available")
        return None
    
    # Extract guest name
    guest = extract_guest_name(title)
    print(f"  Title: {title}")
    print(f"  Guest: {guest or 'Solo episode'}")
    print(f"  Transcript chunks: {len(transcript)}")
    
    # Stage 1: Merge and extract insights
    print(f"  Stage 1: Merging transcript and extracting insights...")
    merged_text = merge_transcript_chunks(transcript)
    print(f"  Merged text length: {len(merged_text):,} characters")
    
    insights = extract_insights(client, merged_text, title, guest, model)
    print(f"  Extracted {len(insights)} insights")
    
    if not insights:
        print(f"  Warning: No insights extracted, skipping question generation")
        return None
    
    # Stage 2: Generate questions
    print(f"  Stage 2: Generating quiz questions...")
    questions_data = generate_questions(client, insights, title, guest, model)
    
    questions = questions_data.get("questions", [])
    print(f"  Generated {len(questions)} questions")
    
    # Build output
    output = {
        "video_id": video_id,
        "title": title,
        "url": data.get("url", ""),
        "guest": guest,
        "duration": data.get("duration"),
        "insights_extracted": len(insights),
        "questions": questions
    }
    
    # Save output
    output_path = output_dir / f"{input_path.stem}_questions.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"  Saved: {output_path.name}")
    
    return output


def main():
    parser = argparse.ArgumentParser(description="Generate quiz questions from transcript files")
    parser.add_argument("--input", "-i", required=True, help="Input directory or file pattern")
    parser.add_argument("--output", "-o", default="generated_questions", help="Output directory")
    parser.add_argument("--model", "-m", default="gpt-4o-mini", help="OpenAI model to use")
    args = parser.parse_args()
    
    # Initialize client
    client = get_client()
    
    # Setup paths
    input_path = Path(args.input)
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Find input files
    if input_path.is_file():
        input_files = [input_path]
    elif input_path.is_dir():
        input_files = sorted(input_path.glob("*.json"))
        # Exclude summary file
        input_files = [f for f in input_files if not f.name.startswith("_")]
    else:
        # Treat as glob pattern
        input_files = sorted(Path(".").glob(args.input))
    
    if not input_files:
        print(f"No JSON files found in: {args.input}")
        return
    
    print(f"Found {len(input_files)} transcript file(s)")
    print(f"Using model: {args.model}")
    print(f"Output directory: {output_dir}")
    
    # Process each file
    results = []
    for input_file in input_files:
        try:
            result = process_transcript_file(client, input_file, output_dir, args.model)
            if result:
                results.append(result)
        except Exception as e:
            print(f"  Error processing {input_file.name}: {e}")
            continue
    
    # Save summary
    if results:
        summary = {
            "total_processed": len(results),
            "total_questions": sum(len(r.get("questions", [])) for r in results),
            "videos": [
                {
                    "video_id": r["video_id"],
                    "title": r["title"],
                    "questions_generated": len(r.get("questions", []))
                }
                for r in results
            ]
        }
        
        summary_path = output_dir / "_summary.json"
        with open(summary_path, "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        
        print(f"\n{'='*50}")
        print(f"Complete! Processed {len(results)} videos")
        print(f"Total questions generated: {summary['total_questions']}")
        print(f"Output saved to: {output_dir}/")


if __name__ == "__main__":
    main()
