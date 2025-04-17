# Codeflare

An AI-powered chat agent platform built on Cloudflare Workers.

This monorepo uses Turborepo to manage multiple packages:

- **apps/agent**: The core agent loop and chat UI, powered by the Agent SDK.
- **apps/container**: Hono server exposing tools as endpoints within a container.
- **packages/common**: Shared TypeScript types and utilities.
- **packages/eslint-config**: Shared ESLint configuration.
- **packages/typescript-config**: Shared TypeScript configurations.

## Features

- Interactive AI chat interface with real-time streaming.
- Built-in tools: bash, file system (read/edit/write), glob, ls, etc.
- Cloudflare Workers container integration with Docker support.
- Monorepo orchestration with Turborepo.
- Shared ESLint and TypeScript configs.

## Prerequisites

- Node.js >= 18 and npm >= 8
- Cloudflare account (for Workers deployment)
- Anthropic API key
- Wrangler CLI (`npm install -g wrangler`)

## Installation

```bash
npm install
```

### Environment Variables

Create a `.dev.vars` file in the `apps/agent` directory:

```env
ANTHROPIC_API_KEY="Your Anthropic API key"
REPOSITORY_PATH="Absolute path to the project you want to work on"
```

## Development

Just run:

```bash
npm run dev
```

This starts the following:

- Agent UI (Vite) at http://localhost:5173
- Container server (Hono) at http://localhost:3000

## Deployment

```bash
npm run deploy
```

## Credits

A good chunk of the prompts & tool implementation on this codebase are borrowed from [dnakov/anon-kode](https://github.com/dnakov/anon-kode), which is a CLI coding agent. Much of the heavy lifting of working with the Cloudflare Workers platform and running the agentic loop is done by the [Agent SDK](https://github.com/cloudflare/agents) and interacting with LLMs using the [AI SDK](https://github.com/vercel/ai).

## Contributing

Contributions welcome! Please open issues and PRs.

## License

MIT
