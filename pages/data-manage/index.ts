// pages/data-manage/index.ts
import { Task, TaskStatus, TaskPriority } from '../../types/task'
import { TodoTask } from '../../types/task'
import { getStorageSync, setStorageSync } from '../../utils/storage'
import { formatDate, formatDurationWithSeconds } from '../../utils/date'
import { getAllCategories, setAllCategories, CategoryItem } from '../../utils/category'

Page({
  data: {
    exportText: '',
    showExportModal: false,
    showImportModal: false,
    importText: '',
    importResult: {
      success: 0,
      skipped: 0,
      failed: 0,
      details: [] as string[]
    }
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
    this.setData({
      showImportModal: true,
      importText: '',
      importResult: {
        success: 0,
        skipped: 0,
        failed: 0,
        details: []
      }
    })
  },

  onImportTextChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      importText: e.detail.value
    })
  },

  onImportConfirm() {
    const importText = this.data.importText.trim()
    if (!importText) {
      wx.showToast({
        title: '请输入导入内容',
        icon: 'none'
      })
      return
    }

    this.importData(importText)
  },

  onImportCancel() {
    this.setData({
      showImportModal: false,
      importText: ''
    })
  },

  importData(text: string) {
    const result = {
      success: 0,
      skipped: 0,
      failed: 0,
      details: [] as string[]
    }

    try {
      const lines = text.split('\n')
      let currentSection = ''
      let currentDate = ''
      let currentTaskLines: string[] = []
      
      // 用于批量导入分类时，累积所有分类后再一次性保存
      let pendingCategories: CategoryItem[] = []

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmedLine = line.trim()
        
        // 跳过空行和分隔线
        if (!trimmedLine || trimmedLine.startsWith('===') || trimmedLine.startsWith('导出时间:') || trimmedLine.startsWith('总计:')) {
          // 如果遇到分隔线，处理之前累积的任务行
          if (currentTaskLines.length > 0 && currentSection === 'timeline' && currentDate) {
            const taskResult = this.importTimelineTask(currentTaskLines.join('\n'), currentDate)
            if (taskResult.success) {
              result.success++
              result.details.push(`时间线任务: ${taskResult.title} (${currentDate})`)
            } else if (taskResult.skipped) {
              result.skipped++
              result.details.push(`跳过重复: ${taskResult.title} (${currentDate})`)
            } else {
              result.failed++
              result.details.push(`失败: ${currentTaskLines[0]?.substring(0, 30)}...`)
            }
            currentTaskLines = []
          } else if (currentTaskLines.length > 0 && currentSection === 'todo') {
            const taskResult = this.importTodoTask(currentTaskLines.join('\n'))
            if (taskResult.success) {
              result.success++
              result.details.push(`待办任务: ${taskResult.title}`)
            } else if (taskResult.skipped) {
              result.skipped++
              result.details.push(`跳过重复: ${taskResult.title}`)
            } else {
              result.failed++
              result.details.push(`失败: ${currentTaskLines[0]?.substring(0, 30)}...`)
            }
            currentTaskLines = []
          }
          continue
        }

        // 检测章节
        if (trimmedLine.includes('时间线任务')) {
          currentSection = 'timeline'
          currentTaskLines = []
          continue
        } else if (trimmedLine.includes('待办任务')) {
          currentSection = 'todo'
          currentTaskLines = []
          continue
        } else if (trimmedLine.includes('分类信息')) {
          currentSection = 'category'
          currentTaskLines = []
          continue
        }

        // 处理日期行
        if (trimmedLine.match(/^【\d{4}-\d{2}-\d{2}】$/)) {
          // 处理之前累积的任务
          if (currentTaskLines.length > 0 && currentSection === 'timeline' && currentDate) {
            const taskResult = this.importTimelineTask(currentTaskLines.join('\n'), currentDate)
            if (taskResult.success) {
              result.success++
              result.details.push(`时间线任务: ${taskResult.title} (${currentDate})`)
            } else if (taskResult.skipped) {
              result.skipped++
              result.details.push(`跳过重复: ${taskResult.title} (${currentDate})`)
            } else {
              result.failed++
              result.details.push(`失败: ${currentTaskLines[0]?.substring(0, 30)}...`)
            }
          }
          currentDate = trimmedLine.replace(/【|】/g, '')
          currentTaskLines = []
          continue
        }

        // 处理时间线任务（累积多行）
        if (currentSection === 'timeline' && currentDate) {
          if (trimmedLine.match(/^\d+\./)) {
            // 新任务开始，处理之前的任务
            if (currentTaskLines.length > 0) {
              const taskResult = this.importTimelineTask(currentTaskLines.join('\n'), currentDate)
              if (taskResult.success) {
                result.success++
                result.details.push(`时间线任务: ${taskResult.title} (${currentDate})`)
              } else if (taskResult.skipped) {
                result.skipped++
                result.details.push(`跳过重复: ${taskResult.title} (${currentDate})`)
              } else {
                result.failed++
                result.details.push(`失败: ${currentTaskLines[0]?.substring(0, 30)}...`)
              }
            }
            currentTaskLines = [line]
          } else if (currentTaskLines.length > 0) {
            // 继续累积任务行
            currentTaskLines.push(line)
          }
          continue
        }

        // 处理待办任务（累积多行）
        if (currentSection === 'todo') {
          if (trimmedLine.match(/^\d+\./)) {
            // 新任务开始，处理之前的任务
            if (currentTaskLines.length > 0) {
              const taskResult = this.importTodoTask(currentTaskLines.join('\n'))
              if (taskResult.success) {
                result.success++
                result.details.push(`待办任务: ${taskResult.title}`)
              } else if (taskResult.skipped) {
                result.skipped++
                result.details.push(`跳过重复: ${taskResult.title}`)
              } else {
                result.failed++
                result.details.push(`失败: ${currentTaskLines[0]?.substring(0, 30)}...`)
              }
            }
            currentTaskLines = [line]
          } else if (currentTaskLines.length > 0) {
            // 继续累积任务行
            currentTaskLines.push(line)
          }
          continue
        }

        // 处理分类信息（单行）
        if (currentSection === 'category' && trimmedLine.match(/^\d+\./)) {
          const categoryResult = this.parseCategoryLine(trimmedLine)
          if (categoryResult.success) {
            // 检查是否重复（与已存在的分类和待导入的分类比较）
            const existingCategories = getAllCategories()
            const isDuplicate = existingCategories.some(c => c.name === categoryResult.name) ||
                                pendingCategories.some(c => c.name === categoryResult.name)
            
            if (isDuplicate) {
              result.skipped++
              result.details.push(`跳过重复: ${categoryResult.name}`)
            } else {
              pendingCategories.push(categoryResult.category)
              result.success++
              result.details.push(`分类: ${categoryResult.name}`)
            }
          } else {
            result.failed++
            result.details.push(`失败: ${trimmedLine.substring(0, 30)}...`)
          }
          continue
        }
      }

      // 处理最后累积的任务
      if (currentTaskLines.length > 0) {
        if (currentSection === 'timeline' && currentDate) {
          const taskResult = this.importTimelineTask(currentTaskLines.join('\n'), currentDate)
          if (taskResult.success) {
            result.success++
            result.details.push(`时间线任务: ${taskResult.title} (${currentDate})`)
          } else if (taskResult.skipped) {
            result.skipped++
            result.details.push(`跳过重复: ${taskResult.title} (${currentDate})`)
          } else {
            result.failed++
            result.details.push(`失败: ${currentTaskLines[0]?.substring(0, 30)}...`)
          }
        } else if (currentSection === 'todo') {
          const taskResult = this.importTodoTask(currentTaskLines.join('\n'))
          if (taskResult.success) {
            result.success++
            result.details.push(`待办任务: ${taskResult.title}`)
          } else if (taskResult.skipped) {
            result.skipped++
            result.details.push(`跳过重复: ${taskResult.title}`)
          } else {
            result.failed++
            result.details.push(`失败: ${currentTaskLines[0]?.substring(0, 30)}...`)
          }
        }
      }

      // 批量保存分类
      if (pendingCategories.length > 0) {
        const existingCategories = getAllCategories()
        const allCategories = [...existingCategories, ...pendingCategories]
        setAllCategories(allCategories)
        
        // 验证保存结果
        const savedCategories = getAllCategories()
        const savedCount = pendingCategories.filter(pc => 
          savedCategories.some(sc => sc.name === pc.name && sc.color === pc.color)
        ).length
        
        if (savedCount < pendingCategories.length) {
          result.failed += (pendingCategories.length - savedCount)
          result.success -= (pendingCategories.length - savedCount)
        }
      }

      this.setData({
        importResult: result
      })

      // 重新生成导出文本（包含新导入的分类）
      this.generateExportText()

      // 如果成功导入了分类，提示用户刷新分类管理页面
      const hasCategorySuccess = result.details.some(d => d.startsWith('分类:'))

      wx.showToast({
        title: `导入完成: 成功${result.success}条, 跳过${result.skipped}条, 失败${result.failed}条`,
        icon: result.failed > 0 ? 'none' : 'success',
        duration: 3000
      })

      // 如果导入了分类，提示用户可能需要刷新分类管理页面
      if (hasCategorySuccess) {
        setTimeout(() => {
          wx.showModal({
            title: '提示',
            content: '分类已导入成功，请在分类管理页面查看。',
            showCancel: false
          })
        }, 3500)
      }
    } catch (err) {
      wx.showToast({
        title: '导入失败，请检查格式',
        icon: 'none'
      })
    }
  },

  importTimelineTask(taskText: string, date: string): { success: boolean; skipped: boolean; title: string } {
    try {
      const lines = taskText.split('\n').map(l => l.trim()).filter(l => l)
      if (lines.length === 0) {
        return { success: false, skipped: false, title: '' }
      }

      // 解析第一行: "1. [分类] 标题 - 描述"
      const firstLine = lines[0]
      const match = firstLine.match(/^\d+\.\s*\[([^\]]+)\]\s*(.+?)(?:\s*-\s*(.+))?$/)
      if (!match) {
        return { success: false, skipped: false, title: '' }
      }

      const category = match[1].trim()
      const title = match[2].trim()
      const description = match[3] ? match[3].trim() : ''

      // 检查是否已存在（通过标题和日期判断）
      const tasksKey = `tasks_${date}`
      const existingTasks = getStorageSync<Task[]>(tasksKey) || []
      const isDuplicate = existingTasks.some(t => 
        t.title === title && t.date === date && t.category === category
      )

      if (isDuplicate) {
        return { success: false, skipped: true, title }
      }

      // 解析状态、时间等信息（从所有行中查找）
      const fullText = lines.join(' ')
      const statusMatch = fullText.match(/状态:\s*([^|]+)/)
      const statusText = statusMatch ? statusMatch[1].trim() : '待开始'
      const status = this.parseStatus(statusText)

      const startTimeMatch = fullText.match(/开始:\s*(\d{2}:\d{2})/)
      const startTime = startTimeMatch ? startTimeMatch[1] : '00:00'

      const endTimeMatch = fullText.match(/结束:\s*(\d{2}:\d{2})/)
      const endTime = endTimeMatch ? endTimeMatch[1] : undefined

      const now = Date.now()
      const newTask: Task = {
        id: `task_${now}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        description,
        startTime,
        endTime,
        category: category as any,
        status,
        date,
        createdAt: now,
        updatedAt: now
      }

      existingTasks.push(newTask)
      setStorageSync(tasksKey, existingTasks)

      return { success: true, skipped: false, title }
    } catch (err) {
      return { success: false, skipped: false, title: '' }
    }
  },

  importTodoTask(taskText: string): { success: boolean; skipped: boolean; title: string } {
    try {
      const lines = taskText.split('\n').map(l => l.trim()).filter(l => l)
      if (lines.length === 0) {
        return { success: false, skipped: false, title: '' }
      }

      // 解析第一行: "1. [优先级] 标题 - 描述"
      const firstLine = lines[0]
      const match = firstLine.match(/^\d+\.\s*\[([^\]]+)\]\s*(.+?)(?:\s*-\s*(.+))?$/)
      if (!match) {
        return { success: false, skipped: false, title: '' }
      }

      const priorityText = match[1].trim()
      const title = match[2].trim()
      const description = match[3] ? match[3].trim() : ''

      // 检查是否已存在（通过标题判断）
      const existingTasks = getStorageSync<TodoTask[]>('todo_tasks') || []
      const isDuplicate = existingTasks.some(t => t.title === title)

      if (isDuplicate) {
        return { success: false, skipped: true, title }
      }

      // 解析优先级
      const priority = this.parsePriority(priorityText)

      // 解析状态、日期等信息（从所有行中查找）
      const fullText = lines.join(' ')
      const statusMatch = fullText.match(/状态:\s*([^|]+)/)
      const statusText = statusMatch ? statusMatch[1].trim() : '待开始'
      const status = this.parseStatus(statusText)

      const startDateMatch = fullText.match(/开始日期:\s*(\d{4}-\d{2}-\d{2})/)
      const startDate = startDateMatch ? startDateMatch[1] : undefined

      const endDateMatch = fullText.match(/结束日期:\s*(\d{4}-\d{2}-\d{2})/)
      const endDate = endDateMatch ? endDateMatch[1] : undefined

      const now = Date.now()
      const newTask: TodoTask = {
        id: `todo_${now}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        description,
        priority,
        startDate,
        endDate,
        category: title as any, // 待办任务的分类就是标题
        status,
        createdAt: now,
        updatedAt: now
      }

      existingTasks.push(newTask)
      setStorageSync('todo_tasks', existingTasks)

      return { success: true, skipped: false, title }
    } catch (err) {
      return { success: false, skipped: false, title: '' }
    }
  },

  parseCategoryLine(line: string): { success: boolean; name: string; category: CategoryItem } {
    try {
      // 解析格式: "1. [#颜色] 分类名" 或 "22. [#795549] 工作日志开发"
      const match = line.match(/^\d+\.\s*\[([^\]]+)\]\s*(.+)$/)
      if (!match) {
        return { success: false, name: '', category: { name: '', color: '' } }
      }

      const color = match[1].trim()
      const name = match[2].trim()

      if (!name) {
        return { success: false, name: '', category: { name: '', color: '' } }
      }

      const category: CategoryItem = {
        name,
        color: color.startsWith('#') ? color : `#${color}`
      }

      return { success: true, name, category }
    } catch (err) {
      return { success: false, name: '', category: { name: '', color: '' } }
    }
  },

  parseStatus(statusText: string): TaskStatus {
    const statusMap: Record<string, TaskStatus> = {
      '待开始': TaskStatus.PENDING,
      '进行中': TaskStatus.IN_PROGRESS,
      '已暂停': TaskStatus.PAUSED,
      '已完成': TaskStatus.COMPLETED,
      '已取消': TaskStatus.CANCELLED
    }
    return statusMap[statusText] || TaskStatus.PENDING
  },

  parsePriority(priorityText: string): TaskPriority {
    const priorityMap: Record<string, TaskPriority> = {
      '紧急&重要': TaskPriority.URGENT_IMPORTANT,
      '重要&不紧急': TaskPriority.IMPORTANT_NOT_URGENT,
      '紧急&不重要': TaskPriority.URGENT_NOT_IMPORTANT,
      '不紧急&不重要': TaskPriority.NOT_URGENT_NOT_IMPORTANT
    }
    return priorityMap[priorityText] || TaskPriority.URGENT_IMPORTANT
  }
})

