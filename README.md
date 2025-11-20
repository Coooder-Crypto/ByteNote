## 项目简介

Byte Note 是字节训练营前端课程的笔记作品，技术栈基于 Next.js 16 (App Router) + tRPC + Prisma + PostgreSQL + TailwindCSS + shadcn/ui。

### 核心功能

- Markdown 笔记编辑与预览（基于 `@uiw/react-md-editor` / `react-markdown-preview`）
- tRPC API + Prisma ORM + Postgres 数据持久化
- 用户体系：注册 / 登录 / 会话 / Session Cookie / 头像上传（Vercel Blob）
- 笔记标签、公开笔记广场、筛选 + 搜索
- GitHub 风格的贡献热力图 & Profile 仪表盘

## 本地开发

```bash
pnpm install
pnpm prisma generate
pnpm dev
```

默认 `.env` 使用本地 Postgres 容器或 Vercel Pull 下来的云端连接，请确保 `DATABASE_URL`、`BLOB_READ_WRITE_TOKEN` 已在 `.env` 配置。

## 部署说明

1. 准备 Postgres（本项目使用 Vercel Prisma Postgres，也可以自行部署），配置 `DATABASE_URL`。
2. 在 Vercel 上创建项目，执行 `vercel link`、`vercel env pull/push` 同步环境变量。
3. 配置 Blob：`BLOB_READ_WRITE_TOKEN` 需通过 `vercel blob` 或控制台生成（部署项目并开通 Blob 后执行 `vercel env pull`），否则头像上传接口会 403。
4. 运行 `pnpm build`（脚本里会自动 `prisma generate`），确保通过，再执行 `pnpm dlx vercel deploy --prod --yes`。

需要放行 Prisma 等依赖的安装脚本时，可在本地执行 `pnpm approve-builds`（若 Vercel 仍提示，可改为 `prisma generate && next build` 组合，如本项目）。

<details>
<summary><strong>📌 开发 TODO</strong></summary>

### 阶段一 项目初始化与基础工程能力

### 阶段一 项目初始化与基础工程能力

- [x] 初始化仓库和基础框架
  - [x] 创建项目结构（Next.js）
  - [x] 配置包管理工具（pnpm）
  - [x] 引入 UI 技术栈（TailwindCSS + shadcn ui）

- [x] 工程规范与基础工具
  - [x] 配置 TypeScript
  - [x] 配置 ESLint 和 Prettier
  - [x] 配置基础 Git 忽略规则

- [x] 后端与数据库基础
  - [x] 通过 Docker 启动本地开发数据库容器（Postgres）
  - [x] 接入数据库（Prisma）
  - [x] 定义用户和笔记的基础数据模型，跑通交互
  - [x] 搭建基础 API 层（tRPC）

---

### 阶段二 用户体系和鉴权

- [x] 用户数据模型完善
  - [x] 完善 user 表结构设计
  - [x] user avatar：用 vercel blob 来存储

- [x] 鉴权逻辑
  - [x] 实现用户注册接口
  - [x] 实现用户登录接口
  - [x] 实现退出登录接口
  - [x] 前端登录状态管理
  - [x] 未登录用户访问笔记页面时跳转登录（笔记部分做好了再加，private 的笔记不给看）

- [x] 基础页面
  - [x] 注册页面
  - [x] 登录页面
  - [x] 登录后基础布局框架（顶栏 侧边栏 内容区）

---

### 阶段三 核心笔记功能（基于 Markdown）

- [x] 笔记数据模型完善
  - [x] 为笔记补充字段，添加 Public/Private 设计
  - [x] 为未来标签和分类预留字段（如 categoryId tags 关联）
  - [ ] 可能还有 embedding 相关的字段，用来做 ai 相关的功能，做到 ai 的时候再说吧

- [x] 笔记 CRUD 接口
  - [x] 新建笔记接口
  - [x] 更新笔记接口
  - [x] 删除笔记接口
  - [x] 查询单条笔记接口
  - [x] 查询当前用户笔记列表接口
  - [x] 查询所有的 Public 笔记，做一个笔记广场

- [x] 前端页面和交互
  - [x] 笔记列表页（自己的、笔记广场）
  - [x] 编辑笔记页面（自己的）
  - [x] 笔记详情查看页（其他人的）

- [x] Markdown 编辑与预览
  - [x] 接入 Markdown 编辑输入组件，借助第三方库
  - [x] 接入 Markdown 渲染库实现预览，借助第三方库

---

### 阶段四 笔记组织和检索能力

- [x] 笔记标签
  - [x] 在笔记模型中增加标签字段
  - [x] 支持在编辑页为笔记添加和移除标签

- [ ] 列表展示与分页
  - [x] 列表展示笔记标题 更新时间 标签等基础信息
  - [ ] 实现分页查询接口

- [x] 搜索与筛选
  - [x] 标题关键词搜索
  - [x] 内容关键词搜索（先做简单模糊匹配）
  - [x] 按标签筛选
  - [x] 搜索条件与标签筛选组合使用

---

### 阶段五 P0 体验优化与真实部署

- [ ] 交互体验优化
  - [ ] 编辑时自动保存（定时或输入防抖）
  - [ ] 主题切换（明暗模式）
  - [ ] 常用快捷键支持（如 Cmd 加 S 触发保存）

- [ ] 性能优化
  - [ ] 对 Markdown 渲染部分做懒加载或按需加载
  - [ ] 首屏加载优化（拆分路由和组件）
  - [ ] 列表渲染优化（笔记列表）

- [x] 部署与演示
  - [x] 选择部署方案（Vercel）
  - [x] 完成一次线上部署
  - [x] 在 README 中写明访问入口和演示说明

---

### 阶段六 P1 优化：离线编辑与同步，这部分接触比较少，先不详细写todo了

- [ ] 离线编辑能力
- [ ] 本地缓存支持
- [ ] 协同编辑基础

---

### 阶段七 P2 优化：AI 融合与智能检索，这部分接触比较少，先不详细写todo了

- [ ] AI 检索
- [ ] AI 摘要、主题聚合

---

### 阶段八 交付与文档

- [ ] GitHub 仓库整理
  - [ ] 提交完整项目代码
  - [ ] 添加 README（功能说明 技术栈 使用方法）

- [ ] 演示材料
  - [ ] 部署站点链接或演示视频链接
  - [ ] 简要操作说明（如何登录 如何创建和搜索笔记）

- [ ] 学习总结
  - [ ] 记录项目中遇到的主要问题
  - [ ] 说明具体解决方案和思路
  - [ ] 反思可以改进的地方和后续演进方向

</details>
