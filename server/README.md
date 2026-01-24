# 工作笔记小程序后台API服务

## 安装依赖

```bash
npm install
```

## 配置数据库

1. 创建数据库和用户（执行 `../database/schema.sql`）
   ```bash
   mysql -u root -p < ../database/schema.sql
   ```
   
   这会自动创建：
   - 数据库 `worknote`
   - 用户 `worknote`（默认密码：`worknote_password`）
   - 所有必要的表结构

2. 配置环境变量或修改 `app.js` 中的数据库配置：
   - DB_HOST: 数据库主机（默认：localhost）
   - DB_USER: 数据库用户名（默认：worknote）
   - DB_PASSWORD: 数据库密码（默认：worknote_password，**生产环境请修改**）
   - DB_NAME: 数据库名称（默认：worknote）

3. **重要**：生产环境请修改默认密码！

## 启动服务

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

服务默认运行在 `http://localhost:3000`

## API接口

### POST /worknoteApi/upload-data

上传数据到服务器

**请求头：**
- Content-Type: text/plain
- x-user-id: 用户ID（可选，默认1）

**请求体：**
导出的文本数据

**响应：**
```json
{
  "success": true,
  "message": "数据上传成功",
  "stats": {
    "taskCount": 10,
    "todoCount": 5,
    "logCount": 20,
    "categoryCount": 8
  }
}
```

### GET /worknoteApi/health

健康检查接口

**响应：**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**注意：** API路径前缀为 `/worknoteApi`，避免与其他服务冲突。

## 部署

可以使用 PM2 或其他进程管理器部署：

```bash
pm2 start app.js --name worknote-api
```
