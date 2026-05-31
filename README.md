# llm-provider-unsloth

Unsloth provider plugins for [Pi](https://pi.chat) and [Opencode](https://opencode.sh) — connect to locally served models via the OpenAI-compatible API.

## Install

```bash
git clone https://github.com/dohzoh/llm-provider-unsloth
```

## Project Structure

This repository contains two provider plugins using pnpm workspaces:
- **Pi provider**: `packages/pi/index.ts` (default port 8000)
- **Opencode provider**: `packages/opencode/index.ts` (default port 8888)

## Quick Start

### 1. Install Unsloth

```bash
pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
```

Or use [Unsloth Studio](https://unsloth.ai/docs/new/studio) for a web UI.

### 2. Start the Unsloth API server

Using the Python SDK:

```python
from unsloth import FastLanguageModel

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="Qwen/Qwen2.5-7B-Instruct",
    max_seq_length=8192,
    load_in_4bit=True,
)

FastLanguageModel.for_inference(model)

# Start the OpenAI-compatible server
model.save_pretrained_merged("output/qwen2.5-7b")
tokenizer.save_pretrained_merged("output/qwen2.5-7b")

# Or use Unsloth Studio CLI:
# unsloth studio start --port 8000   # For pi provider
# unsloth studio start --port 8888   # For opencode provider
```

The server exposes standard OpenAI endpoints (`/v1/chat/completions`, `/v1/models`).

## Usage

### For Pi (Default Port: 8000)

**Option A: CLI flag (temporary) - Direct from repo**
```bash
pi -e ./packages/pi
```

**Option B: npm package (temporary)**
```bash
pi -e @dohzoh/pi
```

**Option C: models.json (persistent)**
Add to `~/.pi/agent/models.json`:
```json
{
  "providers": {
    "unsloth": {
      "baseUrl": "http://localhost:8000/v1",
      "api": "openai-completions",
      "apiKey": "unsloth-remote",
      "models": [
        { "id": "Qwen/Qwen2.5-7B-Instruct" },
        { "id": "meta-llama/Llama-3.1-8B-Instruct" }
      ]
    }
  }
}
```

**Option D: Environment variable for custom endpoint**
```bash
# Direct from repo
UNSLOTH_BASE_URL=http://localhost:9000/v1 pi -e ./packages/pi

# Or via npm package
UNSLOTH_BASE_URL=http://localhost:9000/v1 pi -e @dohzoh/pi
```

Verify: `curl http://localhost:8000/v1/models`
Select model: `/model unsloth`

### For Opencode (Default Port: 8888)

**Option A: CLI flag (temporary)**
```bash
opencode plugin ./packages/opencode
```

**Option B: Environment variable for custom endpoint**
```bash
UNSLOTH_BASE_URL=http://localhost:9000/v1 opencode plugin ./packages/opencode
```

**Option B: Environment variable for custom endpoint**
```bash
UNSLOTH_BASE_URL=http://localhost:9000/v1 opencode plugin ./packages/opencode
```

**Option B: npm package (temporary)**
```bash
opencode plugin @dohzoh/opencode
```

**Option C: Environment variable for custom endpoint**
```bash
# Direct from repo
UNSLOTH_BASE_URL=http://localhost:9000/v1 opencode plugin ./packages/opencode

# Or via npm package
UNSLOTH_BASE_URL=http://localhost:9000/v1 opencode plugin @dohzoh/opencode
```

Verify: `curl http://localhost:8888/v1/models`
Configure: `/connect unsloth` (then set base_url and api_key)
List models: `/models`
Select model: `/model unsloth`

## Development

Install dependencies:
```bash
pnpm install
```

### Pi Development

**Direct from repo:**
```bash
pi -e ./packages/pi
```

**Via npm package:**
```bash
pi -e @dohzoh/pi
```

### Opencode Development

**Direct from repo:**
```bash
opencode plugin ./packages/opencode
```

**Via npm package:**
```bash
opencode plugin @dohzoh/opencode
```

### Testing Custom Endpoints

**For Pi - Direct from repo:**
```bash
UNSLOTH_BASE_URL=http://localhost:9000/v1 pi -e ./packages/pi
```

**For Pi - Via npm package:**
```bash
UNSLOTH_BASE_URL=http://localhost:9000/v1 pi -e @dohzoh/pi
```

**For Opencode - Direct from repo:**
```bash
UNSLOTH_BASE_URL=http://localhost:9000/v1 opencode plugin ./packages/opencode
```

**For Opencode - Via npm package:**
```bash
UNSLOTH_BASE_URL=http://localhost:9000/v1 opencode plugin @dohzoh/opencode
```

## Configuration

| Option | Default (Pi) | Default (Opencode) | Description |
|--------|--------------|-------------------|-------------|
| `UNSLOTH_BASE_URL` | `http://localhost:8000/v1` | `http://localhost:8888/v1` | Unsloth server endpoint |
| Context Window | 131072 tokens | 131072 tokens | Configurable per model |
| Max Output Tokens | 8192 | 8192 | Configurable per model |

## Features

- **Auto-discovery**: Dynamically fetches models from the running Unsloth server via `/v1/models`
- **Fallback models**: Pre-configured common models (Qwen, Llama, Gemma, Mistral) when server is not running
- **Zero auth needed**: Local servers don't require API keys — uses `unsloth-remote` as placeholder
- **Workspace managed**: Uses pnpm for dependency management

## Troubleshooting

### "Connection refused" on `/v1/models`

The Unsloth server isn't running. Start it first:

```bash
# Via unsloth CLI (adjust port as needed)
unsloth studio start --port 8000   # For pi
unsloth studio start --port 8888   # For opencode

# Or via Python SDK
python -c "from unsloth import FastLanguageModel; ..." # with model serving enabled
```

### Model not appearing in `/model` or `/models`

1. Check the Unsloth server is responding: `curl http://localhost:[PORT]/v1/models`
2. Verify the model ID matches exactly what the server reports
3. Reload the provider list:
   - Pi: `/reload` in pi, or edit `~/.pi/agent/models.json`
   - Opencode: Reconnect provider or restart opencode

### Using GGUF models

Unsloth supports GGUF quantized models which can be loaded via:

```python
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="path/to/gguf-model",
    load_in_4bit=True,  # or False for full precision
)
```

Register the GGUF model's ID in your provider's `models.json` configuration.

## License

MIT