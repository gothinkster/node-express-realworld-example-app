FROM node:18-alpine

# Use a more robust package install for Prisma/Alpine compatibility
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy your build artifacts
COPY dist/api .
COPY src/prisma ./src/prisma

# Install production dependencies
RUN npm install --omit=dev

# Generate the client for the Alpine environment
RUN npx prisma generate --schema=./src/prisma/schema.prisma

EXPOSE 3000

CMD ["node", "main.js"]
