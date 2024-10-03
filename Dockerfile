# Use the official Bun image
# See all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:latest AS base

# Install dependencies into temp directory
# This will cache them and speed up future builds
FROM base AS install
RUN mkdir /app
COPY package.json bun.lockb /app/
RUN cd /app && bun install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=install /app/node_modules ./node_modules
COPY . .
RUN \
  bun --bun run build

FROM base AS runner
WORKDIR /app
RUN mkdir /data

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# COPY --from=builder /app/public ./public

RUN mkdir .next
# RUN chown nextjs:nodejs .next

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# USER nextjs

EXPOSE 4000
ENV PORT=4000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
ENV HOSTNAME="0.0.0.0"
CMD ["bun", "--bun", "run", "server.js"]
