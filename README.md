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

Create a `.env` or `.dev.vars` in the root:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## Development

Start both apps:

```bash
npm run dev
```

- Agent UI (Vite) at http://localhost:5173
- Container server (Hono) at http://localhost:3000

## Building

```bash
npm run build
```

## Linting & Types

```bash
npm run lint
npm run types
```

## Formatting

```bash
npm run format
```

## Deployment

```bash
npm run deploy
```

## Project Structure

```
.
├── apps
│   ├── agent           # Cloudflare Workers chat UI
│   └── container       # Node.js container server
├── packages
│   ├── common          # Shared types & utils
│   ├── eslint-config   # ESLint configs
│   └── typescript-config # TS configs
├── Dockerfile          # Container Dockerfile
├── turbo.json          # Turborepo config
├── package.json        # Root workspace config
└── README.md           # This file
```

## Contributing

Contributions welcome! Please open issues and PRs.

## License

MIT
