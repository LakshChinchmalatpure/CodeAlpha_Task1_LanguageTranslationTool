import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Server-side function calling Lovable AI Gateway (Gemini) for translation.
// Returns corrected source text, translation, and an explanation.

const InputSchema = z.object({
  text: z.string().min(1).max(5000),
  sourceLang: z.string().min(1).max(50), // "auto" allowed
  targetLang: z.string().min(1).max(50),
});

type TranslateResult = {
  detectedLanguage: string;
  correctedText: string;
  translatedText: string;
  explanation: string;
};

export const translateText = createServerFn({ method: "POST" })
  .inputValidator((d) => InputSchema.parse(d))
  .handler(async ({ data }): Promise<TranslateResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert multilingual translator and language assistant.
You will receive text in a source language and translate it to a target language.
Steps:
1. Detect the language of the input (or use the provided source language if not "auto").
2. Correct any grammar or spelling mistakes in the original text (keep meaning).
3. Translate the corrected text into the target language naturally and fluently.
4. Provide a short explanation (2-4 sentences) about notable linguistic choices,
   idioms, tone, or cultural notes a learner would benefit from.
Always respond ONLY by calling the provided tool.`;

    const userPrompt = `Source language: ${data.sourceLang}
Target language: ${data.targetLang}
Text:
"""${data.text}"""`;

    const body = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "return_translation",
            description: "Return structured translation result.",
            parameters: {
              type: "object",
              properties: {
                detectedLanguage: { type: "string" },
                correctedText: { type: "string" },
                translatedText: { type: "string" },
                explanation: { type: "string" },
              },
              required: [
                "detectedLanguage",
                "correctedText",
                "translatedText",
                "explanation",
              ],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: {
        type: "function",
        function: { name: "return_translation" },
      },
    };

    const resp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    if (!resp.ok) {
      if (resp.status === 429) {
        throw new Error("Rate limit exceeded. Please try again shortly.");
      }
      if (resp.status === 402) {
        throw new Error(
          "AI credits exhausted. Please add credits to your Lovable workspace.",
        );
      }
      const errText = await resp.text();
      console.error("AI gateway error:", resp.status, errText);
      throw new Error("Translation service error");
    }

    const json = await resp.json();
    const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("Malformed AI response");
    }

    const parsed = JSON.parse(toolCall.function.arguments) as TranslateResult;
    return parsed;
  });
