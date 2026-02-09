"""
AI-powered lyrics synchronization service using OpenAI Whisper
"""
import os
from typing import List, Dict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import whisper
from rapidfuzz import fuzz
import tempfile
import urllib.request

app = FastAPI(title="Lyrics Sync Service")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Whisper model
MODEL_NAME = os.getenv("WHISPER_MODEL", "base")
print(f"Loading Whisper model: {MODEL_NAME}...")
model = whisper.load_model(MODEL_NAME)
print("✅ Whisper model loaded successfully")


class SyncRequest(BaseModel):
    audio_url: str
    lyrics: str
    language: str = "en"


class LyricLine(BaseModel):
    text: str
    start: float
    end: float
    confidence: float


class SyncResponse(BaseModel):
    lines: List[LyricLine]
    total_duration: float
    average_confidence: float


def download_audio(url: str) -> str:
    """Download audio file from URL to temp file"""
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
    urllib.request.urlretrieve(url, temp_file.name)
    return temp_file.name


def normalize_text(text: str) -> str:
    """Normalize text for matching"""
    return text.lower().strip()


def find_best_match(lyric_line: str, segments: List[Dict]) -> Dict:
    """
    Find best matching segment for a lyric line using fuzzy matching
    """
    lyric_normalized = normalize_text(lyric_line)

    best_match = None
    best_score = 0
    best_segment = None

    for segment in segments:
        segment_text = normalize_text(segment['text'])
        score = fuzz.ratio(lyric_normalized, segment_text)

        if score > best_score:
            best_score = score
            best_segment = segment

    if best_segment:
        return {
            'start': best_segment['start'],
            'end': best_segment['end'],
            'confidence': best_score / 100.0
        }

    # Return default if no match found
    return {
        'start': 0.0,
        'end': 0.0,
        'confidence': 0.0
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "service": "lyrics-sync"
    }


@app.post("/sync", response_model=SyncResponse)
async def sync_lyrics(request: SyncRequest):
    """
    Synchronize lyrics to audio using Whisper AI

    1. Download audio file
    2. Transcribe with Whisper to get word timestamps
    3. Match lyrics lines to transcription
    4. Return synced lyrics with timestamps
    """
    try:
        # Download audio
        print(f"Downloading audio from: {request.audio_url}")
        audio_path = download_audio(request.audio_url)

        # Transcribe with Whisper
        print(f"Transcribing audio (language: {request.language})...")
        result = model.transcribe(
            audio_path,
            language=request.language if request.language != "auto" else None,
            word_timestamps=True,
            verbose=False
        )

        # Clean up temp file
        os.unlink(audio_path)

        # Split lyrics into lines
        lyric_lines = [line.strip() for line in request.lyrics.split('\n') if line.strip()]

        print(f"Processing {len(lyric_lines)} lyric lines...")

        # Match each lyric line to transcription
        synced_lines = []
        total_confidence = 0

        for i, line in enumerate(lyric_lines):
            match = find_best_match(line, result['segments'])

            synced_lines.append(LyricLine(
                text=line,
                start=match['start'],
                end=match['end'],
                confidence=match['confidence']
            ))

            total_confidence += match['confidence']

            print(f"  Line {i+1}: {line[:50]}... -> {match['start']:.2f}s-{match['end']:.2f}s (conf: {match['confidence']:.2f})")

        # Calculate average confidence
        avg_confidence = total_confidence / len(synced_lines) if synced_lines else 0

        print(f"✅ Sync complete! Average confidence: {avg_confidence:.2f}")

        return SyncResponse(
            lines=synced_lines,
            total_duration=result['segments'][-1]['end'] if result['segments'] else 0,
            average_confidence=avg_confidence
        )

    except Exception as e:
        print(f"❌ Error during sync: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/transcribe")
async def transcribe_audio(audio_url: str, language: str = "en"):
    """
    Transcribe audio and return full transcription with timestamps
    Useful for debugging or getting raw transcription
    """
    try:
        # Download audio
        audio_path = download_audio(audio_url)

        # Transcribe
        result = model.transcribe(
            audio_path,
            language=language if language != "auto" else None,
            word_timestamps=True
        )

        # Clean up
        os.unlink(audio_path)

        return {
            "text": result['text'],
            "segments": result['segments'],
            "language": result['language']
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))

    print(f"""
    ╔═══════════════════════════════════════════════════╗
    ║                                                   ║
    ║   🤖 Lyrics Sync Service (Whisper AI)            ║
    ║                                                   ║
    ║   Model: {MODEL_NAME.ljust(42)}║
    ║   Port: {str(port).ljust(43)}║
    ║                                                   ║
    ╚═══════════════════════════════════════════════════╝
    """)

    uvicorn.run(app, host="0.0.0.0", port=port)
