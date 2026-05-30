# pi-provider-unsloth

Pi LLM provider plugin for [Unsloth](https://github.com/unslothai/unsloth) — connect pi to locally served models via the OpenAI-compatible API.

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
# unsloth studio start
```

The server exposes `http://localhost:8000/v1` by default with standard OpenAI endpoints (`/v1/chat/completions`, `/v1/models`).

### 3. Register the provider in pi

**Option A: CLI flag (temporary)**

```bash
pi -e ./path/to/pi-provider-unsloth
```

**Option B: models.json (persistent)**

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

**Option C: Environment variable for custom endpoint**

```bash
UNSLOTH_BASE_URL=http://localhost:9000/v1 pi -e ./path/to/pi-provider-unsloth
```

### 4. Select the model

```
/model unsloth   # Then pick from available models
```

## Configuration

| Option | Default | Description |
|--------|---------|-------------|
| `UNSLOTH_BASE_URL` | `http://localhost:8000/v1` | Unsloth server endpoint |
| Context Window | 131072 tokens | Configurable per model |
| Max Output Tokens | 8192 | Configurable per model |

## Features

- **Auto-discovery**: Dynamically fetches models from the running Unsloth server via `/v1/models`
- **Fallback models**: Pre-configured common models (Qwen, Llama, Gemma, Mistral) when server is not running
- **Zero auth needed**: Local servers don't require API keys — uses `unsloth-remote` as placeholder

## Troubleshooting

### "Connection refused" on `/v1/models`

The Unsloth server isn't running. Start it first:

```bash
# Via unsloth CLI
unsloth studio start

# Or via Python SDK
python -c "from unsloth import FastLanguageModel; ..." # with model serving enabled
```

### Model not appearing in `/model`

1. Check the Unsloth server is responding: `curl http://localhost:8000/v1/models`
2. Verify the model ID matches exactly what the server reports
3. Reload pi's provider list: `/reload` in pi, or edit `models.json` directly

### Using GGUF models

Unsloth supports GGUF quantized models which can be loaded via:

```python
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="path/to/gguf-model",
    load_in_4bit=True,  # or False for full precision
)
```

Register the GGUF model's ID in `models.json` under the `unsloth` provider.

## License

MIT
