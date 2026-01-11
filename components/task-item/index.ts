// components/task-item/index.ts
import { Task } from '../../types/task'
import { getCategoryColor } from '../../utils/category'
import { getCurrentTheme, getThemeColors, type ThemeType, type ThemeColors } from '../../utils/theme'

Component({
  properties: {
    task: {
      type: Object,
      value: {} as Task
    },
    selected: {
      type: Boolean,
      value: false
    },
    theme: {
      type: String,
      value: 'warm' as ThemeType
    }
  },

  data: {
    categoryColor: '#969799',
    themeColors: null as ThemeColors | null
  },

  lifetimes: {
    attached() {
      // 初始化时设置主题颜色（如果父组件传递了 theme，使用父组件的，否则使用全局主题）
      const theme = this.properties.theme || getCurrentTheme()
      const themeColors = getThemeColors(theme)
      this.setData({ themeColors })
      
      // 初始化时设置颜色
      const task = this.properties.task
      if (task && task.category) {
        const color = getCategoryColor(task.category)
        this.setData({
          categoryColor: color
        })
      }
    }
  },

  observers: {
    'theme': function(theme: ThemeType) {
      if (theme) {
        const themeColors = getThemeColors(theme)
        this.setData({ themeColors })
      }
    },
    'task.category': function(category: string) {
      if (category) {
        const color = getCategoryColor(category)
        this.setData({
          categoryColor: color
        })
      }
    }
  },

  methods: {
    onTaskTap() {
      this.triggerEvent('tap', { task: this.properties.task })
    },

    onDetailTap() {
      this.triggerEvent('detail', { task: this.properties.task })
    }
  }
})

