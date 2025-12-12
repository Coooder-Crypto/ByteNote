# ByteNote

## 项目简介

ByteNote 是一个面向个人与团队的现代化 Web 笔记应用，主打“写作体验 + 轻协作 + 可自建”。它提供基于 Slate 的结构化编辑器，支持标题、标签、列表/代码块/引用等常见排版，并集成 AI 摘要与内容辅助能力。在离线或网络不稳定场景下也能顺畅使用，数据会本地缓存并在恢复联网后自动同步。对于团队协作，ByteNote 基于 Yjs/WS 实时协同，且提供可通过 Docker 自建的协作服务，兼顾隐私与可控性。

- 线上地址：https://byte-note.vercel.app/
- 仓库地址：https://github.com/Coooder-Crypto/ByteNote
- demo 地址：https://www.youtube.com/watch?v=uiNL36Urqt8

## 功能特性

ByteNote 以“写作体验 + 轻协作 + 可自建”为核心，围绕日常写作与知识管理的完整流程构建：从快速登录、随手记录，到结构化编辑、智能总结，再到离线可用与自动同步。它既能满足个人高频笔记的顺滑体验，也支持多人实时协作与可自建的协作服务，兼顾隐私与可控性。下面是当前已实现的主要功能与体验优化点。

> 截图为示例，以实际效果为准（更完整效果建议搭配 Demo 视频/线上体验查看）。

### GitHub OAuth 登录与账号体系

- 支持 GitHub OAuth 一键登录。
- 首次登录自动同步 GitHub 头像与昵称作为默认资料。
- 可在设置页随时修改头像与昵称。

![](./doc/github-oauth.png)

### 笔记系统（管理与组织）

- 笔记列表支持懒加载。
- 支持笔记的创建、编辑、删除与回收站恢复。
- 支持笔记的搜索、排序、筛选功能。
- 支持收藏（Favorite）快速标记重点笔记。
- 支持标签（Tags）管理与筛选。
- 支持文件夹/分组（Folders）归档与快速切换。

![](./doc/note-system.png)

### 富文本编辑器（Slate 驱动）

- 结构化富文本实时渲染，包含标题、段落、引用、列表、代码块等常见块级结构。
- 支持预览模式与编辑模式无缝切换；预览时保持布局稳定。
- 支持编辑区域宽度切换（默认/全宽）。
- 支持快捷键、自动保存与本地备份，降低内容丢失风险。
- 优化了列表/代码块等编辑体验（如删除、换行、粘贴等场景更符合直觉）。
- 支持 AI 自动生成摘要（详见：AI 集成能力），并可随权限/网络状态自动启停。
- 支持标签选择/编辑与编辑器联动。

![](./doc/editor.png)

### 离线编辑与自动同步

- 离线可完整浏览、创建、编辑、删除/回收笔记，所有操作都会先写入本地，即使刷新或关闭页面也不会丢失。
- 支持离线创建笔记：无网络时生成本地临时 ID，标记为“仅本地/待同步”，在笔记列表中与云端笔记统一展示和管理。
- 网络恢复后会自动触发后台同步队列，且同步过程对用户透明，不阻塞继续编辑。
- 同步具备容错和重试：网络抖动/临时失败会保留本地 dirty 状态并指数退避重试；用户无需手动操作。
- 同步与登录状态联动：若会话过期/401，前端会暂停同步并提示重新登录，恢复登录后自动继续队列

![](./doc/local-and-sync.png)

### 协作编辑（实时同步）

- 基于 Yjs + WebSocket 的多人实时协作编辑，协作状态可视化。
- 支持自定义/自建 WS 协作服务器（Docker 部署）。
- 支持协作者管理与权限控制，区分 Owner/Collaborator。
- 首次开启协作会将本地内容 seed 到协作房间，协作房间不存储任何数据

![](./doc/collab.png)

### 主题切换与移动端适配

- 提供浅色/深色两套主题，可在设置中切换并持久化。
- 全站响应式布局，侧边栏与编辑器在移动端针对性优化。

![](./doc/theme.png)

### 数据统计

- 提供笔记维度的数据概览与趋势统计。
- 支持 AI 生成统计报告（详见：AI 集成能力），辅助回顾与总结。

