# 工作笔记微信小程序

一个基于微信小程序开发的笔记类应用，支持日程管理、任务跟踪、日志记录等功能。

## 项目简介

本项目是一个工作笔记类微信小程序，采用原生微信小程序框架开发，使用 TypeScript 编写，集成 Vant Weapp UI 组件库。主要功能包括：

- 📅 日历视图：支持日期选择和周视图展示
- 📝 晨间日志：记录每日计划和目标
- ✅ 任务管理：创建和管理工作任务，支持分类标签
- 🌙 夜晚总结：记录每日工作总结和反思
- 📊 时间线：按时间顺序查看所有记录

## 技术栈

- **框架**：原生微信小程序
- **语言**：TypeScript
- **UI框架**：Vant Weapp
- **构建工具**：微信开发者工具

## 项目结构

```
workNote/
├── app.json                 # 小程序全局配置
├── app.ts                   # 小程序入口文件
├── app.wxss                 # 全局样式
├── sitemap.json            # 站点地图配置
├── project.config.json      # 项目配置文件
├── tsconfig.json           # TypeScript配置
├── package.json            # 依赖管理
├── README.md               # 项目说明文档
├── pages/                  # 页面目录
│   ├── timeline/          # 时间线页面（主页面）
│   ├── todo/               # 待办页面
│   ├── other/              # 其他页面
│   └── profile/            # 个人页面
├── components/             # 组件目录
│   ├── calendar/          # 日历组件
│   ├── task-item/         # 任务项组件
│   └── log-input/         # 日志输入组件
├── utils/                  # 工具函数
│   ├── date.ts            # 日期处理工具
│   └── storage.ts         # 本地存储工具
├── types/                  # TypeScript类型定义
│   ├── task.ts            # 任务类型
│   ├── log.ts             # 日志类型
│   └── common.ts          # 通用类型
└── assets/                 # 静态资源
    └── images/            # 图片资源
```

## 安装步骤

### 1. 环境要求

- Node.js >= 12.0.0
- 微信开发者工具（最新版本）
- npm 或 yarn

### 2. 安装依赖

```bash
# 安装项目依赖
npm install

# 或使用 yarn
yarn install
```

### 3. 构建 npm

在微信开发者工具中：

1. 点击菜单栏 `工具` -> `构建 npm`
2. 等待构建完成

### 4. 配置项目

1. 使用微信开发者工具打开项目
2. 在 `project.config.json` 中配置你的 AppID（或使用测试号）
3. 确保 `app.json` 中的页面路径配置正确

### 5. 添加图标资源

在 `assets/images/` 目录下添加以下图标文件（或使用占位图）：

- `timeline.png` / `timeline-active.png` - 时间线图标
- `todo.png` / `todo-active.png` - 待办图标
- `other.png` / `other-active.png` - 其他图标
- `profile.png` / `profile-active.png` - 个人图标

## 开发说明

### 开发模式

1. 在微信开发者工具中打开项目
2. 点击 `编译` 按钮开始开发
3. 使用 `预览` 功能在手机上测试

### 代码规范

- 使用 TypeScript 编写所有 `.ts` 文件
- 遵循微信小程序开发规范
- 组件和页面使用 PascalCase 命名
- 工具函数使用 camelCase 命名

### 组件使用

#### Calendar 组件

```xml
<calendar 
  selectedDate="{{selectedDate}}"
  bind:datechange="onDateChange"
/>
```

#### TaskItem 组件

```xml
<task-item 
  task="{{task}}"
  bind:tap="onTaskTap"
/>
```

#### LogInput 组件

```xml
<log-input
  type="morning"
  title="晨间日志"
  placeholder="点击记录今日计划..."
  icon="sunrise-o"
  value="{{morningLog}}"
  bind:tap="onMorningLogTap"
/>
```

### 类型定义

项目使用 TypeScript，所有类型定义在 `types/` 目录下：

- `types/task.ts` - 任务相关类型
- `types/log.ts` - 日志相关类型
- `types/common.ts` - 通用类型和枚举

### 工具函数

#### 日期处理 (utils/date.ts)

```typescript
import { formatDate, formatTime, getCurrentDate } from '../../utils/date'

const today = getCurrentDate() // "2024-01-07"
const time = formatTime(new Date()) // "16:10"
```

#### 本地存储 (utils/storage.ts)

```typescript
import { setStorageSync, getStorageSync } from '../../utils/storage'

setStorageSync('key', value)
const data = getStorageSync('key')
```

## 功能说明

### 已实现功能

- ✅ 项目基础结构搭建
- ✅ 日历组件（周视图）
- ✅ 任务列表展示
- ✅ 晨间日志和夜晚总结输入框
- ✅ 底部导航栏
- ✅ 浮动操作按钮（FAB）
- ✅ TypeScript 类型定义
- ✅ 工具函数封装

### 待开发功能

- ⏳ 任务创建和编辑
- ⏳ 日志编辑页面
- ⏳ 数据持久化存储
- ⏳ 任务状态管理
- ⏳ 日期选择器弹窗
- ⏳ 搜索功能
- ⏳ 数据统计和报表

## 注意事项

1. **图片资源**：当前 tabBar 图标路径已配置，但需要添加实际图片文件。可以使用占位图或从 Vant Weapp 图标库选择。

2. **Vant Weapp 组件**：项目已配置 Vant Weapp，但需要确保 npm 构建成功。如果遇到组件未找到的错误，请重新构建 npm。

3. **TypeScript 编译**：微信开发者工具会自动编译 TypeScript，确保 `tsconfig.json` 配置正确。

4. **数据存储**：当前使用模拟数据，后续需要实现真实的数据存储逻辑（本地存储或云开发）。

5. **页面路由**：确保 `app.json` 中的页面路径与实际文件结构一致。

## 常见问题

### Q: npm 构建失败？

A: 确保已执行 `npm install`，然后在微信开发者工具中重新构建 npm。

### Q: 组件找不到？

A: 检查 `app.json` 中的 `usingComponents` 配置，确保路径正确。

### Q: TypeScript 类型错误？

A: 确保安装了 `miniprogram-api-typings`，检查 `tsconfig.json` 配置。

## 开发计划

- [ ] 完善任务管理功能
- [ ] 实现日志编辑功能
- [ ] 添加数据持久化
- [ ] 优化 UI 和交互体验
- [ ] 添加数据统计功能
- [ ] 支持云开发

## 许可证

MIT License

## 联系方式

如有问题或建议，欢迎提交 Issue 或 Pull Request。

