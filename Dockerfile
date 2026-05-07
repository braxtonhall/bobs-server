FROM node:20.9.0-alpine as builder

WORKDIR /app

RUN apk add python3 \
    pkgconfig \
    pixman-dev \
    cairo-dev \
    pango-dev \
    build-base \
    npm

COPY tsconfig.json ./
COPY package.json ./
COPY yarn.lock ./
RUN yarn install

COPY prisma/ ./prisma/
RUN yarn db:generate

COPY apps/crdt-client/package.json ./apps/crdt-client/
COPY apps/crdt-client/yarn.lock ./apps/crdt-client/
RUN cd apps/crdt-client && yarn install --frozen-lockfile

COPY apps/crdt-client/src/ ./apps/crdt-client/src/
COPY apps/crdt-client/tsconfig.json ./apps/crdt-client/

COPY src/ ./src/
RUN yarn build

RUN yarn download-fonts

FROM node:20.9.0-alpine as runner

WORKDIR /app

RUN apk add pixman-dev \
    cairo-dev \
    pango-dev \
    build-base

COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock ./
COPY --from=builder /app/node_modules ./node_modules/

COPY --from=builder /app/prisma/ ./prisma/

COPY --from=builder /app/dist/src/ ./dist/src/
COPY --from=builder /app/fonts ./fonts/

COPY views/ ./views/
COPY public/ ./public/
COPY --from=builder /app/public/crdt-client/ ./public/crdt-client/

CMD ["yarn", "start:prod"]

