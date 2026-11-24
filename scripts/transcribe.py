"""Transcribe an audio file supplied by an authorized user."""
import argparse
import json
from pathlib import Path

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("audio", type=Path)
    parser.add_argument("--consent", action="store_true")
    args = parser.parse_args()
    if not args.consent:
        parser.error("Permission to process the audio is required.")
    if not args.audio.is_file():
        parser.error("Choose an existing audio file.")
    from faster_whisper import WhisperModel
    model = WhisperModel("base", device="cpu", compute_type="int8")
    segments, info = model.transcribe(str(args.audio), vad_filter=True)
    print(json.dumps({"language": info.language, "segments": [
        {"start": s.start, "end": s.end, "text": s.text.strip()} for s in segments
    ]}, ensure_ascii=False))

if __name__ == "__main__":
    main()
