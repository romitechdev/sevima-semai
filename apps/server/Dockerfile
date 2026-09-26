FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/server/ ./apps/server/

RUN npm ci --workspace=apps/server --workspace=packages/shared --if-present 2>/dev/null || npm ci
RUN npm run build --workspace=apps/server

EXPOSE 3002
CMD ["node", "apps/server/dist/index.js"]
