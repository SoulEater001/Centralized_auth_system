FROM node:22-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

RUN apt-get update -y && apt-get install -y openssl
COPY . .

RUN mkdir -p /app/logs
RUN npx prisma generate

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node app.js"]