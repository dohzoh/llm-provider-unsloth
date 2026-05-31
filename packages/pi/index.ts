/**
 * Pi Provider Plugin for Unsloth
 *
 * Connects pi to local Unsloth model serving via OpenAI-compatible API.
 *
 * Usage:
 *   # Start Unsloth server first (e.g., via `unsloth studio start` or the Python SDK)
 *
 *   # Option 1: Use the interactive /unsloth-login command
 *   pi -e ./path/to/pi-provider-unsloth
 *   /unsloth-login
 *
 *   # Option 2: Configure via environment variable
 *   UNSLOTH_BASE_URL=http://192.168.x.x:8000/v1 pi -e ./path/to/pi-provider-unsloth
 *
 *   # Option 3: Add to ~/.pi/agent/models.json as a custom provider:
 *   # {
 *   #   "providers": {
 *   #     "unsloth": {
 *   #       "baseUrl": "http://localhost:8000/v1",
 *   #       "api": "openai-completions",
 *   #       "apiKey": "unsloth-remote",
 *   #       "models": [
 *   #         { "id": "<your-model-id>" }
 *   #       ]
 *   #     }
 *   #   }
 *   # }
 */

import { join } from "path";
import { readFileSync, writeFileSync, existsSync } from "fs";

// Define minimal interface for the Pi provider API we actually use
interface PiProviderAPI {
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
  registerCommand: (
    name: string,
    opts: {
      description: string;
      handler: (args: string, ctx: ExtensionCommandContext) => Promise<void>;
    }
  ) => void;
}

// Extension context types
interface ExtensionCommandContext {
  ui: {
    select: (title: string, options: string[], opts?: { timeout?: number }) => Promise<string | undefined>;
    input: (title: string, placeholder?: string, opts?: { timeout?: number }) => Promise<string | undefined>;
    notify: (message: string, type?: "info" | "warning" | "error") => void;
  };
  modelRegistry: {
    refresh: () => void;
  };
  sessionManager: {
    cwd: string;
  };
  cwd: string;
}

const DEFAULT_BASE_URL = "http://localhost:8000/v1";

// Config file path
function getConfigPath(cwd: string): string {
  return join(cwd, ".pi-unsloth-config.json");
}

// Config types
interface UnslothConfig {
  baseUrl: string;
  apiKey: string;
  model?: string;
}

// Load saved config
function loadConfig(cwd: string): UnslothConfig | null {
  try {
    const configPath = getConfigPath(cwd);
    if (existsSync(configPath)) {
      return JSON.parse(readFileSync(configPath, "utf-8"));
    }
  } catch {}
  return null;
}

// Save config
function saveConfig(cwd: string, config: UnslothConfig): void {
  try {
    const configPath = getConfigPath(cwd);
    writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
  } catch (e) {
    console.error("[pi-unsloth] Failed to save config:", e);
  }
}

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

// Register the /unsloth-login command
function registerUnslothLoginCommand(pi: PiProviderAPI, defaultBaseUrl: string) {
  pi.registerCommand("unsloth-login", {
    description: "Configure and connect to a local Unsloth server",
    handler: async (args: string, ctx: ExtensionCommandContext) => {
      // Parse arguments (optional: can pass baseUrl directly like /unsloth-login http://192.168.1.100:8000/v1)
      const argBaseUrl = args.trim() || "";

      // Step 1: Get base URL (from args, saved config, or ask user)
      let baseUrl: string;
      if (argBaseUrl) {
        baseUrl = argBaseUrl;
      } else {
        const savedConfig = loadConfig(ctx.cwd);
        if (savedConfig) {
          // Show saved config options
          const choice = await ctx.ui.select(
            "Unsloth Connection",
            [
              `Use saved: ${savedConfig.baseUrl}`,
              "Enter new URL",
            ],
            { timeout: 60000 }
          );

          if (choice === undefined) {
            ctx.ui.notify("Cancelled", "info");
            return;
          }

          if (choice.startsWith("Use saved:")) {
            baseUrl = savedConfig.baseUrl;
          } else {
            // Ask for new URL
            const entered = await ctx.ui.input(
              "Unsloth Server URL",
              savedConfig.baseUrl || defaultBaseUrl,
              { timeout: 60000 }
            );
            if (entered === undefined || !entered.trim()) {
              ctx.ui.notify("No URL entered", "warning");
              return;
            }
            baseUrl = entered.trim();
          }
        } else {
          // No saved config, ask user
          const entered = await ctx.ui.input(
            "Unsloth Server URL",
            defaultBaseUrl,
            { timeout: 60000 }
          );
          if (entered === undefined || !entered.trim()) {
            ctx.ui.notify("No URL entered", "warning");
            return;
          }
          baseUrl = entered.trim();
        }
      }

      // Step 2: Get API key (usually "unsloth-remote" for local, but can be customized)
      const apiKey = await ctx.ui.input(
        "API Key",
        "unsloth-remote",
        { timeout: 60000 }
      );
      if (apiKey === undefined) {
        ctx.ui.notify("No API key entered", "warning");
        return;
      }

      // Step 3: Save config
      const config: UnslothConfig = {
        baseUrl,
        apiKey: apiKey.trim() || "unsloth-remote",
      };
      saveConfig(ctx.cwd, config);

      // Step 4: Discover models from the server
      const models = await discoverModels(baseUrl);

      if (models.length === 0) {
        ctx.ui.notify(
          `No models found at ${baseUrl}. Provider registered with defaults.`,
          "warning"
        );
      } else {
        ctx.ui.notify(
          `Connected! Found ${models.length} model(s) at ${baseUrl}`,
          "info"
        );
      }

      // Step 5: Register the provider
      pi.registerProvider("unsloth", {
        name: "Unsloth (Local)",
        baseUrl,
        apiKey: config.apiKey,
        api: "openai-completions" as const,
        models,
      });

      // Step 6: Refresh model registry to show new models
      ctx.modelRegistry.refresh();

      console.log(`[pi-unsloth] Provider registered at ${baseUrl}`);
      console.log(`[pi-unsloth] Available models: ${models.length}`);
      console.log(`[pi-unsloth] Run /models to see available models`);
    },
  });
}

export default async function (pi: PiProviderAPI) {
  const baseUrl = process.env.UNSLOTH_BASE_URL ?? DEFAULT_BASE_URL;

  // Register the /unsloth-login command
  registerUnslothLoginCommand(pi, baseUrl);

  // Try to discover models from the running Unsloth server
  const discoveredModels = await discoverModels(baseUrl);

  // Use discovered models if available, otherwise fall back to common models
  const models = discoveredModels.length > 0 ? discoveredModels : COMMON_MODELS.map((m) => createModelConfig(m.id, m.name));

  pi.registerProvider("unsloth", {
    name: "Unsloth (Local)",
    baseUrl,
    apiKey: "unsloth-remote", // Local server doesn't need a real API key
    api: "openai-completions" as const,
    models,
  });

  console.log(`[pi-unsloth] Provider registered at ${baseUrl}`);
  console.log(`[pi-unsloth] Available models: ${models.length}`);
}
