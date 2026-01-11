// app.ts
import { getCurrentTheme, type ThemeType } from './utils/theme'

interface IAppOption extends WechatMiniprogram.AppInstance {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo
    theme: ThemeType
  }
}

App<IAppOption>({
  globalData: {
    theme: getCurrentTheme()
  },
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 初始化主题
    const theme = getCurrentTheme()
    this.globalData.theme = theme
    // 设置 tabBar 背景色
    const { getThemeColors } = require('./utils/theme')
    const themeColors = getThemeColors(theme)
    try {
      wx.setTabBarStyle({
        backgroundColor: themeColors.cardBg
      })
    } catch (e) {
      console.error('初始化 TabBar 颜色失败:', e)
    }

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      },
      fail: err => {
        // 登录失败，静默处理（可能是网络问题或开发者工具环境问题）
      }
    })
  },
})

