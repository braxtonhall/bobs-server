FROM node:20-alpine as builder

WORKDIR /app

COPY tsconfig.json ./
COPY package.json ./
COPY yarn.lock ./
RUN yarn install

COPY prisma/ ./prisma/
RUN yarn db:generate

COPY src/ ./src/
RUN yarn build

FROM node:20-alpine as runner

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock ./
COPY --from=builder /app/node_modules ./node_modules/

COPY --from=builder /app/prisma/ ./prisma/

COPY --from=builder /app/dist/src/ ./dist/src/

COPY views/ ./views/

CMD ["yarn", "start:prod"]

