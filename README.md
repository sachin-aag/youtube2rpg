# YouTube Playlist Transcript Extractor

A FastAPI web application that extracts transcripts from all videos in a YouTube playlist and returns them as downloadable JSON files.

## Features

- Extract transcripts from entire YouTube playlists
- One JSON file per video with full transcript and metadata
- Handles videos without transcripts gracefully
- Simple, modern web interface
- Easy deployment to Railway/Render

## Local Development

### Prerequisites

- Python 3.9+
- pip

### Setup

1. Clone the repository:
```bash
cd youtube2rpg
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the development server:
```bash
uvicorn main:app --reload
```

5. Open http://localhost:8000 in your browser

## Usage

1. Go to the web interface
2. Paste a YouTube playlist URL (e.g., `https://www.youtube.com/playlist?list=PLxxxxx`)
3. Click "Extract Transcripts"
4. Wait for processing (larger playlists take longer)
5. Download the ZIP file containing all transcripts

## Output Format

Each video generates a JSON file with this structure:

```json
{
  "video_id": "abc123xyz",
  "title": "Video Title",
  "url": "https://www.youtube.com/watch?v=abc123xyz",
  "channel": "Channel Name",
  "thumbnail": "https://...",
  "duration": 1234,
  "playlist_url": "https://...",
  "transcript_available": true,
  "transcript": [
    {
      "text": "Hello and welcome",
      "start": 0.0,
      "duration": 2.5
    },
    {
      "text": "to this video",
      "start": 2.5,
      "duration": 1.8
    }
  ]
}
```

A `_summary.json` file is also included with overall statistics.

## Deployment

### Railway

1. Push code to GitHub
2. Go to [Railway](https://railway.app)
3. Create new project → Deploy from GitHub repo
4. Railway auto-detects the Procfile and deploys

### Render

1. Push code to GitHub
2. Go to [Render](https://render.com)
3. Create new Web Service → Connect GitHub repo
4. Set:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

## Limitations

- Some videos don't have transcripts (disabled by uploader or auto-captions not available)
- Large playlists may take several minutes to process
- YouTube may rate-limit requests for very large playlists

## License

MIT
