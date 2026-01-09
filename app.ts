// app.ts
interface IAppOption extends WechatMiniprogram.AppInstance {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo
  }
}

App<IAppOption>({
  globalData: {},
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

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

