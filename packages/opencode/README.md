# Unsloth Provider Plugin for Opencode

Connects Opencode to local Unsloth model serving via OpenAI-compatible API.

## Installation

You can install this plugin directly from the repository or publish it to npm and install it as a dependency.

### From Repository (Development)

```bash
opencode plugin /path/to/llm-provider-unsloth/packages/opencode
```

### As an Independent npm Package

Once published to npm:

```bash
npm install @dohzoh/opencode
# Then register with opencode
opencode plugin @dohzoh/opencode
```

## Usage

### 1. Start the Unsloth API server

You need to have an Unsloth server running. By default, the plugin expects it on port 8888.

Using the Python SDK:

```python
from unsloth import FastLanguageModel

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="Qwen/Qwen2.5-7B-Instruct",
    max_seq_length=8192,
    load_in_4bit=True,
)

FastLanguageModel.for_inference(model)

# Start the OpenAI-compatible server on port 8888
# Note: The exact method to start the server may vary based on your Unsloth setup.
# Refer to Unsloth documentation for serving models.
```

Or use Unsloth Studio CLI:

```bash
unsloth studio start --port 8888   # For opencode provider
```

### 2. Register the Plugin with Opencode

```bash
opencode plugin ./packages/opencode
# Or if installed via npm:
# opencode plugin @dohzoh/opencode
```

### 3. Configure the Provider in Opencode

Once the plugin is loaded, you need to configure it in Opencode:

```bash
/connect unsloth   # This will set up the unsloth provider
# Then set:
#   base_url: http://localhost:8888/v1
#   api_key: unsloth-remote (placeholder, not actually used for local server)
```

### 4. List and Select Models

```bash
/models   # Fetch available models from the Unsloth server
/model unsloth   # Select the unsloth provider for subsequent commands
```

## Configuration

You can customize the Unsloth server endpoint by setting the `UNSLOTH_BASE_URL` environment variable:

```bash
UNSLOTH_BASE_URL=http://localhost:9000/v1 opencode plugin ./packages/opencode
```

## Development

To develop this plugin:

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Make changes to `index.ts`
4. Test with: `opencode plugin ./packages/opencode`

## Features

- **Auto-discovery**: Dynamically fetches models from the running Unsloth server via `/v1/models`
- **Fallback models**: Pre-configured common models (Qwen, Llama, Gemma, Mistral) when server is not running
- **Zero auth needed**: Local servers don't require API keys — uses `unsloth-remote` as placeholder
- **TypeScript**: Written in TypeScript for better developer experience

## License

MIT