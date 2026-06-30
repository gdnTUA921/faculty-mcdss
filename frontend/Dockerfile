FROM node:20-alpine

WORKDIR /app

# Install dependencies first (layer cache — only re-runs if package files change)
COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 3000

ENV NEXT_TELEMETRY_DISABLED=1

CMD ["npm", "run", "dev"]
