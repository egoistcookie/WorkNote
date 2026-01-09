// types/task.ts
import { Category } from './common'

/**
 * 任务状态
 */
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

/**
 * 时间段数据
 */
export interface TimeSegment {
  startTimestamp: number
  endTimestamp?: number
  duration?: number // 秒数
}

/**
 * 任务数据接口
 */
export interface Task {
  id: string
  title: string
  description?: string
  startTime: string // 格式: HH:mm
  endTime?: string // 格式: HH:mm
  duration?: string // 格式: "1时20分" 或 "1时20分30秒"
  category: Category
  status: TaskStatus
  date: string // 格式: YYYY-MM-DD
  startTimestamp?: number // 当前时间段开始时间戳（用于计时）
  elapsedSeconds?: number // 已用秒数（用于实时显示）
  timeSegments?: TimeSegment[] // 所有时间段记录
  createdAt: number
  updatedAt: number
}

/**
 * 任务优先级（四象限）
 */
export enum TaskPriority {
  URGENT_IMPORTANT = 'urgent_important',      // 紧急&重要
  IMPORTANT_NOT_URGENT = 'important_not_urgent', // 重要&不紧急
  URGENT_NOT_IMPORTANT = 'urgent_not_important', // 紧急&不重要
  NOT_URGENT_NOT_IMPORTANT = 'not_urgent_not_important' // 不紧急&不重要
}

/**
 * 待办任务接口
 */
export interface TodoTask {
  id: string
  title: string
  description?: string
  priority: TaskPriority
  startDate?: string // 格式: YYYY-MM-DD
  endDate?: string // 格式: YYYY-MM-DD
  category?: Category
  status: TaskStatus
  duration?: string // 格式: "3时9分2秒"
  elapsedSeconds?: number
  createdAt: number
  updatedAt: number
  completedAt?: number
}

/**
 * 创建任务参数
 */
export interface CreateTaskParams {
  title: string
  description?: string
  startTime: string
  endTime?: string
  category: Category
  date?: string
}

/**
 * 创建待办任务参数
 */
export interface CreateTodoTaskParams {
  title: string
  description?: string
  priority: TaskPriority
  startDate?: string
  endDate?: string
  category?: Category
}

