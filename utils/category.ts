// utils/category.ts
import { Category, CategoryColor } from '../types/common'
import { getStorageSync } from './storage'

interface CategoryItem {
  name: string
  color: string
}

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
  return Object.values(Category).map(cat => ({
    name: cat,
    color: CategoryColor[cat] || '#969799'
  }))
}

