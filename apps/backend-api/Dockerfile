# Build context is the repo root (Railway uses root as build context)
FROM node:20-alpine

WORKDIR /app

# Copy workspace root files
COPY package.json package-lock.json tsconfig.base.json ./

# Copy workspace package manifests
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/backend-api/package.json ./apps/backend-api/

# Install all dependencies
RUN npm install

# Copy source
COPY packages/shared-types/ ./packages/shared-types/
COPY apps/backend-api/ ./apps/backend-api/

# Generate Prisma client and build NestJS
WORKDIR /app/apps/backend-api
RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production
EXPOSE 4000

# Run migrations then start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
