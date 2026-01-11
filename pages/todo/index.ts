// pages/todo/index.ts
import { TodoTask, TaskPriority, TaskStatus } from '../../types/task'
import { getStorageSync, setStorageSync } from '../../utils/storage'
import { getCurrentTheme, getThemeColors, type ThemeType, type ThemeColors } from '../../utils/theme'

Page({
  data: {
    urgentImportantTasks: [] as TodoTask[],
    importantNotUrgentTasks: [] as TodoTask[],
    urgentNotImportantTasks: [] as TodoTask[],
    notUrgentNotImportantTasks: [] as TodoTask[],
    showTaskModal: false,
    currentPriority: TaskPriority.URGENT_IMPORTANT,
    editingTask: null as TodoTask | null,
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
    // 每次显示页面时检查主题并重新加载任务
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
    
    // 过滤掉无效的任务（没有 id 或 priority）
    const validTasks = allTasks.filter(t => t && t.id && t.priority)
    
    // 按优先级分类
    const urgentImportant = validTasks.filter(t => 
      t.priority === TaskPriority.URGENT_IMPORTANT && t.status !== TaskStatus.COMPLETED
    )
    const importantNotUrgent = validTasks.filter(t => 
      t.priority === TaskPriority.IMPORTANT_NOT_URGENT && t.status !== TaskStatus.COMPLETED
    )
    const urgentNotImportant = validTasks.filter(t => 
      t.priority === TaskPriority.URGENT_NOT_IMPORTANT && t.status !== TaskStatus.COMPLETED
    )
    const notUrgentNotImportant = validTasks.filter(t => 
      t.priority === TaskPriority.NOT_URGENT_NOT_IMPORTANT && t.status !== TaskStatus.COMPLETED
    )

    this.setData({
      urgentImportantTasks: urgentImportant,
      importantNotUrgentTasks: importantNotUrgent,
      urgentNotImportantTasks: urgentNotImportant,
      notUrgentNotImportantTasks: notUrgentNotImportant
    })
  },

  onAddTask(e: WechatMiniprogram.CustomEvent) {
    const { priority } = e.currentTarget.dataset
    this.setData({
      showTaskModal: true,
      currentPriority: priority || TaskPriority.URGENT_IMPORTANT,
      editingTask: null
    })
  },

  onTaskModalClose() {
    this.setData({
      showTaskModal: false,
      editingTask: null
    })
  },

  onTaskSave(e: WechatMiniprogram.CustomEvent) {
    const { id, title, description, priority, startDate, endDate, category, categoryColor, isEdit } = e.detail
    
    const tasksKey = 'todo_tasks'
    const allTasks = getStorageSync<TodoTask[]>(tasksKey) || []
    const now = Date.now()

    if (isEdit && id) {
      // 编辑模式
      const updatedTasks = allTasks.map(task => {
        if (task.id === id) {
          return {
            ...task,
            title,
            description: description || '',
            priority: priority || task.priority,
            startDate,
            endDate,
            category: title, // 分类名称就是任务标题
            updatedAt: now
          }
        }
        return task
      })
      setStorageSync(tasksKey, updatedTasks)
    } else {
      // 新建模式
      const newTask: TodoTask = {
        id: `todo_${now}`,
        title,
        description: description || '',
        priority: priority || this.data.currentPriority,
        startDate,
        endDate,
        category: title, // 分类名称就是任务标题
        status: TaskStatus.PENDING,
        createdAt: now,
        updatedAt: now
      }
      allTasks.push(newTask)
      setStorageSync(tasksKey, allTasks)
    }

    this.loadTasks()
    this.setData({
      showTaskModal: false,
      editingTask: null
    })
  },

  onTaskToggle(e: WechatMiniprogram.CustomEvent) {
    const { task } = e.detail
    const tasksKey = 'todo_tasks'
    const allTasks = getStorageSync<TodoTask[]>(tasksKey) || []
    
    const updatedTasks = allTasks.map(t => {
      if (t.id === task.id) {
        const newStatus = t.status === TaskStatus.COMPLETED 
          ? TaskStatus.PENDING 
          : TaskStatus.COMPLETED
        return {
          ...t,
          status: newStatus,
          completedAt: newStatus === TaskStatus.COMPLETED ? Date.now() : undefined,
          updatedAt: Date.now()
        }
      }
      return t
    })
    
    setStorageSync(tasksKey, updatedTasks)
    this.loadTasks()
  },

  onTaskTap(e: WechatMiniprogram.CustomEvent) {
    // 只处理组件触发的自定义事件
    const detail = e.detail
    
    // 如果是点击坐标（有 x, y 属性），说明是直接点击了外层 view，忽略
    if (detail && typeof detail.x === 'number' && typeof detail.y === 'number') {
      return
    }
    
    const { task } = detail || {}
    
    // 安全检查
    if (!task || !task.id) {
      return
    }
    
    // 待办任务的标题就是分类名称，跳转到详情页
    const categoryName = task.title || task.category
    if (categoryName) {
      // 使用 navigateTo 的 success 回调确保页面跳转流畅
      wx.navigateTo({
        url: `/pages/todo-detail/index?category=${encodeURIComponent(categoryName)}`
      })
    } else {
      // 没有标题，打开编辑弹窗
      this.setData({
        showTaskModal: true,
        editingTask: task,
        currentPriority: task.priority || TaskPriority.URGENT_IMPORTANT
      })
    }
  }
})
