# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A web application that uses Chrome's on-device Gemini Nano model (via the Prompt API) to check Japanese SNS (social media) posts for potential issues. The app performs content checking for inappropriate expressions, privacy risks, readability, and tone.

## Architecture

**Backend (server.js)**
- Simple Express server that serves static files from the `docs/` directory
- Runs on port 3000 by default

**Frontend (docs/)**
- `index.html`: Main UI with chat interface
- `app.js`: Client-side logic that interfaces with Chrome's on-device Language Model API
- Uses DOMPurify for sanitization and marked.js for markdown rendering

**AI Integration**
- Uses Chrome's experimental Prompt API with Gemini Nano
- Requires specific Chrome flags to be enabled (see Setup section)
- Model runs entirely on-device (no external API calls)
- System prompt in `app.js:6-22` defines SNS content checking behavior in Japanese

## Development Commands

**Install dependencies:**
```bash
npm i
```

**Run the development server:**
```bash
node server.js
```
The app will be available at http://localhost:3000

## Chrome Setup Required

Before running, enable these Chrome flags:

1. `chrome://flags/#optimization-guide-on-device-model` → Enabled
2. `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` → Enabled

After enabling flags, restart Chrome and the app will download the Gemini Nano model on first use.

## Key Implementation Details

**Language Model Session Management**
- Session initialization happens in `app.js:90-113` via `LanguageModel.create()`
- System prompt configures the model as an SNS content checker
- Language is set to Japanese (`LANGUAGE = 'ja'`)

**Streaming Responses**
- Uses `session.promptStreaming()` for real-time response rendering (app.js:64-70)
- Responses are rendered as markdown with sanitization

**Model Availability States**
- `unavailable`: Browser doesn't support the API
- `available`: Model is ready to use
- `after-download`: Model needs to be downloaded first (shows "Initialize the model" button)
