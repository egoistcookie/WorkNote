// pages/todo-manage/index.ts
import { TodoTask, TaskStatus, TaskPriority } from '../../types/task'
import { getStorageSync, setStorageSync } from '../../utils/storage'
import { formatDate } from '../../utils/date'
import { getCurrentTheme, getThemeColors, type ThemeType, type ThemeColors } from '../../utils/theme'

Page({
  data: {
    allTasks: [] as TodoTask[],
    filteredTasks: [] as TodoTask[],
    filterStatus: 'all' as 'all' | 'completed' | 'pending',
    showDeleteConfirm: false,
    deletingTaskId: '',
    theme: 'warm' as ThemeType,
    themeColors: null as ThemeColors | null
  },

  onLoad() {
    const theme = getCurrentTheme()
    const themeColors = getThemeColors(theme)
    this.setData({ theme, themeColors })
    this.loadTasks()
  },

  onShow() {
    const theme = getCurrentTheme()
    if (this.data.theme !== theme) {
      const themeColors = getThemeColors(theme)
      this.setData({ theme, themeColors })
    }
    this.loadTasks()
  },

  onThemeChange(theme: ThemeType) {
    const themeColors = getThemeColors(theme)
    this.setData({ theme, themeColors })
  },

  loadTasks() {
    const tasksKey = 'todo_tasks'
    const allTasks = getStorageSync<TodoTask[]>(tasksKey) || []
    
    // 按创建时间倒序排列
    allTasks.sort((a, b) => b.createdAt - a.createdAt)
    
    this.updateFilteredTasks(allTasks, this.data.filterStatus)
  },

  updateFilteredTasks(allTasks: TodoTask[], filterStatus: 'all' | 'completed' | 'pending') {
    let filteredTasks: TodoTask[]
    
    if (filterStatus === 'all') {
      filteredTasks = allTasks
    } else if (filterStatus === 'completed') {
      filteredTasks = allTasks.filter((task: TodoTask) => task.status === TaskStatus.COMPLETED)
    } else {
      filteredTasks = allTasks.filter((task: TodoTask) => task.status !== TaskStatus.COMPLETED)
    }
    
    this.setData({
      allTasks,
      filteredTasks
    })
  },

  onFilterChange(e: WechatMiniprogram.TouchEvent) {
    const { status } = e.currentTarget.dataset
    this.updateFilteredTasks(this.data.allTasks, status)
    this.setData({
      filterStatus: status
    })
  },

  getFilteredTasks(): TodoTask[] {
    const { allTasks, filterStatus } = this.data
    
    if (filterStatus === 'all') {
      return allTasks
    } else if (filterStatus === 'completed') {
      return allTasks.filter((task: TodoTask) => task.status === TaskStatus.COMPLETED)
    } else {
      return allTasks.filter((task: TodoTask) => task.status !== TaskStatus.COMPLETED)
    }
  },

  onToggleStatus(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset
    const { allTasks } = this.data
    
    const updatedTasks = allTasks.map((task: TodoTask) => {
      if (task.id === id) {
        const newStatus = task.status === TaskStatus.COMPLETED 
          ? TaskStatus.PENDING 
          : TaskStatus.COMPLETED
        return {
          ...task,
          status: newStatus,
          completedAt: newStatus === TaskStatus.COMPLETED ? Date.now() : undefined,
          updatedAt: Date.now()
        }
      }
      return task
    })
    
    setStorageSync('todo_tasks', updatedTasks)
    this.updateFilteredTasks(updatedTasks, this.data.filterStatus)
    
      wx.showToast({
      title: updatedTasks.find((t: TodoTask) => t.id === id)?.status === TaskStatus.COMPLETED ? '已完成' : '已取消完成',
      icon: 'success'
    })
  },

  onDeleteTask(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset
    this.setData({
      showDeleteConfirm: true,
      deletingTaskId: id
    })
  },

  onConfirmDelete() {
    const { allTasks, deletingTaskId } = this.data
    
    const updatedTasks = allTasks.filter((task: TodoTask) => task.id !== deletingTaskId)
    setStorageSync('todo_tasks', updatedTasks)
    
    this.updateFilteredTasks(updatedTasks, this.data.filterStatus)
    this.setData({
      showDeleteConfirm: false,
      deletingTaskId: ''
    })
    
    wx.showToast({
      title: '删除成功',
      icon: 'success'
    })
  },

  onCancelDelete() {
    this.setData({
      showDeleteConfirm: false,
      deletingTaskId: ''
    })
  },

  getPriorityText(priority: TaskPriority): string {
    const map = {
      [TaskPriority.URGENT_IMPORTANT]: '紧急&重要',
      [TaskPriority.IMPORTANT_NOT_URGENT]: '重要&不紧急',
      [TaskPriority.URGENT_NOT_IMPORTANT]: '紧急&不重要',
      [TaskPriority.NOT_URGENT_NOT_IMPORTANT]: '不紧急&不重要'
    }
    return map[priority] || '未知'
  }
})

