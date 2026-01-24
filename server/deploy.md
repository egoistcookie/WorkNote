# 服务器部署指南

## 前提条件

- 服务器已安装 Node.js（建议 v16+）和 npm
- 服务器已安装 MySQL
- 服务器已安装 Nginx
- 域名已解析到服务器IP

**如果没有安装 Node.js，请先参考 `install-nodejs.md` 进行安装。**

## 部署步骤

### 0. 安装 Node.js 和 npm（如果未安装）

```bash
# 使用 NodeSource 仓库安装（推荐）
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 验证安装
node --version
npm --version
```

详细安装步骤请参考 `install-nodejs.md`。

### 1. 部署Node.js API服务

#### 1.1 上传代码到服务器

```bash
# 在服务器上创建项目目录
mkdir -p /var/www/worknote-api
cd /var/www/worknote-api

# 上传server目录下的所有文件到此目录
# 或使用git克隆项目
```

#### 1.2 安装依赖

```bash
cd /var/www/worknote-api
npm install
```

#### 1.3 配置环境变量

创建 `.env` 文件：

```bash
cat > .env << EOF
DB_HOST=localhost
DB_USER=worknote
DB_PASSWORD=Srcb@2026
DB_NAME=worknote
PORT=3000
NODE_ENV=production
EOF
```

#### 1.4 使用PM2启动服务

```bash
# 安装PM2（如果未安装）
npm install -g pm2

# 启动服务
pm2 start app.js --name worknote-api

# 设置开机自启
pm2 startup
pm2 save

# 查看服务状态
pm2 status
pm2 logs worknote-api
```

### 2. 配置Nginx

#### 2.1 复制Nginx配置

```bash
# 复制配置文件到Nginx配置目录
sudo cp server/nginx.conf /etc/nginx/sites-available/worknote-api

# 或使用conf.d目录（根据你的Nginx安装方式选择）
# sudo cp server/nginx.conf /etc/nginx/conf.d/worknote-api.conf
```

#### 2.2 创建软链接（如果使用sites-available）

```bash
sudo ln -s /etc/nginx/sites-available/worknote-api /etc/nginx/sites-enabled/
```

#### 2.3 测试Nginx配置

```bash
sudo nginx -t
```

#### 2.4 重载Nginx

```bash
sudo systemctl reload nginx
# 或
sudo nginx -s reload
```

### 3. 配置SSL证书（推荐）

#### 3.1 使用Let's Encrypt免费证书

```bash
# 安装certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d www.egoistcookie.top -d egoistcookie.top

# 证书会自动配置到Nginx
# 然后编辑nginx.conf，取消HTTPS配置的注释，注释掉HTTP配置
```

#### 3.2 手动配置SSL

如果有其他SSL证书，编辑nginx.conf，取消HTTPS配置部分的注释，并修改证书路径。

### 4. 配置防火墙

```bash
# 开放80和443端口
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 如果使用firewalld
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 5. 验证部署

#### 5.1 测试API服务

```bash
# 在服务器上测试（直接访问Node.js服务）
curl http://localhost:3000/worknoteApi/health

# 通过域名测试（通过Nginx代理）
curl https://www.egoistcookie.top/worknoteApi/health
```

#### 5.2 检查服务状态

```bash
# 检查PM2服务
pm2 status

# 检查Nginx服务
sudo systemctl status nginx

