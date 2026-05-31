# Repository Guidelines

## Project Structure & Module Organization

This repository contains two provider plugins for Unsloth local model serving:
- **Pi provider**: Located in `packages/pi/index.ts` - connects Pi to Unsloth (default port 8000)
- **Opencode provider**: Located in `packages/opencode/index.ts` - connects opencode to Unsloth (default port 8888)

Each plugin exports a provider registration function consumed by its respective agent framework. 
`README.md` documents installation, configuration, and troubleshooting. 
`models.example.json` provides a sample persistent provider configuration. 
`package.json` declares package metadata and scripts. 
There is currently no separate `src/`, `tests/`, or assets directory; keep new files at the root only when they are part of the package surface or documentation.

## Build, Test, and Development Commands

- For Pi development: `pi -e ./packages/pi`
- For Opencode development: `opencode --plugin ./packages/opencode`
- Test Pi against non-default endpoint: `UNSLOTH_BASE_URL=http://localhost:9000/v1 pi -e ./packages/pi`
- Test Opencode against non-default endpoint: `UNSLOTH_BASE_URL=http://localhost:9000/v1 opencode --plugin ./packages/opencode`
- Verify Pi server: `curl http://localhost:8000/v1/models`
- Verify Opencode server: `curl http://localhost:8888/v1/models`

## Coding Style & Naming Conventions

Use TypeScript ES modules and keep the default export as the plugin entrypoint. 
Follow the existing style: two-space indentation, double quotes, semicolons, `const` by default, and concise helper functions. 
Use `UPPER_SNAKE_CASE` for constants such as `DEFAULT_BASE_URL` and `COMMON_MODELS`; use `camelCase` for functions and local variables such as `createModelConfig` and `discoverModels`. 
Keep provider IDs and model IDs exact because the agent frameworks and upstream server match them by string.

## Testing Guidelines

No automated test framework is configured yet. For changes, run manual smoke tests with a running Unsloth server: 
1. Verify `/v1/models` responds 
2. Load the provider with the appropriate command (`pi -e` or `opencode --plugin`)
3. Confirm the agent lists discovered models or falls back to the common model list when the server is unavailable. 
If adding tests, prefer focused TypeScript tests for model config generation and discovery behavior.

## Commit & Pull Request Guidelines

Recent history uses Conventional Commit prefixes, for example `feat:` and `docs:`. 
Keep commits scoped and imperative, such as `fix: handle malformed model responses`. 
Pull requests should describe behavior changes, include manual test results, and mention any changes to `UNSLOTH_BASE_URL`, provider registration, or model defaults. 
Link related issues when applicable.

## Security & Configuration Tips

Do not commit real API keys or private model paths. 
Local Unsloth servers normally use the placeholder `unsloth-remote`; 
keep secrets in environment variables or user-local agent configuration under:
- Pi: `~/.pi/agent/models.json`
- Opencode: (refer to opencode's documentation for provider configuration location)