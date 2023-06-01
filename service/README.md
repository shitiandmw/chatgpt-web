# chat-egg-server



## QuickStart

<!-- add docs here for user -->

see [egg docs][egg] for more detail.

### Development

```bash
$ npm i
$ npm run dev
$ open http://localhost:7001/
```

### Deploy

```bash
$ npm start
$ npm stop
```

### npm scripts

- Use `npm run lint` to check code style.
- Use `npm test` to run unit test.
- Use `npm run autod` to auto detect dependencies upgrade, see [autod](https://www.npmjs.com/package/autod) for more detail.


[egg]: https://eggjs.org


### 部署
#### 1. 打包文件
tar -zcvf ../release.tgz --exclude=./node_modules --exclude=./logs .
tar -zcvf ./release.tgz --exclude=chat-egg-server/node_modules --exclude=chat-egg-server/logs chat-egg-server


#### 2. 服务器部署

+ 上传文件到服务器 /var/www/egg-chat/release 目录并解压
mkdir -p /var/www/egg-chat/release
cd /var/www/egg-chat/release
tar xvf release.tgz

+ 创建日志目录
mkdir -p /var/www/egg-chat/logs

+ 创建镜像
docker build -t egg-chat:0001 .

+ 启动容器
docker run -d  \
-p 21003:7002 \
--log-driver json-file  \
--log-opt max-size=100m  \
--log-opt max-file=2  \
-v /var/www/chatgpt-pro/service-log:/app/logs  \
-v /etc/localtime:/etc/localtime \
--net egg-chat --ip 172.20.0.161 \
--restart=always \
--name chat-pre-service chatgpt-pre-service:0001


docker run -d  \
-p 21003:7002 \
--log-driver json-file  \
--log-opt max-size=100m  \
--log-opt max-file=2  \
-v /var/www/chatgpt-pro/service/app:/app/app  \
-v /var/www/chatgpt-pro/service/config:/app/config  \
-v /etc/localtime:/etc/localtime \
--net egg-chat --ip 172.20.0.161 \
--restart=always \
--name chat-pre-service chatgpt-pre-service:0001

docker run -d  \
-p 22003:7002 \
--log-driver json-file  \
--log-opt max-size=100m  \
--log-opt max-file=2  \
-v /var/www/chatgpt-dev/service/app:/app/app  \
-v /var/www/chatgpt-dev/service/config:/app/config  \
-v /etc/localtime:/etc/localtime \
--net egg-chat --ip 172.20.0.181 \
--restart=always \
--name chat-dev-service chatgpt-pre-service:0001


## 关于插件
**user**: 在eggjs中，我拓展了redis插件 egg-lu-redis ,编辑了一部分代码，具体目录是 lib/plugins/egg-lu-reids ，这个拓展包本身需要依赖 ioredis，目前这个目录的node_moudules 模块需要单独安装，dockerfile如下：
# 设置基础镜像,如果本地没有该镜像，会从Docker.io服务器pull镜像
FROM node:18.14.2-alpine3.17

# # 设置时区
# RUN apk --update add tzdata \
#     && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
#     && echo "Asia/Shanghai" > /etc/timezone \
#     && apk del tzdata

# 创建app目录
RUN mkdir -p /app

# 设置工作目录
WORKDIR /app

# 拷贝package.json文件到工作目录
# !!重要：package.json需要单独添加。
# Docker在构建镜像的时候，是一层一层构建的，仅当这一层有变化时，重新构建对应的层。
# 如果package.json和源代码一起添加到镜像，则每次修改源码都需要重新安装npm模块，这样木有必要。
# 所以，正确的顺序是: 添加package.json；安装npm模块；添加源代码。
COPY package.json  /app/package.json

# 安装npm依赖(使用淘宝的镜像源)
# 如果使用的境外服务器，无需使用淘宝的镜像源，即改为`RUN npm i`。
RUN npm install -g npm@9.6.1
RUN npm i --production --registry=https://registry.npmmirror.com

# 拷贝所有源代码到工作目录
COPY . /app

RUN cd /app/lib/plugins/egg-lu-redis && npm i --registry=https://registry.npmmirror.com 


WORKDIR /app

# 暴露容器端口
EXPOSE 7001

# 启动node应用
CMD npm start

你有办法优化一下吗

**chatgpt**: 可以将 `npm i` 命令拆分成两个步骤，将 `npm i --production` 放在 Dockerfile 的顶部，这样在源代码没有改变时就不需要重新安装依赖了，这可以显著减少构建时间。然后将 `npm i` 命令放在 `CMD npm start` 命令之前，这样在容器启动时还可以安装开发依赖，从而方便开发和调试。另外，可以将 `WORKDIR /app` 命令放在 Dockerfile 的顶部，这样可以避免在多个地方重复设置工作目录。修改后的 Dockerfile 如下：

```
FROM node:18.14.2-alpine3.17

RUN mkdir -p /app
WORKDIR /app

COPY package.json /app/package.json
RUN npm install -g npm@9.6.1
RUN npm i --production --registry=https://registry.npmmirror.com

COPY . /app
RUN cd /app/lib/plugins/egg-lu-redis && npm i --registry=https://registry.npmmirror.com 

EXPOSE 7001

CMD npm i && npm start
```

**user**: egg-lu-redis 插件的依赖能与app公用么，不要安装两次依赖

**chatgpt**: 可以通过将 `egg-lu-redis` 的依赖声明在应用程序的 `package.json` 文件中，来避免在 `egg-lu-redis` 和应用程序中重复安装依赖。具体来说，可以在应用程序的 `package.json` 文件中添加以下内容：

```
{
  "dependencies": {
    "egg-lu-redis": "^x.x.x"
  }
}
```

其中 `^x.x.x` 表示需要使用的 `egg-lu-redis` 版本号。然后在 `config/plugin.js` 文件中声明插件并指定依赖：

```
exports.redis = {
  enable: true,
  package: 'egg-lu-redis',
  dependencies: ['ioredis'],
};
```

这样，在应用程序启动时，`egg-lu-redis` 插件会自动安装并加载 `ioredis` 依赖，而不需要在 `Dockerfile` 中单独安装。这也可以避免重复安装依赖的问题。

**user**: 你理解错了，egg-lu-redis 是我自己定义的本地插件。

**chatgpt**: 如果 `egg-lu-redis` 是自己定义的本地插件，且需要依赖 `ioredis`，可以通过将 `ioredis` 作为应用程序的顶级依赖，来避免在 `egg-lu-redis` 和应用程序中重复安装依赖。具体来说，可以在应用程序的 `package.json` 文件中添加以下内容：

```
{
  "dependencies": {
    "egg": "^x.x.x",
    "ioredis": "^x.x.x",
    "egg-lu-redis": "file:./lib/plugins/egg-lu-redis"
  }
}
```

其中 `^x.x.x` 表示需要使用的依赖版本号。在这里，我们将 `egg-lu-redis` 作为本地依赖添加到应用程序中，而 `ioredis` 则作为顶级依赖添加到应用程序中。然后在 `config/plugin.js` 文件中声明插件：

```
exports.redis = {
  enable: true,
  package: 'egg-lu-redis',
};
```

这样，在应用程序启动时，`egg-lu-redis` 插件会自动加载 `ioredis` 依赖，而不需要在 `Dockerfile` 中单独安装。