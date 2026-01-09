// components/todo-task-item/index.ts
import { TodoTask, TaskStatus } from '../../types/task'
import { Category, CategoryColor } from '../../types/common'

Component({
  properties: {
    task: {
      type: Object,
      value: {} as TodoTask
    }
  },

  data: {
    categoryColorMap: CategoryColor
  },

  methods: {
    onTaskTap() {
      const task = this.properties.task
      if (!task || !task.id) {
        console.error('任务数据无效:', task)
        return
      }
      this.triggerEvent('tap', { task })
    },

    onCheckboxChange() {
      const task = this.properties.task
      if (!task || !task.id) {
        console.error('任务数据无效:', task)
        return
      }
      this.triggerEvent('toggle', { task })
    }
  }
})

