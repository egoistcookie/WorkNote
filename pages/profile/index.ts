// pages/profile/index.ts
import { getStorageSync, setStorageSync } from '../../utils/storage'
import { Task } from '../../types/task'

interface UserProfile {
  avatar: string
  name: string
  email: string
}

Page({
  data: {
    avatar: '',
    name: '未命名',
    email: '',
    eventCount: 0,
    recordDays: 0,
    showEditModal: false,
    editingField: '' as 'name' | 'email' | '',
    editValue: ''
  },

  onLoad() {
    this.loadProfile()
    this.loadStatistics()
  },

  onShow() {
    // 每次显示页面时重新加载统计数据
    this.loadStatistics()
  },

  loadProfile() {
    const profile = getStorageSync<UserProfile>('user_profile') || {
      avatar: '',
      name: '未命名',
      email: ''
    }
    this.setData({
      avatar: profile.avatar,
      name: profile.name,
      email: profile.email
    })
  },

  loadStatistics() {
    // 获取所有任务数据，计算事件个数和记录天数
    let eventCount = 0
    const dateSet = new Set<string>()
    
    // 遍历可能的日期范围（最近一年）
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      
      const tasksKey = `tasks_${dateStr}`
      const tasks = getStorageSync<Task[]>(tasksKey) || []
      
      if (tasks.length > 0) {
        eventCount += tasks.length
        dateSet.add(dateStr)
      }
    }
    
    // 也统计待办任务
    const todoTasks = getStorageSync<any[]>('todo_tasks') || []
    eventCount += todoTasks.length
    
    this.setData({
      eventCount,
      recordDays: dateSet.size
    })
  },

  onAvatarTap() {
    // 选择头像
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        // 这里可以上传到服务器，暂时使用本地路径
        const profile = getStorageSync<UserProfile>('user_profile') || {
          avatar: '',
          name: '未命名',
          email: ''
        }
        profile.avatar = tempFilePath
        setStorageSync('user_profile', profile)
        this.setData({
          avatar: tempFilePath
        })
      }
    })
  },

  onNameTap() {
    this.setData({
      showEditModal: true,
      editingField: 'name',
      editValue: this.data.name
    })
  },

  onEmailTap() {
    this.setData({
      showEditModal: true,
      editingField: 'email',
      editValue: this.data.email
    })
  },

  onEditInput(e: WechatMiniprogram.Input) {
    this.setData({
      editValue: e.detail.value
    })
  },

  onEditConfirm() {
    const { editingField, editValue } = this.data
    if (!editingField) return
    
    const profile = getStorageSync<UserProfile>('user_profile') || {
      avatar: '',
      name: '未命名',
      email: ''
    }
    
    if (editingField === 'name') {
      profile.name = editValue || '未命名'
      this.setData({ name: profile.name })
    } else if (editingField === 'email') {
      profile.email = editValue
      this.setData({ email: profile.email })
    }
    
    setStorageSync('user_profile', profile)
    this.setData({
      showEditModal: false,
      editingField: '',
      editValue: ''
    })
  },

  onEditCancel() {
    this.setData({
      showEditModal: false,
      editingField: '',
      editValue: ''
    })
  },

  onCategoryManage() {
    wx.navigateTo({
      url: '/pages/category-manage/index'
    })
  },

  onSummaryManage() {
    wx.navigateTo({
      url: '/pages/summary-manage/index'
    })
  },

  onTodoManage() {
    wx.navigateTo({
      url: '/pages/todo-manage/index'
    })
  },

  onDataManage() {
    wx.navigateTo({
      url: '/pages/data-manage/index'
    })
  }
})
