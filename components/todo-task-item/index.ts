// components/todo-task-item/index.ts
import { TodoTask, TaskStatus } from '../../types/task'
import { getCategoryColor } from '../../utils/category'

Component({
  properties: {
    task: {
      type: Object,
      value: {} as TodoTask
    }
  },

  data: {
    categoryColor: '#969799'
  },

  observers: {
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

  attached() {
    const task = this.properties.task
    // 待办任务的分类名称就是任务标题
    const categoryName = task.title || task.category
    if (categoryName) {
      const color = getCategoryColor(categoryName)
      this.setData({
        categoryColor: color
      })
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

