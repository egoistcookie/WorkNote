// types/common.ts
/**
 * 通用类型定义
 */

/**
 * 分类枚举
 */
export enum Category {
  // 生活类
  ENTERTAINMENT = '娱乐',
  ON_THE_ROAD = '路上',
  EXERCISE = '运动',
  HOUSEWORK = '家务',
  REST = '休息',
  NAP = '小憩',
  SLEEP = '睡觉',
  EAT = '吃饭',
  // 工作类
  WORK = '工作',
  SIDE_HUSTLE = '副业',
  MAIN_JOB = '主业',
  DEVELOPMENT = '开发',
  ASSIST_TESTING = '配合测试',
  DESIGN = '设计',
  TROUBLESHOOT_PRODUCTION = '排查生产',
  FOLLOW_PROCESS = '走流程',
  // 学习类
  STUDY = '学习',
  LEARN_PROGRAMMING = '学编程',
  // 其他
  OTHER = '其他'
}

/**
 * 分类颜色映射
 */
export const CategoryColor: Record<Category, string> = {
  // 生活类 - 浅黄色系
  [Category.ENTERTAINMENT]: '#ffb3d9', // 粉色
  [Category.ON_THE_ROAD]: '#fff9c4', // 浅黄色
  [Category.EXERCISE]: '#fff9c4',
  [Category.HOUSEWORK]: '#fff9c4',
  [Category.REST]: '#fff9c4',
  [Category.NAP]: '#fff9c4',
  [Category.SLEEP]: '#fff9c4',
  [Category.EAT]: '#fff9c4',
  // 工作类
  [Category.WORK]: '#fff9c4',
  [Category.SIDE_HUSTLE]: '#fff9c4',
  [Category.MAIN_JOB]: '#fff9c4',
  [Category.DEVELOPMENT]: '#ffb3d9', // 粉色
  [Category.ASSIST_TESTING]: '#fff9c4',
  [Category.DESIGN]: '#fff9c4',
  [Category.TROUBLESHOOT_PRODUCTION]: '#b3d9ff', // 浅蓝色
  [Category.FOLLOW_PROCESS]: '#ffb3d9', // 粉色
  // 学习类 - 浅绿色系
  [Category.STUDY]: '#c8e6c9', // 浅绿色
  [Category.LEARN_PROGRAMMING]: '#c8e6c9',
  // 其他
  [Category.OTHER]: '#9e9e9e'
}

/**
 * 页面路径
 */
export enum PagePath {
  TIMELINE = 'pages/timeline/index',
  TODO = 'pages/todo/index',
  OTHER = 'pages/other/index',
  PROFILE = 'pages/profile/index'
}

