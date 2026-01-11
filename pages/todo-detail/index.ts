// pages/todo-detail/index.ts
import { TodoTask, TaskStatus } from '../../types/task'
import { getStorageSync } from '../../utils/storage'
import { getCategoryColor } from '../../utils/category'
import { formatDurationWithSeconds, getCurrentDate, parseTimeToTimestamp, getSecondsDiff } from '../../utils/date'
import { getCurrentTheme, getThemeColors, type ThemeType, type ThemeColors } from '../../utils/theme'

Page({
  data: {
    category: '',
    categoryColor: '#969799',
    tasks: [] as TodoTask[], // 待办任务
    timelineTasks: [] as any[], // 时间线任务
    totalDuration: 0,
    totalDurationText: '0秒',
    taskCount: 0, // 时间线任务的数量
    taskCountText: '0', // 用于显示的文本
    theme: 'warm' as ThemeType,
    themeColors: null as ThemeColors | null
  },

  onLoad(options: { category?: string }) {
    const theme = getCurrentTheme()
    const themeColors = getThemeColors(theme)
    this.setData({ theme, themeColors })
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

  onShow() {
    const theme = getCurrentTheme()
    if (this.data.theme !== theme) {
      const themeColors = getThemeColors(theme)
      this.setData({ theme, themeColors })
    }
  },

  onThemeChange(theme: ThemeType) {
    const themeColors = getThemeColors(theme)
    this.setData({ theme, themeColors })
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
      timelineTasks: [], // 初始化为空数组
      totalDuration: 0,
      totalDurationText: '计算中...',
      taskCount: 0,
      taskCountText: '计算中...' // 初始显示计算中，异步计算后更新
    })

    // 异步计算耗时统计，避免阻塞主线程
    setTimeout(() => {
      this.calculateTotalDuration(category)
    }, 100)
  },

  calculateTotalDuration(category: string) {
    // 从时间线任务中统计该分类的累积耗时和任务数量
    let totalSeconds = 0
    let taskCount = 0
    const allTimelineTasks: any[] = [] // 收集所有时间线任务
    const today = new Date()
    
    // 遍历最近365天的数据，分批处理避免卡顿
    const batchSize = 30 // 每次处理30天
    let processedDays = 0
    const totalDays = 365
    
    const processBatch = () => {
      const endIndex = Math.min(processedDays + batchSize, totalDays)
      
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
            // 统计任务数量
            taskCount++
            
            // 计算任务的时长（秒）
            let taskSeconds = 0
            if (task.timeSegments && task.timeSegments.length > 0) {
              // 使用时间段计算
              taskSeconds = task.timeSegments.reduce((sum: number, seg: any) => {
                return sum + (seg.duration || 0)
              }, 0)
            } else if (task.elapsedSeconds) {
              // 使用已用秒数
              taskSeconds = task.elapsedSeconds
            } else if (task.startTime && task.endTime) {
              // 使用起止时间计算（用于导入的任务）
              const startTimestamp = parseTimeToTimestamp(dateStr, task.startTime)
              const endTimestamp = parseTimeToTimestamp(dateStr, task.endTime)
              if (startTimestamp && endTimestamp) {
                taskSeconds = getSecondsDiff(startTimestamp, endTimestamp)
              }
            }
            
            // 累加总时长
            totalSeconds += taskSeconds
            
            // 格式化时长文本
            let durationText = task.duration || ''
            if (!durationText && taskSeconds > 0) {
              durationText = formatDurationWithSeconds(taskSeconds)
            }
            
            // 收集任务，确保有唯一ID
            allTimelineTasks.push({
              ...task,
              id: task.id || `task_${dateStr}_${allTimelineTasks.length}`, // 确保有ID
              date: dateStr, // 确保日期字段存在
              durationText: durationText // 添加格式化的时长文本
            })
          }
        })
      }
      
      processedDays = endIndex
      
      // 每次批次都更新统计信息和任务列表（实时反馈）
      const totalDurationText = formatDurationWithSeconds(totalSeconds)
      
      // 按日期和创建时间倒序排序（使用副本避免修改原数组）
      const sortedTasks = allTimelineTasks.slice().sort((a, b) => {
        // 先按日期倒序
        if (a.date !== b.date) {
          return b.date.localeCompare(a.date)
        }
        // 同一天按创建时间倒序
        return (b.createdAt || 0) - (a.createdAt || 0)
      })
      
      // 每次批次完成后都更新，实现增量显示
      this.setData({
        totalDuration: totalSeconds,
        totalDurationText,
        taskCount,
        taskCountText: taskCount.toString(),
        timelineTasks: sortedTasks // 每次批次都更新任务列表
      })
      
      // 如果还有数据，继续处理下一批
      if (processedDays < totalDays) {
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

