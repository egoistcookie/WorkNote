// utils/config.ts
// 应用配置

// API配置
export const API_CONFIG = {
  // 后台API地址
  BASE_URL: 'https://www.egoistcookie.top', // 生产环境API地址
  // 开发环境可以使用本地地址
  // BASE_URL: 'http://localhost:3000',
  
  // API端点
  ENDPOINTS: {
    UPLOAD_DATA: '/worknoteApi/upload-data',
    HEALTH: '/worknoteApi/health'
  }
}

// 获取完整API地址
export function getApiUrl(endpoint: string): string {
  return `${API_CONFIG.BASE_URL}${endpoint}`
}
