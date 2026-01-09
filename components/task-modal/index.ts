// components/task-modal/index.ts
import { Category, CategoryColor } from '../../types/common'
import { Task } from '../../types/task'
import { getAllCategories } from '../../utils/category'

Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    task: {
      type: Object,
      value: undefined as Task | undefined
    }
  },

  data: {
    taskTitle: '',
    taskNote: '',
    selectedCategory: Category.TROUBLESHOOT_PRODUCTION,
    startTime: '',
    endTime: '',
    startTimeArray: [0, 0, 0] as number[],
    endTimeArray: [0, 0, 0] as number[],
    timeColumns: [
      Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')),
      Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')),
      Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
    ],
    isEditMode: false,
    taskId: '',
    categories: [] as Array<{ label: string; color: string }>,
    elapsedSeconds: 0
  },

  attached() {
    // 加载分类列表
    this.loadCategories()
  },

  pageLifetimes: {
    show() {
      // 每次显示时重新加载分类（可能在其他页面修改了分类）
      this.loadCategories()
    }
  },

  observers: {
    show(show) {
      if (show) {
        const task = this.properties.task
        if (task) {
          // 编辑模式：加载任务数据
          this.loadTaskData(task)
        } else {
          // 新建模式：重置表单
          this.resetForm()
        }
      }
    },
    task(task: Task | undefined) {
      if (task && this.data.show) {
        this.loadTaskData(task)
      }
    }
  },

  methods: {
    loadCategories() {
      const allCategories = getAllCategories()
      const categories = allCategories.map(cat => ({
        label: cat.name,
        color: cat.color
      }))
      this.setData({
        categories
      })
    },

    resetForm() {
      const now = new Date()
      const defaultTimeArray = [now.getHours(), now.getMinutes(), now.getSeconds()]
      const allCategories = getAllCategories()
      const defaultCategory = allCategories.length > 0 ? allCategories[0].name : Category.TROUBLESHOOT_PRODUCTION
      
      this.setData({
        taskTitle: '',
        taskNote: '',
        selectedCategory: defaultCategory as Category,
        startTime: '',
        endTime: '',
        startTimeArray: defaultTimeArray,
        endTimeArray: defaultTimeArray,
        isEditMode: false,
        taskId: '',
        elapsedSeconds: 0
      })
    },

    parseTimeString(timeStr: string): number[] {
      if (!timeStr) {
        const now = new Date()
        return [now.getHours(), now.getMinutes(), now.getSeconds()]
      }
      const parts = timeStr.split(':')
      if (parts.length === 2) {
        return [parseInt(parts[0]) || 0, parseInt(parts[1]) || 0, 0]
      } else if (parts.length === 3) {
        return [parseInt(parts[0]) || 0, parseInt(parts[1]) || 0, parseInt(parts[2]) || 0]
      }
      const now = new Date()
      return [now.getHours(), now.getMinutes(), now.getSeconds()]
    },

    formatTimeArray(timeArray: number[]): string {
      const [hour, minute, second] = timeArray
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
    },

    loadTaskData(task: Task) {
      const startTimeArray = this.parseTimeString(task.startTime || '')
      const endTimeArray = task.endTime ? this.parseTimeString(task.endTime) : [0, 0, 0]
      
      this.setData({
        taskTitle: task.title || '',
        taskNote: task.description || '',
        selectedCategory: task.category || Category.TROUBLESHOOT_PRODUCTION,
        startTime: task.startTime || '',
        endTime: task.endTime || '',
        startTimeArray: startTimeArray,
        endTimeArray: endTimeArray,
        isEditMode: true,
        taskId: task.id || ''
      })
    },

    onTitleInput(e: WechatMiniprogram.Input) {
      const value = e.detail.value
      this.setData({
        taskTitle: value
      })
    },

    onNoteInput(e: WechatMiniprogram.Input) {
      // textarea 的 input 事件返回 e.detail.value
      const value = e.detail.value || ''
      this.setData({
        taskNote: value
      })
    },

    onCategorySelect(e: WechatMiniprogram.CustomEvent) {
      const { category } = e.currentTarget.dataset
      this.setData({
        selectedCategory: category
      })
    },

    onStartTimeColumnChange(e: WechatMiniprogram.PickerColumnChange) {
      const { column, value } = e.detail
      const timeArray = [...this.data.startTimeArray]
      timeArray[column] = value
      const timeStr = this.formatTimeArray(timeArray)
      this.setData({
        startTimeArray: timeArray,
        startTime: timeStr
      })
    },

    onEndTimeColumnChange(e: WechatMiniprogram.PickerColumnChange) {
      const { column, value } = e.detail
      const timeArray = [...this.data.endTimeArray]
      timeArray[column] = value
      const timeStr = this.formatTimeArray(timeArray)
      this.setData({
        endTimeArray: timeArray,
        endTime: timeStr
      })
    },

    onStartTimeChange(e: WechatMiniprogram.PickerChange) {
      const value = e.detail.value as number[]
      const timeStr = this.formatTimeArray(value)
      this.setData({
        startTimeArray: value,
        startTime: timeStr
      })
    },

    onEndTimeChange(e: WechatMiniprogram.PickerChange) {
      const value = e.detail.value as number[]
      const timeStr = this.formatTimeArray(value)
      this.setData({
        endTimeArray: value,
        endTime: timeStr
      })
    },

    onSave() {
      const { taskTitle, selectedCategory, taskNote, startTime, endTime, isEditMode, taskId } = this.data
      // 如果没有输入标题，使用分类名称作为标题
      const finalTitle = (taskTitle && taskTitle.trim()) || selectedCategory || ''
      // 安全处理备注，避免 undefined 错误
      const finalNote = (taskNote && taskNote.trim()) || ''

      this.triggerEvent('save', {
        id: isEditMode ? taskId : undefined,
        title: finalTitle,
        category: selectedCategory,
        description: finalNote,
        startTime: startTime,
        endTime: endTime,
        isEdit: isEditMode,
        startTimer: false
      })
    },

    onStartTimer() {
      const { taskTitle, selectedCategory, taskNote } = this.data
      // 如果没有输入标题，使用分类名称作为标题
      const finalTitle = (taskTitle && taskTitle.trim()) || selectedCategory || ''
      // 安全处理备注，避免 undefined 错误
      const finalNote = (taskNote && taskNote.trim()) || ''

      this.triggerEvent('save', {
        title: finalTitle,
        category: selectedCategory,
        description: finalNote,
        startTimer: true
      })
    },

    onDelete() {
      const { taskId } = this.data
      if (!taskId) return

      // 显示确认对话框
      wx.showModal({
        title: '确认删除',
        content: '确定要删除这个任务吗？',
        success: (res) => {
          if (res.confirm) {
            this.triggerEvent('delete', {
              id: taskId
            })
          }
        }
      })
    },

    onClose() {
      this.triggerEvent('close')
    },

    onMaskTap() {
      // 点击遮罩层不关闭，需要点击关闭按钮
    }
  }
})

