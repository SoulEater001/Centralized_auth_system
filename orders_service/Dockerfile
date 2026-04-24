FROM node:22-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN mkdir -p /app/logs

EXPOSE 3002

CMD ["node", "app.js"]