# Language Translation Tool with AI


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

Installation

''' In the Command prompt '''

Clone the repository:

git clone https://github.com/LakshChinchmalatpure/CodeAlpha_Task1_LanguageTranslationTool.git

cd CodeAlpha_Task1_LanguageTranslationTool

Install dependencies:

bun install

Run the project:

bun run dev

Open in your browser:
http://localhost:8080

Technologies Used:
React
Vite
TypeScript
Tailwind CSS
Google Translate API

Author:
Laksh Chinchmalatpure
