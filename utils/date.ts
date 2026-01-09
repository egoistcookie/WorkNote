// utils/date.ts
/**
 * 日期处理工具函数
 */

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 格式化日期为 MM月DD日
 */
export function formatDateChinese(date: Date): string {
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}月${day}日`
}

/**
 * 格式化时间为 HH:mm
 */
export function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * 格式化时间为 HH:mm:ss
 */
export function formatTimeWithSeconds(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

/**
 * 获取当前时间字符串（包含秒）
 */
export function getCurrentTimeWithSeconds(): string {
  return formatTimeWithSeconds(new Date())
}

/**
 * 获取当前日期字符串
 */
export function getCurrentDate(): string {
  return formatDate(new Date())
}

/**
 * 获取当前时间字符串
 */
export function getCurrentTime(): string {
  return formatTime(new Date())
}

/**
 * 获取一周的日期范围
 */
export function getWeekDates(date: Date = new Date()): Date[] {
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // 调整为周一开始
  const monday = new Date(date.setDate(diff))
  const weekDates: Date[] = []
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    weekDates.push(d)
  }
  
  return weekDates
}

/**
 * 判断两个日期是否为同一天
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

/**
 * 计算时间差（分钟）
 */
export function getTimeDiff(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  
  const start = startHour * 60 + startMin
  const end = endHour * 60 + endMin
  
  return end - start
}

/**
 * 格式化时长为 "X时Y分"
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours === 0) {
    return `${mins}分`
  } else if (mins === 0) {
    return `${hours}时`
  } else {
    return `${hours}时${mins}分`
  }
}

/**
 * 格式化时长为 "X时Y分Z秒"
 */
export function formatDurationWithSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    if (minutes > 0) {
      if (secs > 0) {
        return `${hours}时${minutes}分${secs}秒`
      }
      return `${hours}时${minutes}分`
    }
    if (secs > 0) {
      return `${hours}时${secs}秒`
    }
    return `${hours}时`
  } else if (minutes > 0) {
    if (secs > 0) {
      return `${minutes}分${secs}秒`
    }
    return `${minutes}分`
  } else {
    return `${secs}秒`
  }
}

/**
 * 计算两个时间戳之间的秒数差
 */
export function getSecondsDiff(startTimestamp: number, endTimestamp: number): number {
  return Math.floor((endTimestamp - startTimestamp) / 1000)
}

/**
 * 获取星期几的中文
 */
export function getWeekdayChinese(date: Date): string {
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return weekdays[date.getDay()]
}

/**
 * 获取星期几的英文缩写
 */
export function getWeekdayAbbr(date: Date): string {
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return weekdays[date.getDay()]
}

/**
 * 将日期字符串和时间字符串转换为时间戳
 * 支持 HH:mm 和 HH:mm:ss 格式
 */
export function parseTimeToTimestamp(dateStr: string, timeStr: string): number | null {
  try {
    const [year, month, day] = dateStr.split('-').map(Number)
    const timeParts = timeStr.split(':')
    const hour = parseInt(timeParts[0]) || 0
    const minute = parseInt(timeParts[1]) || 0
    const second = parseInt(timeParts[2]) || 0
    const date = new Date(year, month - 1, day, hour, minute, second)
    return date.getTime()
  } catch (e) {
    return null
  }
}

/**
 * 从时间戳格式化时间为 HH:mm
 */
export function formatTimeFromTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  return formatTime(date)
}

/**
 * 将日期字符串（YYYY-MM-DD）转换为时间戳
 */
export function dateStringToTimestamp(dateStr: string): number {
  if (!dateStr) return Date.now()
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getTime()
}

/**
 * 将时间戳转换为日期字符串（YYYY-MM-DD）
 */
export function timestampToDateString(timestamp: number): string {
  if (!timestamp || isNaN(timestamp) || timestamp <= 0) {
    return formatDate(new Date())
  }
  const date = new Date(timestamp)
  // 验证日期是否有效
  if (isNaN(date.getTime())) {
    return formatDate(new Date())
  }
  return formatDate(date)
}

