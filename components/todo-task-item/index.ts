// components/todo-task-item/index.ts
import { TodoTask, TaskStatus } from '../../types/task'
import { getCategoryColor } from '../../utils/category'
import { getCurrentTheme, getThemeColors, type ThemeType, type ThemeColors } from '../../utils/theme'

Component({
  properties: {
    task: {
      type: Object,
      value: {} as TodoTask
    },
    theme: {
      type: String,
      value: 'warm' as ThemeType
    }
  },

  data: {
    categoryColor: '#969799',
    theme: 'warm' as ThemeType,
    themeColors: null as ThemeColors | null
  },

  lifetimes: {
    attached() {
      const theme = this.properties.theme || getCurrentTheme()
      const themeColors = getThemeColors(theme)
      this.setData({ theme, themeColors })
      
      const task = this.properties.task
      // 待办任务的分类名称就是任务标题
      const categoryName = task.title || task.category
      if (categoryName) {
        const color = getCategoryColor(categoryName)
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
    'task.title, task.category'(title: string, category: string) {
      // 待办任务的分类名称就是任务标题
      const categoryName = title || category
      if (categoryName) {
        const color = getCategoryColor(categoryName)
        this.setData({
          categoryColor: color
        })
      }
    }
  },

  methods: {
    onTaskTap() {
      const task = this.properties.task
      if (!task || !task.id) {
        return
      }
      this.triggerEvent('tap', { task })
    },

    onCheckboxChange() {
      const task = this.properties.task
      if (!task || !task.id) {
        return
      }
      this.triggerEvent('toggle', { task })
    }
  }
})

