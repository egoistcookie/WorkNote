# 数据库部署说明

## 快速部署

### 1. 使用 root 用户执行 SQL 脚本

```bash
mysql -u root -p < schema.sql
```

或者登录 MySQL 后执行：

```sql
source schema.sql;
```

### 2. 手动创建用户（如果自动创建失败）

如果 MySQL 版本不支持 `CREATE USER IF NOT EXISTS`，可以手动执行：

```sql
-- 创建用户
CREATE USER 'worknote'@'localhost' IDENTIFIED BY 'worknote_password';
CREATE USER 'worknote'@'%' IDENTIFIED BY 'worknote_password';

-- 授予权限
GRANT ALL PRIVILEGES ON worknote.* TO 'worknote'@'localhost';
GRANT ALL PRIVILEGES ON worknote.* TO 'worknote'@'%';

-- 刷新权限
FLUSH PRIVILEGES;
```

### 3. 修改密码（可选）

为了安全，建议修改默认密码：

```sql
ALTER USER 'worknote'@'localhost' IDENTIFIED BY 'your_secure_password';
ALTER USER 'worknote'@'%' IDENTIFIED BY 'your_secure_password';
FLUSH PRIVILEGES;
```

然后更新 `server/app.js` 或环境变量中的密码。

## 数据库用户说明

- **用户名**: `worknote`
- **默认密码**: `worknote_password`（生产环境请修改）
- **权限**: 仅对 `worknote` 数据库拥有全部权限
- **访问范围**: 
  - `localhost`: 本地访问
  - `%`: 远程访问（生产环境建议限制IP）

## 安全建议

1. **修改默认密码**：部署到生产环境前，务必修改默认密码
2. **限制访问IP**：生产环境建议将 `'%'` 改为具体的服务器IP
3. **使用环境变量**：不要在代码中硬编码密码，使用环境变量
4. **定期备份**：定期备份数据库数据

## 环境变量配置

在 `server` 目录创建 `.env` 文件：

```env
DB_HOST=localhost
DB_USER=worknote
DB_PASSWORD=your_secure_password
DB_NAME=worknote
PORT=3000
```

## 验证连接

测试数据库连接：

```bash
mysql -u worknote -p worknote
```

输入密码后，如果成功连接，说明用户创建成功。
