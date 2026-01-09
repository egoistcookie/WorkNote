// pages/category-manage/index.ts
import { Category, CategoryColor } from '../../types/common'
import { getStorageSync, setStorageSync } from '../../utils/storage'

interface CategoryItem {
  name: string
  color: string
}

Page({
  data: {
    categories: [] as CategoryItem[],
    showAddModal: false,
    newCategoryName: '',
    newCategoryColor: '#1989fa',
    editingIndex: -1
  },

  onLoad() {
    this.loadCategories()
  },

  loadCategories() {
    // 从存储获取所有分类（包括默认分类的修改）
    const savedCategories = getStorageSync<CategoryItem[]>('all_categories')
    
    if (savedCategories && savedCategories.length > 0) {
      // 使用保存的分类
      this.setData({
        categories: savedCategories
      })
    } else {
      // 首次加载，使用默认分类
      const defaultCategories: CategoryItem[] = Object.values(Category).map(cat => ({
        name: cat,
        color: CategoryColor[cat] || '#969799'
      }))
      setStorageSync('all_categories', defaultCategories)
      this.setData({
        categories: defaultCategories
      })
    }
  },

  onAddCategory() {
    this.setData({
      showAddModal: true,
      newCategoryName: '',
      newCategoryColor: '#1989fa',
      editingIndex: -1
    })
  },

  onCategoryNameInput(e: WechatMiniprogram.Input) {
    this.setData({
      newCategoryName: e.detail.value
    })
  },

  onColorChange(e: WechatMiniprogram.TouchEvent) {
    const { color } = e.currentTarget.dataset
    this.setData({
      newCategoryColor: color
    })
  },

  onSaveCategory() {
    const { newCategoryName, newCategoryColor, editingIndex, categories } = this.data
    
    if (!newCategoryName.trim()) {
      wx.showToast({
        title: '请输入分类名称',
        icon: 'none'
      })
      return
    }

    // 检查是否已存在
    const exists = categories.some((cat: CategoryItem, index: number) => 
      cat.name === newCategoryName && index !== editingIndex
    )
    
    if (exists) {
      wx.showToast({
        title: '分类已存在',
        icon: 'none'
      })
      return
    }

    if (editingIndex >= 0) {
      // 编辑模式
      const updatedCategories = [...categories]
      updatedCategories[editingIndex] = {
        name: newCategoryName,
        color: newCategoryColor
      }
      
      setStorageSync('all_categories', updatedCategories)
      
      this.setData({
        categories: updatedCategories,
        showAddModal: false
      })
    } else {
      // 新增模式
      const newCategory: CategoryItem = {
        name: newCategoryName,
        color: newCategoryColor
      }
      
      const updatedCategories = [...categories, newCategory]
      setStorageSync('all_categories', updatedCategories)
      
      this.setData({
        categories: updatedCategories,
        showAddModal: false
      })
    }
  },

  onCancelAdd() {
    this.setData({
      showAddModal: false,
      newCategoryName: '',
      editingIndex: -1
    })
  },

  onDeleteCategory(e: WechatMiniprogram.TouchEvent) {
    const { index } = e.currentTarget.dataset
    const { categories } = this.data

    wx.showModal({
      title: '确认删除',
      content: `确定要删除分类"${categories[index].name}"吗？`,
      success: (res) => {
        if (res.confirm) {
          const updatedCategories = categories.filter((_: CategoryItem, i: number) => i !== index)
          setStorageSync('all_categories', updatedCategories)
          
          this.setData({
            categories: updatedCategories
          })
        }
      }
    })
  },

  onEditCategory(e: WechatMiniprogram.TouchEvent) {
    const { index } = e.currentTarget.dataset
    const { categories } = this.data
    
    this.setData({
      showAddModal: true,
      newCategoryName: categories[index].name,
      newCategoryColor: categories[index].color,
      editingIndex: index
    })
  }
})

