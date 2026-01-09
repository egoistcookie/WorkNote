// components/task-item/index.ts
import { Task } from '../../types/task'
import { getCategoryColor } from '../../utils/category'

Component({
  properties: {
    task: {
      type: Object,
      value: {} as Task
    },
    selected: {
      type: Boolean,
      value: false
    }
  },

  data: {
    categoryColor: '#969799'
  },

  observers: {
    'task.category': function(category: string) {
      if (category) {
        const color = getCategoryColor(category)
        this.setData({
          categoryColor: color
        })
      }
    }
  },

  attached() {
    // 初始化时设置颜色
    const task = this.properties.task
    if (task && task.category) {
      const color = getCategoryColor(task.category)
      this.setData({
        categoryColor: color
      })
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

