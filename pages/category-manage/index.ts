// pages/category-manage/index.ts
import { Category, CategoryColor } from '../../types/common'
import { getAllCategories, setAllCategories } from '../../utils/category'
import { getCurrentTheme, getThemeColors, type ThemeType, type ThemeColors } from '../../utils/theme'

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
    editingIndex: -1,
    theme: 'warm' as ThemeType,
    themeColors: null as ThemeColors | null
  },

  onLoad() {
    const theme = getCurrentTheme()
    const themeColors = getThemeColors(theme)
    this.setData({ theme, themeColors })
    this.loadCategories()
  },

  onShow() {
    // 每次显示时检查主题并重新加载分类
    const theme = getCurrentTheme()
    if (this.data.theme !== theme) {
      const themeColors = getThemeColors(theme)
      this.setData({ theme, themeColors })
    }
    this.loadCategories()
  },

  onThemeChange(theme: ThemeType) {
    const themeColors = getThemeColors(theme)
    this.setData({ theme, themeColors })
  },

  loadCategories() {
    // 使用统一的分类管理函数，确保包含所有分类（包括待办任务创建的分类）
    const allCategories = getAllCategories()
    this.setData({
      categories: allCategories
    })
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
      
      setAllCategories(updatedCategories)
      
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
      setAllCategories(updatedCategories)
      
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
          setAllCategories(updatedCategories)
          
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

