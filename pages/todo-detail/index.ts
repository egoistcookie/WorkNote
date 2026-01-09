// pages/todo-detail/index.ts
import { TodoTask, TaskStatus } from '../../types/task'
import { getStorageSync } from '../../utils/storage'
import { getCategoryColor } from '../../utils/category'
import { formatDurationWithSeconds, getCurrentDate } from '../../utils/date'

Page({
  data: {
    category: '',
    categoryColor: '#969799',
    tasks: [] as TodoTask[],
    totalDuration: 0,
    totalDurationText: '0秒'
  },

  onLoad(options: { category?: string }) {
    const category = decodeURIComponent(options.category || '')
    if (!category) {
      wx.showToast({
        title: '分类信息缺失',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }

    const categoryColor = getCategoryColor(category)
    this.setData({
      category,
      categoryColor
    })

    this.loadTasks(category)
    wx.setNavigationBarTitle({
      title: category
    })
  },

  loadTasks(category: string) {
    const tasksKey = 'todo_tasks'
    const allTasks = getStorageSync<TodoTask[]>(tasksKey) || []
    
    // 筛选出该分类的所有待办任务
    const categoryTasks = allTasks.filter(task => {
      // 待办任务的分类名称就是任务标题
      return (task.title === category) || (task.category === category)
    })
    
    // 先显示待办任务列表，耗时统计异步加载
    this.setData({
      tasks: categoryTasks.sort((a, b) => b.createdAt - a.createdAt), // 按创建时间倒序
      totalDuration: 0,
      totalDurationText: '计算中...'
    })

    // 异步计算耗时统计，避免阻塞主线程
    setTimeout(() => {
      this.calculateTotalDuration(category)
    }, 100)
  },

  calculateTotalDuration(category: string) {
    // 从时间线任务中统计该分类的累积耗时
    let totalSeconds = 0
    const today = new Date()
    
    // 遍历最近365天的数据，分批处理避免卡顿
    const batchSize = 30 // 每次处理30天
    let processedDays = 0
    
    const processBatch = () => {
      const endIndex = Math.min(processedDays + batchSize, 365)
      
      for (let i = processedDays; i < endIndex; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const dateStr = `${year}-${month}-${day}`
        const timelineTasksKey = `tasks_${dateStr}`
        const timelineTasks = getStorageSync<any[]>(timelineTasksKey) || []
        
        timelineTasks.forEach((task: any) => {
          if (task.category === category) {
            // 优先使用 elapsedSeconds
            if (task.elapsedSeconds) {
              totalSeconds += task.elapsedSeconds
            } 
            // 如果有时间段，计算总时长
            else if (task.timeSegments && task.timeSegments.length > 0) {
              const taskSeconds = task.timeSegments.reduce((sum: number, seg: any) => {
                return sum + (seg.duration || 0)
              }, 0)
              totalSeconds += taskSeconds
            }
          }
        })
      }
      
      processedDays = endIndex
      
      // 更新进度
      const totalDurationText = formatDurationWithSeconds(totalSeconds)
      this.setData({
        totalDuration: totalSeconds,
        totalDurationText
      })
      
      // 如果还有数据，继续处理下一批
      if (processedDays < 365) {
        setTimeout(processBatch, 50) // 50ms后处理下一批
      }
    }
    
    processBatch()
  },

  onTaskTap(e: WechatMiniprogram.TouchEvent) {
    const { task } = e.currentTarget.dataset
    if (!task) return

    // 返回待办页签并打开编辑
    wx.navigateBack({
      success: () => {
        // 通过事件总线或全局数据传递任务信息
        const app = getApp()
        if (app) {
          (app as any).pendingEditTask = task
        }
      }
    })
  }
})

