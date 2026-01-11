// components/log-input/index.ts
import { getCurrentTheme, getThemeColors, type ThemeType, type ThemeColors } from '../../utils/theme'

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
    },
    theme: {
      type: String,
      value: 'warm' as ThemeType
    }
  },

  data: {
    iconColor: '#F6C12C',
    themeColors: null as ThemeColors | null
  },

  lifetimes: {
    attached() {
      const theme = this.properties.theme || getCurrentTheme()
      const themeColors = getThemeColors(theme)
      this.updateIconColor(theme)
      this.setData({ themeColors })
    }
  },

  observers: {
    'theme': function(theme: ThemeType) {
      if (theme) {
        const themeColors = getThemeColors(theme)
        this.updateIconColor(theme)
        this.setData({ themeColors })
      }
    },
    'type': function(type: string) {
      const theme = this.properties.theme || getCurrentTheme()
      this.updateIconColor(theme)
    }
  },

  methods: {
    updateIconColor(theme: ThemeType) {
      const themeColors = getThemeColors(theme)
      const color = this.properties.type === 'morning' 
        ? themeColors.accent 
        : themeColors.darkAccent
      this.setData({
        iconColor: color
      })
    },
    
    onInput(e: WechatMiniprogram.Input) {
      const value = e.detail.value
      this.triggerEvent('input', { value })
    },

    onTap() {
      this.triggerEvent('tap')
    }
  }
})

