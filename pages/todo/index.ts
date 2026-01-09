// pages/todo/index.ts
import { TodoTask, TaskPriority, TaskStatus } from '../../types/task'
import { getStorageSync, setStorageSync } from '../../utils/storage'

Page({
  data: {
    urgentImportantTasks: [] as TodoTask[],
    importantNotUrgentTasks: [] as TodoTask[],
    urgentNotImportantTasks: [] as TodoTask[],
    notUrgentNotImportantTasks: [] as TodoTask[],
    showTaskModal: false,
    currentPriority: TaskPriority.URGENT_IMPORTANT,
    editingTask: null as TodoTask | null
  },

  onLoad() {
    this.loadTasks()
  },

  onShow() {
    // 每次显示页面时重新加载任务
    this.loadTasks()
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
    const { id, title, description, priority, startDate, endDate, category, isEdit } = e.detail
    
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
            category,
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
        category,
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
    // 检查是否是组件触发的自定义事件
    const detail = e.detail
    console.log('onTaskTap 事件详情:', detail)
    
    // 如果是点击坐标（有 x, y 属性），说明是直接点击了外层 view，忽略
    if (detail && typeof detail.x === 'number' && typeof detail.y === 'number') {
      console.warn('接收到点击坐标，忽略此事件')
      return
    }
    
    const { task } = detail || {}
    
    // 安全检查
    if (!task) {
      console.error('任务数据为空:', detail)
      return
    }
    
    // 可以打开任务详情或编辑
    this.setData({
      showTaskModal: true,
      editingTask: task,
      currentPriority: task.priority || TaskPriority.URGENT_IMPORTANT
    })
  }
})