![](./doc/data.png)

### AI 集成能力

- AI 笔记摘要生成。
- AI 统计报告生成。
- 能力受权限与网络状态控制，避免无权限/离线误调用。

![](./doc/ai.png)

## 系统架构

ByteNote 采用同仓全栈 + 离线优先 + 可选协作服务的架构：主 Web 应用基于 Next.js（App Router）提供 UI 与 API；本地用 IndexedDB 持久化笔记并通过后台同步队列与云端双向合并；协作能力由独立的 Yjs WebSocket 服务提供实时广播，应用侧可按需启用并支持自建。

![](./doc/structure.png)

### 组件分层

- 前端（`app/`、`components/`、`hooks/`、`lib/`）
  - 视图与路由：Next.js App Router 页面负责列表/编辑/统计等界面。
  - 编辑器：`SlateEditor` 负责渲染与交互；`withMarkdownPaste / withCustomDelete / useShortcuts` 等插件提供粘贴、删除、快捷键、块级切换等能力。
  - 本地持久化：`LocalManager` + `noteStorage` 将笔记写入 IndexedDB，记录 `version/updatedAt/syncStatus` 以支持离线编辑与同步。
  - 网络与缓存：tRPC + React Query 管理 list/detail/infinite query；Zustand 管理 UI/网络/协作状态。
  - PWA：Service Worker 负责静态资源与页面缓存，保证弱网/离线可进入应用。

- 服务端（`server/api/`、`prisma/`）
  - API 与鉴权：tRPC 路由统一承载笔记、文件夹、协作者与 AI 请求；`protectedProcedure` 通过 NextAuth session 校验权限。
  - 数据层：Prisma 访问 PostgreSQL；笔记更新使用 `version` 的乐观锁（`updateMany where version=...`）避免并发覆盖。
  - AI：服务端代理调用 DeepSeek 并回写摘要/报告，前端根据权限与网络状态启用。

- 协作服务（`service/`）
  - 独立的 Yjs WebSocket 广播服务，不保存数据，只负责房间内 CRDT 更新分发；可通过 Docker/Compose 自建。
  - 前端启用协作时先把本地内容 seed 到房间，再与 Yjs 文档双向同步；断开/手动触发时将房间快照落库。

### 模块职责与边界

为了让离线、协作与编辑体验能够同时成立，ByteNote 对核心模块做了清晰分工：

- `EditorManager`（`lib/manager/EditorManager.ts`）
  - 只管理编辑器的内存态：标题/正文/标签/版本/权限计算等。
  - 提供纯函数式 `updateXAndNote`，不直接触碰网络或本地存储。

- `SlateEditor` + Slate 插件（`components/editor/slate/*`）
  - 负责文档渲染与交互行为：块级结构、快捷键、粘贴、删除、预览等。
  - 插件只关心 Slate 文档结构与编辑语义，不耦合业务字段。

- `LocalManager`（`lib/manager/LocalManager.ts`）
  - 负责本地持久化与离线队列：IndexedDB 读写、dirty/pending/synced 状态、版本与时间戳维护。
  - 不直接操作 UI，只提供存取与同步所需的底层能力。

- `useEditor`（`hooks/editor/useEditor.ts`）
  - 负责把三条链路编排起来：服务端 hydrate → 本地 fallback → Slate/协作切换 → 保存/重试。
  - 在普通/协作模式间切换时保持 selection、版本与本地状态一致。

- `useSync`（`hooks/network/useSync.ts`）
  - 后台同步只消费 LocalManager 的 dirty 队列，成功后回写版本/状态并刷新缓存。
  - 与前台保存通过 `pending` 状态隔离，避免并发更新导致乐观锁失败。

- 协作层（`hooks/network/useSocket.ts`、`service/`）
  - 前端负责 WS 连接、seed 本地内容、Slate <-> Yjs 共享类型实时映射。
  - WS 服务只做房间广播，不保存数据；持久化仍由主应用完成。

### 目录结构

- `app/`：页面与路由（Notes、Editor、Stats、Auth 等）
- `components/`：UI 与业务组件（Sidebar、NoteList、Editor、Dialog、Skeleton…）
- `hooks/`：业务 hooks（editor/network/note/user/app）
- `lib/manager/`：本地/编辑器状态管理（`EditorManager`、`LocalManager`）
- `server/api/`：tRPC 路由与中间件
- `prisma/`：数据库 schema 与迁移
- `service/`：可选协作 WS 服务（Docker/Compose 部署）

