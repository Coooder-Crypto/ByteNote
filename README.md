# Byte Note

协作型 Markdown 笔记应用，支持标签/分组/收藏/回收站、实时协同、自动保存与云端存储。

## 核心特性
- ✍️ Markdown 编辑：UIW MDEditor，主题跟随系统/切换。
- 🤝 协作编辑：Yjs + Pusher，笔记可设为协作并邀请协作者。
- 🏷️ 组织管理：标签、分组、收藏、回收站，支持搜索/过滤/排序。
- 🔐 身份认证：NextAuth GitHub 登录，JWT 会话。
- 🗄️ 数据存储：Postgres（Prisma），云端持久化。
- ☁️ 自动保存：10s 间隔 & Cmd/Ctrl+S；后端广播最新版本。

## 开发指南

### 环境依赖
- Node 18+
- pnpm
- Postgres（本地 docker-compose 已提供，默认端口 55432）

### 本地启动
```bash
pnpm install
pnpm dev
```
访问 http://localhost:3000

### 环境变量
复制 `.env.example` -> `.env.local`，主要项：
- 数据库：`DATABASE_URL`（docker-compose 默认：postgres://byte_note:byte_note@localhost:55432/byte_note）
- 认证：`NEXTAUTH_SECRET`、`GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET`
- Pusher：`PUSHER_APP_ID`、`PUSHER_KEY`、`PUSHER_SECRET`、`PUSHER_CLUSTER`
- Vercel Blob（头像上传，可选）：`BLOB_READ_WRITE_TOKEN`

### 数据库
- 生成客户端：`pnpm prisma generate`
- 同步 schema：`pnpm prisma db push`

### 脚本
- `pnpm dev`：本地开发
- `pnpm build`：Prisma generate + Next 构建
- `pnpm lint`：ESLint
- `pnpm format`：Prettier

### 提交规范
已配置 Husky + lint-staged，提交前自动运行 ESLint/Prettier。

## 目录结构（关键部分）
- `app/`：Next App Router（`/notes` 主入口，`/notes/[id]` 编辑页，`/api` 服务端路由）
- `components/`：UI 与业务组件（Sidebar、Editor 等）
- `hooks/`：业务 hooks（Actions/Common/Store）
- `lib/`：Prisma、Pusher、工具方法
- `server/`：tRPC 路由与 NextAuth 配置
- `types/`：全局实体类型定义（BnNote/BnFolder/BnUser 等）

## 协作编辑简述
- 前端：`CollaborativeEditor` 使用 Yjs 文档；`useNoteSync` 处理自动保存与服务器广播。

## 许可证
MIT
