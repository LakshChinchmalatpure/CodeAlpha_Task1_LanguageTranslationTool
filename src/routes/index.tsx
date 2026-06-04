import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftRight,
  Copy,
  Download,
  History,
  Languages,
  Mic,
  Moon,
  Sparkles,
  Sun,
  Trash2,
  Volume2,
  X,
} from "lucide-react";
import { translateText } from "@/lib/translate.functions";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Language Translation Tool" },
      {
        name: "description",
        content:
          "Fast, free language translation across 20+ languages, powered by Google Translate. Voice input, text-to-speech, history, and dark mode.",
      },
      { property: "og:title", content: "Language Translation Tool" },
      {
        property: "og:description",
        content: "Translate text across 20+ languages instantly.",
      },
    ],
  }),
  component: TranslatorPage,
});


// -------- Supported languages --------
const LANGUAGES: { code: string; name: string }[] = [
  { code: "auto", name: "Auto-detect" },
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "nl", name: "Dutch" },
  { code: "ru", name: "Russian" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "bn", name: "Bengali" },
  { code: "tr", name: "Turkish" },
  { code: "pl", name: "Polish" },
  { code: "sv", name: "Swedish" },
  { code: "vi", name: "Vietnamese" },
  { code: "th", name: "Thai" },
];

const MAX_CHARS = 5000;
const HISTORY_KEY = "ltt.translation.history.v1";
const THEME_KEY = "ltt.theme";

type HistoryItem = {
  id: string;
  at: number;
  source: string;
  target: string;
  original: string;
  translated: string;
  detected: string;
};


