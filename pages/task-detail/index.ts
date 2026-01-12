// pages/task-detail/index.ts
import { Task, TaskStatus } from '../../types/task'
import { Category, CategoryColor } from '../../types/common'
import { getStorageSync, setStorageSync } from '../../utils/storage'
import { formatDurationWithSeconds, getSecondsDiff, parseTimeToTimestamp, formatTimeFromTimestamp } from '../../utils/date'
import { getCurrentTheme, getThemeColors, type ThemeType, type ThemeColors } from '../../utils/theme'

Page({
  data: {
    task: {} as Task,
    categoryColor: '#969799',
    statusText: '',
    theme: 'warm' as ThemeType,
    themeColors: null as ThemeColors | null,
    timeSegmentsDisplay: [] as Array<{ startTime: string; endTime: string; duration: string; index: number }>
  },

  onLoad(options: { taskId?: string; date?: string }) {
    const { taskId, date } = options
    if (!taskId || !date) {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }

    const theme = getCurrentTheme()
    const themeColors = getThemeColors(theme)
    this.setData({ theme, themeColors })

    this.loadTask(date, taskId)
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

  loadTask(date: string, taskId: string) {
    const tasksKey = `tasks_${date}`
    const allTasks = getStorageSync<Task[]>(tasksKey) || []
    const task = allTasks.find(t => t.id === taskId)

    if (!task) {
      wx.showToast({
        title: '任务不存在',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }

    const categoryColor = CategoryColor[task.category] || '#969799'
    const statusMap: Record<TaskStatus, string> = {
      [TaskStatus.PENDING]: '待开始',
      [TaskStatus.IN_PROGRESS]: '进行中',
      [TaskStatus.PAUSED]: '已暂停',
      [TaskStatus.COMPLETED]: '已完成',
      [TaskStatus.CANCELLED]: '已取消'
    }
    const statusText = statusMap[task.status] || '未知'

    // 处理时间段显示
    const timeSegmentsDisplay: Array<{ startTime: string; endTime: string; duration: string; index: number }> = []
    
    // 先添加已保存的时间段
    if (task.timeSegments && task.timeSegments.length > 0) {
      task.timeSegments.forEach((segment, index) => {
        if (segment.startTimestamp) {
          const startTime = formatTimeFromTimestamp(segment.startTimestamp)
          const endTime = segment.endTimestamp ? formatTimeFromTimestamp(segment.endTimestamp) : '进行中'
          const duration = segment.duration ? formatDurationWithSeconds(segment.duration) : '-'
          timeSegmentsDisplay.push({
            startTime,
            endTime,
            duration,
            index: index + 1
          })
        }
      })
    }
    
    // 如果任务正在进行中（有startTimestamp但没有对应的timeSegments条目），也显示当前时段
    if (task.startTimestamp && task.status === TaskStatus.IN_PROGRESS) {
      const startTime = formatTimeFromTimestamp(task.startTimestamp)
      const now = Date.now()
      const currentDuration = getSecondsDiff(task.startTimestamp, now)
      const duration = formatDurationWithSeconds(currentDuration)
      timeSegmentsDisplay.push({
        startTime,
        endTime: '进行中',
        duration,
        index: timeSegmentsDisplay.length + 1
      })
    }

    this.setData({
      task: task,
      categoryColor: categoryColor,
      statusText: statusText,
      timeSegmentsDisplay: timeSegmentsDisplay
    })
  },

  onStartTimeChange(e: WechatMiniprogram.PickerChange) {
    const newStartTime = String(e.detail.value)
    const task = this.data.task
    
    // 更新开始时间
    const updatedTask: Task = {
      ...task,
      startTime: newStartTime
    }

    // 如果结束时间存在，重新计算耗时
    if (updatedTask.endTime) {
      const date = task.date
      const startTimestamp = parseTimeToTimestamp(date, newStartTime)
      const endTimestamp = parseTimeToTimestamp(date, updatedTask.endTime)
      
      if (startTimestamp && endTimestamp) {
        const elapsedSeconds = getSecondsDiff(startTimestamp, endTimestamp)
        updatedTask.duration = formatDurationWithSeconds(elapsedSeconds)
        updatedTask.elapsedSeconds = elapsedSeconds
      }
    }

    this.setData({
      task: updatedTask
    })
  },

  onEndTimeChange(e: WechatMiniprogram.PickerChange) {
    const newEndTime = String(e.detail.value)
    const task = this.data.task
    
    // 更新结束时间
    const updatedTask: Task = {
      ...task,
      endTime: newEndTime
    }

    // 重新计算耗时
    if (updatedTask.startTime) {
      const date = task.date
      const startTimestamp = parseTimeToTimestamp(date, updatedTask.startTime)
      const endTimestamp = parseTimeToTimestamp(date, newEndTime)
      
      if (startTimestamp && endTimestamp) {
        const elapsedSeconds = getSecondsDiff(startTimestamp, endTimestamp)
        updatedTask.duration = formatDurationWithSeconds(elapsedSeconds)
        updatedTask.elapsedSeconds = elapsedSeconds
      }
    }

    this.setData({
      task: updatedTask
    })
  },

  onSave() {
    const task = this.data.task
    const tasksKey = `tasks_${task.date}`
    const allTasks = getStorageSync<Task[]>(tasksKey) || []
    
    // 更新任务
    const updatedTasks = allTasks.map(t => 
      t.id === task.id ? { ...task, updatedAt: Date.now() } : t
    )
    
    setStorageSync(tasksKey, updatedTasks)

    wx.showToast({
      title: '保存成功',
      icon: 'success'
    })

    // 通知上一页更新
    const pages = getCurrentPages()
    const prevPage = pages[pages.length - 2]
    if (prevPage && prevPage.loadTasks) {
      prevPage.loadTasks(task.date)
    }

    setTimeout(() => {
      wx.navigateBack()
    }, 1500)
  },

})

