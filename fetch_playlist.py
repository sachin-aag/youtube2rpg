#!/usr/bin/env python3
"""
Script to fetch transcripts from a YouTube playlist.
Usage: python fetch_playlist.py <playlist_url> [max_videos]
"""

import sys
# Force unbuffered output
sys.stdout.reconfigure(line_buffering=True)

import json
import re
import time
import os
import sys
from pathlib import Path

import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi

# Initialize the transcript API with optional cookie support
COOKIES_FILE = Path(__file__).parent / "cookies.txt"
if COOKIES_FILE.exists():
    from http.cookiejar import MozillaCookieJar
    cookie_jar = MozillaCookieJar(str(COOKIES_FILE))
    cookie_jar.load()
    transcript_api = YouTubeTranscriptApi(cookie_jar=cookie_jar)
    print(f"✓ Using cookies from {COOKIES_FILE}", flush=True)
else:
    transcript_api = YouTubeTranscriptApi()
    print("⚠ No cookies.txt found - YouTube may block requests.", flush=True)


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
        videos.append({
            "video_id": entry.get("id"),
            "title": entry.get("title", "Unknown Title"),
            "url": f"https://www.youtube.com/watch?v={entry.get('id')}",
            "duration": entry.get("duration"),
            "channel": entry.get("channel") or entry.get("uploader"),
            "thumbnail": entry.get("thumbnail") or f"https://i.ytimg.com/vi/{entry.get('id')}/maxresdefault.jpg",
        })

    return videos


def get_video_transcript(video_id: str) -> dict:
    """
    Fetch transcript for a single video.
    Returns dict with transcript data or error information.
    """
    try:
        result = transcript_api.fetch(video_id)
        transcript_list = [
            {
                "text": item.text,
                "start": item.start,
                "duration": item.duration,
            }
            for item in result
        ]
        return {
            "success": True,
            "transcript": transcript_list,
        }
    except Exception as e:
        error_message = str(e)
        if "disabled" in error_message.lower():
            error_message = "Transcripts are disabled for this video"
        elif "no transcript" in error_message.lower():
            error_message = "No transcript found for this video"
        elif "unavailable" in error_message.lower():
            error_message = "Video is unavailable"
        return {
            "success": False,
            "error": error_message,
        }


def fetch_playlist_transcripts(playlist_url: str, output_dir: str, max_videos: int = 100, start_index: int = 1):
    """
    Fetch transcripts for videos in a playlist and save to individual JSON files.
    
    Args:
        playlist_url: YouTube playlist URL
        output_dir: Directory to save transcript files
        max_videos: Maximum number of videos to process
        start_index: Starting file number (for continuing from previous runs)
    """
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Get playlist videos
    videos = get_playlist_videos(playlist_url, max_videos)
    print(f"Found {len(videos)} videos to process", flush=True)
    
    results_summary = {
        "total_videos": len(videos),
        "successful": 0,
        "failed": 0,
        "videos": [],
    }
    
    for i, video in enumerate(videos):
        video_id = video["video_id"]
        file_index = start_index + i
        
        if not video_id:
            continue
        
        # Create safe filename
        safe_title = re.sub(r'[^\w\s-]', '', video["title"])[:50].strip()
        filename = f"{file_index:03d}_{safe_title}_{video_id}.json"
        filepath = output_path / filename
        
        # Skip if file already exists
        if filepath.exists():
            print(f"[{file_index}/{start_index + len(videos) - 1}] Skipping (exists): {video['title'][:50]}")
            continue
        
        print(f"[{file_index}/{start_index + len(videos) - 1}] Fetching: {video['title'][:50]}...")
        
        # Delay between requests to avoid rate limiting
        if i > 0:
            time.sleep(1.5)
        
        # Get transcript
        transcript_result = get_video_transcript(video_id)
        
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
            print(f"    ✓ Success - {len(transcript_result['transcript'])} segments")
        else:
            video_data["error"] = transcript_result["error"]
            results_summary["failed"] += 1
            print(f"    ✗ Failed: {transcript_result['error']}")
        
        results_summary["videos"].append({
            "video_id": video_id,
            "title": video["title"],
            "filename": filename,
            "success": transcript_result["success"],
        })
        
        # Save JSON file
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(video_data, f, indent=2, ensure_ascii=False)
    
    # Update summary file
    summary_path = output_path / "_summary.json"
    if summary_path.exists():
        with open(summary_path, 'r', encoding='utf-8') as f:
            existing_summary = json.load(f)
        # Merge summaries
        results_summary["total_videos"] += existing_summary.get("total_videos", 0)
        results_summary["successful"] += existing_summary.get("successful", 0)
        results_summary["failed"] += existing_summary.get("failed", 0)
        results_summary["videos"] = existing_summary.get("videos", []) + results_summary["videos"]
    
    with open(summary_path, 'w', encoding='utf-8') as f:
        json.dump(results_summary, f, indent=2, ensure_ascii=False)
    
    print(f"\n{'='*60}")
    print(f"Completed! Saved to: {output_path}")
    print(f"Successful: {results_summary['successful']}")
    print(f"Failed: {results_summary['failed']}")
    print(f"{'='*60}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python fetch_playlist.py <playlist_url> [max_videos] [start_index]")
        sys.exit(1)
    
    playlist_url = sys.argv[1]
    max_videos = int(sys.argv[2]) if len(sys.argv) > 2 else 100
    start_index = int(sys.argv[3]) if len(sys.argv) > 3 else 1
    
    output_dir = Path(__file__).parent / "huberman_transcripts"
    
    fetch_playlist_transcripts(playlist_url, str(output_dir), max_videos, start_index)
