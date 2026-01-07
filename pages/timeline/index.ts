// pages/timeline/index.ts
import { formatDate, getCurrentDate } from '../../utils/date'
import { Task, TaskStatus } from '../../types/task'
import { Category } from '../../types/common'

Page({
  data: {
    selectedDate: '',
    morningLog: '',
    eveningLog: '',
    tasks: [] as Task[]
  },

  onLoad() {
    const today = getCurrentDate()
    this.setData({
      selectedDate: today
    })
    this.loadTasks(today)
    this.loadLogs(today)
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
    // 模拟数据，后续从存储或API获取
    const mockTasks: Task[] = [
      {
        id: '1',
        title: '报表优化-发票查询报错修复',
        startTime: '16:10',
        endTime: '17:30',
        duration: '1时20分',
        category: Category.DEVELOPMENT,
        status: TaskStatus.PENDING,
        date: date,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: '2',
        title: '任务2',
        startTime: '21:45',
        category: Category.DEVELOPMENT,
        status: TaskStatus.PENDING,
        date: date,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ]
    this.setData({
      tasks: mockTasks
    })
  },

  loadLogs(date: string) {
    // 后续从存储获取
    this.setData({
      morningLog: '',
      eveningLog: ''
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
    // 后续实现开始任务逻辑
    console.log('开始任务')
  },

  onAddTask() {
    // 后续跳转到添加任务页面
    console.log('添加任务')
  },

  onTaskTap(e: WechatMiniprogram.CustomEvent) {
    const { task } = e.detail
    // 后续跳转到任务详情
    console.log('查看任务', task)
  }
})

