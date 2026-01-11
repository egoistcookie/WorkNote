/**
 * 页面主题 Mixin 工具
 * 为页面提供主题切换功能
 */

import { getCurrentTheme, getThemeColors, type ThemeType, type ThemeColors } from './theme'

export interface ThemePageData {
  theme: ThemeType
  themeColors: ThemeColors | null
}

/**
 * 页面主题 Mixin
 * 使用方式：在页面 onLoad 中调用 initTheme，在 onShow 中调用 checkTheme
 */
export const pageThemeMixin = {
  /**
   * 初始化主题
   */
  initTheme(this: any) {
    const theme = getCurrentTheme()
    const themeColors = getThemeColors(theme)
    if (this.setData) {
      this.setData({
        theme: theme,
        themeColors: themeColors
      })
    }
    return { theme, themeColors }
  },

  /**
   * 检查并更新主题
   */
  checkTheme(this: any) {
    const theme = getCurrentTheme()
    if (this.data && this.data.theme !== theme) {
      const themeColors = getThemeColors(theme)
      if (this.setData) {
        this.setData({
          theme: theme,
          themeColors: themeColors
        })
      }
    }
  },

  /**
   * 主题变化回调
   */
  onThemeChange(this: any, theme: ThemeType) {
    const themeColors = getThemeColors(theme)
    if (this.setData) {
      this.setData({
        theme: theme,
        themeColors: themeColors
      })
    }
  }
}

/**
 * 获取页面主题数据初始值
 */
export function getThemePageData(): ThemePageData {
  const theme = getCurrentTheme()
  const themeColors = getThemeColors(theme)
  return {
    theme: theme,
    themeColors: themeColors
  }
}

