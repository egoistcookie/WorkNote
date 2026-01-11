// components/todo-task-modal/index.ts
import { TodoTask, TaskPriority } from '../../types/task'
import { formatDate, dateStringToTimestamp, timestampToDateString } from '../../utils/date'
import { getAllCategories, getCategoryColor, setAllCategories, DEFAULT_COLOR_OPTIONS } from '../../utils/category'
import { getStorageSync, setStorageSync } from '../../utils/storage'
import { getCurrentTheme, getThemeColors, type ThemeType, type ThemeColors } from '../../utils/theme'

Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    task: {
      type: Object,
      value: undefined as TodoTask | undefined
    },
    priority: {
      type: String,
      value: TaskPriority.URGENT_IMPORTANT
    },
    theme: {
      type: String,
      value: 'warm' as ThemeType
    }
  },

  data: {
    taskTitle: '',
    taskDescription: '',
    startDate: '', // 日期字符串，用于显示和存储
    endDate: '', // 日期字符串，用于显示和存储
    showStartDatePicker: false,
    showEndDatePicker: false,
    minDateTimestamp: 0, // 时间戳，用于日期选择器
    maxDateTimestamp: 0, // 时间戳，用于日期选择器
    startDateTimestamp: 0, // 时间戳，用于开始日期选择器
    endDateTimestamp: 0, // 时间戳，用于结束日期选择器
    endDateMinTimestamp: 0, // 时间戳，结束日期选择器的最小日期
    selectedColor: '#1989fa', // 选中的分类颜色
    showColorPicker: false, // 是否显示颜色选择器
    colorOptions: DEFAULT_COLOR_OPTIONS, // 颜色选项
    themeColors: null as ThemeColors | null
  },

  lifetimes: {
    attached() {
      // 初始化主题
      const theme = this.properties.theme || getCurrentTheme()
      const themeColors = getThemeColors(theme)
      this.setData({ themeColors })
    }
  },

  observers: {
    'theme': function(theme: ThemeType) {
      if (theme) {
        const themeColors = getThemeColors(theme)
        this.setData({ themeColors })
      }
    },
    show(show) {
      if (show) {
        this.initForm()
      }
    },
    'task, priority'(task, priority) {
      if (this.properties.show) {
        this.initForm()
      }
    }
  },

  attached() {
    const today = formatDate(new Date())
    const todayTimestamp = dateStringToTimestamp(today)
    const maxDateStr = '2099-12-31'
    const maxTimestamp = dateStringToTimestamp(maxDateStr)
    
    this.setData({
      startDate: today, // 日期字符串
      minDateTimestamp: todayTimestamp,
      maxDateTimestamp: maxTimestamp,
      startDateTimestamp: todayTimestamp,
      endDateTimestamp: todayTimestamp, // 初始化结束日期时间戳
      endDateMinTimestamp: todayTimestamp // 初始化结束日期最小时间戳
    })
    // 注意：待办任务模态框不需要加载分类，因为待办任务的标题就是分类名称
  },

  methods: {
    initForm() {
      const task = this.properties.task
      const today = formatDate(new Date())
      const todayTimestamp = dateStringToTimestamp(today)
      
      if (task) {
        // 编辑模式
        const startDate = task.startDate || today
        const endDate = task.endDate || ''
        const startTimestamp = dateStringToTimestamp(startDate)
        const endTimestamp = endDate ? dateStringToTimestamp(endDate) : startTimestamp
        
        // 获取任务标题对应的分类颜色
        let taskColor = '#1989fa'
        if (task.title) {
          taskColor = getCategoryColor(task.title)
        }
        
        this.setData({
          taskTitle: task.title || '',
          taskDescription: task.description || '',
          startDate: startDate,
          endDate: endDate,
          startDateTimestamp: startTimestamp,
          endDateTimestamp: endTimestamp,
          endDateMinTimestamp: startTimestamp,
          selectedColor: taskColor
        })
      } else {
        // 新建模式
        this.setData({
          taskTitle: '',
          taskDescription: '',
          startDate: today,
          endDate: '',
          startDateTimestamp: todayTimestamp,
          endDateTimestamp: todayTimestamp,
          endDateMinTimestamp: todayTimestamp,
          selectedColor: this.data.colorOptions[0]
        })
      }
    },

    onTitleInput(e: WechatMiniprogram.Input) {
      this.setData({
        taskTitle: e.detail.value
      })
    },

    onDescriptionInput(e: WechatMiniprogram.Input) {
      this.setData({
        taskDescription: e.detail.value
      })
    },

    onStartDateChange(e: WechatMiniprogram.CustomEvent) {
      // Vant datetime-picker 的 confirm 事件返回时间戳
      // 根据文档，可能是 e.detail 直接是时间戳，或者 e.detail.value
      
      // 尝试多种方式获取值
      let value: any
      
      // 如果 e.detail 本身就是数字（时间戳）
      if (typeof e.detail === 'number') {
        value = e.detail
      } 
      // 如果 e.detail 有 value 属性
      else if (e.detail && typeof e.detail === 'object' && 'value' in e.detail) {
        value = (e.detail as any).value
      }
      // 如果 e.detail 是对象但没有 value，尝试其他可能的属性
      else if (e.detail && typeof e.detail === 'object') {
        // 尝试获取第一个属性值
        const keys = Object.keys(e.detail)
        if (keys.length > 0) {
          value = (e.detail as any)[keys[0]]
        }
      }
      else {
        value = e.detail
      }
      
      if (value === undefined || value === null) {
        // 使用当前 startDateTimestamp 的值
        const currentTimestamp = this.data.startDateTimestamp
        if (currentTimestamp && currentTimestamp > 0) {
          const dateStr = timestampToDateString(currentTimestamp)
          this.setData({
            startDate: dateStr,
            showStartDatePicker: false
          })
        } else {
          this.setData({
            showStartDatePicker: false
          })
        }
        return
      }
      
      let timestamp: number
      
      // 处理不同的返回值格式
      if (typeof value === 'number') {
        timestamp = value
      } else if (typeof value === 'string') {
        // 如果是日期字符串，转换为时间戳
        timestamp = dateStringToTimestamp(value)
      } else if (value && typeof value === 'object' && 'value' in value) {
        // 如果是一个对象，尝试获取 value 属性
        timestamp = typeof value.value === 'number' ? value.value : dateStringToTimestamp(value.value)
      } else {
        this.setData({
          showStartDatePicker: false
        })
        return
      }
      
      // 验证时间戳是否有效
      if (isNaN(timestamp) || timestamp <= 0) {
        this.setData({
          showStartDatePicker: false
        })
        return
      }
      
      const dateStr = timestampToDateString(timestamp)
      
      this.setData({
        startDate: dateStr,
        startDateTimestamp: timestamp,
        showStartDatePicker: false
      })
      
      // 如果结束日期早于开始日期，清空结束日期并更新选择器的值
      if (this.data.endDate && this.data.endDate < dateStr) {
        this.setData({
          endDate: '',
          endDateTimestamp: timestamp,
          endDateMinTimestamp: timestamp
        })
      } else if (this.data.endDate) {
        // 更新结束日期选择器的最小日期
        this.setData({
          endDateMinTimestamp: timestamp
        })
      } else {
        // 如果没有结束日期，更新默认值
        this.setData({
          endDateTimestamp: timestamp,
          endDateMinTimestamp: timestamp
        })
      }
    },

    onEndDateChange(e: WechatMiniprogram.CustomEvent) {
      // Vant datetime-picker 的 confirm 事件返回时间戳
      // 根据文档，可能是 e.detail 直接是时间戳，或者 e.detail.value
      
      // 尝试多种方式获取值
      let value: any
      
      // 如果 e.detail 本身就是数字（时间戳）
      if (typeof e.detail === 'number') {
        value = e.detail
      } 
      // 如果 e.detail 有 value 属性
      else if (e.detail && typeof e.detail === 'object' && 'value' in e.detail) {
        value = (e.detail as any).value
      }
      // 如果 e.detail 是对象但没有 value，尝试其他可能的属性
      else if (e.detail && typeof e.detail === 'object') {
        // 尝试获取第一个属性值
        const keys = Object.keys(e.detail)
        if (keys.length > 0) {
          value = (e.detail as any)[keys[0]]
        }
      }
      else {
        value = e.detail
      }
      
      // 如果值为 undefined 或 null，使用当前选择器的值
      if (value === undefined || value === null) {
        // 使用当前 endDateTimestamp 的值
        const currentTimestamp = this.data.endDateTimestamp
        if (currentTimestamp && currentTimestamp > 0) {
          const dateStr = timestampToDateString(currentTimestamp)
          this.setData({
            endDate: dateStr,
            showEndDatePicker: false
          })
        } else {
          this.setData({
            showEndDatePicker: false
          })
        }
        return
      }
      
      let timestamp: number
      
      // 处理不同的返回值格式
      if (typeof value === 'number') {
        timestamp = value
      } else if (typeof value === 'string') {
        // 如果是日期字符串，转换为时间戳
        timestamp = dateStringToTimestamp(value)
      } else if (value && typeof value === 'object' && 'value' in value) {
        // 如果是一个对象，尝试获取 value 属性
        timestamp = typeof value.value === 'number' ? value.value : dateStringToTimestamp(value.value)
      } else {
        this.setData({
          showEndDatePicker: false
        })
        return
      }
      
      // 验证时间戳是否有效
      if (isNaN(timestamp) || timestamp <= 0) {
        // 如果时间戳无效，使用当前结束日期时间戳或开始日期时间戳
        const fallbackTimestamp = this.data.endDateTimestamp || this.data.startDateTimestamp || this.data.minDateTimestamp
        if (fallbackTimestamp && fallbackTimestamp > 0) {
          const dateStr = timestampToDateString(fallbackTimestamp)
          this.setData({
            endDate: dateStr,
            endDateTimestamp: fallbackTimestamp,
            showEndDatePicker: false
          })
        } else {
          this.setData({
            showEndDatePicker: false
          })
        }
        return
      }
      
      const dateStr = timestampToDateString(timestamp)
      
      this.setData({
        endDate: dateStr,
        endDateTimestamp: timestamp,
        showEndDatePicker: false
      })
    },

    onStartDateTap() {
      this.setData({
        showStartDatePicker: true
      })
    },

    onEndDateTap() {
      // 确保结束日期选择器有有效的初始值（时间戳）
      const today = formatDate(new Date())
      const todayTimestamp = dateStringToTimestamp(today)
      const startDate = this.data.startDate || today
      const startTimestamp = this.data.startDateTimestamp || todayTimestamp
      const endDate = this.data.endDate || ''
      // 如果 endDate 为空，使用 startDate 的时间戳作为默认值
      const endTimestamp = endDate ? dateStringToTimestamp(endDate) : startTimestamp
      const endDateMinTimestamp = startTimestamp || todayTimestamp
      
      this.setData({
        showEndDatePicker: true,
        endDateTimestamp: endTimestamp,
        endDateMinTimestamp: endDateMinTimestamp
      })
    },

    onStartDateCancel() {
      this.setData({
        showStartDatePicker: false
      })
    },

    onEndDateCancel() {
      this.setData({
        showEndDatePicker: false
      })
    },

    onColorTap() {
      this.setData({
        showColorPicker: true
      })
    },

    onColorSelect(e: WechatMiniprogram.TouchEvent) {
      const { color } = e.currentTarget.dataset
      this.setData({
        selectedColor: color,
        showColorPicker: false
      })
    },

    onColorPickerClose() {
      this.setData({
        showColorPicker: false
      })
    },

    onSave() {
      const { taskTitle, taskDescription, startDate, endDate, selectedColor } = this.data
      const task = this.properties.task
      const priority = this.properties.priority

      if (!taskTitle.trim()) {
        wx.showToast({
          title: '请输入任务标题',
          icon: 'none'
        })
        return
      }

      // 待办任务的标题就是分类名称，自动创建/更新分类
      const categoryName = taskTitle.trim()
      const allCategories = getAllCategories()
      const existingCategory = allCategories.find((cat: { name: string; color: string }) => cat.name === categoryName)
      
      if (!existingCategory) {
        // 新建分类
        const newCategory = {
          name: categoryName,
          color: selectedColor
        }
        const updatedCategories = [...allCategories, newCategory]
        setAllCategories(updatedCategories)
      } else if (existingCategory.color !== selectedColor) {
        // 更新分类颜色
        const updatedCategories = allCategories.map((cat: { name: string; color: string }) => 
          cat.name === categoryName ? { ...cat, color: selectedColor } : cat
        )
        setAllCategories(updatedCategories)
      }

      this.triggerEvent('save', {
        id: task?.id,
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        priority: task?.priority || priority,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        category: categoryName, // 分类名称就是任务标题
        categoryColor: selectedColor, // 传递颜色信息
        isEdit: !!task
      })
    },

    onClose() {
      this.triggerEvent('close')
    }
  }
})

