import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Server-side function that calls Google Translate's public endpoint.
// No API key required — uses the same endpoint the web translator uses.

const InputSchema = z.object({
  text: z.string().min(1).max(5000),
  sourceLang: z.string().min(1).max(10), // "auto" allowed
  targetLang: z.string().min(1).max(10),
});

type TranslateResult = {
  detectedLanguage: string;
  translatedText: string;
};

export const translateText = createServerFn({ method: "POST" })
  .inputValidator((d) => InputSchema.parse(d))
  .handler(async ({ data }): Promise<TranslateResult> => {
    const sl = data.sourceLang === "auto" ? "auto" : data.sourceLang;
    const url =
      `https://translate.googleapis.com/translate_a/single` +
      `?client=gtx&sl=${encodeURIComponent(sl)}` +
      `&tl=${encodeURIComponent(data.targetLang)}` +
      `&dt=t&q=${encodeURIComponent(data.text)}`;

    const resp = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; LanguageTranslationTool/1.0)",
      },
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("Google Translate error:", resp.status, errText);
      throw new Error("Translation service error");
    }

    // Response shape: [[[ "translated", "original", ... ], ...], null, "detectedLang", ...]
    const json: any = await resp.json();
    const segments: any[] = Array.isArray(json?.[0]) ? json[0] : [];
    const translatedText = segments
      .map((s) => (Array.isArray(s) ? s[0] : ""))
      .filter(Boolean)
      .join("");
    const detectedLanguage: string =
      typeof json?.[2] === "string" ? json[2] : data.sourceLang;

    if (!translatedText) throw new Error("Empty translation");
    return { detectedLanguage, translatedText };
  });
