// pages/data-manage/index.ts
import { Task, TaskStatus } from '../../types/task'
import { TodoTask } from '../../types/task'
import { getStorageSync } from '../../utils/storage'
import { formatDate, formatDurationWithSeconds } from '../../utils/date'

Page({
  data: {
    exportText: '',
    showExportModal: false
  },

  onLoad() {
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
          
          text += `${index + 1}. [${task.category}] ${task.title}`
          if (task.description) {
            text += ` - ${task.description}`
          }
          text += `\n   状态: ${this.getStatusText(task.status)}`
          if (task.startTime) {
            text += ` | 开始: ${task.startTime}`
          }
          if (task.endTime) {
            text += ` | 结束: ${task.endTime}`
          }
          if (duration) {
            text += ` | 时长: ${duration}`
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

  onExportFile() {
    // 微信小程序中，直接复制到剪贴板更实用
    wx.setClipboardData({
      data: this.data.exportText,
      success: () => {
        wx.showToast({
          title: '已复制，可粘贴到文件',
          icon: 'success',
          duration: 2000
        })
      }
    })
  }
})

