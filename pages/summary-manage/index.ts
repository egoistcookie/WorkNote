// pages/summary-manage/index.ts
import { getCurrentDate, formatDate } from '../../utils/date'
import { getStorageSync, setStorageSync } from '../../utils/storage'
import { Log, LogType } from '../../types/log'

Page({
  data: {
    logs: [] as Log[],
    selectedDate: '',
    showLogModal: false,
    editingLog: null as Log | null,
    logContent: '',
    logType: LogType.MORNING
  },

  onLoad() {
    const today = getCurrentDate()
    this.setData({
      selectedDate: today
    })
    this.loadLogs()
  },

  loadLogs() {
    // 获取所有日志（最近365天）
    const logs: Log[] = []
    const today = new Date()
    
    for (let i = 0; i < 365; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = formatDate(date)
      
      const morningKey = `log_morning_${dateStr}`
      const eveningKey = `log_evening_${dateStr}`
      
      const morningLog = getStorageSync<string>(morningKey)
      const eveningLog = getStorageSync<string>(eveningKey)
      
      if (morningLog) {
        logs.push({
          id: `morning_${dateStr}`,
          type: LogType.MORNING,
          content: morningLog,
          date: dateStr,
          createdAt: date.getTime(),
          updatedAt: date.getTime()
        })
      }
      
      if (eveningLog) {
        logs.push({
          id: `evening_${dateStr}`,
          type: LogType.EVENING,
          content: eveningLog,
          date: dateStr,
          createdAt: date.getTime(),
          updatedAt: date.getTime()
        })
      }
    }
    
    // 按日期倒序排列
    logs.sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateB - dateA
    })
    
    this.setData({
      logs
    })
  },

  onDateChange(e: WechatMiniprogram.CustomEvent) {
    const { date } = e.detail
    this.setData({
      selectedDate: date
    })
    this.loadLogs()
  },

  onAddLog(e: WechatMiniprogram.TouchEvent) {
    const { type } = e.currentTarget.dataset
    const today = getCurrentDate()
    this.setData({
      showLogModal: true,
      editingLog: null,
      logContent: '',
      logType: type === 'morning' ? LogType.MORNING : LogType.EVENING,
      selectedDate: today
    })
  },

  onEditLog(e: WechatMiniprogram.TouchEvent) {
    const { log } = e.currentTarget.dataset
    this.setData({
      showLogModal: true,
      editingLog: log,
      logContent: log.content,
      logType: log.type,
      selectedDate: log.date
    })
  },

  onLogContentInput(e: WechatMiniprogram.Input) {
    this.setData({
      logContent: e.detail.value
    })
  },

  onDatePickerChange(e: WechatMiniprogram.PickerChange) {
    this.setData({
      selectedDate: e.detail.value
    })
  },

  onSaveLog() {
    const { logContent, logType, editingLog, selectedDate } = this.data
    
    if (!logContent.trim()) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none'
      })
      return
    }

    const date = editingLog ? editingLog.date : selectedDate
    const logKey = `log_${logType}_${date}`
    
    setStorageSync(logKey, logContent)
    
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    })
    
    this.setData({
      showLogModal: false,
      editingLog: null,
      logContent: ''
    })
    
    this.loadLogs()
  },

  onDeleteLog(e: WechatMiniprogram.TouchEvent) {
    const { log } = e.currentTarget.dataset
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除这条${log.type === LogType.MORNING ? '晨间计划' : '夜间总结'}吗？`,
      success: (res) => {
        if (res.confirm) {
          const logKey = `log_${log.type}_${log.date}`
          setStorageSync(logKey, '')
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          })
          
          this.loadLogs()
        }
      }
    })
  },

  onCancelLog() {
    this.setData({
      showLogModal: false,
      editingLog: null,
      logContent: ''
    })
  }
})

