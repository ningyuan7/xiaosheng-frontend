# 校声 Xiaosheng · 校园社区前端

让校园里的声音被看见。

校声面向校园话题讨论，提供校园广场、近 24 小时十大热点、观点发布、赞同收藏、评论回复、站内通知和校园身份认证。管理员可审核认证、处理举报和管理内容。

本仓库是校声的 React 前端，需要配套 `xiaosheng-backend` 后端与数据库，页面中的互动和热度来自真实接口。

## 技术栈

React 18 · TypeScript · Vite · React Router · CSS Modules

## 本地开发

```bash
npm install
npm run dev
```

默认访问 `http://localhost:5173`。Vite 将 `/api` 请求转发到 `http://localhost:8080`，请先按后端 README 初始化数据库、配置密钥并启动服务。

复制 `.env.example` 为 `.env.local`，可以设置 `VITE_API_BASE_URL`。本地代理或生产同源部署可留空；使用独立后端域名时填写对应地址，并配置后端 CORS。

**所有 `VITE_` 变量都会进入浏览器构建产物，不得填写服务密钥、数据库密码或 JWT 私钥。**

## 页面

| 路径 | 页面 |
| --- | --- |
| `/` | 校园广场、话题与十大热点 |
| `/search` | 校园观点搜索 |
| `/create` | 发布话题及观点 |
| `/campus/topics/:id` | 话题讨论 |
| `/campus/opinions/:id` | 观点、图片及评论回复 |
| `/campus/account` | 校园身份与认证 |
| `/campus/notifications` | 通知与未读管理 |
| `/campus/admin` | 认证、举报及内容管理 |
| `/library` | 保留的知识库模块 |

游客可阅读公开内容；创建话题、发表观点和参与互动需要校园认证，本校内容仅向已认证的本校用户开放。学号不公开展示，管理员权限由后端配置决定。

## 目录

```text
src/pages/campus/          校园业务页面与样式
src/services/             接口封装
src/context/              会话状态
src/components/           布局和通用组件
src/types/                数据类型
public/                   静态资源
```

为兼容既有会话，浏览器本地存储键及部分旧接口字段保留历史名称，不影响页面品牌。

## 检查与构建

```bash
npm run lint
npm run build
npm run preview
```

`lint` 当前执行 TypeScript 类型检查。生产构建输出至 `dist/`；部署时需设置 SPA 路由回退到 `index.html`，并让 `/api` 转发到后端，或在构建前设置 `VITE_API_BASE_URL`。

当前版本为单校园试用。验证码发送、真实 OSS Bucket、管理员账号和认证审核需要在后端完成配置，尚未接入匿名发言或私信。

## 提交说明

可以提交源代码、`package-lock.json` 和 `.env.example`；`.env*` 本地配置、`node_modules/`、`dist/`、日志及 IDE 文件已加入忽略规则。已有 Git 历史中若存在敏感信息，仍需在公开推送前处理。
