# build front-end
FROM node:lts-alpine AS frontend

RUN npm install pnpm -g

WORKDIR /app

COPY ./package.json /app

COPY ./pnpm-lock.yaml /app

RUN pnpm install

COPY . /app

RUN pnpm run build-only

# nginx backend
FROM nginx:latest
COPY --from=frontend /app/dist /usr/share/nginx/html

# 暴露容器端口
EXPOSE 80