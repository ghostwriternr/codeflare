<div align="center">
  <h1>🔥 Codeflare</h1>
  <h3><strong>AI coding agent running on Cloudflare workers</strong></h3>
</div>

<div align="center">
  <a href="#overview">Overview</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#development">Development</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#contributing">Contributing</a>
</div>

## ✨ Overview

Codeflare is a coding agent designed to run on Cloudflare's Durable Objects and their upcoming Containers platform. It offers a very minimal UI to interact with the agent and display its working.

> At this point, this project is only a quick prototype to showcase the simplicity of building coding agents and the ease of deploying them on Cloudflare. That being said, it is still quite capable, thanks to Claude Sonnet 3.7.

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18, npm ≥ 8
- [Anthropic API Key](https://console.anthropic.com/)
- In order to deploy to Cloudflare as-is, you will need a Cloudflare account with early access to their [upcoming Containers platform](https://blog.cloudflare.com/cloudflare-containers-coming-2025/).
    - You could also modify the code to have the agent connect with containers running on other platforms too. Of course, this is not needed for running locally.

### Setup

```bash
# Clone the repository
git clone https://github.com/cloudflare/codeflare.git
cd codeflare

# Install dependencies
npm install

# Set up environment variables (remember to replace the placeholders!)
echo "ANTHROPIC_API_KEY=your_key_here" > apps/agent/.dev.vars
echo "REPOSITORY_PATH=absolute_path_to_a_local_repo" >> apps/agent/.dev.vars
```

## 💻 Development

```bash
# Start development servers
npm run dev
```

This launches:

- Agent UI: http://localhost:5173
- Container Server: http://localhost:3000

## 🏗️ Architecture

The React frontend is running on Cloudflare Workers, and the core agent loop atop Durable Objects (made easier with the [Agent SDK](https://github.com/cloudflare/agents)). Because we need access to a unix-like environment to access the filesystem and run commands, containers are spun up on demand with a Hono server that exposes actions that the agent needs to perform as tools via a simple REST API.

The monorepo is managed with Turborepo, containing:

```
apps/
  ├── agent/      # Core agent loop and chat UI
  └── container/  # Hono server for tool endpoints
packages/
  ├── common/     # Shared types and utilities
  ├── eslint/     # ESLint configuration
  └── typescript/ # TypeScript configuration
```

## 🌟 Contributing

Contributions are welcome! To get started:

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

## 📄 License

[MIT. Clean and simple.](LICENSE)

## 🙌 Credits

A good chunk of the prompts & tool implementation on this codebase are borrowed from [dnakov/anon-kode](https://github.com/dnakov/anon-kode), which is a CLI coding agent. Much of the heavy lifting of working with the Cloudflare Workers platform and running the agentic loop is done by the [Agent SDK](https://github.com/cloudflare/agents) and interacting with LLMs using the [AI SDK](https://github.com/vercel/ai).
