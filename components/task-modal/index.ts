// components/task-modal/index.ts
import { Category, CategoryColor } from '../../types/common'

Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    }
  },

  data: {
    taskTitle: '',
    taskNote: '',
    selectedCategory: Category.TROUBLESHOOT_PRODUCTION,
    categories: [
      // 第一行
      { label: Category.ENTERTAINMENT, color: CategoryColor[Category.ENTERTAINMENT] },
      { label: Category.ON_THE_ROAD, color: CategoryColor[Category.ON_THE_ROAD] },
      { label: Category.EXERCISE, color: CategoryColor[Category.EXERCISE] },
      { label: Category.HOUSEWORK, color: CategoryColor[Category.HOUSEWORK] },
      { label: Category.REST, color: CategoryColor[Category.REST] },
      { label: Category.NAP, color: CategoryColor[Category.NAP] },
      // 第二行
      { label: Category.SLEEP, color: CategoryColor[Category.SLEEP] },
      { label: Category.WORK, color: CategoryColor[Category.WORK] },
      { label: Category.SIDE_HUSTLE, color: CategoryColor[Category.SIDE_HUSTLE] },
      { label: Category.MAIN_JOB, color: CategoryColor[Category.MAIN_JOB] },
      { label: Category.DEVELOPMENT, color: CategoryColor[Category.DEVELOPMENT] },
      { label: Category.ASSIST_TESTING, color: CategoryColor[Category.ASSIST_TESTING] },
      // 第三行
      { label: Category.DESIGN, color: CategoryColor[Category.DESIGN] },
      { label: Category.TROUBLESHOOT_PRODUCTION, color: CategoryColor[Category.TROUBLESHOOT_PRODUCTION] },
      { label: Category.FOLLOW_PROCESS, color: CategoryColor[Category.FOLLOW_PROCESS] },
      { label: Category.STUDY, color: CategoryColor[Category.STUDY] },
      { label: Category.LEARN_PROGRAMMING, color: CategoryColor[Category.LEARN_PROGRAMMING] },
      { label: Category.EAT, color: CategoryColor[Category.EAT] }
    ],
    elapsedSeconds: 0
  },

  observers: {
    show(show) {
      if (show) {
        this.resetForm()
      }
    }
  },

  methods: {
    resetForm() {
      this.setData({
        taskTitle: '',
        taskNote: '',
        selectedCategory: Category.TROUBLESHOOT_PRODUCTION,
        elapsedSeconds: 0
      })
    },

    onTitleInput(e: WechatMiniprogram.Input) {
      const value = e.detail.value
      this.setData({
        taskTitle: value
      })
    },

    onNoteInput(e: WechatMiniprogram.Input) {
      this.setData({
        taskNote: e.detail.value
      })
    },

    onCategorySelect(e: WechatMiniprogram.CustomEvent) {
      const { category } = e.currentTarget.dataset
      this.setData({
        selectedCategory: category
      })
    },

    onSave() {
      const { taskTitle, selectedCategory, taskNote } = this.data
      // 如果没有输入标题，使用分类名称作为标题
      const finalTitle = (taskTitle && taskTitle.trim()) || selectedCategory || ''
      // 安全处理备注，避免 undefined 错误
      const finalNote = (taskNote && taskNote.trim()) || ''

      this.triggerEvent('save', {
        title: finalTitle,
        category: selectedCategory,
        description: finalNote,
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

    onClose() {
      this.triggerEvent('close')
    },

    onMaskTap() {
      // 点击遮罩层不关闭，需要点击关闭按钮
    }
  }
})

