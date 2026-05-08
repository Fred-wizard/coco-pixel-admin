# Coco Pixel Admin

Coco Pixel 后台管理前端，独立于用户产品工程。它通过 `NEXT_PUBLIC_API_BASE_URL` 连接主产品 API，并调用 `/api/admin/*` 管理接口。

## 能力

- 管理员登录。
- 查看系统概览：用户、项目、版本、导出、色卡。
- 查看用户列表并切换角色/套餐。
- 查看最近项目与色卡版本状态。
- 查看导出队列和失败原因。
- 检查主产品健康状态与数据库 ready 状态。

## 开发

```bash
pnpm install
copy .env.example .env.local
pnpm dev --port 3001
```

默认连接主产品服务：

```bash
NEXT_PUBLIC_API_BASE_URL="http://localhost:3000"
```
