# Language Translation Tool

A modern web app that translates text across 20+ languages using the **Google Translate** public endpoint. No API key required.

## Features

- 20+ languages with auto-detect
- Swap source/target languages
- Text-to-speech (Web Speech API)
- Voice input (Speech Recognition API)
- Copy & download translation as `.txt`
- Translation history (localStorage)
- Dark / light mode

## How it works

The frontend (React + TanStack Start) calls a server function (`src/lib/translate.functions.ts`) that proxies the request to Google Translate's public endpoint, so no API key is exposed to the browser.

## Project structure

```
src/
├── lib/translate.functions.ts   # Server function — calls Google Translate
├── routes/
│   ├── __root.tsx               # Root layout
│   └── index.tsx                # Main translator UI
└── styles.css                   # Design system
```

## Run locally

```bash
bun install
bun run dev
```
