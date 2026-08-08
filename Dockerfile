# Smitvi — Fly.io production image
# Pattern: GitHub → Fly compute · GoDaddy DNS · Supabase Auth/DB/Storage
FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN apt-get update -y \
  && apt-get install -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_APP_URL=https://smitvi.com
ENV NEXT_PUBLIC_APP_NAME=Smitvi
ARG NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true
ENV NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=$NEXT_PUBLIC_ENABLE_GOOGLE_AUTH
# NEXT_PUBLIC_* are inlined at build time — pass real values via --build-arg
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres
RUN test -n "$NEXT_PUBLIC_SUPABASE_URL" \
  && test -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  && npx prisma generate && npm run build && npm prune --omit=dev

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/scripts ./scripts
# Full pruned node_modules so Prisma release_command can run
COPY --from=builder /app/node_modules ./node_modules

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
