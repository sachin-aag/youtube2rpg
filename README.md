# YouTube Playlist Transcript Extractor

A FastAPI web application that extracts transcripts from all videos in a YouTube playlist and returns them as downloadable JSON files.

## Important: Avoiding YouTube Rate Limits

YouTube may block transcript requests if you make too many in a short time. To avoid this:

### Option 1: Use Browser Cookies (Recommended)

Export your YouTube cookies and save them to `cookies.txt` in the project root. This authenticates requests as your logged-in account.

**Steps to export cookies:**

1. Install a browser extension:
   - Chrome: [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)
   - Firefox: [cookies.txt](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/)

2. Go to [youtube.com](https://www.youtube.com) and make sure you're logged in

3. Click the extension icon and export cookies for youtube.com

4. Save the file as `cookies.txt` in the project root folder

5. Restart the server - you should see "Using cookies from cookies.txt" in the console

### Option 2: Wait Between Requests

If you get blocked, wait 15-30 minutes before trying again. The block is temporary.

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

## Working Around YouTube IP Blocks

YouTube may block transcript requests from your IP address, especially if:
- You've made too many requests
- You're running from a cloud provider (AWS, GCP, Azure, Railway, Render, etc.)

**Solution: Use browser cookies**

1. Install a browser extension to export cookies in Netscape format:
   - Chrome: [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)
   - Firefox: [cookies.txt](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/)

2. Log into YouTube in your browser

3. Go to any YouTube page and export cookies using the extension

4. Save the exported cookies as `cookies.txt` in the project root (same folder as `main.py`)

5. Restart the server - it will automatically use the cookies

The server will show a message on startup indicating whether cookies are loaded.

## Limitations

- Some videos don't have transcripts (disabled by uploader or auto-captions not available)
- Large playlists may take several minutes to process
- YouTube may rate-limit requests for very large playlists
- **IP Blocking**: YouTube actively blocks requests from many IPs. Use cookies (see above) to work around this.

## License

MIT