## 性能与体验优化

ByteNote 在保持功能完整的同时，针对“首屏加载、列表渲染、编辑体验、弱网/离线与协作延迟”等关键场景做了多处优化：

- 笔记列表懒加载与虚拟滚动  
  笔记列表使用 React Query 的 infinite query 结合 react-virtual 进行按需加载与窗口化渲染，显著降低首屏网络与 DOM 负担，长列表滚动更顺滑。

- 编辑器单容器滚动与布局稳定  
  编辑器采用单一滚动容器（header sticky + 内容区滚动），避免多层 overflow 造成的滚动抖动与背景断层；预览/编辑切换仅做禁用而不重排布局，保证高度与位置稳定。

- 前台保存与后台同步隔离  
  本地写入先标记为 dirty/pending；在线保存成功后再标记 synced，并在同步队列里跳过 pending 项，避免前台保存与后台 flush 并发导致的乐观锁冲突与重复请求。

- 协作与 AI 按需启用  
  Yjs 协作连接与 AI 面板采用动态加载与权限/网络条件触发，仅在需要时建立 WS 或加载相关代码，减少未使用场景下的包体与运行开销。

## 快速开始（本地开发与部署）

下面提供三种常见用法：本地开发、生产部署（Vercel/自托管）、以及可选的协作 WS 服务自建。

### 1）本地开发（推荐）

**前置条件**

- Node.js 18+
- pnpm
- Docker（用于本地 Postgres）

**启动数据库**

```bash
docker compose up -d
```

默认会启动 `postgres:16`，端口映射为 `localhost:55432`（见根目录 `docker-compose.yml`）。

**配置环境变量**

复制并填写环境变量：

```bash
cp .env.example .env
```

至少需要（本地/生产通用）：

- `DATABASE_URL`：PostgreSQL 连接串（本地 compose 默认可用：`postgres://byte_note:byte_note@localhost:55432/byte_note`）
- `NEXTAUTH_SECRET`：任意随机字符串
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`：GitHub OAuth 应用配置
- （生产必需）`NEXTAUTH_URL`：你的站点域名；本地一般是 `http://localhost:3000`
- （可选）`DEEPSEEK_API_KEY` 或 `SILICONFLOW_API_KEY`：启用 AI 功能
- （可选）`BLOB_READ_WRITE_TOKEN`：启用头像上传（Vercel Blob）

**安装依赖并启动**

```bash
pnpm install
pnpm prisma migrate dev
pnpm run dev
```

如你不想创建迁移文件，也可以使用 `pnpm prisma db push` 快速同步 schema（更适合本地快速试用）。

### 2）生产部署（Web 应用）

ByteNote 是 Next.js 全栈应用（App Router + tRPC），生产环境你可以选择：

- **Vercel 部署（推荐）**：简单省心，适合快速上线。
- **自托管部署（Docker/Node）**：适合需要自有网络/数据合规/内网部署的场景。

**生产环境必需变量**

- `DATABASE_URL`：生产 Postgres
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`：你的站点域名（例如 `https://your-domain.com`）
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`

**可选变量**

- AI：`SILICONFLOW_API_KEY`（或兼容的 `DEEPSEEK_API_KEY`），以及可选 `SILICONFLOW_API_URL / SILICONFLOW_MODEL`
- 头像上传：`BLOB_READ_WRITE_TOKEN`

### 3）可选：自建协作 WebSocket 服务（service/）

协作编辑依赖一个独立的 Yjs WebSocket 广播服务（默认不持久化任何数据）。你可以使用本仓库自带的 `service/` 目录来部署，详细说明见 `service/README.md`。

**Docker 方式（单容器）**

```bash
docker build -t bytenote-collab ./service
docker run -d --name bytenote-collab -p 1234:1234 \
  -e WS_PORT=1234 \
  -e ALLOWED_ORIGINS="https://your-domain.com" \
  bytenote-collab
