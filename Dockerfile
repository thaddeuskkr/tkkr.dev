FROM oven/bun:alpine AS base

WORKDIR /app

FROM base AS dependencies
WORKDIR /app
COPY package.json bun.lock* ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --no-save --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN bun run build

FROM base AS production-dependencies
WORKDIR /app
COPY package.json bun.lock* ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --no-save --production --frozen-lockfile

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
COPY --from=builder --chown=bun:bun /app/public ./public
RUN mkdir .next
RUN chown bun:bun .next
COPY --from=builder --chown=bun:bun /app/.next/standalone ./
RUN rm -rf node_modules
COPY --from=production-dependencies --chown=bun:bun /app/node_modules ./node_modules
COPY --from=builder --chown=bun:bun /app/.next/static ./.next/static
COPY --from=builder --chown=bun:bun /app/.next/cache ./.next/cache

USER bun

EXPOSE 3000

CMD ["bun", "server.js"]
