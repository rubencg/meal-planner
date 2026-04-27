FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate

COPY tsconfig*.json ./
COPY src ./src
RUN npm run build

EXPOSE 3000
CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]
