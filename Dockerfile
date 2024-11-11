FROM node:20-alpine as builder

WORKDIR /app

COPY tsconfig.json ./
COPY package.json ./
COPY yarn.lock ./
RUN yarn install

COPY prisma/ ./prisma/
RUN yarn db:generate # TODO does this even work without the database?

COPY src/ ./src/
RUN yarn build

# TODO begin new code...

WORKDIR /app/apps/trek

COPY apps/trek/tsconfig.json ./
COPY apps/trek/package.json ./
COPY apps/trek/yarn.lock ./
RUN yarn install

# TODO somewhere here we also need to build the star trek thing... but it relies on the backend types :(

FROM node:20-alpine as runner

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock ./
COPY --from=builder /app/node_modules ./node_modules/

COPY --from=builder /app/prisma/ ./prisma/

COPY --from=builder /app/dist/src/ ./dist/src/

COPY views/ ./views/
COPY public/ ./public/

CMD ["yarn", "start:prod"]

