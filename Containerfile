# syntax=docker/dockerfile:1
#
# Memex runs a SvelteKit server via the node adapter. The agent runs in the
# browser, but /api/stream holds the DeepSeek key and /api/memories persists
# memories to data/memories.json, so the runtime needs a writable data/.

# --- build stage -------------------------------------------------------------
# Build on the host architecture: adapter-node emits portable JS, so there's no
# reason to run the build under QEMU when targeting arm64.
FROM --platform=$BUILDPLATFORM node:22-alpine AS build
RUN corepack enable
WORKDIR /app

# Install exact deps first so this layer caches until the lockfile changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build && pnpm prune --prod --ignore-scripts

# --- runtime stage -----------------------------------------------------------
FROM node:22-alpine
WORKDIR /app

COPY --chown=node:node package.json ./
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/build ./build

# Memories are written here at runtime; mount a volume to keep them across
# container replacements.
RUN mkdir data && chown node:node data
USER node

ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
EXPOSE 3000
CMD ["node", "build"]
