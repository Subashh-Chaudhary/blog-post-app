# =============================================================================
# backend-service/Dockerfile  — DEVELOPMENT ONLY
# =============================================================================

FROM node:22-alpine

# Install pnpm globally via npm
RUN npm install -g pnpm

# Allow all build scripts in development to prevent ERR_PNPM_IGNORED_BUILDS
RUN pnpm config set dangerously-allow-all-builds true

WORKDIR /app

# ── Step 1: Copy ONLY the dependency manifests ────────────────────────────────
COPY package.json pnpm-lock.yaml ./

# ── Step 2: Install ALL dependencies (including devDependencies) ───────────────
RUN pnpm install --frozen-lockfile --prefer-offline

# ── Step 3: Copy remaining config files ───────────────────────────────────────
COPY tsconfig.json tsconfig.build.json nest-cli.json ./

# ── Step 4: Expose the NestJS port ────────────────────────────────────────────
EXPOSE 5000

# ── Step 5: Default dev command ───────────────────────────────────────────────
CMD ["pnpm", "run", "start:dev"]