function TranslatorPage() {
  const translate = useServerFn(translateText);

  // ---- State ----
  const [text, setText] = useState("");
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("es");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    detectedLanguage: string;
    translatedText: string;
  } | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [dark, setDark] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // ---- Theme bootstrap ----
  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    const prefers =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const useDark = saved ? saved === "dark" : prefers;
    setDark(useDark);
    document.documentElement.classList.toggle("dark", useDark);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(THEME_KEY, next ? "dark" : "light");
  };

  // ---- History from localStorage ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const persistHistory = (next: HistoryItem[]) => {
    setHistory(next);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next.slice(0, 50)));
  };

  // ---- Handlers ----
  const handleTranslate = async () => {
    if (!text.trim()) {
      toast.error("Please enter some text to translate.");
      return;
    }
    if (sourceLang !== "auto" && sourceLang === targetLang) {
      toast.error("Source and target languages must differ.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await translate({
        data: { text: text.trim(), sourceLang, targetLang },
      });
      setResult(res);
      const item: HistoryItem = {
        id: crypto.randomUUID(),
        at: Date.now(),
        source: sourceLang,
        target: targetLang,
        original: text.trim(),
        translated: res.translatedText,
        detected: res.detectedLanguage,
      };
      persistHistory([item, ...history]);

    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Translation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () => {
    if (sourceLang === "auto") {
      toast.message("Pick a specific source language to swap.");
      return;
    }
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    if (result?.translatedText) {
      setText(result.translatedText);
      setResult(null);
    }
  };

  const handleClear = () => {
    setText("");
    setResult(null);
  };

  const handleCopy = async () => {
    if (!result?.translatedText) return;
    await navigator.clipboard.writeText(result.translatedText);
    toast.success("Translation copied!");
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob(
      [
        `Original (${result.detectedLanguage}):\n${text}\n\n` +
          `Translated (${targetLang}):\n${result.translatedText}\n`,
      ],
      { type: "text/plain;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `translation-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };


  const handleSpeak = () => {
    if (!result?.translatedText) return;
    if (!("speechSynthesis" in window)) {
      toast.error("Text-to-speech not supported in this browser.");
      return;
    }
    const utter = new SpeechSynthesisUtterance(result.translatedText);
    utter.lang = targetLang === "auto" ? "en" : targetLang;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  const handleVoiceInput = () => {
    const SR: any =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Voice input not supported in this browser.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const rec = new SR();
    rec.lang = sourceLang === "auto" ? "en-US" : sourceLang;
    rec.interimResults = false;
    rec.continuous = false;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => {
      setListening(false);
      toast.error("Voice recognition error.");
    };
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join(" ");
      setText((prev) => (prev ? prev + " " + transcript : transcript));
    };
    recognitionRef.current = rec;
    rec.start();
  };

  const charCount = text.length;
  const charPct = useMemo(
    () => Math.min(100, (charCount / MAX_CHARS) * 100),
    [charCount],
  );

  return (
    <div className="min-h-screen w-full">
      <Toaster richColors position="top-center" />

      {/* ---------- Header ---------- */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-hero shadow-glow grid h-11 w-11 place-items-center rounded-2xl">
            <Languages className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">
              <span className="text-gradient-hero">Language Translation</span> Tool
            </h1>
            <p className="text-muted-foreground text-xs">
              Fast multilingual translator
            </p>
          </div>

        </div>
        <div className="flex items-center gap-2">
          <IconButton
            onClick={() => setShowHistory((v) => !v)}
            label="History"
          >
            <History className="h-4 w-4" />
          </IconButton>
          <IconButton onClick={toggleTheme} label="Theme">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </IconButton>
        </div>
      </header>

      {/* ---------- Main ---------- */}
      <main className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        {/* Hero tagline */}
        <section className="mb-8 text-center sm:mb-12">
          <div className="border-border bg-card/60 mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs backdrop-blur">
            <Sparkles className="h-3 w-3" />
            Powered by Google Translate
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Translate anything,{" "}
            <span className="text-gradient-hero">understand everything</span>
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-xl text-sm sm:text-base">
            Instant translations across 20+ languages, with speech and voice input.
          </p>
        </section>


        {/* Language selectors */}
        <div className="bg-card/60 border-border mb-4 grid grid-cols-1 items-center gap-2 rounded-2xl border p-3 backdrop-blur sm:grid-cols-[1fr_auto_1fr]">
          <LangSelect
            value={sourceLang}
            onChange={setSourceLang}
            label="From"
          />
          <button
            onClick={handleSwap}
            className="hover:bg-accent/30 mx-auto grid h-10 w-10 place-items-center rounded-full transition"
            aria-label="Swap languages"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>
          <LangSelect
            value={targetLang}
            onChange={setTargetLang}
            label="To"
            excludeAuto
          />
        </div>

        {/* Editor grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Input */}
          <Panel>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                Original text
              </span>
              <div className="flex items-center gap-1">
                <IconButton onClick={handleVoiceInput} label="Voice input">
                  <Mic
                    className={`h-4 w-4 ${listening ? "text-destructive animate-pulse" : ""}`}
                  />
                </IconButton>
                <IconButton onClick={handleClear} label="Clear">
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </div>
            </div>
            <textarea
              value={text}
              onChange={(e) =>
                setText(e.target.value.slice(0, MAX_CHARS))
              }
              placeholder="Type, paste, or speak text to translate…"
              className="placeholder:text-muted-foreground/60 h-56 w-full resize-none bg-transparent text-base outline-none"
            />
            <div className="flex items-center gap-3">
              <div className="bg-muted h-1 flex-1 overflow-hidden rounded-full">
                <div
                  className="bg-gradient-hero h-full transition-all"
                  style={{ width: `${charPct}%` }}
                />
              </div>
              <span className="text-muted-foreground text-xs tabular-nums">
                {charCount}/{MAX_CHARS}
              </span>
            </div>
          </Panel>

          {/* Output */}
          <Panel>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                Translation
              </span>
              <div className="flex items-center gap-1">
                <IconButton onClick={handleSpeak} label="Speak">
                  <Volume2 className="h-4 w-4" />
                </IconButton>
                <IconButton onClick={handleCopy} label="Copy">
                  <Copy className="h-4 w-4" />
                </IconButton>
                <IconButton onClick={handleDownload} label="Download">
                  <Download className="h-4 w-4" />
                </IconButton>
              </div>
            </div>
            <div className="h-56 overflow-auto text-base">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="flex gap-2">
                    <span className="lov-dot bg-primary h-3 w-3 rounded-full" />
                    <span className="lov-dot bg-accent h-3 w-3 rounded-full" />
                    <span
                      className="lov-dot h-3 w-3 rounded-full"
                      style={{ background: "var(--glow)" }}
                    />
                  </div>
                </div>
              ) : result ? (
                <p className="whitespace-pre-wrap">{result.translatedText}</p>
              ) : (
                <p className="text-muted-foreground/60">
                  Your translation will appear here…
                </p>
              )}
            </div>
            <div className="h-1" />
          </Panel>
        </div>

        {/* Translate button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleTranslate}
            disabled={loading || !text.trim()}
            className="bg-gradient-hero shadow-glow inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold text-white transition hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {loading ? "Translating…" : "Translate"}
          </button>
        </div>

        {/* Detected language info */}
        {result && (
          <div className="mt-8 grid grid-cols-1 gap-4">
            <InsightCard label="Detected language" value={result.detectedLanguage} />
          </div>
        )}

      </main>

      {/* ---------- History Drawer ---------- */}
      {showHistory && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setShowHistory(false)}
        >
          <aside
            className="bg-card border-border absolute right-0 top-0 h-full w-full max-w-md overflow-auto border-l p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">History</h3>
              <div className="flex items-center gap-1">
                {history.length > 0 && (
                  <button
                    onClick={() => persistHistory([])}
                    className="text-muted-foreground hover:text-destructive text-xs"
                  >
                    Clear all
                  </button>
                )}
                <IconButton
                  onClick={() => setShowHistory(false)}
                  label="Close"
                >
                  <X className="h-4 w-4" />
                </IconButton>
              </div>
            </div>
            {history.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No translations yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {history.map((h) => (
                  <li
                    key={h.id}
                    className="border-border hover:border-primary/40 cursor-pointer rounded-xl border p-3 transition"
                    onClick={() => {
                      setText(h.original);
                      setSourceLang(h.source);
                      setTargetLang(h.target);
                      setResult({
                        detectedLanguage: h.detected,
                        translatedText: h.translated,
                      });
                      setShowHistory(false);
                    }}

                  >
                    <div className="text-muted-foreground mb-1 flex items-center justify-between text-[11px] uppercase tracking-wider">
                      <span>
                        {h.source} → {h.target}
                      </span>
                      <span>{new Date(h.at).toLocaleString()}</span>
                    </div>
                    <p className="line-clamp-2 text-sm">{h.original}</p>
                    <p className="text-primary mt-1 line-clamp-2 text-sm">
                      {h.translated}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      )}

      <footer className="text-muted-foreground border-border/50 mx-auto max-w-6xl border-t px-4 py-6 text-center text-xs sm:px-6">
        Language Translation Tool · Google Translate · TanStack Start
      </footer>

    </div>
  );
}

// ---------- Small UI primitives ----------

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gradient-card border-border shadow-glow flex flex-col gap-3 rounded-2xl border p-4 backdrop-blur">
      {children}
    </div>
  );
}

function IconButton({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="border-border bg-card/70 hover:bg-accent/30 grid h-9 w-9 place-items-center rounded-full border transition"
    >
      {children}
    </button>
  );
}

function LangSelect({
  value,
  onChange,
  label,
  excludeAuto,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  excludeAuto?: boolean;
}) {
  const opts = excludeAuto
    ? LANGUAGES.filter((l) => l.code !== "auto")
    : LANGUAGES;
  return (
    <label className="flex items-center gap-3 rounded-xl px-3 py-2">
      <span className="text-muted-foreground w-10 text-xs uppercase tracking-wider">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-input w-full cursor-pointer rounded-lg border-none px-3 py-2 text-sm outline-none"
      >
        {opts.map((l) => (
          <option key={l.code} value={l.code}>
            {l.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function InsightCard({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="bg-card/70 border-border rounded-2xl border p-4 backdrop-blur">
      <div className="text-muted-foreground mb-2 text-[11px] font-medium uppercase tracking-wider">
        {label}
      </div>
      <p
        className={`text-sm leading-relaxed ${muted ? "text-muted-foreground italic" : ""}`}
      >
        {muted ? "No corrections needed." : value}
      </p>
    </div>
  );
}
