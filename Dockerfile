FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci       
COPY . .
RUN npx prisma generate && npx nx build api --configuration=production
FROM node:22-alpine AS deps
WORKDIR /app
COPY --from=build /app/dist/api/package.json /app/dist/api/package-lock.json ./
COPY .npmrc ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
ENV PRISMA_QUERY_ENGINE_LIBRARY=/app/node_modules/.prisma/client/libquery_engine-linux-musl-openssl-3.0.x.so.node
WORKDIR /app
RUN apk add --no-cache openssl
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist/api ./
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:3000/ || exit 1
CMD ["node", "main.js"]