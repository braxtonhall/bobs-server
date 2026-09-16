FROM node:20.9.0-alpine as builder

WORKDIR /app

RUN apk add python3 \
    pkgconfig \
    pixman-dev \
    cairo-dev \
    pango-dev \
    build-base \
    npm \
    git

COPY tsconfig.json ./
COPY package.json ./
COPY yarn.lock ./
RUN yarn install

COPY prisma/ ./prisma/
RUN yarn db:generate

COPY src/ ./src/
RUN yarn build

RUN yarn download-fonts

COPY .git/ ./.git/
RUN git rev-parse --short HEAD > commit-sha.txt

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
COPY --from=builder /app/commit-sha.txt ./commit-sha.txt

COPY views/ ./views/
COPY public/ ./public/

CMD ["yarn", "start:prod"]

