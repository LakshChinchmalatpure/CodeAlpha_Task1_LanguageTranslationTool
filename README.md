# Aurora — AI-Powered Multilingual Language Translator & Assistant

A modern web app that translates text across 20 languages using Google's Gemini AI (via the Lovable AI Gateway). It also corrects grammar, explains the translation, speaks the result aloud, and accepts voice input.

## ✨ Features

- 🌍 AI translation across 20 languages
- 🔍 Auto language detection
- ✍️ Grammar correction before translation
- 💡 AI-generated explanation of the translation
- 🔊 Text-to-Speech for translated output
- 🎙️ Voice input via the Web Speech Recognition API
- 📋 Copy, ⬇️ download as `.txt`, 🔁 swap languages, 🧹 clear
- 🕘 Translation history (saved to Local Storage)
- 🌗 Dark / Light mode toggle
- 📏 Character counter with progress bar
- ⚡ Loading animation + friendly error toasts

## 🧠 How it works

1. The UI (React + TanStack Start) collects text, source, and target language.
2. A **server function** (`src/lib/translate.functions.ts`) calls the **Lovable AI Gateway** (`https://ai.gateway.lovable.dev/v1/chat/completions`) with the Gemini model.
3. The model returns a structured JSON response: detected language, corrected text, translated text, and an explanation.
4. The frontend renders all four and saves the entry to Local Storage history.

The API key (`LOVABLE_API_KEY`) is provided automatically by Lovable Cloud — no manual setup required.

## 🗂️ Project structure

```
src/
├── routes/
│   ├── __root.tsx         # App shell
│   └── index.tsx          # Translator UI (single page)
├── lib/
│   └── translate.functions.ts  # Server function calling Gemini
├── styles.css             # Design system (Aurora theme)
└── components/ui/         # shadcn primitives (toaster, etc.)
```

## 🚀 Run it

This is a Lovable project — open the preview and start translating. To run locally:

```bash
bun install
bun run dev
```

## 🔐 Notes

- All AI calls go through a server function. The API key is never exposed to the browser.
- History is stored in the user's browser via `localStorage` only.
