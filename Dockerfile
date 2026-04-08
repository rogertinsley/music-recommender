FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM deps AS prod-deps
RUN npm prune --omit=dev

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Only the Prisma packages needed for runtime migrations — the standalone
# output bundles everything else the app needs in its own node_modules
COPY --from=prod-deps /app/node_modules/prisma ./node_modules/prisma
COPY --from=prod-deps /app/node_modules/@prisma ./node_modules/@prisma

# Standalone output (includes its own minimal node_modules for the app)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs
EXPOSE 3567
ENV PORT=3567
ENV HOSTNAME="0.0.0.0"
CMD ["./entrypoint.sh"]
