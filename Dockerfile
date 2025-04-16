FROM node:20-alpine AS base

FROM base AS builder

RUN apk add --no-cache gcompat git
WORKDIR /app

# Clone the agents repository
RUN git clone https://github.com/cloudflare/agents /app/agents

# Copy workspace files first
COPY package*.json ./
COPY packages ./packages/
COPY turbo.json ./
COPY .npmrc ./

# Copy container project files
COPY apps/container/package*.json apps/container/tsconfig.json ./apps/container/
COPY apps/container/src ./apps/container/src

RUN npm ci && \
    npm run build && \
    npm prune --production

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodeuser

COPY --from=builder --chown=nodeuser:nodejs /app/apps/container/node_modules /app/node_modules
COPY --from=builder --chown=nodeuser:nodejs /app/apps/container/dist /app/dist
COPY --from=builder --chown=nodeuser:nodejs /app/apps/container/package.json /app/package.json
COPY --from=builder --chown=nodeuser:nodejs /app/agents /app/agents

WORKDIR /app/dist

USER nodeuser
EXPOSE 3000

CMD ["node", "index.js"]