# 检查MySQL服务
sudo systemctl status mysql
```

## 常见问题

### 1. 502 Bad Gateway

- 检查Node.js服务是否运行：`pm2 status`
- 检查端口是否正确：`netstat -tlnp | grep 3000`
- 检查Nginx配置中的proxy_pass地址

### 2. 连接数据库失败

- 检查MySQL服务是否运行
- 检查数据库用户和密码是否正确
- 检查防火墙是否允许本地连接
- 测试数据库连接：
  ```bash
  mysql -u worknote -p -h localhost worknote
  ```

### 3. 域名无法访问

- 检查域名DNS解析是否正确
- 检查防火墙是否开放80/443端口
- 检查Nginx配置语法：`sudo nginx -t`

### 4. 404 Not Found（API接口）

如果小程序调用API返回404错误，请检查：

1. **Nginx配置问题**：
   - 确保 `nginx.conf` 中的 `location /worknoteApi` 配置正确
   - **重要**：不要使用 `rewrite` 规则去掉 `/worknoteApi` 前缀
   - Node.js应用的路由是 `/worknoteApi/upload-data`，需要保持完整路径

2. **检查Nginx配置**：
   ```bash
   # 测试配置语法
   sudo nginx -t
   
   # 查看Nginx错误日志
   sudo tail -f /var/log/nginx/error.log
   
   # 查看访问日志
   sudo tail -f /var/log/nginx/access.log
   ```

3. **验证路由是否注册**：
   ```bash
   # 在服务器上直接测试Node.js服务
   curl http://localhost:3000/worknoteApi/health
   curl -X POST http://localhost:3000/worknoteApi/upload-data -H "Content-Type: text/plain" -d "test"
   
   # 通过域名测试（通过Nginx代理）
   curl https://www.egoistcookie.top/worknoteApi/health
   ```

4. **检查Node.js服务**：
   ```bash
   # 查看服务状态
   pm2 status
   
   # 查看服务日志
   pm2 logs worknote-api
   ```

5. **微信小程序域名配置（真机预览必需）**：

   **重要**：开发工具可以绕过域名校验，但真机预览必须配置合法域名！

   **配置步骤**：
   
   1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
   2. 进入 **`开发`** → **`开发管理`** → **`开发设置`**
   3. 找到 **`服务器域名`** 部分
   4. 在 **`request合法域名`** 中添加：
      ```
      https://www.egoistcookie.top
      ```
   5. 点击 **`保存并提交`**
   6. **注意**：配置后可能需要等待几分钟生效

   **常见问题**：
   
   - **Q: 为什么开发工具可以，真机不行？**
     A: 开发工具可以关闭域名校验（`urlCheck: false`），但真机必须配置合法域名
   
   - **Q: 配置后还是失败？**
     A: 检查以下几点：
     1. 域名必须使用 HTTPS（不能是 HTTP）
     2. 域名不能带端口号（如 `https://www.egoistcookie.top:443` 是错误的）
     3. 配置后需要等待 5-10 分钟生效
     4. 确保服务器 SSL 证书有效
   
   - **Q: 如何测试域名是否配置成功？**
     A: 在真机上测试，如果配置成功，请求会正常发送；如果失败，会提示"不在合法域名列表中"
   
   **开发环境 vs 生产环境**：
   
   - **开发环境**：可以在开发工具中关闭域名校验（`project.config.json` 中 `urlCheck: false`）
   - **真机预览/生产环境**：必须在微信公众平台配置合法域名

### 5. 500 Internal Server Error（服务器内部错误）

如果小程序调用API返回500错误，请按以下步骤排查：

1. **查看服务器日志**：
   ```bash
   # 查看PM2日志（最重要）
   pm2 logs worknote-api --lines 50
   
   # 实时查看日志
   pm2 logs worknote-api --lines 0
   ```

2. **检查数据库连接**：
   ```bash
   # 测试数据库连接
   mysql -u worknote -p -h localhost worknote
   # 输入密码: Srcb@2026
   
   # 检查数据库和表是否存在
   mysql -u worknote -p -h localhost worknote -e "SHOW TABLES;"
   ```

3. **检查数据库配置**：
   ```bash
   # 查看环境变量配置
   cd /var/www/worknote-api
   cat .env
   
   # 确认配置是否正确
   # DB_HOST=localhost
   # DB_USER=worknote
   # DB_PASSWORD=Srcb@2026
   # DB_NAME=worknote
   ```

4. **检查用户表**：
   ```bash
   # 确认users表是否存在且有数据
   mysql -u worknote -p -h localhost worknote -e "SELECT * FROM users LIMIT 5;"
   
   # 如果users表为空，系统会自动创建默认用户（ID=1）
   ```

5. **测试健康检查接口**：
   ```bash
   # 测试数据库连接状态
   curl http://localhost:3000/worknoteApi/health
   
   # 如果返回 database: "disconnected"，说明数据库连接有问题
   ```

6. **常见500错误原因**：
   - **数据库连接失败**：检查MySQL服务是否运行、用户名密码是否正确
   - **表不存在**：执行 `schema.sql` 初始化数据库
   - **外键约束失败**：确保users表中存在对应的用户ID
   - **SQL语法错误**：检查数据库版本兼容性
   - **数据格式错误**：检查上传的数据格式是否正确

7. **重启服务**：
   ```bash
   # 重启Node.js服务
   pm2 restart worknote-api
   
   # 查看重启后的日志
   pm2 logs worknote-api --lines 20
   ```

## 维护命令

```bash
# 查看API服务日志
pm2 logs worknote-api

# 重启API服务
pm2 restart worknote-api

# 查看Nginx日志
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# 重启Nginx
sudo systemctl restart nginx
```

## 安全建议

1. **修改默认密码**：确保数据库密码足够复杂
2. **使用HTTPS**：配置SSL证书，强制使用HTTPS
3. **限制数据库访问**：只允许本地连接，删除远程用户（如果不需要）
4. **定期备份**：设置数据库自动备份
5. **更新系统**：定期更新系统和依赖包
