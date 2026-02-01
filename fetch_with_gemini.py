#!/usr/bin/env python3
"""
Fetch YouTube playlist and generate quiz questions using Gemini 3 Flash.
Audio → Questions in one step, with parallel processing.

Usage: python fetch_with_gemini.py <playlist_url> [max_videos] [workers]
"""

import sys
sys.stdout.reconfigure(line_buffering=True)

import json
import re
import os
import tempfile
import time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Optional
import threading

import yt_dlp
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Gemini client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Thread-safe print lock
print_lock = threading.Lock()

def safe_print(msg):
    with print_lock:
        print(msg, flush=True)


QUESTION_PROMPT = """You are creating quiz questions for an educational RPG game based on this podcast audio.

Listen carefully to the entire podcast and generate EXACTLY 3 high-quality quiz questions.

CRITICAL RULE - READ FIRST:
Questions must be STANDALONE and make sense WITHOUT any context about the podcast.
FORBIDDEN phrases (DO NOT USE ANY OF THESE):
- "According to the discussion"
- "According to the episode" 
- "In the podcast"
- "The speaker mentions"
- "As discussed"
- "In this episode"
- "The host explains"
Any question containing these phrases is INVALID and must be rewritten.

Requirements:

1. QUESTION MIX:
   - Include both factual questions (testing scientific knowledge) and opinion-based questions (expert recommendations)
   - EXACTLY 3 questions: 1 easy, 1 medium, 1 hard

2. QUESTION FORMAT:
   - Each question should have exactly 4 options (A, B, C, D)
   - EXACTLY ONE option must be correct
   - Wrong options should be plausible but clearly incorrect
   - Avoid "all of the above" or "none of the above"

3. STYLE:
   - Write questions as if they are general knowledge questions, NOT about a specific podcast
   - GOOD: "What brain region controls memory consolidation?"
   - GOOD: "Dr. Huberman recommends which protocol for improving sleep?"
   - BAD: "According to the discussion, what brain region..."
   - BAD: "In this episode, what does the speaker recommend..."

4. CONTENT:
   - Focus on the most important and memorable insights
   - Include scientific facts, practical protocols, and surprising findings
   - Questions should be educational - players should learn something valuable

5. SUMMARY:
   - Provide a comprehensive summary of the podcast's main topic (3-5 sentences)

6. KEY TAKEAWAYS:
   - List the most important actionable insights from the podcast
   - Maximum 10 takeaways, each should be a concise, actionable statement
   - Focus on practical advice, scientific findings, and protocols discussed

Output ONLY valid JSON in this exact format:
{
  "summary": "A comprehensive 3-5 sentence summary of the podcast's main topic and themes.",
  "key_takeaways": [
    "First key takeaway or actionable insight",
    "Second key takeaway",
    "..."
  ],
  "questions": [
    {
      "id": 1,
      "type": "factual",
      "difficulty": "easy",
      "question": "The question text",
      "options": [
        {"id": "a", "text": "Option A", "correct": false},
        {"id": "b", "text": "Option B", "correct": true},
        {"id": "c", "text": "Option C", "correct": false},
        {"id": "d", "text": "Option D", "correct": false}
      ],
      "explanation": "Why the correct answer is right"
    },
    {
      "id": 2,
      "type": "opinion",
      "difficulty": "medium",
      "question": "...",
      "options": [...],
      "explanation": "..."
    },
    {
      "id": 3,
      "type": "factual",
      "difficulty": "hard",
      "question": "...",
      "options": [...],
      "explanation": "..."
    }
  ]
}"""


def get_playlist_videos(playlist_url: str, max_videos: int = None) -> list[dict]:
    """
    Use yt-dlp to extract video information from a playlist.
    """
    ydl_opts = {
        "extract_flat": "in_playlist",
        "quiet": True,
        "no_warnings": True,
    }
    
    if max_videos:
        ydl_opts["playlistend"] = max_videos

    safe_print("Fetching playlist info...")
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        result = ydl.extract_info(playlist_url, download=False)

    if not result or "entries" not in result:
        raise Exception("Could not find videos in playlist")

    videos = []
    for entry in result.get("entries", []):
        if entry is None:
            continue
        video_id = entry.get("id")
        videos.append({
            "video_id": video_id,
            "title": entry.get("title", "Unknown Title"),
            "url": f"https://www.youtube.com/watch?v={video_id}",
            "duration": entry.get("duration"),
            "channel": entry.get("channel") or entry.get("uploader"),
            "thumbnail": entry.get("thumbnail") or f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg",
        })

    return videos


