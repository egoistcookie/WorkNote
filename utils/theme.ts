/**
 * 主题配置
 */

export type ThemeType = 'warm' | 'cool'

export interface ThemeColors {
  // 主背景色
  primaryBg: string
  // 卡片背景色（稍淡）
  cardBg: string
  // 强调色（黄色/蓝色）
  accent: string
  // 深色强调（红褐色/深蓝色）
  darkAccent: string
  // 浅灰色
  lightGray: string
  // 文字颜色
  textPrimary: string
  // 次要文字颜色
  textSecondary: string
}

export const themes: Record<ThemeType, ThemeColors> = {
  // 暖色调（当前风格）
  warm: {
    primaryBg: '#F0DEBF',      // 奶杏米
    cardBg: '#F7EBD5',         // 稍淡的奶杏米
    accent: '#F6C12C',         // 琥珀柠黄
    darkAccent: '#B22A2A',     // 砖红褐
    lightGray: '#e4e9ec',
    textPrimary: '#B22A2A',
    textSecondary: '#969799'
  },
  // 冷色调（新风格）
  cool: {
    primaryBg: '#9ac8ec',      // 浅蓝
    cardBg: '#e4e9ec',         // 灰白
    accent: '#598bb0',         // 中蓝
    darkAccent: '#234369',     // 深蓝
    lightGray: '#e4e9ec',
    textPrimary: '#234369',
    textSecondary: '#80807e'
  }
}

/**
 * 获取当前主题
 */
export function getCurrentTheme(): ThemeType {
  try {
    const theme = wx.getStorageSync('appTheme')
    return theme === 'cool' ? 'cool' : 'warm'
  } catch (e) {
    return 'warm'
  }
}

/**
 * 设置主题
 */
export function setTheme(theme: ThemeType) {
  try {
    wx.setStorageSync('appTheme', theme)
    const themeColors = getThemeColors(theme)
    
    // 更新 tabBar 背景色
    try {
      wx.setTabBarStyle({
        backgroundColor: themeColors.cardBg,
        success: () => {
          console.log('TabBar 背景色更新成功')
        },
        fail: (err) => {
          console.error('TabBar 背景色更新失败:', err)
        }
      })
    } catch (e) {
      console.error('设置 TabBar 颜色失败:', e)
    }
    
    // 触发全局事件通知所有页面更新主题
    try {
      const app = getApp<any>()
      if (app && app.globalData) {
        app.globalData.theme = theme
        // 触发页面更新事件
        const pages = getCurrentPages()
        pages.forEach(page => {
          if (page && typeof (page as any).onThemeChange === 'function') {
            ;(page as any).onThemeChange(theme)
          } else if (page && (page as any).setData) {
            // 如果页面有 setData 方法，尝试更新主题
            try {
              const themeColors = getThemeColors(theme)
              ;(page as any).setData({ theme: theme, themeColors: themeColors })
            } catch (e) {
              // 忽略错误
            }
          }
        })
      }
    } catch (e) {
      // 忽略 app 获取错误
    }
  } catch (e) {
    console.error('设置主题失败:', e)
  }
}

/**
 * 获取主题颜色
 */
export function getThemeColors(theme?: ThemeType): ThemeColors {
  const currentTheme = theme || getCurrentTheme()
  return themes[currentTheme]
}

/**
 * 切换主题
 */
export function toggleTheme(): ThemeType {
  const current = getCurrentTheme()
  const newTheme = current === 'warm' ? 'cool' : 'warm'
  setTheme(newTheme)
  return newTheme
}

