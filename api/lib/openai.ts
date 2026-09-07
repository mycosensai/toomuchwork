/**
 * LLM Provider — Nous Research inference (Hermes API key), OpenAI-compatible.
 *
 * Every Vault agent routes through here. Operator policy (2026-09-07):
 *   - ALL agents use upstage/solar-pro4:free (via Nous portal).
 *   - EXCEPTIONS: Appraisal and ProVerify use Google Gemini flash
 *     (google/gemini-3.7-flash) — multimodal, so image verification works.
 *   - The fallback pool keeps a resilient trail behind any preferred model.
 *
 * Falls back across the pool so a single retired/rate-limited model never
 * breaks a feature.
 */

import { env } from "./env";

export const NOUS_BASE_URL = "https://inference-api.nousresearch.com/v1";

// upstage/solar-pro4:free — every general agent (operator policy 2026-09-07)
export const DEEPSEEK_FLASH_MODEL = "upstage/solar-pro4:free";

// DeepSeek v4 pro — Pricing Intelligence (operator: keep pro where pro was
// already implemented; ALL calls still via the Nous portal API).
export const DEEPSEEK_PRO_MODEL = "deepseek/deepseek-v4-pro-0813";

// Gemini flash (Nous-proxied, multimodal) — Appraisal + ProVerify exceptions
export const GEMINI_FLASH_MODEL = "google/gemini-3.7-flash";

// General agents — default via Nous Research portal (Hermes `model.default`)
export const AGENT_MODEL = DEEPSEEK_FLASH_MODEL;

// Appraisal — Gemini flash (text AND image appraisals; multimodal)
export const APPRAISAL_MODEL = GEMINI_FLASH_MODEL;

// ProVerify Engine — Gemini flash (vision-capable image verification)
export const PROVERIFY_MODEL = GEMINI_FLASH_MODEL;

// Logistics agent — DeepSeek v4 flash
export const LOGISTICS_MODEL = DEEPSEEK_FLASH_MODEL;

// Pricing Intelligence — DeepSeek v4 pro (was pro before 2026-09-07; restored)
export const PRICING_MODEL = DEEPSEEK_PRO_MODEL;

// Generic multimodal fallback (no current callers since appraisal moved to Gemini).
export const VISION_MODEL = "stepfun/step-3.7-flash:free";

// Resilient fallback pool (DeepSeek v4 first; the rest are verified Nous slugs).
const FREE_MODELS = [
  "deepseek/deepseek-v4-flash-0731",
  "stepfun/step-3.7-flash:free",
  "meituan/longcat-2.0:free",
];

// ─── Types ───
export interface LLMMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
}

export interface LLMRequest {
  model?: string;
  messages: LLMMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  response_format?: { type: "json_object" | "text" };
  tools?: Array<{
    type: "function";
    function: {
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    };
  }>;
  tool_choice?: "auto" | "none" | { type: "function"; function: { name: string } };
}

export interface LLMResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: LLMMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

function getApiConfig() {
  // ALL agent LLM calls go through the Nous portal API (inference-api.nousresearch.com)
  // with the Nous access token. No OpenRouter/OpenAI fallback — Nous is canonical.
  const key = env.nousApiKey;
  const baseUrl = env.nousBaseUrl; // getter defaults to inference-api.nousresearch.com/v1

  if (!key || key.length < 10) {
    throw new Error("NOUS_API_KEY not configured. Set it in Cloudflare Pages secrets.");
  }
  return { key, baseUrl };
}

// hy3 returns chain-of-thought in a `reasoning` field and supports
// `reasoning_effort`. Disable reasoning for agent calls to keep latency/tokens
// down (it is still a strong model without it).
function withReasoningEffort(body: Record<string, unknown>, model: string): Record<string, unknown> {
  if (model.includes("hy3")) {
    return { ...body, reasoning_effort: "none" };
  }
  return body;
}

function getModelTryOrder(preferred: string): string[] {
  const pool = FREE_MODELS;
  const idx = pool.indexOf(preferred);
  // Preferred model ALWAYS leads, even when it is not in the pool (e.g.
  // Gemini for appraisal/proverify). Pool models trail as fallback so a
  // retired/rate-limited preferred model never breaks a feature.
  if (idx === 0) return [...pool];
  if (idx > 0) return [preferred, ...pool.slice(0, idx), ...pool.slice(idx + 1)];
  return [preferred, ...pool];
}

