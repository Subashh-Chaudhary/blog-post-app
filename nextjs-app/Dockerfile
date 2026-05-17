# =============================================================================
# nextjs-app/Dockerfile  — DEVELOPMENT ONLY
# =============================================================================

FROM node:22-alpine

# Install pnpm globally
RUN npm install -g pnpm

# Allow all build scripts in development to prevent ERR_PNPM_IGNORED_BUILDS
RUN pnpm config set dangerously-allow-all-builds true

WORKDIR /app

# ── Step 1: Copy ONLY dependency manifests (cache layer) ──────────────────────
COPY package.json pnpm-lock.yaml ./

# ── Step 2: Install ALL dependencies including devDependencies ─────────────────
RUN pnpm install --frozen-lockfile --prefer-offline

# ── Step 3: Copy Next.js config files ─────────────────────────────────────────
COPY next.config.ts tsconfig.json postcss.config.mjs ./

# ── Step 4: Expose Next.js dev server port ────────────────────────────────────
EXPOSE 3000

# ── Step 5: Start Next.js in development mode ─────────────────────────────────
CMD ["pnpm", "run", "dev"]
