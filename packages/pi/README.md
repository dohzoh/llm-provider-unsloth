# Unsloth Provider Plugin for Pi

Connects Pi to local Unsloth model serving via OpenAI-compatible API.

## Installation

This package is published to GitHub Packages. You need to configure authentication first:

```bash
# Configure GitHub Packages registry
echo "@dohzoh:registry=https://npm.pkg.github.com/" >> ~/.npmrc
echo "//npm.pkg.github.com/:_authToken=$(gh auth token)" >> ~/.npmrc

# Install the package
npm install @dohzoh/pi-unsloth
```

Or use the local path directly for development:
```bash
git clone https://github.com/dohzoh/llm-provider-unsloth.git
pi -e ./llm-provider-unsloth/packages/pi
```

## Usage

### 1. Start the Unsloth API server

You need to have an Unsloth server running. By default, the plugin expects it on port 8888.

use Unsloth Studio CLI:

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
