/**
 * Opencode Provider Plugin for Unsloth
 * 
 * Connects opencode to local Unsloth model serving via OpenAI-compatible API.
 * 
 * Usage:
 *   # Start Unsloth server on port 8888 first (e.g., via `unsloth studio start --port 8888`)
 *   # Default endpoint: http://localhost:8888/v1
 *   
 *   # Register this provider in opencode
 *   opencode plugin ./path/to/llm-provider-unsloth/packages/opencode
 *   
 *   # Then configure via:
 *   /connect unsloth   # Set base_url and api_key
 *   /models            # Fetch available models
 */

// Define minimal interface for the Opencode provider API we actually use
interface UnslothProviderAPI {
  registerProvider: (
    id: string,
    opts: {
      name: string;
      baseUrl: string;
      apiKey: string;
      api: "openai-completions";
      models: Array<{
        id: string;
        name?: string;
        reasoning?: boolean;
        input: readonly ["text"];
        cost: { input: number; output: number; cacheRead: number; cacheWrite: number };
        contextWindow: number;
        maxTokens: number;
      }>;
    }
  ) => void;
}

const DEFAULT_BASE_URL = "http://localhost:8888/v1";

// Common models that work well with Unsloth fine-tuning
const COMMON_MODELS = [
  // Qwen series
  { id: "Qwen/Qwen2.5-7B-Instruct", name: "Qwen 2.5 7B Instruct" },
  { id: "Qwen/Qwen2.5-14B-Instruct", name: "Qwen 2.5 14B Instruct" },
  { id: "Qwen/Qwen2.5-32B-Instruct", name: "Qwen 2.5 32B Instruct" },
  { id: "Qwen/Qwen2.5-Coder-7B-Instruct", name: "Qwen 2.5 Coder 7B Instruct" },
  { id: "Qwen/Qwen2.5-Coder-14B-Instruct", name: "Qwen 2.5 Coder 14B Instruct" },

  // Llama series
  { id: "meta-llama/Llama-3.2-3B-Instruct", name: "Llama 3.2 3B Instruct" },
  { id: "meta-llama/Llama-3.2-8B-Instruct", name: "Llama 3.2 8B Instruct" },
  { id: "meta-llama/Llama-3.1-8B-Instruct", name: "Llama 3.1 8B Instruct" },
  { id: "meta-llama/Llama-3.1-70B-Instruct", name: "Llama 3.1 70B Instruct" },

  // Gemma series
  { id: "google/gemma-2-9b-it", name: "Gemma 2 9B IT" },
  { id: "google/gemma-2-27b-it", name: "Gemma 2 27B IT" },

  // Mistral series
  { id: "mistralai/Mistral-7B-Instruct-v0.3", name: "Mistral 7B Instruct v0.3" },
  { id: "mistralai/Mixtral-8x7B-Instruct-v0.1", name: "Mixtral 8x7B Instruct v0.1" },

  // DeepSeek series
  { id: "deepseek-ai/DeepSeek-Coder-V2-Lite-Instruct", name: "DeepSeek Coder V2 Lite Instruct" },

  // Phi series
  { id: "microsoft/Phi-3-mini-4k-instruct", name: "Phi-3 Mini 4K Instruct" },
];

// Model defaults for Unsloth models
function createModelConfig(modelId: string, displayName?: string) {
  return {
    id: modelId,
    name: displayName ?? modelId.split("/").pop() ?? modelId,
    reasoning: false,
    input: ["text"] as const,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 131072,
    maxTokens: 8192,
  };
}

// Dynamically discover models from the Unsloth server
async function discoverModels(baseUrl: string): Promise<Record<string, any>[]> {
  try {
    const response = await fetch(`${baseUrl}/models`);
    if (!response.ok) return [];
    const data = (await response.json()) as { data?: Array<{ id: string }> };
    if (!data.data || !Array.isArray(data.data)) return [];
    return data.data.map((m) => createModelConfig(m.id));
  } catch {
    return [];
  }
}

export default async function (opencode: UnslothProviderAPI) {
  const baseUrl = process.env.UNSLOTH_BASE_URL ?? DEFAULT_BASE_URL;

  // Try to discover models from the running Unsloth server
  const discoveredModels = await discoverModels(baseUrl);

  // Use discovered models if available, otherwise fall back to common models
  const models = discoveredModels.length > 0 
    ? discoveredModels 
    : COMMON_MODELS.map((m) => createModelConfig(m.id, m.name));

  opencode.registerProvider("unsloth", {
    name: "Unsloth (Local)",
    baseUrl,
    apiKey: "unsloth-remote", // Local server doesn't need a real API key
    api: "openai-completions" as const,
    models,
  });

  console.log(`[opencode-unsloth] Provider registered at ${baseUrl}`);
  console.log(`[opencode-unsloth] Available models: ${models.length}`);
}