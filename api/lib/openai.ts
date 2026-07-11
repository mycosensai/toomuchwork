/**
 * LLM Provider — OpenRouter-backed with free model rotation
 * Uses env.openaiApiKey + env.openaiBaseUrl (set to https://openrouter.ai/api/v1)
 * 
 * Model Rotation: picks a different free model every 6 hours
 * from the FREE_MODELS list. Image appraisal uses VISION_MODELS separately.
 */
import { env } from "./env";

// ─── Free models on OpenRouter ───
// NOTE: Free models are rotated by the upstream provider frequently. If a
// model in this list is retired it returns a 404 at request time. The chat
// helpers below fall back across the WHOLE pool so one dead model never
// breaks the feature — they try every remaining model before failing.
// Verified against the live OpenRouter catalog. Ordered by observed
// availability: the first two responded 200 during setup; the rest are real
// slugs kept as fallback depth (they float between 200/429 as capacity
// rotates). Re-verify with `GET /api/v1/models` if chats start 404-ing.
const FREE_MODELS = [
  "openai/gpt-oss-20b:free",
  "google/gemma-4-26b-a4b-it:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "google/gemma-4-31b-it:free",
  "meta-llama/llama-3.2-3b-instruct:free",
];

const VISION_MODELS = [
  "nvidia/nemotron-nano-12b-v2-vl:free",
  "openai/gpt-oss-20b:free",
  "google/gemma-4-31b-it:free",
];

// ─── Model selection ───
function getCurrentModel(): string {
  const hours = Math.floor(Date.now() / 1000 / 3600);
  const index = hours % FREE_MODELS.length; // rotates every 6h split across 5 models = every 6h change
  const sixHourBlock = Math.floor(hours / 6);
  return FREE_MODELS[sixHourBlock % FREE_MODELS.length];
}

function getVisionModel(): string {
  const hours = Math.floor(Date.now() / 1000 / 3600);
  const index = Math.floor(hours / 6) % VISION_MODELS.length;
  return VISION_MODELS[index];
}

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
  const key = env.openaiApiKey;
  const baseUrl = env.openaiBaseUrl || "https://openrouter.ai/api/v1";
  
  if (!key || key.length < 10) {
    throw new Error("OPENAI_API_KEY not configured. Set it in Cloudflare Pages secrets.");
  }
  return { key, baseUrl };
}

// Build the ordered list of models to try. Start with the rotated pick, then
// every other model in the pool. This guarantees fallback across ALL models
// when one is retired upstream (common with free tiers).
function getModelTryOrder(preferred: string): string[] {
  const pool = FREE_MODELS;
  const idx = pool.indexOf(preferred);
  if (idx <= 0) return [...pool];
  return [preferred, ...pool.slice(0, idx), ...pool.slice(idx + 1)];
}

// Shared fetch with cross-model fallback. Returns the raw Response on the
// first model that returns a non-error (2xx). Throws a consolidated error
// only if every model in the pool failed.
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
      body: JSON.stringify({ ...body, model }),
    });
    if (res.ok) return res;
    // Auth failure (401) is fatal — it would repeat for every model.
    // Model-availability (404) and rate-limit (429) errors fall through to
    // the next model: OpenRouter free models route through different upstream
    // providers with independent limits, so another model may have capacity.
    const status = res.status;
    const text = await res.text();
    lastError = `model ${model} -> ${status}: ${text.slice(0, 200)}`;
    if (status === 401) {
      throw new Error(`LLM API error ${status}: ${text}`);
    }
    // otherwise (404 retired / 429 rate-limited) fall through to next model
  }
  throw new Error(`All LLM models failed. Last error: ${lastError}`);
}

// ─── Chat (text generation with model rotation + fallback) ───
export async function openaiChat(request: LLMRequest): Promise<LLMResponse> {
  const { key, baseUrl } = getApiConfig();
  const preferred = request.model || getCurrentModel();
  const models = getModelTryOrder(preferred);

  const res = await chatCompletionWithFallback(baseUrl, key, {
    messages: request.messages,
    temperature: request.temperature ?? 0.7,
    max_tokens: request.max_tokens ?? 4096,
    top_p: request.top_p ?? 1,
    ...(request.response_format ? { response_format: request.response_format } : {}),
    ...(request.tools ? { tools: request.tools } : {}),
    ...(request.tool_choice ? { tool_choice: request.tool_choice } : {}),
  }, models);

  return res.json() as Promise<LLMResponse>;
}

// ─── Streaming chat (with cross-model fallback) ───
export async function openaiChatStream(
  request: LLMRequest,
  onChunk: (text: string, done: boolean) => void,
): Promise<void> {
  const { key, baseUrl } = getApiConfig();
  const preferred = request.model || getCurrentModel();
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
      body: JSON.stringify({ ...body, model }),
    });

    // A non-OK that looks like a retired/unavailable model: try the next one.
    // Auth failure (401) is fatal. Model-availability (404) and rate-limit
    // (429) errors fall through so another model can be tried.
    if (!res.ok) {
      const status = res.status;
      const text = await res.text();
      lastError = `model ${model} -> ${status}: ${text.slice(0, 200)}`;
      if (status === 401) {
        throw new Error(`LLM API error ${status}: ${text}`);
      }
      continue; // model retired/429 -> fall through to next model
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

// ─── Vision API (uses separate vision model, for appraisals) ───
export async function openaiVision(
  imageUrl: string,
  prompt: string,
  model?: string,
): Promise<string> {
  const { key, baseUrl } = getApiConfig();
  const visionModel = model || getVisionModel();

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

// ─── Helper: get current model names ───
export function getActiveModels() {
  return {
    text: getCurrentModel(),
    vision: getVisionModel(),
  };
}