```

**Docker Compose 方式（推荐）**

```bash
cd service
docker compose up -d
```

`ALLOWED_ORIGINS` 支持逗号分隔，建议生产环境通过反向代理 + 证书提供 `wss://`。

部署完成后，在 ByteNote 的“协作服务器”输入框中填写 WS 地址：

- 本地：`ws://localhost:1234`
- 生产：`wss://your-domain.com`（建议由反代提供 443 端口）

## 技术栈

### 基础与工程体系

- 语言与类型：全项目 TypeScript。前后端共享类型，配合 tRPC 的类型推导，减少接口与实体的重复定义。
- 运行时/包管理：Node.js 18+；pnpm + pnpm-workspace.yaml 组织为单仓多包。主 Web 应用在根目录，协作 WebSocket 服务在 service/ 里独立为一个小包。
- 代码规范与质量：ESLint 9 + eslint-config-next；Prettier 3（含tailwindcss 排序插件）；Husky + lint-staged 做提交前自动 lint/format（eslint.config.mjs、prettier.config.mjs、.husky/）。

### 前端与路由层

- 框架：Next.js 16（App Router）。页面与路由在 app/ 中，API 路由也走 App Router，实现同仓全栈。
- UI 渲染：React 19。大量业务组件在 components/，配合 hooks 抽离逻辑（hooks/）。
- PWA：next-pwa；在 next.config.ts 中配置，使应用可离线缓存。

### 样式与交互

- 样式方案：Tailwind CSS 4 + PostCSS。整体以原子类为主，减少手写 CSS。
- 组件与交互基元：Radix UI（对话框、选择器、label、slot 等），用于构建可访问性较好的基础组件。
- 视觉与体验增强：lucide-react 图标；sonner 作为全局 toast；clsx / class-variance-authority / tailwind-merge 做 class 组合与变体管理；tw-animate-css 提供轻量动画。

### 编辑器与文档能力

- Markdown 解析/粘贴：自研 parseMarkdown + Slate 扩展插件
- 富文本/协作编辑核心：Slate 生态（slate、slate-react、slate-history、slate-dom）。
- 协作集成：slate-yjs 将 Slate 的文档结构映射到 Yjs 的共享数据类型，实现“编辑器状态 <-> CRDT 文档”的双向同步。

### 数据获取、状态与校验

- API 通信：tRPC v11，前后端同构路由与类型，实现了定义过程、适配入口、初始化客户端。
- 请求缓存：@tanstack/react-query v5 与 tRPC React Query 适配器一起使用，处理 list/detail/infinite query 等。
- 本地状态：Zustand，用于 sidebar、网络/协作状态、编辑器 UI 状态等。
- 校验与序列化：Zod 做输入校验/推断；SuperJSON 让 tRPC 能稳定传递Date、Map 等复杂类型。
- 虚拟列表/滚动渲染：react-virtual

### 鉴权与用户体系

- 认证框架：NextAuth v4，支持 GitHub OAuth 登录。
- 数据适配：@next-auth/prisma-adapter 将 NextAuth 的用户/会话模型落到 Postgres。
- 会话策略：JWT + 服务端 session 获取工具。

### 数据库与持久

- 数据库：PostgreSQL。开发环境通过 docker-compose.yml 一键起本地库。
- ORM：Prisma 6，提供类型安全的 CRUD 与迁移/同步。
- 协作服务/数据库均提供 Docker & Compose 部署方案。

### 实时协作与同步

- CRDT 引擎：Yjs 作为冲突自动合并的核心。
- 传输协议：y-websocket + WebsocketProvider，前端按需启用并连接协作 WS。
- 协作服务：service/ 目录下有一个极简的 Yjs WebSocket Server，用于房间/文档广播。

### 文件/对象存储

- Vercel Blob：@vercel/blob（头像上传等可选能力），通过环境变量 BLOB_READ_WRITE_TOKEN 配置。

## 致谢 / 协议

### 致谢

感谢字节工程训练营提供系统化的工程实践机会，让我在真实项目中把前端工程化、全栈协作与性能优化等能力串联起来并完成落地。也特别感谢组内导师的指导，对 ByteNote 的完善帮助很大。

### 协议

本项目当前未附带 `LICENSE`；如需用于开源发布或二次分发，建议补充合适的开源协议文件。
