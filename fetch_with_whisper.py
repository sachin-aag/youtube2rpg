#!/usr/bin/env python3
"""
Fetch YouTube playlist transcripts using yt-dlp + OpenAI Whisper API.
Speeds up audio 2x to reduce transcription costs by 50%.

Usage: python fetch_with_whisper.py <playlist_url> [max_videos] [start_index]
"""

import sys
sys.stdout.reconfigure(line_buffering=True)

import json
import re
import time
import os
import tempfile
from pathlib import Path
from typing import Optional

import yt_dlp
from pydub import AudioSegment
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI()

# Speed multiplier (2x = half the cost)
SPEED_MULTIPLIER = 2.0

# Whisper API file size limit (25MB)
MAX_FILE_SIZE_MB = 25


def get_playlist_videos(playlist_url: str, max_videos: int = None) -> list[dict]:
    """
    Use yt-dlp to extract video information from a playlist.
    Uses flat extraction for speed (no descriptions).
    """
    ydl_opts = {
        "extract_flat": "in_playlist",
        "quiet": True,
        "no_warnings": True,
    }
    
    if max_videos:
        ydl_opts["playlistend"] = max_videos

    print(f"Fetching playlist info...", flush=True)
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


def download_audio(video_url: str, output_path: str) -> Optional[str]:
    """
    Download audio from a YouTube video using yt-dlp.
    Returns the path to the downloaded file.
    """
    ydl_opts = {
        "format": "bestaudio/best",
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "128",
        }],
        "outtmpl": output_path,
        "quiet": True,
        "no_warnings": True,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([video_url])
        # yt-dlp adds .mp3 extension
        return output_path + ".mp3"
    except Exception as e:
        print(f"    ✗ Download failed: {e}", flush=True)
        return None


def speed_up_audio(input_path: str, output_path: str, speed: float = 2.0) -> str:
    """
    Speed up audio file using pydub.
    Returns path to sped-up audio file.
    """
    audio = AudioSegment.from_mp3(input_path)
    
    # Speed up by changing frame rate then converting back
    # This method preserves reasonable quality
    sped_up = audio._spawn(audio.raw_data, overrides={
        "frame_rate": int(audio.frame_rate * speed)
    }).set_frame_rate(audio.frame_rate)
    
    sped_up.export(output_path, format="mp3")
    return output_path


def transcribe_audio(audio_path: str, speed_multiplier: float = 2.0) -> dict:
    """
    Transcribe audio using OpenAI Whisper API.
    Adjusts timestamps based on speed multiplier.
    """
    try:
        # Check file size
        file_size_mb = os.path.getsize(audio_path) / (1024 * 1024)
        
        if file_size_mb > MAX_FILE_SIZE_MB:
            # Need to chunk the audio
            return transcribe_audio_chunked(audio_path, speed_multiplier)
        
        with open(audio_path, "rb") as audio_file:
            response = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="verbose_json",
                timestamp_granularities=["segment"]
            )
        
        # Convert to our transcript format and adjust timestamps
        transcript = []
        for segment in response.segments:
            transcript.append({
                "text": segment.text.strip(),
                "start": segment.start * speed_multiplier,  # Adjust for speedup
                "duration": (segment.end - segment.start) * speed_multiplier,
            })
        
        return {
            "success": True,
            "transcript": transcript,
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }


def transcribe_audio_chunked(audio_path: str, speed_multiplier: float = 2.0) -> dict:
    """
    Transcribe large audio files by chunking them.
    """
    try:
        audio = AudioSegment.from_mp3(audio_path)
        
        # Split into 10-minute chunks (should be well under 25MB each)
        chunk_length_ms = 10 * 60 * 1000  # 10 minutes
        chunks = []
        
        for i in range(0, len(audio), chunk_length_ms):
            chunks.append(audio[i:i + chunk_length_ms])
        
        print(f"    Splitting into {len(chunks)} chunks...", flush=True)
        
        full_transcript = []
        time_offset = 0  # Track cumulative time for timestamp adjustment
        
        for i, chunk in enumerate(chunks):
            # Export chunk to temp file
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
                chunk.export(tmp.name, format="mp3")
                tmp_path = tmp.name
            
            try:
                with open(tmp_path, "rb") as audio_file:
                    response = client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file,
                        response_format="verbose_json",
                        timestamp_granularities=["segment"]
                    )
                
                for segment in response.segments:
                    # Adjust timestamps for chunk offset and speed
                    adjusted_start = (time_offset + segment.start) * speed_multiplier
                    adjusted_duration = (segment.end - segment.start) * speed_multiplier
                    
                    full_transcript.append({
                        "text": segment.text.strip(),
                        "start": adjusted_start,
                        "duration": adjusted_duration,
                    })
                
            finally:
                os.unlink(tmp_path)
            
            # Update time offset for next chunk (in sped-up time)
            time_offset += len(chunk) / 1000  # Convert ms to seconds
            
            print(f"    Chunk {i+1}/{len(chunks)} transcribed", flush=True)
        
        return {
            "success": True,
            "transcript": full_transcript,
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }


