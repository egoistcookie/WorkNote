// components/task-item/index.ts
import { Task } from '../../types/task'
import { Category, CategoryColor } from '../../types/common'

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
    categoryColorMap: CategoryColor
  },

  methods: {
    onTaskTap() {
      this.triggerEvent('tap', { task: this.properties.task })
    },

    onDetailTap() {
      this.triggerEvent('detail', { task: this.properties.task })
    },

    getCategoryColor(category: Category): string {
      return CategoryColor[category] || '#969799'
    }
  }
})