def download_audio(video_url: str, audio_dir: str, video_id: str) -> Optional[str]:
    """
    Download audio from a YouTube video using yt-dlp.
    Returns the path to the downloaded file.
    Skips download if file already exists.
    """
    output_path = os.path.join(audio_dir, video_id)
    mp3_path = output_path + ".mp3"
    
    # Skip if already downloaded
    if os.path.exists(mp3_path):
        safe_print(f"    [{video_id}] Audio already exists, skipping download")
        return mp3_path
    
    # Download to temp file first
    temp_output = os.path.join(audio_dir, f"{video_id}_temp")
    
    ydl_opts = {
        # Prefer non-DASH formats to avoid fragmented downloads that stall
        "format": "worstaudio[protocol!=m3u8][protocol!=m3u8_native][protocol!=dash]/worstaudio/worst",
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "64",
        }],
        "outtmpl": temp_output,
        "quiet": False,
        "no_warnings": True,
        "retries": 5,
        "fragment_retries": 3,
        "socket_timeout": 15,  # Shorter timeout to fail faster on stuck downloads
        "extractor_retries": 3,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([video_url])
        
        # Compress with FFmpeg to mono 16kHz 32kbps
        temp_mp3 = temp_output + ".mp3"
        if os.path.exists(temp_mp3):
            import subprocess
            subprocess.run([
                "ffmpeg", "-y", "-i", temp_mp3,
                "-ac", "1", "-ar", "16000", "-b:a", "32k",
                mp3_path
            ], capture_output=True)
            os.remove(temp_mp3)  # Delete temp file
        
        return mp3_path if os.path.exists(mp3_path) else None
    except Exception as e:
        return None


def generate_questions_from_audio(audio_path: str, video_title: str) -> dict:
    """
    Send audio to Gemini 3 Flash and get quiz questions directly.
    """
    try:
        # Upload the audio file
        with open(audio_path, "rb") as f:
            audio_data = f.read()
        
        # Create the prompt with context
        prompt = f"Video Title: {video_title}\n\n{QUESTION_PROMPT}"
        
        # Call Gemini with audio
        response = client.models.generate_content(
            model="gemini-2.0-flash",  # Using 2.0 flash as 3.0 may not be available yet
            contents=[
                types.Content(
                    parts=[
                        types.Part.from_bytes(data=audio_data, mime_type="audio/mp3"),
                        types.Part.from_text(text=prompt),
                    ]
                )
            ],
            config=types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=4096,
            )
        )
        
        # Parse the JSON response
        response_text = response.text
        
        # Extract JSON from response (handle markdown code blocks)
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0]
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0]
        
        questions_data = json.loads(response_text.strip())
        
        return {
            "success": True,
            "summary": questions_data.get("summary", ""),
            "key_takeaways": questions_data.get("key_takeaways", []),
            "questions": questions_data.get("questions", []),
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }


