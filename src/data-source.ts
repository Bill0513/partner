// src/data-source.ts (或项目根目录)

import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv'; // 用于加载 .env 文件给 CLI 使用
import * as path from 'path'; // 引入 path 模块

// 加载 .env 文件中的环境变量到 process.env
// 这使得我们可以在本地运行 CLI 命令时使用 .env 文件
// 在 Vercel 环境中，环境变量由 Vercel 注入，dotenv 不会覆盖它们
config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  // 使用 process.env 直接读取环境变量
  host: process.env.MYSQL_SERVER_HOST,
  port: parseInt(process.env.MYSQL_SERVER_PORT || '3306', 10), // 提供默认端口并确保是数字
  username: process.env.MYSQL_SERVER_USERNAME,
  password: process.env.MYSQL_SERVER_PASSWORD,
  database: process.env.MYSQL_SERVER_DATABASE,

  // !!! 关键：CLI 使用时 synchronize 必须为 false !!!
  // 迁移操作依赖于数据库的实际状态，而不是自动同步
  synchronize: false,

  // CLI 操作时开启日志通常很有用
  logging: true, // 或者根据需要设置为 ['error', 'warn', 'migration'] 或 false

  // 指向你的实体文件
  // **重要:** 路径需要指向编译后的 JS 文件，或者在使用 ts-node 时指向 TS 文件
  // 这个路径模式会查找 src 目录下所有符合 .entity.ts 或 .entity.js 结尾的文件
  // 根据你的项目结构和编译输出调整此路径！
  // 明确指向 dist 目录下的 JS 实体文件
  entities: [path.join(process.cwd(), 'dist/**/*.entity.js')],
  // 明确指向 dist 目录下的 JS 迁移文件
  migrations: [path.join(process.cwd(), 'dist/migrations/*.js')],
  // 如果此文件在项目根目录，使用: migrations: ['src/migrations/*{.ts,.js}'],

  // 迁移历史记录表的名称 (可选, 'migrations' 是 TypeORM 0.3+ 的默认值，之前是 'typeorm_migrations')
  migrationsTableName: 'typeorm_migrations', // 与你 app.module 中保持一致或使用默认

  // 从 app.module.ts 复制过来的其他选项
  poolSize: parseInt(process.env.DATABASE_POOL_SIZE || '10', 10), // 使池大小也可配置（可选）
  connectorPackage: 'mysql2',
  timezone: '+08:00',
};

// 创建 DataSource 实例
const dataSource = new DataSource(dataSourceOptions);

// 导出 DataSource 实例，供 CLI 使用
export default dataSource;
