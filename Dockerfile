# ──────────────────────────────────────────────────────────────────────────────
# Stage 1: Install dependencies
# ──────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev=false

# ──────────────────────────────────────────────────────────────────────────────
# Stage 2: Build
# NEXT_PUBLIC_* vars are public by design (embedded in the client bundle).
# Server-side secrets (AUTH_SECRET, SUPABASE_SERVICE_KEY, etc.) are NOT
# needed at build time and must NOT appear here.
# ──────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Public branding / Supabase public config (not secrets)
ARG NEXT_PUBLIC_APP_TITLE
ARG NEXT_PUBLIC_COMPANY_NAME
ARG NEXT_PUBLIC_AGENT_NAME
ARG NEXT_PUBLIC_AGENT_EMOJI
ARG NEXT_PUBLIC_AGENT_DESCRIPTION
ARG NEXT_PUBLIC_AGENT_AVATAR
ARG NEXT_PUBLIC_AGENT_LOCATION
ARG NEXT_PUBLIC_OWNER_EMAIL
ARG NEXT_PUBLIC_OWNER_COLLAB_EMAIL
ARG NEXT_PUBLIC_OWNER_USERNAME
ARG NEXT_PUBLIC_TWITTER_HANDLE
ARG NEXT_PUBLIC_BIRTH_DATE
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

ENV NEXT_PUBLIC_APP_TITLE=$NEXT_PUBLIC_APP_TITLE
ENV NEXT_PUBLIC_COMPANY_NAME=$NEXT_PUBLIC_COMPANY_NAME
ENV NEXT_PUBLIC_AGENT_NAME=$NEXT_PUBLIC_AGENT_NAME
ENV NEXT_PUBLIC_AGENT_EMOJI=$NEXT_PUBLIC_AGENT_EMOJI
ENV NEXT_PUBLIC_AGENT_DESCRIPTION=$NEXT_PUBLIC_AGENT_DESCRIPTION
ENV NEXT_PUBLIC_AGENT_AVATAR=$NEXT_PUBLIC_AGENT_AVATAR
ENV NEXT_PUBLIC_AGENT_LOCATION=$NEXT_PUBLIC_AGENT_LOCATION
ENV NEXT_PUBLIC_OWNER_EMAIL=$NEXT_PUBLIC_OWNER_EMAIL
ENV NEXT_PUBLIC_OWNER_COLLAB_EMAIL=$NEXT_PUBLIC_OWNER_COLLAB_EMAIL
ENV NEXT_PUBLIC_OWNER_USERNAME=$NEXT_PUBLIC_OWNER_USERNAME
ENV NEXT_PUBLIC_TWITTER_HANDLE=$NEXT_PUBLIC_TWITTER_HANDLE
ENV NEXT_PUBLIC_BIRTH_DATE=$NEXT_PUBLIC_BIRTH_DATE
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

RUN npm run build

# ──────────────────────────────────────────────────────────────────────────────
# Stage 3: Runtime
# Server-side secrets are injected here by the container orchestrator (EasyPanel)
# at runtime — they are NEVER baked into any image layer.
# ──────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=80
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 80

# Runtime secrets (AUTH_SECRET, SUPABASE_SERVICE_KEY, N8N_WEBHOOK_SECRET,
# SUPABASE_URL, OPENCLAW_DIR, OPENCLAW_WORKSPACE, EVOLUTION_API_URL) are set
# via EasyPanel Environment Variables — injected at container start, not build.
CMD ["npm", "run", "start"]