def fetch_playlist_transcripts(playlist_url: str, output_dir: str, max_videos: int = 100, start_index: int = 1):
    """
    Fetch transcripts for videos in a playlist using yt-dlp + Whisper API.
    """
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Create temp directory for audio files
    temp_dir = Path(tempfile.mkdtemp(prefix="whisper_audio_"))
    print(f"Temp audio directory: {temp_dir}", flush=True)
    
    # Get playlist videos
    videos = get_playlist_videos(playlist_url, max_videos)
    print(f"Found {len(videos)} videos to process", flush=True)
    
    results_summary = {
        "total_videos": len(videos),
        "successful": 0,
        "failed": 0,
        "videos": [],
    }
    
    try:
        for i, video in enumerate(videos):
            video_id = video["video_id"]
            file_index = start_index + i
            
            if not video_id:
                continue
            
            # Create safe filename
            safe_title = re.sub(r'[^\w\s-]', '', video["title"])[:50].strip()
            filename = f"{file_index:03d}_{safe_title}_{video_id}.json"
            filepath = output_path / filename
            
            # Skip if file already exists with transcript
            if filepath.exists():
                try:
                    with open(filepath, 'r') as f:
                        existing = json.load(f)
                    if existing.get("transcript_available") and existing.get("transcript"):
                        print(f"[{file_index}/{start_index + len(videos) - 1}] Skipping (exists): {video['title'][:50]}", flush=True)
                        continue
                except:
                    pass
            
            print(f"[{file_index}/{start_index + len(videos) - 1}] Processing: {video['title'][:50]}...", flush=True)
            
            # Rate limiting for YouTube downloads
            if i > 0:
                time.sleep(3)
            
            # Step 1: Download audio
            audio_path = temp_dir / f"{video_id}"
            downloaded_path = download_audio(video["url"], str(audio_path))
            
            if not downloaded_path or not os.path.exists(downloaded_path):
                print(f"    ✗ Audio download failed", flush=True)
                video_data = {
                    "video_id": video_id,
                    "title": video["title"],
                    "url": video["url"],
                    "channel": video.get("channel"),
                    "thumbnail": video.get("thumbnail"),
                    "duration": video.get("duration"),
                    "playlist_url": playlist_url,
                    "transcript_available": False,
                    "error": "Audio download failed",
                }
                results_summary["failed"] += 1
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(video_data, f, indent=2, ensure_ascii=False)
                continue
            
            # Step 2: Speed up audio
            print(f"    Speeding up audio {SPEED_MULTIPLIER}x...", flush=True)
            sped_up_path = str(temp_dir / f"{video_id}_fast.mp3")
            speed_up_audio(downloaded_path, sped_up_path, SPEED_MULTIPLIER)
            
            # Step 3: Transcribe
            print(f"    Transcribing with Whisper API...", flush=True)
            transcript_result = transcribe_audio(sped_up_path, SPEED_MULTIPLIER)
            
            # Clean up audio files
            try:
                os.unlink(downloaded_path)
                os.unlink(sped_up_path)
            except:
                pass
            
            # Prepare JSON data
            video_data = {
                "video_id": video_id,
                "title": video["title"],
                "url": video["url"],
                "channel": video.get("channel"),
                "thumbnail": video.get("thumbnail"),
                "duration": video.get("duration"),
                "playlist_url": playlist_url,
                "transcript_available": transcript_result["success"],
            }
            
            if transcript_result["success"]:
                video_data["transcript"] = transcript_result["transcript"]
                results_summary["successful"] += 1
                print(f"    ✓ Success - {len(transcript_result['transcript'])} segments", flush=True)
            else:
                video_data["error"] = transcript_result["error"]
                results_summary["failed"] += 1
                print(f"    ✗ Failed: {transcript_result['error']}", flush=True)
            
            results_summary["videos"].append({
                "video_id": video_id,
                "title": video["title"],
                "filename": filename,
                "success": transcript_result["success"],
            })
            
            # Save JSON file
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(video_data, f, indent=2, ensure_ascii=False)
    
    finally:
        # Clean up temp directory
        try:
            import shutil
            shutil.rmtree(temp_dir)
        except:
            pass
    
    # Update summary file
    summary_path = output_path / "_summary.json"
    if summary_path.exists():
        with open(summary_path, 'r', encoding='utf-8') as f:
            existing_summary = json.load(f)
        results_summary["total_videos"] += existing_summary.get("total_videos", 0)
        results_summary["successful"] += existing_summary.get("successful", 0)
        results_summary["failed"] += existing_summary.get("failed", 0)
        results_summary["videos"] = existing_summary.get("videos", []) + results_summary["videos"]
    
    with open(summary_path, 'w', encoding='utf-8') as f:
        json.dump(results_summary, f, indent=2, ensure_ascii=False)
    
    print(f"\n{'='*60}", flush=True)
    print(f"Completed! Saved to: {output_path}", flush=True)
    print(f"Successful: {results_summary['successful']}", flush=True)
    print(f"Failed: {results_summary['failed']}", flush=True)
    print(f"{'='*60}", flush=True)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python fetch_with_whisper.py <playlist_url> [max_videos] [start_index]")
        sys.exit(1)
    
    playlist_url = sys.argv[1]
    max_videos = int(sys.argv[2]) if len(sys.argv) > 2 else 100
    start_index = int(sys.argv[3]) if len(sys.argv) > 3 else 1
    
    output_dir = Path(__file__).parent / "huberman_transcripts"
    
    fetch_playlist_transcripts(playlist_url, str(output_dir), max_videos, start_index)
