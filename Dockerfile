# --- Stage 1: Build ---
FROM node:18-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package*.json ./
COPY src/prisma ./src/prisma
RUN npm install
COPY . .

# Generate Prisma Client and build the app
RUN npx prisma generate --schema=./src/prisma/schema.prisma
RUN npx nx build api --configuration=production

# --- Stage 2: Runtime ---
FROM node:18-alpine
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy production build
COPY --from=builder /app/dist/api .
# Copy generated Prisma client from the builder stage
COPY --from=builder /app/node_modules/.prisma/client ./node_modules/.prisma/client
# Copy Prisma client definition
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --omit=dev

EXPOSE 3000
CMD ["node", "main.js"]
