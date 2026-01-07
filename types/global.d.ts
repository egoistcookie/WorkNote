// types/global.d.ts
/**
 * 微信小程序全局类型声明
 * 如果 miniprogram-api-typings 未正确加载，此文件提供备用类型定义
 */

/// <reference types="miniprogram-api-typings" />

declare namespace WechatMiniprogram {
  interface PageInstance {
    data?: any
    setData?(
      data: Partial<PageInstance['data']>,
      callback?: () => void
    ): void
    onLoad?(options: Record<string, string | undefined>): void
    onShow?(): void
    onReady?(): void
    onHide?(): void
    onUnload?(): void
    [key: string]: any
  }

  interface PageConstructor {
    (options: PageInstance): void
  }

  interface ComponentInstance {
    data?: any
    properties?: any
    methods?: any
    lifetimes?: any
    observers?: any
    setData?(
      data: Partial<ComponentInstance['data']>,
      callback?: () => void
    ): void
    triggerEvent?(
      name: string,
      detail?: any,
      options?: any
    ): void
    [key: string]: any
  }

  interface ComponentConstructor {
    (options: ComponentInstance): void
  }

  interface TouchEvent {
    currentTarget: {
      dataset: Record<string, any>
    }
    detail: any
  }

  interface CustomEvent {
    detail: any
  }

  interface Input {
    detail: {
      value: string
      cursor?: number
      keyCode?: number
    }
    currentTarget?: {
      dataset: Record<string, any>
    }
  }

  interface UserInfo {
    nickName: string
    avatarUrl: string
    [key: string]: any
  }
}

declare namespace WechatMiniprogram {
  interface AppInstance {
    globalData?: any
    onLaunch?(options: Record<string, any>): void
    onShow?(options: Record<string, any>): void
    onHide?(): void
    onError?(msg: string): void
    [key: string]: any
  }

  interface AppConstructor {
    <T extends AppInstance = AppInstance>(options: T): void
  }
}

declare const Page: WechatMiniprogram.PageConstructor
declare const Component: WechatMiniprogram.ComponentConstructor
declare const App: WechatMiniprogram.AppConstructor
declare const getApp: () => any
declare const getCurrentPages: () => WechatMiniprogram.PageInstance[]

declare namespace WechatMiniprogram {
  interface GeneralCallbackResult {
    errMsg: string
  }

  interface SetStorageOption {
    key: string
    data: any
    success?: (res: GeneralCallbackResult) => void
    fail?: (err: GeneralCallbackResult) => void
    complete?: (res: GeneralCallbackResult) => void
  }

  interface GetStorageOption {
    key: string
    success?: (res: { data: any }) => void
    fail?: (err: GeneralCallbackResult) => void
    complete?: (res: GeneralCallbackResult) => void
  }

  interface RemoveStorageOption {
    key: string
    success?: (res: GeneralCallbackResult) => void
    fail?: (err: GeneralCallbackResult) => void
    complete?: (res: GeneralCallbackResult) => void
  }

  interface ClearStorageOption {
    success?: (res: GeneralCallbackResult) => void
    fail?: (err: GeneralCallbackResult) => void
    complete?: (res: GeneralCallbackResult) => void
  }

  interface LoginOption {
    success?: (res: { code: string }) => void
    fail?: (err: GeneralCallbackResult) => void
    complete?: (res: GeneralCallbackResult) => void
  }

  interface Wx {
    setStorage(option: SetStorageOption): void
    setStorageSync(key: string, data: any): void
    getStorage(option: GetStorageOption): void
    getStorageSync(key: string): any
    removeStorage(option: RemoveStorageOption): void
    removeStorageSync(key: string): void
    clearStorage(option?: ClearStorageOption): void
    clearStorageSync(): void
    login(option: LoginOption): void
    [key: string]: any
  }
}

declare const wx: WechatMiniprogram.Wx

