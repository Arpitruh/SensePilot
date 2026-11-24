# SensePilot

Hear. See. Understand. Assist.

A local-first desktop meeting assistant for Windows and macOS, designed for consent-based transcription, screen analysis and meeting notes.

## Development

The initial core contains input validation and a local AI client. Desktop integration, native capture tests and signed installers are pending.

Requires Node.js 22+ and Ollama for local AI. Run `npm test` to test the core.

Use only meeting audio and screen content you are authorized to process. Share a selected presentation window to keep personal information private.

## Local file processing

Install Python dependencies with `python -m pip install -r requirements.txt` and download the vision model with `ollama pull gemma3:4b`.

For an authorized audio file, run `python scripts/transcribe.py meeting.wav --consent`. The output contains language and timestamped transcript segments. The Whisper model may require an initial download.

The `src/image-analysis.js` module accepts user-selected PNG and JPEG files with explicit consent. It uses the local Ollama runtime.

Desktop integration of these modules, live capture, native runtime tests and packaging are not yet complete.
