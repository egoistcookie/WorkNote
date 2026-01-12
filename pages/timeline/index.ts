// pages/timeline/index.ts
import { formatDate, getCurrentDate, getCurrentTime, formatDurationWithSeconds, getSecondsDiff, parseTimeToTimestamp, formatTimeFromTimestamp } from '../../utils/date'
import { Task, TaskStatus } from '../../types/task'
import { Category } from '../../types/common'
import { getStorageSync, setStorageSync } from '../../utils/storage'
import { getCurrentTheme, toggleTheme, getThemeColors, type ThemeType, type ThemeColors } from '../../utils/theme'

Page({
  data: {
    selectedDate: '',
    morningLog: '',
    eveningLog: '',
    tasks: [] as Task[],
    completedTasks: [] as Task[],
    showTaskModal: false,
    editingTask: null as Task | null,
    currentTask: null as Task | null,
    selectedTaskId: '' as string,
    selectedTask: null as Task | null,
    timerInterval: null as number | null,
    showLogModal: false,
    logType: 'morning' as 'morning' | 'evening',
    logContent: '',
    editingLogDate: '',
    theme: 'warm' as ThemeType,
    themeColors: null as ThemeColors | null
  },

  onLoad() {
    const today = getCurrentDate()
    const theme = getCurrentTheme()
    const themeColors = getThemeColors(theme)
    this.setData({
      selectedDate: today,
      theme: theme,
      themeColors: themeColors
    })
    this.loadTasks(today)
    this.loadLogs(today)
    // 检查是否有正在进行的任务
    this.checkRunningTask()
    // 应用主题样式
    this.applyTheme(theme)
  },

  onShow() {
    // 每次显示页面时检查主题是否变化
    const theme = getCurrentTheme()
    if (this.data.theme !== theme) {
      const themeColors = getThemeColors(theme)
      this.setData({ theme, themeColors })
      this.applyTheme(theme)
    }
  },

  onThemeToggle() {
    const newTheme = toggleTheme()
    const themeColors = getThemeColors(newTheme)
    this.setData({ theme: newTheme, themeColors })
    this.applyTheme(newTheme)
    wx.showToast({
      title: newTheme === 'warm' ? '暖色调' : '冷色调',
      icon: 'success',
      duration: 1500
    })
  },

  onThemeChange(theme: ThemeType) {
    const themeColors = getThemeColors(theme)
    this.setData({ theme, themeColors })
    this.applyTheme(theme)
  },

  applyTheme(theme: ThemeType) {
    // 更新主题颜色
    const themeColors = getThemeColors(theme)
    this.setData({ themeColors })
    // 重新加载页面以应用新主题样式
    const pages = getCurrentPages()
    if (pages.length > 0) {
      const currentPage = pages[pages.length - 1]
      if (currentPage === this) {
        // 强制更新所有子组件和页面
        this.loadTasks(this.data.selectedDate)
        this.loadLogs(this.data.selectedDate)
      }
    }
  },

  onUnload() {
    // 清除定时器
    if (this.data.timerInterval) {
      clearInterval(this.data.timerInterval)
    }
  },

  onDateChange(e: WechatMiniprogram.CustomEvent) {
    const { date } = e.detail
    this.setData({
      selectedDate: date
    })
    this.loadTasks(date)
    this.loadLogs(date)
  },

  loadTasks(date: string) {
    // 从存储获取任务
    const tasksKey = `tasks_${date}`
    const allTasks = getStorageSync<Task[]>(tasksKey) || []

    // 补齐导入任务的耗时字段（导入数据可能只有开始/结束时间）
    const normalizeTask = (task: Task): Task => {
      // 已有耗时直接返回
      if (task.elapsedSeconds && task.duration) {
        return task
      }

      // 优先累加时间片
      let totalSeconds = 0
      if (task.timeSegments && task.timeSegments.length > 0) {
        totalSeconds = task.timeSegments.reduce((sum, seg) => sum + (seg.duration || 0), 0)
      }

      // 如果没有时间片但有开始/结束时间，按日期计算耗时
      if (totalSeconds === 0 && task.startTime && task.endTime) {
        const targetDate = task.date || date
        const startTs = parseTimeToTimestamp(targetDate, task.startTime)
        let endTs = parseTimeToTimestamp(targetDate, task.endTime)
        
        // 处理跨天情况：如果结束时间小于开始时间，说明是跨天任务，结束时间应该是第二天
        if (startTs && endTs) {
          if (endTs <= startTs) {
            // 跨天任务：结束时间加一天
            const [year, month, day] = targetDate.split('-').map(Number)
            const timeParts = task.endTime.split(':')
            const hour = parseInt(timeParts[0]) || 0
            const minute = parseInt(timeParts[1]) || 0
            const second = parseInt(timeParts[2]) || 0
            const endDate = new Date(year, month - 1, day + 1, hour, minute, second)
            endTs = endDate.getTime()
          }
          if (endTs > startTs) {
            totalSeconds = getSecondsDiff(startTs, endTs)
          }
        }
      }

      // 如果仍为0且有已有字段，沿用原值
      const elapsedSeconds = totalSeconds > 0 ? totalSeconds : (task.elapsedSeconds || 0)
      const duration = elapsedSeconds > 0 ? formatDurationWithSeconds(elapsedSeconds) : task.duration

      return {
        ...task,
        elapsedSeconds,
        duration
      }
    }

    const normalizedAllTasks = allTasks.map(normalizeTask)

    // 分离未完成和已完成的任务，并按时间倒序排列
    const inProgressTasks = normalizedAllTasks
      .filter(task => 
        task.status === TaskStatus.IN_PROGRESS || 
        task.status === TaskStatus.PENDING || 
        task.status === TaskStatus.PAUSED
      )
      .sort((a, b) => {
        // 进行中的任务排在最后
        if (a.status === TaskStatus.IN_PROGRESS && b.status !== TaskStatus.IN_PROGRESS) {
          return 1
        }
        if (a.status !== TaskStatus.IN_PROGRESS && b.status === TaskStatus.IN_PROGRESS) {
          return -1
        }
        // 暂停的任务排在待开始之前
        if (a.status === TaskStatus.PAUSED && b.status === TaskStatus.PENDING) {
          return -1
        }
        if (a.status === TaskStatus.PENDING && b.status === TaskStatus.PAUSED) {
          return 1
        }
        // 按创建时间倒序
        return b.createdAt - a.createdAt
      })
    
    const completedTasks = normalizedAllTasks
      .filter(task => task.status === TaskStatus.COMPLETED)
      .sort((a, b) => b.updatedAt - a.updatedAt) // 按完成时间倒序

    // 更新选中任务（如果存在）
    let updatedSelectedTask: Task | null = null
    if (this.data.selectedTaskId) {
      updatedSelectedTask = inProgressTasks.find(task => task.id === this.data.selectedTaskId) || null
    }

    this.setData({
      tasks: inProgressTasks,
      completedTasks: completedTasks,
      selectedTask: updatedSelectedTask
    })

    // 如果有正在进行的任务，启动计时器
    const runningTask = inProgressTasks.find(task => task.status === TaskStatus.IN_PROGRESS)
    if (runningTask) {
      this.setData({
        currentTask: runningTask
      })
      this.startTimer(runningTask)
    } else {
      this.setData({
        currentTask: null
      })
    }
  },

  loadLogs(date: string) {
    // 从存储获取日志
    const morningKey = `log_morning_${date}`
    const eveningKey = `log_evening_${date}`
    const morningLog = getStorageSync<string>(morningKey) || ''
    const eveningLog = getStorageSync<string>(eveningKey) || ''
    
    this.setData({
      morningLog,
      eveningLog
    })
  },

  checkRunningTask() {
    const today = getCurrentDate()
    const tasksKey = `tasks_${today}`
    const allTasks = getStorageSync<Task[]>(tasksKey) || []
    const runningTask = allTasks.find(task => task.status === TaskStatus.IN_PROGRESS)
    
    if (runningTask && runningTask.startTimestamp) {
      this.setData({
        currentTask: runningTask
      })
      this.startTimer(runningTask)
    }
  },

  startTimer(task: Task) {
    // 清除之前的定时器
    if (this.data.timerInterval) {
      clearInterval(this.data.timerInterval)
    }

    // 每秒更新一次计时
    const interval = setInterval(() => {
      if (!task.startTimestamp) return
      
      const now = Date.now()
      const currentSegmentSeconds = getSecondsDiff(task.startTimestamp, now)
      
      // 计算之前时间段的总耗时
      let previousDuration = 0
      if (task.timeSegments && task.timeSegments.length > 0) {
        previousDuration = task.timeSegments.reduce((sum, seg) => sum + (seg.duration || 0), 0)
      }
      
      // 总耗时 = 之前时间段 + 当前时间段
      const totalElapsedSeconds = previousDuration + currentSegmentSeconds
      const duration = formatDurationWithSeconds(totalElapsedSeconds)
      
      // 更新任务列表中的显示
      const tasks = this.data.tasks.map((t: Task) => {
        if (t.id === task.id) {
          return {
            ...t,
            duration: duration,
            elapsedSeconds: totalElapsedSeconds
          }
        }
        return t
      })
      
      this.setData({
        tasks: tasks,
        currentTask: {
          ...task,
          duration: duration,
          elapsedSeconds: totalElapsedSeconds
        }
      })
    }, 1000)

    this.setData({
      timerInterval: interval
    })
  },

  onMorningLogTap() {
    const { selectedDate, morningLog } = this.data
    this.setData({
      showLogModal: true,
      logType: 'morning',
      logContent: morningLog,
      editingLogDate: selectedDate
    })
  },

  onEveningLogTap() {
    const { selectedDate, eveningLog } = this.data
    this.setData({
      showLogModal: true,
      logType: 'evening',
      logContent: eveningLog,
      editingLogDate: selectedDate
    })
  },

  onLogContentInput(e: WechatMiniprogram.Input) {
    this.setData({
      logContent: e.detail.value
    })
  },

  onSaveLog() {
    const { logContent, logType, editingLogDate, selectedDate } = this.data
    
    if (!logContent.trim()) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none'
      })
      return
    }

    const date = editingLogDate || selectedDate
    const logKey = `log_${logType}_${date}`
    
    setStorageSync(logKey, logContent)
    
    // 如果保存的是当前选中日期的日志，更新显示并重新加载日志
    if (date === selectedDate) {
      this.loadLogs(selectedDate)
    }
    
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    })
    
    this.setData({
      showLogModal: false,
      logContent: '',
      editingLogDate: ''
    })
  },

  onCancelLog() {
    this.setData({
      showLogModal: false,
      logContent: '',
      editingLogDate: ''
    })
  },

  onTaskTap(e: WechatMiniprogram.CustomEvent) {
    // 点击未完成任务时，选中该任务
    const { task } = e.detail
    if (!task) return
    
    if (task.status === TaskStatus.COMPLETED) {
      // 已完成任务保持原逻辑，打开编辑弹窗
      this.setData({
        showTaskModal: true,
        editingTask: task,
        selectedTaskId: '',
        selectedTask: null
      })
    } else {
      // 未完成任务：切换选中状态
      const newSelectedId = this.data.selectedTaskId === task.id ? '' : task.id
      const newSelectedTask = newSelectedId ? task : null
      this.setData({
        selectedTaskId: newSelectedId,
        selectedTask: newSelectedTask
      })
    }
  },

  onTaskDetail(e: WechatMiniprogram.CustomEvent) {
    // 点击详情按钮，打开任务编辑弹窗
    const { task } = e.detail
    this.setData({
      showTaskModal: true,
      editingTask: task
    })
  },

  onPauseTask() {
    // 暂停选中的任务（必须是进行状态）
    const selectedTask = this.data.selectedTask
    if (!selectedTask || selectedTask.status !== TaskStatus.IN_PROGRESS) {
      wx.showToast({
        title: '请选择正在进行的任务',
        icon: 'none'
      })
      return
    }

    const now = Date.now()
    const currentDate = this.data.selectedDate || getCurrentDate()
    const tasksKey = `tasks_${currentDate}`
    const allTasks = getStorageSync<Task[]>(tasksKey) || []
    
    const task = allTasks.find(t => t.id === selectedTask.id)
    if (!task) return

    // 结束当前时间段
    if (task.startTimestamp) {
      const segmentDuration = getSecondsDiff(task.startTimestamp, now)
      
      // 初始化时间段数组
      if (!task.timeSegments) {
        task.timeSegments = []
      }
      
      // 添加当前时间段
      task.timeSegments.push({
        startTimestamp: task.startTimestamp,
        endTimestamp: now,
        duration: segmentDuration
      })
      
      // 计算总耗时
      const totalDuration = task.timeSegments.reduce((sum, seg) => sum + (seg.duration || 0), 0)
      task.elapsedSeconds = totalDuration
      task.duration = formatDurationWithSeconds(totalDuration)
    }

    // 更新任务状态为暂停
    const updatedTask: Task = {
      ...task,
      status: TaskStatus.PAUSED,
      startTimestamp: undefined,
      updatedAt: now
    }

    // 清除定时器
    if (this.data.timerInterval) {
      clearInterval(this.data.timerInterval)
      this.setData({
        timerInterval: null,
        currentTask: null
      })
    }

    // 更新存储
    const updatedTasks = allTasks.map(t => 
      t.id === selectedTask.id ? updatedTask : t
    )
    setStorageSync(tasksKey, updatedTasks)

    // 保存选中任务ID，以便在重新加载后恢复选中状态
    const selectedTaskId = this.data.selectedTaskId
    
    // 重新加载任务列表
    this.loadTasks(currentDate)
    
    // 恢复选中状态（任务状态已变为暂停）
    if (selectedTaskId) {
      const updatedSelectedTask = this.data.tasks.find((task: Task) => task.id === selectedTaskId)
      if (updatedSelectedTask) {
        this.setData({
          selectedTaskId: selectedTaskId,
          selectedTask: updatedSelectedTask
        })
      }
    }
  },

  onResumeTask() {
    // 恢复选中的任务（可以是暂停或待开始状态）
    const selectedTask = this.data.selectedTask
    if (!selectedTask || (selectedTask.status !== TaskStatus.PAUSED && selectedTask.status !== TaskStatus.PENDING)) {
      wx.showToast({
        title: '请选择暂停或待开始的任务',
        icon: 'none'
      })
      return
    }
    
    // 保存选中任务ID，以便在重新加载后恢复选中状态
    const selectedTaskId = this.data.selectedTaskId
    
    this.resumeTask(selectedTask.id)
    
    // 恢复选中状态（任务状态已变为进行中）
    // 由于resumeTask内部会调用loadTasks，我们需要在loadTasks之后恢复选中状态
    if (selectedTaskId) {
      // 使用setTimeout确保在loadTasks完成后再恢复选中状态
      setTimeout(() => {
        const updatedSelectedTask = this.data.tasks.find((task: Task) => task.id === selectedTaskId)
        if (updatedSelectedTask) {
          this.setData({
            selectedTaskId: selectedTaskId,
            selectedTask: updatedSelectedTask
          })
        }
      }, 50)
    }
  },

  resumeTask(taskId: string) {
    // 确保只有一个正在进行的任务
    const currentDate = this.data.selectedDate || getCurrentDate()
    const tasksKey = `tasks_${currentDate}`
    const allTasks = getStorageSync<Task[]>(tasksKey) || []
    
    // 先暂停所有正在进行的任务
    const runningTasks = allTasks.filter(t => t.status === TaskStatus.IN_PROGRESS)
    const now = Date.now()
    
    runningTasks.forEach(runningTask => {
      if (runningTask.startTimestamp) {
        const segmentDuration = getSecondsDiff(runningTask.startTimestamp, now)
        
        if (!runningTask.timeSegments) {
          runningTask.timeSegments = []
        }
        
        runningTask.timeSegments.push({
          startTimestamp: runningTask.startTimestamp,
          endTimestamp: now,
          duration: segmentDuration
        })
        
        const totalDuration = runningTask.timeSegments.reduce((sum, seg) => sum + (seg.duration || 0), 0)
        runningTask.elapsedSeconds = totalDuration
        runningTask.duration = formatDurationWithSeconds(totalDuration)
      }
      
      runningTask.status = TaskStatus.PAUSED
      runningTask.startTimestamp = undefined
      runningTask.updatedAt = now
    })

    // 清除当前定时器
    if (this.data.timerInterval) {
      clearInterval(this.data.timerInterval)
    }

    // 恢复指定任务
    const task = allTasks.find(t => t.id === taskId)
    if (!task) {
      return
    }
    
    // 允许恢复暂停或待开始的任务
    if (task.status !== TaskStatus.PAUSED && task.status !== TaskStatus.PENDING) {
      return
    }
    
    // 如果是第一次开始（PENDING状态），初始化timeSegments
    if (!task.timeSegments) {
      task.timeSegments = []
    }

    const updatedTask: Task = {
      ...task,
      status: TaskStatus.IN_PROGRESS,
      startTimestamp: now,
      updatedAt: now
    }

    // 更新存储
    const updatedTasks = allTasks.map(t => {
      const runningTask = runningTasks.find(rt => rt.id === t.id)
      if (runningTask) {
        return runningTask
      }
      return t.id === taskId ? updatedTask : t
    })
    setStorageSync(tasksKey, updatedTasks)

    // 重新加载任务列表并启动计时器
    this.loadTasks(currentDate)
  },

  onCompleteTask() {
    // 完成选中的任务
    const selectedTask = this.data.selectedTask
    if (!selectedTask) {
      wx.showToast({
        title: '请选择要完成的任务',
        icon: 'none'
      })
      return
    }
    
    this.completeTask(selectedTask.id)
    // 清除选中状态
    this.setData({
      selectedTaskId: '',
      selectedTask: null
    })
  },

  onAddTask() {
    this.setData({
      showTaskModal: true,
      editingTask: null as any
    })
  },

  onTaskModalClose() {
    this.setData({
      showTaskModal: false
    })
  },

  onTaskSave(e: WechatMiniprogram.CustomEvent) {
    const { id, title, category, description, startTime, endTime, isEdit, startTimer } = e.detail
    const now = Date.now()
    const currentDate = this.data.selectedDate || getCurrentDate()
    
    // 确保 description 字段存在，即使是空字符串也要保留
    const taskDescription = description || ''
    
    if (isEdit && id) {
      // 编辑模式：更新现有任务
      this.updateTask(id, {
        title,
        category,
        description: taskDescription,
        startTime,
        endTime
      })
    } else {
      // 新建模式：创建新任务
      // 如果开始计时，先暂停所有正在进行的任务
      if (startTimer) {
        const tasksKey = `tasks_${currentDate}`
        const allTasks = getStorageSync<Task[]>(tasksKey) || []
        const runningTasks = allTasks.filter(t => t.status === TaskStatus.IN_PROGRESS)
        const pauseNow = Date.now()
        
        runningTasks.forEach(runningTask => {
          if (runningTask.startTimestamp) {
            const segmentDuration = getSecondsDiff(runningTask.startTimestamp, pauseNow)
            
            if (!runningTask.timeSegments) {
              runningTask.timeSegments = []
            }
            
            runningTask.timeSegments.push({
              startTimestamp: runningTask.startTimestamp,
              endTimestamp: pauseNow,
              duration: segmentDuration
            })
            
            const totalDuration = runningTask.timeSegments.reduce((sum, seg) => sum + (seg.duration || 0), 0)
            runningTask.elapsedSeconds = totalDuration
            runningTask.duration = formatDurationWithSeconds(totalDuration)
          }
          
          runningTask.status = TaskStatus.PAUSED
          runningTask.startTimestamp = undefined
          runningTask.updatedAt = pauseNow
        })
        
        // 清除当前定时器
        if (this.data.timerInterval) {
          clearInterval(this.data.timerInterval)
        }
        
        if (runningTasks.length > 0) {
          const updatedTasks = allTasks.map(t => {
            const runningTask = runningTasks.find(rt => rt.id === t.id)
            return runningTask || t
          })
          setStorageSync(tasksKey, updatedTasks)
        }
      }
      
      const currentTime = getCurrentTime()
      const newTask: Task = {
        id: `task_${now}`,
        title: title,
        description: taskDescription,
        startTime: currentTime,
        endTime: undefined,
        category: category,
        status: startTimer ? TaskStatus.IN_PROGRESS : TaskStatus.PENDING,
        date: currentDate,
        startTimestamp: startTimer ? now : undefined,
        timeSegments: [],
        createdAt: now,
        updatedAt: now,
        duration: startTimer ? '0秒' : undefined,
        elapsedSeconds: 0
      }

      // 保存到存储
      const tasksKey = `tasks_${currentDate}`
      const existingTasks = getStorageSync<Task[]>(tasksKey) || []
      existingTasks.push(newTask)
      setStorageSync(tasksKey, existingTasks)

      // 更新列表
      this.loadTasks(currentDate)

      // 如果开始计时，启动定时器并选中新任务
      if (startTimer) {
        this.setData({
          currentTask: newTask,
          selectedTaskId: newTask.id,
          selectedTask: newTask
        })
        this.startTimer(newTask)
        
        // 确保在loadTasks之后选中状态正确（因为loadTasks可能会更新tasks列表）
        setTimeout(() => {
          const updatedTask = this.data.tasks.find((task: Task) => task.id === newTask.id)
          if (updatedTask) {
            this.setData({
              selectedTaskId: newTask.id,
              selectedTask: updatedTask
            })
          }
        }, 50)
      }
    }

    // 关闭弹窗
    this.setData({
      showTaskModal: false,
      editingTask: null as any
    })
  },

  updateTask(taskId: string, updates: Partial<Task>) {
    const currentDate = this.data.selectedDate || getCurrentDate()
    const tasksKey = `tasks_${currentDate}`
    const allTasks = getStorageSync<Task[]>(tasksKey) || []
    
    const task = allTasks.find(t => t.id === taskId)
    if (!task) return

    // 如果修改了时间，重新计算耗时
    let duration = task.duration
    let elapsedSeconds = task.elapsedSeconds
    if (updates.startTime || updates.endTime) {
      const startTime = updates.startTime || task.startTime
      const endTime = updates.endTime || task.endTime
      
      if (startTime && endTime) {
        const { parseTimeToTimestamp, getSecondsDiff, formatDurationWithSeconds } = require('../../utils/date')
        const startTimestamp = parseTimeToTimestamp(currentDate, startTime)
        const endTimestamp = parseTimeToTimestamp(currentDate, endTime)
        
        if (startTimestamp && endTimestamp) {
          elapsedSeconds = getSecondsDiff(startTimestamp, endTimestamp)
          duration = formatDurationWithSeconds(elapsedSeconds)
        }
      }
    }

    // 更新任务
    const updatedTask: Task = {
      ...task,
      ...updates,
      duration,
      elapsedSeconds,
      updatedAt: Date.now()
    }

    // 更新存储
    const updatedTasks = allTasks.map(t => 
      t.id === taskId ? updatedTask : t
    )
    setStorageSync(tasksKey, updatedTasks)

    // 重新加载任务列表
    this.loadTasks(currentDate)
  },

  onTaskDelete(e: WechatMiniprogram.CustomEvent) {
    const { id } = e.detail
    if (!id) return

    const currentDate = this.data.selectedDate || getCurrentDate()
    const tasksKey = `tasks_${currentDate}`
    const allTasks = getStorageSync<Task[]>(tasksKey) || []
    
    // 检查任务是否存在
    const task = allTasks.find(t => t.id === id)
    if (!task) {
      wx.showToast({
        title: '任务不存在',
        icon: 'none'
      })
      return
    }

    // 如果删除的是正在进行的任务，清除定时器
    if (task.status === TaskStatus.IN_PROGRESS && this.data.currentTask?.id === id) {
      if (this.data.timerInterval) {
        clearInterval(this.data.timerInterval)
        this.setData({
          timerInterval: null,
          currentTask: null
        })
      }
    }

    // 从列表中删除任务
    const updatedTasks = allTasks.filter(t => t.id !== id)
    setStorageSync(tasksKey, updatedTasks)

    // 重新加载任务列表
    this.loadTasks(currentDate)

    // 关闭弹窗
    this.setData({
      showTaskModal: false,
      editingTask: null as any
    })

    wx.showToast({
      title: '删除成功',
      icon: 'success'
    })
  },

  completeTask(taskId: string) {
    const currentDate = this.data.selectedDate || getCurrentDate()
    const tasksKey = `tasks_${currentDate}`
    const allTasks = getStorageSync<Task[]>(tasksKey) || []
    
    const task = allTasks.find(t => t.id === taskId)
    if (!task) return

    const now = Date.now()
    
    // 如果任务正在计时，先结束当前时间段
    if (task.startTimestamp) {
      const segmentDuration = getSecondsDiff(task.startTimestamp, now)
      
      if (!task.timeSegments) {
        task.timeSegments = []
      }
      
      task.timeSegments.push({
        startTimestamp: task.startTimestamp,
        endTimestamp: now,
        duration: segmentDuration
      })
    }
    
    // 计算总时长
    let totalDuration = 0
    if (task.timeSegments && task.timeSegments.length > 0) {
      totalDuration = task.timeSegments.reduce((sum, seg) => sum + (seg.duration || 0), 0)
    } else if (task.elapsedSeconds) {
      totalDuration = task.elapsedSeconds
    }
    
    const duration = formatDurationWithSeconds(totalDuration)

    // 确定结束时间：如果任务曾经暂停过（有timeSegments），使用最后一个时间段的结束时间
    // 否则使用当前时间
    let endTime: string
    if (task.timeSegments && task.timeSegments.length > 0) {
      // 获取最后一个时间段（应该是最新的）
      const lastSegment = task.timeSegments[task.timeSegments.length - 1]
      if (lastSegment.endTimestamp) {
        endTime = formatTimeFromTimestamp(lastSegment.endTimestamp)
      } else {
        endTime = getCurrentTime()
      }
    } else {
      endTime = getCurrentTime()
    }

    // 更新任务状态
    const updatedTask: Task = {
      ...task,
      status: TaskStatus.COMPLETED,
      endTime: endTime,
      duration: duration,
      elapsedSeconds: totalDuration,
      startTimestamp: undefined,
      updatedAt: now
    }

    // 更新存储
    const updatedTasks = allTasks.map(t => 
      t.id === taskId ? updatedTask : t
    )
    setStorageSync(tasksKey, updatedTasks)

    // 清除定时器
    if (this.data.timerInterval) {
      clearInterval(this.data.timerInterval)
      this.setData({
        timerInterval: null,
        currentTask: null
      })
    }

    // 重新加载任务列表
    this.loadTasks(currentDate)
  }
})

