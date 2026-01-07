# GitHub 仓库改名说明

## 方法一：在 GitHub 网页上直接改名（推荐）

1. **登录 GitHub**，进入你的仓库页面

2. **点击仓库设置**
   - 在仓库页面，点击右上角的 "Settings"（设置）标签

3. **修改仓库名称**
   - 在 "Repository name"（仓库名称）输入框中
   - 将 `workNote` 改为 `WorkNote`
   - 点击 "Rename"（重命名）按钮

4. **确认改名**
   - GitHub 会提示你确认，点击确认即可

## 方法二：使用 GitHub CLI（命令行）

如果你安装了 GitHub CLI，可以使用命令：

```bash
gh repo rename WorkNote
```

## 改名后的操作

### 1. 更新本地仓库的远程地址

GitHub 仓库改名后，需要更新本地仓库的远程地址：

```bash
# 查看当前远程地址
git remote -v

# 更新远程地址（将 username 替换为你的 GitHub 用户名）
git remote set-url origin https://github.com/egoistcookie/WorkNote.git

# 或者使用 SSH（如果你使用 SSH）
git remote set-url origin git@github.com:username/WorkNote.git

# 验证更新
git remote -v
```

### 2. 测试连接

```bash
# 拉取最新代码测试连接
git fetch origin

# 如果成功，说明配置正确
```

## 注意事项

1. **GitHub 会自动处理重定向**
   - 旧的仓库 URL 会自动重定向到新的 URL
   - 但建议更新所有引用旧 URL 的地方

2. **更新其他地方的引用**
   - 如果项目中有文档、配置文件等引用了仓库 URL，需要手动更新
   - 检查 README.md、package.json 等文件中的仓库链接

3. **通知协作者**
   - 如果有其他协作者，需要通知他们更新远程地址
   - 他们也需要执行 `git remote set-url` 命令

4. **Webhooks 和集成**
   - 如果配置了 CI/CD、Webhooks 等，可能需要更新相关配置

## 快速命令总结

```bash
# 1. 更新远程仓库地址（替换 username）
git remote set-url origin https://github.com/username/WorkNote.git

# 2. 验证
git remote -v

# 3. 测试连接
git fetch origin
```

## 如果遇到问题

如果改名后无法连接，检查：
1. 仓库名称是否正确（区分大小写）
2. 是否有访问权限
3. 网络连接是否正常

