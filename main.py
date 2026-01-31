import json
import io
import zipfile
import re
import time
import os
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi

# Initialize the transcript API with optional cookie support
# To use cookies, export them from your browser and save to cookies.txt
COOKIES_FILE = Path(__file__).parent / "cookies.txt"
if COOKIES_FILE.exists():
    from http.cookiejar import MozillaCookieJar
    cookie_jar = MozillaCookieJar(str(COOKIES_FILE))
    cookie_jar.load()
    transcript_api = YouTubeTranscriptApi(cookie_jar=cookie_jar)
    print(f"✓ Using cookies from {COOKIES_FILE}")
else:
    transcript_api = YouTubeTranscriptApi()
    print("⚠ No cookies.txt found - YouTube may block requests. See README for instructions.")

app = FastAPI(title="YouTube Playlist Transcript Extractor")

# Mount static files and templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


def extract_playlist_id(url: str) -> Optional[str]:
    """Extract playlist ID from various YouTube URL formats."""
    patterns = [
        r"[?&]list=([a-zA-Z0-9_-]+)",
        r"playlist\?list=([a-zA-Z0-9_-]+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def get_playlist_videos(playlist_url: str, include_descriptions: bool = True) -> list[dict]:
    """
    Use yt-dlp to extract all video information from a playlist.
    
    Args:
        playlist_url: YouTube playlist URL
        include_descriptions: If True, do full extraction (slower but gets descriptions).
                            If False, use flat extraction (faster, no descriptions).
    
    Returns list of dicts with video_id, title, and other metadata.
    """
    if include_descriptions:
        # Full extraction - slower but gets descriptions
        ydl_opts = {
            "quiet": True,
            "no_warnings": True,
            "skip_download": True,
            "extract_flat": False,
        }
    else:
        # Flat extraction - faster but no descriptions
        ydl_opts = {
            "extract_flat": "in_playlist",
            "quiet": True,
            "no_warnings": True,
        }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            result = ydl.extract_info(playlist_url, download=False)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to fetch playlist: {str(e)}")

    if not result or "entries" not in result:
        raise HTTPException(status_code=400, detail="Could not find videos in playlist")

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
            "description": entry.get("description", ""),
            "thumbnail": entry.get("thumbnail"),
            "view_count": entry.get("view_count"),
            "upload_date": entry.get("upload_date"),
        })

    return videos


def get_video_transcript(video_id: str) -> dict:
    """
    Fetch transcript for a single video.
    Returns dict with transcript data or error information.
    """
    try:
        result = transcript_api.fetch(video_id)
        # Convert FetchedTranscript items to dicts
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
        # Provide friendlier error messages for common cases
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


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Render the home page with the playlist input form."""
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/extract")
async def extract_transcripts(
    playlist_url: str = Form(...),
    include_description: bool = Form(default=True),
):
    """
    Extract transcripts from all videos in a playlist.
    Returns a ZIP file containing one JSON file per video.
    
    Args:
        playlist_url: YouTube playlist URL
        include_description: If True, fetch full video descriptions (slower).
                           If False, skip descriptions for faster extraction.
    """
    # Validate playlist URL
    playlist_id = extract_playlist_id(playlist_url)
    if not playlist_id:
        raise HTTPException(
            status_code=400,
            detail="Invalid playlist URL. Please provide a valid YouTube playlist URL."
        )

    # Get all videos in the playlist (with descriptions if requested)
    videos = get_playlist_videos(playlist_url, include_descriptions=include_description)
    
    if not videos:
        raise HTTPException(status_code=400, detail="No videos found in playlist")

    # Create a ZIP file in memory
    zip_buffer = io.BytesIO()
    
    results_summary = {
        "total_videos": len(videos),
        "successful": 0,
        "failed": 0,
        "videos": [],
    }

    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for i, video in enumerate(videos):
            video_id = video["video_id"]
            
            if not video_id:
                continue

            # Delay between requests to avoid rate limiting
            # YouTube may block IPs that make too many requests too quickly
            if i > 0:
                time.sleep(2.0)

            # Get transcript
            transcript_result = get_video_transcript(video_id)

            # Prepare JSON data for this video
            video_data = {
                "video_id": video_id,
                "title": video["title"],
                "url": video["url"],
                "channel": video.get("channel"),
                "description": video.get("description", ""),
                "thumbnail": video.get("thumbnail"),
                "duration": video.get("duration"),
                "view_count": video.get("view_count"),
                "upload_date": video.get("upload_date"),
                "playlist_url": playlist_url,
                "transcript_available": transcript_result["success"],
            }

            if transcript_result["success"]:
                video_data["transcript"] = transcript_result["transcript"]
                results_summary["successful"] += 1
            else:
                video_data["error"] = transcript_result["error"]
                results_summary["failed"] += 1

            results_summary["videos"].append({
                "video_id": video_id,
                "title": video["title"],
                "success": transcript_result["success"],
            })

            # Create safe filename
            safe_title = re.sub(r'[^\w\s-]', '', video["title"])[:50].strip()
            filename = f"{i+1:03d}_{safe_title}_{video_id}.json"

            # Add JSON file to ZIP
            json_content = json.dumps(video_data, indent=2, ensure_ascii=False)
            zip_file.writestr(filename, json_content)

        # Add a summary file
        summary_content = json.dumps(results_summary, indent=2, ensure_ascii=False)
        zip_file.writestr("_summary.json", summary_content)

    # Prepare the ZIP for download
    zip_buffer.seek(0)

    # Generate filename from playlist ID
    zip_filename = f"transcripts_{playlist_id}.zip"

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={
            "Content-Disposition": f"attachment; filename={zip_filename}"
        }
    )


@app.get("/health")
async def health_check():
    """Health check endpoint for deployment platforms."""
    return {"status": "healthy"}
