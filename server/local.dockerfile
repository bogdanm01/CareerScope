# syntax=docker/dockerfile:1

ARG NODE_VERSION=24.13.1

FROM node:${NODE_VERSION}-alpine

WORKDIR /usr/src/app

ENV NODE_ENV development

RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --include=dev

USER node

COPY . .

CMD npm run dev