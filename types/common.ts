// types/common.ts
/**
 * 通用类型定义
 */

/**
 * 分类枚举
 */
export enum Category {
  DEVELOPMENT = '开发',
  DESIGN = '设计',
  MEETING = '会议',
  STUDY = '学习',
  OTHER = '其他'
}

/**
 * 分类颜色映射
 */
export const CategoryColor: Record<Category, string> = {
  [Category.DEVELOPMENT]: '#7232dd',
  [Category.DESIGN]: '#ff9800',
  [Category.MEETING]: '#2196f3',
  [Category.STUDY]: '#4caf50',
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

