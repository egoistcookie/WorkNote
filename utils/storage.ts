// utils/storage.ts
/**
 * 本地存储工具函数
 */

/**
 * 存储数据
 */
export function setStorage<T>(key: string, value: T): Promise<void> {
  return new Promise((resolve, reject) => {
    wx.setStorage({
      key,
      data: value,
      success: () => resolve(),
      fail: (err: WechatMiniprogram.GeneralCallbackResult) => reject(err),
    })
  })
}

/**
 * 同步存储数据
 * @throws {Error} 当存储失败时抛出错误（如存储空间不足）
 */
export function setStorageSync<T>(key: string, value: T): void {
  try {
    wx.setStorageSync(key, value)
  } catch (err: any) {
    // 如果是存储空间不足的错误，抛出异常以便上层处理
    if (err && (err.errMsg?.includes('exceeded') || err.errMsg?.includes('maximum size') || err.errMsg?.includes('storage limit'))) {
      throw new Error('存储空间不足，请清理数据或导出备份后再试')
    }
    // 其他错误也抛出，但不包含具体错误信息
    throw err
  }
}

/**
 * 获取数据
 */
export function getStorage<T>(key: string): Promise<T | null> {
  return new Promise((resolve, reject) => {
    wx.getStorage({
      key,
      success: (res: { data: any }) => resolve(res.data as T),
      fail: (err: WechatMiniprogram.GeneralCallbackResult) => {
        if (err.errMsg.includes('not found')) {
          resolve(null)
        } else {
          reject(err)
        }
      },
    })
  })
}

/**
 * 同步获取数据
 */
export function getStorageSync<T>(key: string): T | null {
  try {
    return wx.getStorageSync(key) as T
  } catch (err) {
    return null
  }
}

/**
 * 删除数据
 */
export function removeStorage(key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    wx.removeStorage({
      key,
      success: () => resolve(),
      fail: (err: WechatMiniprogram.GeneralCallbackResult) => reject(err),
    })
  })
}

/**
 * 同步删除数据
 */
export function removeStorageSync(key: string): void {
  try {
    wx.removeStorageSync(key)
  } catch (err) {
    // 删除失败，静默处理
  }
}

/**
 * 清空所有数据
 */
export function clearStorage(): Promise<void> {
  return new Promise((resolve, reject) => {
    wx.clearStorage({
      success: () => resolve(),
      fail: (err: WechatMiniprogram.GeneralCallbackResult) => reject(err),
    })
  })
}

/**
 * 同步清空所有数据
 */
export function clearStorageSync(): void {
  try {
    wx.clearStorageSync()
  } catch (err) {
    // 清空失败，静默处理
  }
}

