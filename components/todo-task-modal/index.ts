// components/todo-task-modal/index.ts
import { TodoTask, TaskPriority } from '../../types/task'
import { formatDate } from '../../utils/date'
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
    startDate: '', // 日期字符串，用于显示和存储，格式：YYYY-MM-DD
    endDate: '', // 日期字符串，用于显示和存储，格式：YYYY-MM-DD
    minDate: '', // 最小日期字符串，格式：YYYY-MM-DD
    maxDate: '', // 最大日期字符串，格式：YYYY-MM-DD
    endDateMin: '', // 结束日期的最小日期字符串，格式：YYYY-MM-DD
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
    const maxDateStr = '2099-12-31'
    
    this.setData({
      startDate: today, // 日期字符串 YYYY-MM-DD
      minDate: today, // 最小日期为今天
      maxDate: maxDateStr, // 最大日期
      endDateMin: today // 结束日期最小值为今天（会随开始日期更新）
    })
    // 注意：待办任务模态框不需要加载分类，因为待办任务的标题就是分类名称
  },

  methods: {
    initForm() {
      const task = this.properties.task
      const today = formatDate(new Date())
      
      if (task) {
        // 编辑模式
        const startDate = task.startDate || today
        const endDate = task.endDate || ''
        
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
          endDateMin: startDate // 结束日期不能早于开始日期
        })
      } else {
        // 新建模式
        this.setData({
          taskTitle: '',
          taskDescription: '',
          startDate: today,
          endDate: '',
          endDateMin: today // 结束日期最小值为今天
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

    onStartDateChange(e: WechatMiniprogram.PickerChange) {
      // 原生picker mode="date" 返回日期字符串，格式：YYYY-MM-DD
      const dateStr = e.detail.value as string
      
      if (!dateStr) return
      
      this.setData({
        startDate: dateStr
      })
      
      // 如果结束日期早于开始日期，清空结束日期
      if (this.data.endDate && this.data.endDate < dateStr) {
        this.setData({
          endDate: '',
          endDateMin: dateStr // 更新结束日期的最小值为新的开始日期
        })
      } else if (this.data.endDate) {
        // 更新结束日期选择器的最小日期
        this.setData({
          endDateMin: dateStr
        })
      } else {
        // 如果没有结束日期，更新默认最小日期
        this.setData({
          endDateMin: dateStr
        })
      }
    },

    onEndDateChange(e: WechatMiniprogram.PickerChange) {
      // 原生picker mode="date" 返回日期字符串，格式：YYYY-MM-DD
      const dateStr = e.detail.value as string
      
      if (!dateStr) return
      
      // 确保结束日期不早于开始日期
      const startDate = this.data.startDate
      if (startDate && dateStr < startDate) {
        wx.showToast({
          title: '结束日期不能早于开始日期',
          icon: 'none'
        })
        return
      }
      
      this.setData({
        endDate: dateStr
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

