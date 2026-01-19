// pages/data-manage/index.ts
import { Task, TaskStatus, TaskPriority } from '../../types/task'
import { TodoTask } from '../../types/task'
import { getStorageSync, setStorageSync } from '../../utils/storage'
import { formatDate, formatDurationWithSeconds, formatTimeWithSeconds } from '../../utils/date'
import { getAllCategories, setAllCategories, CategoryItem } from '../../utils/category'
import { getCurrentTheme, getThemeColors, type ThemeType, type ThemeColors } from '../../utils/theme'

Page({
  data: {
    exportText: '',
    theme: 'warm' as ThemeType,
    themeColors: null as ThemeColors | null
  },

  onLoad() {
    const theme = getCurrentTheme()
    const themeColors = getThemeColors(theme)
    this.setData({ theme, themeColors })
    this.generateExportText()
  },

  generateExportText() {
    let text = '=== 工作笔记数据导出 ===\n\n'
    text += `导出时间: ${new Date().toLocaleString('zh-CN')}\n\n`
    
    // 导出所有任务
    text += '=== 时间线任务 ===\n\n'
    const today = new Date()
    let taskCount = 0
    
    for (let i = 0; i < 365; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      
      const tasksKey = `tasks_${dateStr}`
      const tasks = getStorageSync<Task[]>(tasksKey) || []
      
      if (tasks.length > 0) {
        text += `\n【${dateStr}】\n`
        tasks.forEach((task, index) => {
          taskCount++
          let duration = ''
          if (task.timeSegments && task.timeSegments.length > 0) {
            const totalSeconds = task.timeSegments.reduce((sum, seg) => sum + (seg.duration || 0), 0)
            duration = formatDurationWithSeconds(totalSeconds)
          } else if (task.elapsedSeconds) {
            duration = formatDurationWithSeconds(task.elapsedSeconds)
          } else if (task.duration) {
            duration = task.duration
          }
          
          // 获取精确到秒的开始和结束时间
          // 优先使用实际任务开始时间（第一段时间段的开始时间）
          let startTimeText = ''
          let endTimeText = ''
          
          // 优先从timeSegments中提取实际开始和结束时间
          if (task.timeSegments && task.timeSegments.length > 0) {
            // 使用第一个时间段的开始时间戳作为实际任务开始时间
            const firstSegment = task.timeSegments[0]
            if (firstSegment.startTimestamp) {
              startTimeText = formatTimeWithSeconds(new Date(firstSegment.startTimestamp))
            }
            // 使用最后一个时间段的结束时间戳
            const lastSegment = task.timeSegments[task.timeSegments.length - 1]
            if (lastSegment.endTimestamp) {
              endTimeText = formatTimeWithSeconds(new Date(lastSegment.endTimestamp))
            }
          }
          
          // 如果没有时间段数据，使用手动修改的startTime和endTime
          if (!startTimeText && task.startTime) {
            startTimeText = task.startTime
          }
          if (!endTimeText && task.endTime) {
            endTimeText = task.endTime
          }
          
          // 如果还是没有，使用createdAt和updatedAt作为参考
          if (!startTimeText && task.createdAt) {
            startTimeText = formatTimeWithSeconds(new Date(task.createdAt))
          }
          if (!endTimeText && task.updatedAt && task.status === TaskStatus.COMPLETED) {
            endTimeText = formatTimeWithSeconds(new Date(task.updatedAt))
          }
          
          // 如果时间格式是 HH:mm，补充秒数（:00）
          if (startTimeText && startTimeText.match(/^\d{2}:\d{2}$/)) {
            startTimeText += ':00'
          }
          if (endTimeText && endTimeText.match(/^\d{2}:\d{2}$/)) {
            endTimeText += ':00'
          }
          
          text += `${index + 1}. [${task.category}] ${task.title}`
          if (task.description) {
            text += ` - ${task.description}`
          }
          text += `\n   状态: ${this.getStatusText(task.status)}`
          if (startTimeText) {
            text += ` | 开始: ${startTimeText}`
          }
          if (endTimeText) {
            text += ` | 结束: ${endTimeText}`
          }
          if (duration) {
            text += ` | 时长: ${duration}`
          }
          
          // 如果有多个时间段，展示所有时间段
          if (task.timeSegments && task.timeSegments.length > 1) {
            text += `\n   时间段详情:`
            task.timeSegments.forEach((segment, segIndex) => {
              if (segment.startTimestamp) {
                const segStartTime = formatTimeWithSeconds(new Date(segment.startTimestamp))
                const segEndTime = segment.endTimestamp ? formatTimeWithSeconds(new Date(segment.endTimestamp)) : '进行中'
                const segDuration = segment.duration ? formatDurationWithSeconds(segment.duration) : '-'
                text += `\n     第${segIndex + 1}段: ${segStartTime} - ${segEndTime} (${segDuration})`
              }
            })
          }
          
          text += '\n'
        })
      }
    }
    
    text += `\n总计: ${taskCount} 条任务\n\n`
    
    // 导出待办任务
    text += '=== 待办任务 ===\n\n'
    const todoTasks = getStorageSync<TodoTask[]>('todo_tasks') || []
    
    if (todoTasks.length > 0) {
      todoTasks.forEach((task, index) => {
        text += `${index + 1}. [${this.getPriorityText(task.priority)}] ${task.title}`
        if (task.description) {
          text += ` - ${task.description}`
        }
        text += `\n   状态: ${this.getStatusText(task.status)}`
        if (task.startDate) {
          text += ` | 开始日期: ${task.startDate}`
        }
        if (task.endDate) {
          text += ` | 结束日期: ${task.endDate}`
        }
        if (task.completedAt) {
          const completedDate = new Date(task.completedAt)
          text += ` | 完成时间: ${completedDate.toLocaleString('zh-CN')}`
        }
        text += '\n'
      })
    } else {
      text += '暂无待办任务\n'
    }
    
    text += `\n总计: ${todoTasks.length} 条待办\n\n`
    
    // 导出日志
    text += '=== 晨间计划和晚间总结 ===\n\n'
    let logCount = 0
    
    for (let i = 0; i < 365; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = formatDate(date)
      
      const morningKey = `log_morning_${dateStr}`
      const eveningKey = `log_evening_${dateStr}`
      
      const morningLog = getStorageSync<string>(morningKey)
      const eveningLog = getStorageSync<string>(eveningKey)
      
      if (morningLog || eveningLog) {
        text += `\n【${dateStr}】\n`
        if (morningLog) {
          logCount++
          text += `晨间计划: ${morningLog}\n`
        }
        if (eveningLog) {
          logCount++
          text += `晚间总结: ${eveningLog}\n`
        }
      }
    }
    
    text += `\n总计: ${logCount} 条日志\n\n`
    
    // 导出分类信息
    text += '=== 分类信息 ===\n\n'
    const categories = getAllCategories()
    if (categories.length > 0) {
      categories.forEach((cat, index) => {
        text += `${index + 1}. [${cat.color}] ${cat.name}\n`
      })
    } else {
      text += '暂无分类信息\n'
    }
    text += `\n总计: ${categories.length} 个分类\n\n`
    
    text += '=== 导出结束 ===\n'
    
    this.setData({
      exportText: text
    })
  },

  getStatusText(status: TaskStatus): string {
    const map = {
      [TaskStatus.PENDING]: '待开始',
      [TaskStatus.IN_PROGRESS]: '进行中',
      [TaskStatus.PAUSED]: '已暂停',
      [TaskStatus.COMPLETED]: '已完成',
      [TaskStatus.CANCELLED]: '已取消'
    }
    return map[status] || '未知'
  },

  getPriorityText(priority: string): string {
    const map: Record<string, string> = {
      'urgent_important': '紧急&重要',
      'important_not_urgent': '重要&不紧急',
      'urgent_not_important': '紧急&不重要',
      'not_urgent_not_important': '不紧急&不重要'
    }
    return map[priority] || '未知'
  },

  onCopyText() {
    wx.setClipboardData({
      data: this.data.exportText,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        })
      }
    })
  },

  onImportTap() {
    wx.navigateTo({
      url: '/pages/import-data/index'
    })
  },

  onShow() {
    const theme = getCurrentTheme()
    if (this.data.theme !== theme) {
      const themeColors = getThemeColors(theme)
      this.setData({ theme, themeColors })
    }
    // 异步重新生成导出文本（导入后可能新增了数据），避免阻塞 onShow 生命周期
    setTimeout(() => {
      this.generateExportText()
    }, 0)
  },

  onThemeChange(theme: ThemeType) {
    const themeColors = getThemeColors(theme)
    this.setData({ theme, themeColors })
  }
})
