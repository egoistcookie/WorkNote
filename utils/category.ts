// utils/category.ts
import { Category, CategoryColor } from '../types/common'
import { getStorageSync, setStorageSync } from './storage'

export interface CategoryItem {
  name: string
  color: string
}

// 默认颜色选项（已去重）
export const DEFAULT_COLOR_OPTIONS = [
  '#1989fa', '#07c160', '#ff9800', '#ee0a24', '#9c27b0', '#00bcd4', '#ffc107', '#e91e63', '#607d8b', '#795548',
  '#f44336', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#009688', '#4caf50',
  '#8bc34a', '#cddc39', '#ffeb3b', '#ff5722', '#9e9e9e', '#424242',
  '#ffb3d9', '#ffe66d', '#fff9c4', '#b3d9ff', '#c8e6c9', '#4ecdc4', '#ff6b6b', '#a8e6cf', '#ffd3b6', '#ffaaa5'
]

/**
 * 获取分类颜色（优先从存储读取，如果没有则使用默认颜色）
 */
export function getCategoryColor(categoryName: string): string {
  // 从存储获取所有分类
  const savedCategories = getStorageSync<CategoryItem[]>('all_categories')
  
  if (savedCategories && savedCategories.length > 0) {
    const savedCategory = savedCategories.find(cat => cat.name === categoryName)
    if (savedCategory) {
      return savedCategory.color
    }
  }
  
  // 如果没有找到，尝试从默认分类中获取
  const categoryEnum = Object.values(Category).find(cat => cat === categoryName)
  if (categoryEnum) {
    return CategoryColor[categoryEnum] || '#969799'
  }
  
  // 默认颜色
  return '#969799'
}

/**
 * 获取所有分类（优先从存储读取）
 */
export function getAllCategories(): CategoryItem[] {
  const savedCategories = getStorageSync<CategoryItem[]>('all_categories')
  
  if (savedCategories && savedCategories.length > 0) {
    return savedCategories
  }
  
  // 如果没有保存的分类，返回默认分类
  const defaultCategories = Object.values(Category).map(cat => ({
    name: cat,
    color: CategoryColor[cat] || '#969799'
  }))
  // 初始化并保存默认分类
  setStorageSync('all_categories', defaultCategories)
  return defaultCategories
}

/**
 * 设置所有分类
 */
export function setAllCategories(categories: CategoryItem[]): void {
  setStorageSync('all_categories', categories)
}

