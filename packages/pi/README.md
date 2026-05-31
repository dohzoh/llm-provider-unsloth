# Unsloth Provider Plugin for Pi

Connects Pi to local Unsloth model serving via OpenAI-compatible API.

## Usage

### 1. Start the Unsloth API server

You need to have an Unsloth server running. By default, the plugin expects it on port 8000.

Using the Python SDK:

```python
from unsloth import FastLanguageModel

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="Qwen/Qwen2.5-7B-Instruct",
    max_seq_length=8192,
    load_in_4bit=True,
)

FastLanguageModel.for_inference(model)

# Start the OpenAI-compatible server on port 8000
# Note: The exact method to start the server may vary based on your Unsloth setup.
# Refer to Unsloth documentation for serving models.
```

Or use Unsloth Studio CLI:

```bash
unsloth studio start --port 8000   # For pi provider
```

### 2. Register the Plugin with Pi

You can register the plugin temporarily via CLI flag:

```bash
pi -e ./packages/pi
# Or if installed via npm:
# pi -e @dohzoh/pi-unsloth
```

For persistent registration, add to `~/.pi/agent/models.json`:

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

### 3. Select the Model in Pi

Once the provider is registered, you can select the model:

```bash
/model unsloth
```

## Configuration

You can customize the Unsloth server endpoint by setting the `UNSLOTH_BASE_URL` environment variable:

```bash
UNSLOTH_BASE_URL=http://localhost:9000/v1 pi -e ./packages/pi
```

## Features

- **Auto-discovery**: Dynamically fetches models from the running Unsloth server via `/v1/models`
- **Fallback models**: Pre-configured common models (Qwen, Llama, Gemma, Mistral) when server is not running
- **Zero auth needed**: Local servers don't require API keys — uses `unsloth-remote` as placeholder
- **TypeScript**: Written in TypeScript for better developer experience

## License

MIT