async function chatCompletionWithFallback(
  baseUrl: string,
  key: string,
  body: Record<string, unknown>,
  models: string[],
) {
  let lastError = "";
  for (const model of models) {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "HTTP-Referer": "https://thevaultdfw.win",
        "X-Title": "The Vault DFW",
      },
      body: JSON.stringify(withReasoningEffort({ ...body, model }, model)),
    });
    if (res.ok) return res;
    const status = res.status;
    const text = await res.text();
    lastError = `model ${model} -> ${status}: ${text.slice(0, 200)}`;
    if (status === 401) {
      throw new Error(`LLM API error ${status}: ${text}`);
    }
    // 404 retired / 429 rate-limited -> try next model
  }
  throw new Error(`All LLM models failed. Last error: ${lastError}`);
}

// ─── Chat (text generation with model fallback) ───
export async function openaiChat(request: LLMRequest): Promise<LLMResponse> {
  const { key, baseUrl } = getApiConfig();
  const preferred = request.model || AGENT_MODEL;
  const models = getModelTryOrder(preferred);

  const res = await chatCompletionWithFallback(
    baseUrl,
    key,
    {
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.max_tokens ?? 4096,
      top_p: request.top_p ?? 1,
      ...(request.response_format ? { response_format: request.response_format } : {}),
      ...(request.tools ? { tools: request.tools } : {}),
      ...(request.tool_choice ? { tool_choice: request.tool_choice } : {}),
    },
    models,
  );

  return (await res.json()) as LLMResponse;
}

// ─── Streaming chat (with model fallback) ───
export async function openaiChatStream(
  request: LLMRequest,
  onChunk: (text: string, done: boolean) => void,
): Promise<void> {
  const { key, baseUrl } = getApiConfig();
  const preferred = request.model || AGENT_MODEL;
  const models = getModelTryOrder(preferred);

  const body = {
    messages: request.messages,
    temperature: request.temperature ?? 0.7,
    max_tokens: request.max_tokens ?? 4096,
    stream: true,
    ...(request.response_format ? { response_format: request.response_format } : {}),
  };

  let lastError = "";
  for (const model of models) {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "HTTP-Referer": "https://thevaultdfw.win",
        "X-Title": "The Vault DFW",
      },
      body: JSON.stringify(withReasoningEffort({ ...body, model }, model)),
    });

    if (!res.ok) {
      const status = res.status;
      const text = await res.text();
      lastError = `model ${model} -> ${status}: ${text.slice(0, 200)}`;
      if (status === 401) {
        throw new Error(`LLM API error ${status}: ${text}`);
      }
      continue;
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        onChunk("", true);
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (trimmed.startsWith("data: ")) {
          try {
            const json = JSON.parse(trimmed.slice(6));
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) onChunk(delta, false);
          } catch {
            // ignore parse errors in stream
          }
        }
      }
    }
  }

  throw new Error(`All LLM models failed. Last error: ${lastError}`);
}

// ─── Structured output (JSON mode) ───
export async function openaiStructured<T>(
  request: Omit<LLMRequest, "response_format">,
): Promise<{ result: T; usage: LLMResponse["usage"] }> {
  const response = await openaiChat({
    ...request,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(content) as T;
    return { result: parsed, usage: response.usage };
  } catch {
    throw new Error(`LLM returned invalid JSON: ${content.slice(0, 200)}`);
  }
}

// ─── Vision API ───
export async function openaiVision(
  imageUrl: string,
  prompt: string,
  model?: string,
): Promise<string> {
  const visionModel = model || VISION_MODEL;

  const response = await openaiChat({
    model: visionModel,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageUrl } },
        ] as unknown as string,
      },
    ],
    max_tokens: 4096,
  });

  return response.choices[0]?.message?.content ?? "";
}

// ─── Helpers: model names ───
export function getActiveModels() {
  return {
    text: AGENT_MODEL,
    vision: VISION_MODEL,
    provverify: PROVERIFY_MODEL,
    appraisal: APPRAISAL_MODEL,
  };
}
