# ByteNote 协作服务

基于 Yjs 的极简 WebSocket 服务，为 ByteNote 提供实时协作能力。

## 使用 Docker 运行

```bash
docker build -t bytenote-collab ./service
docker run -d --name bytenote-collab -p 1234:1234 \
  -e WS_PORT=1234 \
  -e ALLOWED_ORIGINS="http://localhost:3000" \
  bytenote-collab
```

### 使用 Docker Compose

```bash
cd service
docker compose up -d
```

可在 `docker-compose.yml` 中调整端口和 `ALLOWED_ORIGINS`。

**选择指南**

- 只需单个容器/嵌入自有编排：用上面的 `docker build` + `docker run`，适合自定义参数或集成到现有脚本/CI。
- 想开箱即用、易改配置：用 `docker compose up -d`，集中管理端口/环境变量，方便修改和一键重启。

## 在 ByteNote 中配置

在「协作服务器」里填写：

```
wss://<你的主机>:1234
```

本地测试可使用 `ws://localhost:1234`。

## 环境变量

| 变量              | 作用                       | 默认值  | 示例                                |
| ----------------- | -------------------------- | ------- | ----------------------------------- |
| `WS_PORT`         | WebSocket 监听端口         | `1234`  | `1234`                              |
| `ALLOWED_ORIGINS` | 允许的前端来源（逗号分隔） | 空=不限 | `http://localhost:3000,https://x.y` |

## 本地开发

```bash
cd service
pnpm install
WS_PORT=1234 node server.js
```

然后在应用内填写 `ws://localhost:1234` 进行协作测试。

## 将协作地址填到 ByteNote

在 ByteNote 的“协作服务器”输入框中填写你部署的 WS 地址，例如：

- 开发环境：`ws://localhost:1234`
- 生产环境：`wss://your-domain.com:1234`（建议通过反向代理+证书提供 WSS）

确保 `ALLOWED_ORIGINS` 包含前端站点的域名。
