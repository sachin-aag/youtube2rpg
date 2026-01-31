import json
import io
import zipfile
import re
import time
from typing import Optional

from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi

# Initialize the transcript API
transcript_api = YouTubeTranscriptApi()

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


def get_playlist_videos(playlist_url: str) -> list[dict]:
    """
    Use yt-dlp to extract all video information from a playlist.
    Returns list of dicts with video_id, title, and other metadata.
    """
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
            "url": entry.get("url") or f"https://www.youtube.com/watch?v={entry.get('id')}",
            "duration": entry.get("duration"),
            "channel": entry.get("channel") or entry.get("uploader"),
            "thumbnail": entry.get("thumbnail"),
        })

    return videos


def get_video_details(video_id: str) -> dict:
    """
    Fetch full video details including description.
    Returns dict with description and other metadata.
    """
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            result = ydl.extract_info(
                f"https://www.youtube.com/watch?v={video_id}",
                download=False
            )
            return {
                "description": result.get("description", ""),
                "thumbnail": result.get("thumbnail"),
                "view_count": result.get("view_count"),
                "upload_date": result.get("upload_date"),
            }
    except Exception:
        return {
            "description": "",
            "thumbnail": None,
            "view_count": None,
            "upload_date": None,
        }


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
async def extract_transcripts(playlist_url: str = Form(...)):
    """
    Extract transcripts from all videos in a playlist.
    Returns a ZIP file containing one JSON file per video.
    """
    # Validate playlist URL
    playlist_id = extract_playlist_id(playlist_url)
    if not playlist_id:
        raise HTTPException(
            status_code=400,
            detail="Invalid playlist URL. Please provide a valid YouTube playlist URL."
        )

    # Get all videos in the playlist
    videos = get_playlist_videos(playlist_url)
    
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

            # Small delay to be respectful to YouTube's servers
            if i > 0:
                time.sleep(0.5)

            # Get full video details including description
            video_details = get_video_details(video_id)

            # Get transcript
            transcript_result = get_video_transcript(video_id)

            # Prepare JSON data for this video
            video_data = {
                "video_id": video_id,
                "title": video["title"],
                "url": video["url"],
                "channel": video.get("channel"),
                "description": video_details.get("description", ""),
                "thumbnail": video_details.get("thumbnail") or video.get("thumbnail"),
                "duration": video.get("duration"),
                "view_count": video_details.get("view_count"),
                "upload_date": video_details.get("upload_date"),
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
