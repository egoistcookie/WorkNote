// components/log-input/index.ts

Component({
  properties: {
    type: {
      type: String,
      value: 'morning' // 'morning' | 'evening'
    },
    title: {
      type: String,
      value: ''
    },
    placeholder: {
      type: String,
      value: ''
    },
    icon: {
      type: String,
      value: ''
    },
    value: {
      type: String,
      value: ''
    }
  },

  data: {
    iconColor: '#ff9800'
  },

  observers: {
    'type': function(type: string) {
      // 根据类型设置图标颜色
      const color = type === 'morning' ? '#ff9800' : '#7232dd'
      this.setData({
        iconColor: color
      })
    }
  },

  methods: {
    onInput(e: WechatMiniprogram.Input) {
      const value = e.detail.value
      this.triggerEvent('input', { value })
    },

    onTap() {
      this.triggerEvent('tap')
    }
  }
})

