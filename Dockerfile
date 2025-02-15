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
RUN yarn db:generate # TODO does this even work without the database?

COPY src/ ./src/
RUN yarn build

RUN yarn download-fonts

# TODO begin new code...

WORKDIR /app/apps/trek

COPY apps/trek/tsconfig.json ./
COPY apps/trek/package.json ./
COPY apps/trek/yarn.lock ./
RUN yarn install

# TODO somewhere here we also need to build the star trek thing... but it relies on the backend types :(

FROM node:20-alpine as runner

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

CMD ["yarn", "start:prod"]

