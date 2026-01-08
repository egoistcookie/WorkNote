// pages/timeline/index.ts
import { formatDate, getCurrentDate, getCurrentTime, formatDurationWithSeconds, getSecondsDiff } from '../../utils/date'
import { Task, TaskStatus } from '../../types/task'
import { Category } from '../../types/common'
import { getStorageSync, setStorageSync } from '../../utils/storage'

Page({
  data: {
    selectedDate: '',
    morningLog: '',
    eveningLog: '',
    tasks: [] as Task[],
    completedTasks: [] as Task[],
    showTaskModal: false,
    currentTask: null as Task | null,
    timerInterval: null as number | null
  },

  onLoad() {
    const today = getCurrentDate()
    this.setData({
      selectedDate: today
    })
    this.loadTasks(today)
    this.loadLogs(today)
    // 检查是否有正在进行的任务
    this.checkRunningTask()
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
    
    // 分离进行中和已完成的任务，并按时间倒序排列
    const inProgressTasks = allTasks
      .filter(task => 
        task.status === TaskStatus.IN_PROGRESS || task.status === TaskStatus.PENDING
      )
      .sort((a, b) => {
        // 进行中的任务排在前面
        if (a.status === TaskStatus.IN_PROGRESS && b.status !== TaskStatus.IN_PROGRESS) {
          return -1
        }
        if (a.status !== TaskStatus.IN_PROGRESS && b.status === TaskStatus.IN_PROGRESS) {
          return 1
        }
        // 按创建时间倒序
        return b.createdAt - a.createdAt
      })
    
    const completedTasks = allTasks
      .filter(task => task.status === TaskStatus.COMPLETED)
      .sort((a, b) => b.updatedAt - a.updatedAt) // 按完成时间倒序

    this.setData({
      tasks: inProgressTasks,
      completedTasks: completedTasks
    })

    // 如果有正在进行的任务，启动计时器
    const runningTask = inProgressTasks.find(task => task.status === TaskStatus.IN_PROGRESS)
    if (runningTask) {
      this.setData({
        currentTask: runningTask
      })
      this.startTimer(runningTask)
    }
  },

  loadLogs(date: string) {
    // 后续从存储获取
    this.setData({
      morningLog: '',
      eveningLog: ''
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
      const elapsedSeconds = getSecondsDiff(task.startTimestamp, now)
      const duration = formatDurationWithSeconds(elapsedSeconds)
      
      // 更新任务列表中的显示
      const tasks = this.data.tasks.map((t: Task) => {
        if (t.id === task.id) {
          return {
            ...t,
            duration: duration,
            elapsedSeconds: elapsedSeconds
          }
        }
        return t
      })
      
      this.setData({
        tasks: tasks,
        currentTask: {
          ...task,
          duration: duration,
          elapsedSeconds: elapsedSeconds
        }
      })
    }, 1000)

    this.setData({
      timerInterval: interval
    })
  },

  onMorningLogTap() {
    // 后续跳转到编辑页面
    console.log('编辑晨间日志')
  },

  onEveningLogTap() {
    // 后续跳转到编辑页面
    console.log('编辑夜晚总结')
  },

  onStartTask() {
    // 如果有正在进行的任务，则完成它
    const runningTask = this.data.tasks.find((task: Task) => task.status === TaskStatus.IN_PROGRESS)
    if (runningTask) {
      this.completeTask(runningTask.id)
    }
  },

  onAddTask() {
    this.setData({
      showTaskModal: true
    })
  },

  onTaskModalClose() {
    this.setData({
      showTaskModal: false
    })
  },

  onTaskSave(e: WechatMiniprogram.CustomEvent) {
    const { title, category, description, startTimer } = e.detail
    const now = Date.now()
    const currentTime = getCurrentTime()
    const currentDate = this.data.selectedDate || getCurrentDate()
    
    // 确保 description 字段存在，即使是空字符串也要保留
    const taskDescription = description || ''
    
    const newTask: Task = {
      id: `task_${now}`,
      title: title,
      description: taskDescription,
      startTime: currentTime,
      category: category,
      status: startTimer ? TaskStatus.IN_PROGRESS : TaskStatus.PENDING,
      date: currentDate,
      startTimestamp: startTimer ? now : undefined,
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

    // 如果开始计时，启动定时器
    if (startTimer) {
      this.setData({
        currentTask: newTask
      })
      this.startTimer(newTask)
    }

    // 关闭弹窗
    this.setData({
      showTaskModal: false
    })
  },

  completeTask(taskId: string) {
    const currentDate = this.data.selectedDate || getCurrentDate()
    const tasksKey = `tasks_${currentDate}`
    const allTasks = getStorageSync<Task[]>(tasksKey) || []
    
    const task = allTasks.find(t => t.id === taskId)
    if (!task) return

    const now = Date.now()
    const endTime = getCurrentTime()
    
    // 计算总时长
    let duration = '0秒'
    if (task.startTimestamp) {
      const elapsedSeconds = getSecondsDiff(task.startTimestamp, now)
      duration = formatDurationWithSeconds(elapsedSeconds)
    }

    // 更新任务状态
    const updatedTask: Task = {
      ...task,
      status: TaskStatus.COMPLETED,
      endTime: endTime,
      duration: duration,
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
  },

  onTaskTap(e: WechatMiniprogram.CustomEvent) {
    const { task } = e.detail
    // 后续跳转到任务详情
    console.log('查看任务', task)
  }
})

