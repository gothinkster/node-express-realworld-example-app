FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate
RUN npx nx build api

ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/api/main.js"]