def process_video(video: dict, file_index: int, total: int, output_dir: Path, 
                  questions_dir: Path, audio_dir: str, playlist_url: str) -> dict:
    """
    Process a single video: download audio → generate questions with Gemini.
    """
    video_id = video["video_id"]
    safe_title = re.sub(r'[^\w\s-]', '', video["title"])[:50].strip()
    
    # Check if already processed
    questions_filename = f"{file_index:03d}_{safe_title}_{video_id}_questions.json"
    questions_filepath = questions_dir / questions_filename
    
    if questions_filepath.exists():
        safe_print(f"[{file_index}/{total}] Skipping (exists): {video['title'][:40]}...")
        return {"video_id": video_id, "success": True, "skipped": True}
    
    safe_print(f"[{file_index}/{total}] Processing: {video['title'][:40]}...")
    
    # Step 1: Download audio (or use existing)
    safe_print(f"    [{video_id}] Checking audio...")
    audio_path = download_audio(video["url"], audio_dir, video_id)
    
    if not audio_path or not os.path.exists(audio_path):
        safe_print(f"    [{video_id}] ✗ Download failed")
        return {"video_id": video_id, "success": False, "error": "Download failed"}
    
    file_size_mb = os.path.getsize(audio_path) / (1024 * 1024)
    safe_print(f"    [{video_id}] Audio ready ({file_size_mb:.1f}MB), sending to Gemini...")
    
    # Step 2: Generate questions with Gemini
    result = generate_questions_from_audio(audio_path, video["title"])
    
    # Note: Audio files are kept for potential future regeneration
    
    if not result["success"]:
        safe_print(f"    [{video_id}] ✗ Gemini failed: {result['error'][:50]}")
        return {"video_id": video_id, "success": False, "error": result["error"]}
    
    # Save questions
    questions_data = {
        "video_id": video_id,
        "title": video["title"],
        "url": video["url"],
        "channel": video.get("channel"),
        "thumbnail": video.get("thumbnail"),
        "duration": video.get("duration"),
        "playlist_url": playlist_url,
        "summary": result.get("summary", ""),
        "key_takeaways": result.get("key_takeaways", []),
        "questions": result["questions"],
    }
    
    with open(questions_filepath, 'w', encoding='utf-8') as f:
        json.dump(questions_data, f, indent=2, ensure_ascii=False)
    
    safe_print(f"    [{video_id}] ✓ Generated {len(result['questions'])} questions")
    return {"video_id": video_id, "success": True, "questions": len(result["questions"])}


def fetch_playlist_questions(playlist_url: str, output_dir: str, max_videos: int = 100, 
                            start_index: int = 1, max_workers: int = 4):
    """
    Fetch questions for videos in a playlist using Gemini 3 Flash.
    Parallelized for speed.
    """
    output_path = Path(output_dir)
    questions_dir = output_path.parent / "generated_questions"
    questions_dir.mkdir(parents=True, exist_ok=True)
    
    # Create persistent audio directory (for potential re-processing)
    audio_dir = output_path.parent / "audio_files"
    audio_dir.mkdir(parents=True, exist_ok=True)
    safe_print(f"Audio directory: {audio_dir}")
    safe_print(f"Using {max_workers} parallel workers")
    
    # Get playlist videos
    videos = get_playlist_videos(playlist_url, max_videos)
    total = start_index + len(videos) - 1
    safe_print(f"Found {len(videos)} videos to process\n")
    
    results = {
        "total": len(videos),
        "successful": 0,
        "failed": 0,
        "skipped": 0,
    }
    
    start_time = time.time()
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all tasks
        futures = {}
        for i, video in enumerate(videos):
            file_index = start_index + i
            future = executor.submit(
                process_video, video, file_index, total,
                output_path, questions_dir, str(audio_dir), playlist_url
            )
            futures[future] = video
        
        # Process results as they complete
        for future in as_completed(futures):
            video = futures[future]
            try:
                result = future.result()
                if result.get("skipped"):
                    results["skipped"] += 1
                elif result["success"]:
                    results["successful"] += 1
                else:
                    results["failed"] += 1
            except Exception as e:
                safe_print(f"    [{video['video_id']}] ✗ Exception: {e}")
                results["failed"] += 1
    
    # Note: Audio files are kept in audio_dir for potential re-processing
    
    elapsed = time.time() - start_time
    
    # Save summary
    summary_path = questions_dir / "_summary.json"
    summary = {
        "total_videos": results["total"],
        "successful": results["successful"],
        "failed": results["failed"],
        "skipped": results["skipped"],
        "elapsed_seconds": elapsed,
    }
    
    with open(summary_path, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    
    safe_print(f"\n{'='*60}")
    safe_print(f"Completed in {elapsed/60:.1f} minutes!")
    safe_print(f"Successful: {results['successful']}")
    safe_print(f"Failed: {results['failed']}")
    safe_print(f"Skipped: {results['skipped']}")
    safe_print(f"Questions saved to: {questions_dir}")
    safe_print(f"{'='*60}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python fetch_with_gemini.py <playlist_url> [max_videos] [workers]")
        sys.exit(1)
    
    playlist_url = sys.argv[1]
    max_videos = int(sys.argv[2]) if len(sys.argv) > 2 else 100
    max_workers = int(sys.argv[3]) if len(sys.argv) > 3 else 4
    
    output_dir = Path(__file__).parent / "huberman_transcripts"
    
    fetch_playlist_questions(playlist_url, str(output_dir), max_videos, start_index=1, max_workers=max_workers)
