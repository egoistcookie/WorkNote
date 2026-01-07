// types/task.ts
import { Category } from './common'

/**
 * 任务状态
 */
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
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
  duration?: string // 格式: "1时20分"
  category: Category
  status: TaskStatus
  date: string // 格式: YYYY-MM-DD
  createdAt: number
  updatedAt: number
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

