// types/log.ts

/**
 * 日志类型
 */
export enum LogType {
  MORNING = 'morning',
  EVENING = 'evening'
}

/**
 * 日志数据接口
 */
export interface Log {
  id: string
  type: LogType
  content: string
  date: string // 格式: YYYY-MM-DD
  createdAt: number
  updatedAt: number
}

/**
 * 创建日志参数
 */
export interface CreateLogParams {
  type: LogType
  content: string
  date?: string
}

