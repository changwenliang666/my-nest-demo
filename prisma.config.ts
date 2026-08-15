// prisma.config.ts
// 完整注释版

import { config as loadEnv } from 'dotenv'
import { resolve } from 'path'
import { defineConfig } from 'prisma/config'

// Nest 项目里 .env 放在 src/.env；Prisma CLI 工作目录是项目根
loadEnv({ path: resolve(__dirname, 'src/.env') })
loadEnv({ path: resolve(__dirname, '.env') })

export default defineConfig({

  // ── schema 文件路径 ──────────────────────────────────────
  // 告诉 Prisma CLI 去哪里找数据模型定义文件
  // 相对于 prisma.config.ts 所在目录（项目根目录）
  schema: 'prisma/schema.prisma',

  // ── 迁移文件存放目录 ─────────────────────────────────────
  // 每次执行 prisma migrate dev，生成的 SQL 文件存放在这里
  // 这些文件记录了每次数据库结构变更的历史
  migrations: {
    path: 'prisma/migrations',
  },

  // ── 数据库连接配置 ───────────────────────────────────────
  datasource: {
    // 数据库连接字符串，从 .env 文件读取
    // 格式：postgresql://用户名:密码@主机:端口/数据库名?schema=public
    url: process.env.DATABASE_URL as string,
  },
})