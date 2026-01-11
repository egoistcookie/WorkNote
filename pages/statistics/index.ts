// pages/statistics/index.ts
import { getCurrentDate, formatDate, getSecondsDiff, formatDurationWithSeconds } from '../../utils/date'
import { Task, TaskStatus } from '../../types/task'
import { Category } from '../../types/common'
import { getStorageSync } from '../../utils/storage'
import { getCategoryColor } from '../../utils/category'
import { getCurrentTheme, getThemeColors, type ThemeType, type ThemeColors } from '../../utils/theme'

interface CategoryStat {
  category: Category
  totalSeconds: number
  totalDurationText: string
  count: number
  percentage: number
  color: string
}

interface ChartSegment {
  angle: number
  color: string
  category: Category
  startAngle: number
  endAngle: number
  percentage: number
}

Page({
  data: {
    selectedDate: '',
    categoryStats: [] as CategoryStat[],
    totalDuration: 0,
    totalDurationText: '0秒',
    chartData: [] as ChartSegment[],
    selectedIndex: -1, // 当前选中的扇形索引
    canvasInfo: {
      centerX: 0,
      centerY: 0,
      radius: 0,
      innerRadius: 0,
      width: 0,
      height: 0
    },
    theme: 'warm' as ThemeType,
    themeColors: null as ThemeColors | null
  },

  onLoad() {
    const today = getCurrentDate()
    const theme = getCurrentTheme()
    const themeColors = getThemeColors(theme)
    this.setData({
      selectedDate: today,
      theme,
      themeColors
    })
    this.loadStatistics(today)
  },

  onShow() {
    // 每次显示页面时检查主题并重新加载统计数据
    const theme = getCurrentTheme()
    if (this.data.theme !== theme) {
      const themeColors = getThemeColors(theme)
      this.setData({ theme, themeColors })
    }
    const selectedDate = this.data.selectedDate || getCurrentDate()
    this.loadStatistics(selectedDate)
  },

  onThemeChange(theme: ThemeType) {
    const themeColors = getThemeColors(theme)
    this.setData({ theme, themeColors })
  },

  onDateChange(e: WechatMiniprogram.CustomEvent) {
    const { date } = e.detail
    this.setData({
      selectedDate: date
    })
    this.loadStatistics(date)
  },

  loadStatistics(date: string) {
    const tasksKey = `tasks_${date}`
    const allTasks = getStorageSync<Task[]>(tasksKey) || []
    
    // 只统计已完成的任务
    const completedTasks = allTasks.filter(task => task.status === TaskStatus.COMPLETED)
    
    // 按分类统计
    const categoryMap = new Map<Category, { totalSeconds: number; count: number }>()
    
    completedTasks.forEach(task => {
      let taskSeconds = 0
      
      // 计算任务总时长
      if (task.timeSegments && task.timeSegments.length > 0) {
        // 使用时间段计算
        taskSeconds = task.timeSegments.reduce((sum, seg) => {
          return sum + (seg.duration || 0)
        }, 0)
      } else if (task.elapsedSeconds) {
        // 使用已用秒数
        taskSeconds = task.elapsedSeconds
      } else if (task.startTime && task.endTime) {
        // 使用起止时间计算
        const { parseTimeToTimestamp, getSecondsDiff } = require('../../utils/date')
        const startTimestamp = parseTimeToTimestamp(date, task.startTime)
        const endTimestamp = parseTimeToTimestamp(date, task.endTime)
        if (startTimestamp && endTimestamp) {
          taskSeconds = getSecondsDiff(startTimestamp, endTimestamp)
        }
      }
      
      if (taskSeconds > 0) {
        const existing = categoryMap.get(task.category) || { totalSeconds: 0, count: 0 }
        categoryMap.set(task.category, {
          totalSeconds: existing.totalSeconds + taskSeconds,
          count: existing.count + 1
        })
      }
    })
    
    // 转换为数组并计算百分比
    const totalSeconds = Array.from(categoryMap.values()).reduce((sum, stat) => sum + stat.totalSeconds, 0)
    
    const categoryStats: CategoryStat[] = Array.from(categoryMap.entries())
      .map(([category, stat]) => ({
        category,
        totalSeconds: stat.totalSeconds,
        totalDurationText: formatDurationWithSeconds(stat.totalSeconds),
        count: stat.count,
        percentage: totalSeconds > 0 ? (stat.totalSeconds / totalSeconds) * 100 : 0,
        color: getCategoryColor(category) // 使用分类的实际颜色
      }))
      .sort((a, b) => b.totalSeconds - a.totalSeconds) // 按时长降序排列
    
    // 计算圆形图数据
    const chartData = this.calculateChartData(categoryStats)
    
    const totalDurationText = formatDurationWithSeconds(totalSeconds)
    
    this.setData({
      categoryStats,
      totalDuration: totalSeconds,
      totalDurationText: totalDurationText,
      chartData,
      selectedIndex: -1 // 重置选中状态
    })
    
    // 绘制图表
    this.drawChart()
  },

  calculateChartData(categoryStats: CategoryStat[]): ChartSegment[] {
    if (categoryStats.length === 0) {
      return []
    }
    
    const totalPercentage = categoryStats.reduce((sum, stat) => sum + stat.percentage, 0)
    const scale = totalPercentage > 0 ? 360 / totalPercentage : 0
    
    let currentAngle = -90 // 从顶部开始（度数）
    const chartData: ChartSegment[] = []
    
    categoryStats.forEach(stat => {
      const angle = stat.percentage * scale
      const startAngle = currentAngle
      const endAngle = currentAngle + angle
      
      chartData.push({
        angle,
        color: stat.color,
        category: stat.category,
        startAngle: (startAngle * Math.PI) / 180, // 转换为弧度
        endAngle: (endAngle * Math.PI) / 180,
        percentage: stat.percentage
      })
      currentAngle = endAngle
    })
    
    return chartData
  },

  drawChart() {
    const query = wx.createSelectorQuery()
    query.select('#chart-canvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0]) {
          return
        }
        
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const windowInfo = wx.getWindowInfo()
        const dpr = windowInfo.pixelRatio
        const width = res[0].width
        const height = res[0].height
        
        canvas.width = width * dpr
        canvas.height = height * dpr
        ctx.scale(dpr, dpr)
        
        // 清空画布
        ctx.clearRect(0, 0, width, height)
        
        const centerX = width / 2
        const centerY = height / 2
        const baseRadius = Math.min(width, height) / 2 - 40 // 基础半径，留出标注空间
        const innerRadius = baseRadius * 0.6 // 内圆半径，形成环形图
        const selectedOffset = 15 // 选中时凸出的距离
        
        // 保存canvas信息用于点击检测
        this.setData({
          canvasInfo: {
            centerX: centerX,
            centerY: centerY,
            radius: baseRadius,
            innerRadius: innerRadius,
            width: width,
            height: height
          }
        })
        
        const chartData = this.data.chartData
        const selectedIndex = this.data.selectedIndex
        
        if (chartData.length === 0) {
          // 如果没有数据，绘制一个灰色圆环
          ctx.beginPath()
          ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2)
          ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2, true)
          ctx.fillStyle = '#ebedf0'
          ctx.fill()
          // 确保内圆区域是白色
          ctx.beginPath()
          ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2)
          ctx.fillStyle = '#ffffff'
          ctx.fill()
          return
        }
        
        // 先绘制所有扇形
        chartData.forEach((item: ChartSegment, index: number) => {
          const isSelected = index === selectedIndex
          const radius = isSelected ? baseRadius + selectedOffset : baseRadius
          
          // 绘制扇形（环形图，不包含内圆区域）
          ctx.beginPath()
          // 从外圆开始
          ctx.arc(centerX, centerY, radius, item.startAngle, item.endAngle)
          // 沿内圆返回
          ctx.arc(centerX, centerY, innerRadius, item.endAngle, item.startAngle, true)
          ctx.closePath()
          ctx.fillStyle = item.color
          ctx.fill()
          
          // 绘制边框
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 2
          ctx.stroke()
        })
        
        // 在所有扇形绘制完成后，绘制白色内圆，确保中心区域完全空白
        ctx.beginPath()
        ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.fill()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.stroke()
        
        // 绘制中心文字（总时长）
        const totalDurationText = this.data.totalDurationText || '0秒'
        if (totalDurationText) {
          ctx.save()
          ctx.fillStyle = '#969799'
          ctx.font = '14px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('总时长', centerX, centerY - 12)
          
          ctx.fillStyle = '#323233'
          ctx.font = 'bold 20px sans-serif'
          ctx.fillText(totalDurationText, centerX, centerY + 8)
          ctx.restore()
        }
        
        // 然后绘制标注（选中时显示）
        chartData.forEach((item: ChartSegment, index: number) => {
          const isSelected = index === selectedIndex
          if (!isSelected) return
          
          const radius = baseRadius + selectedOffset
          
          // 绘制标注（选中时显示）
          if (isSelected) {
            const midAngle = (item.startAngle + item.endAngle) / 2
            const labelRadius = radius + 35 // 标注距离圆环更远一些
            let labelX = centerX + Math.cos(midAngle) * labelRadius
            let labelY = centerY + Math.sin(midAngle) * labelRadius
            
            // 绘制标注背景
            const categoryText = item.category
            const percentageText = `${item.percentage.toFixed(2)}%`
            
            ctx.font = 'bold 16px sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            
            const categoryMetrics = ctx.measureText(categoryText)
            ctx.font = '14px sans-serif'
            const percentageMetrics = ctx.measureText(percentageText)
            const textWidth = Math.max(categoryMetrics.width, percentageMetrics.width)
            const textHeight = 36
            const padding = 8
            
            // 边界检测：确保标注不会超出 canvas 范围
            const rectWidth = textWidth + padding * 2
            const rectHeight = textHeight + padding * 2
            let rectX = labelX - textWidth / 2 - padding
            let rectY = labelY - textHeight / 2 - padding
            
            // 如果超出左边界，向右调整
            if (rectX < 0) {
              labelX = textWidth / 2 + padding
              rectX = 0
            }
            // 如果超出右边界，向左调整
            else if (rectX + rectWidth > width) {
              labelX = width - textWidth / 2 - padding
              rectX = width - rectWidth
            }
            
            // 如果超出上边界，向下调整
            if (rectY < 0) {
              labelY = textHeight / 2 + padding
              rectY = 0
            }
            // 如果超出下边界，向上调整
            else if (rectY + rectHeight > height) {
              labelY = height - textHeight / 2 - padding
              rectY = height - rectHeight
            }
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.98)'
            ctx.strokeStyle = item.color
            ctx.lineWidth = 2
            
            // 绘制圆角矩形背景
            const cornerRadius = 8
            
            ctx.beginPath()
            ctx.moveTo(rectX + cornerRadius, rectY)
            ctx.lineTo(rectX + rectWidth - cornerRadius, rectY)
            ctx.quadraticCurveTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + cornerRadius)
            ctx.lineTo(rectX + rectWidth, rectY + rectHeight - cornerRadius)
            ctx.quadraticCurveTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - cornerRadius, rectY + rectHeight)
            ctx.lineTo(rectX + cornerRadius, rectY + rectHeight)
            ctx.quadraticCurveTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - cornerRadius)
            ctx.lineTo(rectX, rectY + cornerRadius)
            ctx.quadraticCurveTo(rectX, rectY, rectX + cornerRadius, rectY)
            ctx.closePath()
            ctx.fill()
            ctx.stroke()
            
            // 绘制文字
            ctx.fillStyle = '#323233'
            ctx.font = 'bold 16px sans-serif'
            ctx.fillText(categoryText, labelX, labelY - 8)
            ctx.font = '14px sans-serif'
            ctx.fillStyle = '#1989fa'
            ctx.fillText(percentageText, labelX, labelY + 8)
          }
        })
      })
  },

  onChartTap(e: WechatMiniprogram.TouchEvent) {
    const touch = e.touches[0]
    if (!touch) return
    
    // 使用 canvasInfo 中保存的尺寸信息
    const canvasInfo = this.data.canvasInfo
    if (!canvasInfo || !canvasInfo.width || !canvasInfo.height) {
      return
    }
    
    const query = wx.createSelectorQuery()
    query.select('#chart-canvas')
      .boundingClientRect()
      .exec((res: any) => {
        if (!res || !res[0]) return
        
        const rect = res[0]
        // 计算点击位置相对于 canvas 的位置（px）
        const clickX = touch.clientX - rect.left
        const clickY = touch.clientY - rect.top
        
        // canvas 的显示尺寸
        const displayWidth = rect.width
        const displayHeight = rect.height
        
        // canvas 的逻辑尺寸（drawChart 中使用的尺寸）
        const logicWidth = canvasInfo.width
        const logicHeight = canvasInfo.height
        
        // 将点击坐标转换为逻辑坐标
        const x = (clickX / displayWidth) * logicWidth
        const y = (clickY / displayHeight) * logicHeight
        
        // 检查点击是否在某个扇形内
        const clickedIndex = this.getClickedSegmentIndex(x, y)
        
        if (clickedIndex !== -1) {
          const newSelectedIndex = this.data.selectedIndex === clickedIndex ? -1 : clickedIndex
          this.setData({
            selectedIndex: newSelectedIndex
          })
          this.drawChart()
        }
      })
  },

  getClickedSegmentIndex(x: number, y: number): number {
    const canvasInfo = this.data.canvasInfo
    if (!canvasInfo) {
      return -1
    }
    
    const { centerX, centerY, radius, innerRadius } = canvasInfo
    const chartData = this.data.chartData
    
    if (!chartData || chartData.length === 0) {
      return -1
    }
    
    // 计算点击点到圆心的距离
    const dx = x - centerX
    const dy = y - centerY
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    // 检查是否在圆环范围内（允许选中时凸出的范围）
    if (distance < innerRadius || distance > radius + 20) {
      return -1
    }
    
    // 计算点击角度
    // Math.atan2(dy, dx) 返回 -π 到 π，0 度在右侧（x 正方向），逆时针为正
    // Canvas arc 方法中，0 度在右侧，逆时针为正
    // 绘制时从 -90 度（-π/2，顶部）开始，角度递增（顺时针方向）
    let angle = Math.atan2(dy, dx)
    
    // 将 atan2 的角度转换为与绘制时一致的坐标系
    // atan2: 0 度在右侧，-90 度在顶部，逆时针为正
    // 期望: 0 度在顶部，顺时针为正
    // 转换：将 atan2 的角度转换为从顶部（0度）开始的角度
    // atan2 的 -90 度（顶部）应该对应期望的 0 度
    // 所以：angle_expected = atan2_angle + 90度 = atan2_angle + π/2
    angle = angle + Math.PI / 2
    // 转换为 0 到 2π 范围
    if (angle < 0) {
      angle += Math.PI * 2
    }
    if (angle >= Math.PI * 2) {
      angle -= Math.PI * 2
    }
    
    // 查找对应的扇形
    for (let i = 0; i < chartData.length; i++) {
      const segment = chartData[i]
      let startAngle = segment.startAngle
      let endAngle = segment.endAngle
      
      // 将绘制角度转换为 0 到 2π 范围（与点击角度一致）
      // 绘制时从 -90 度（-π/2，顶部）开始，顺时针绘制
      // 我们需要将角度转换为从顶部（0度）开始的角度系统
      // Canvas: -90度（顶部）-> 0度（右侧）-> 90度（底部）-> 180度（左侧）-> 270度（顶部）
      // 期望: 0度（顶部）-> 90度（右侧）-> 180度（底部）-> 270度（左侧）-> 360度（顶部）
      // 转换公式：angle_canvas + 90度 = angle_expected
      let normalizedStartAngle = startAngle + Math.PI / 2  // 加 90 度
      let normalizedEndAngle = endAngle + Math.PI / 2
      
      // 转换为 0 到 2π 范围
      if (normalizedStartAngle < 0) normalizedStartAngle += Math.PI * 2
      if (normalizedEndAngle < 0) normalizedEndAngle += Math.PI * 2
      if (normalizedStartAngle >= Math.PI * 2) normalizedStartAngle -= Math.PI * 2
      if (normalizedEndAngle >= Math.PI * 2) normalizedEndAngle -= Math.PI * 2
      
      // 检查点击角度是否在扇形范围内
      // 如果跨越了 0 度（normalizedEndAngle < normalizedStartAngle），需要检查两个范围
      if (normalizedEndAngle < normalizedStartAngle) {
        // 跨越了 0 度：扇形从 normalizedStartAngle 到 2π，然后从 0 到 normalizedEndAngle
        if (angle >= normalizedStartAngle || angle <= normalizedEndAngle) {
          return i
        }
      } else {
        // 正常情况：扇形从 normalizedStartAngle 到 normalizedEndAngle
        if (angle >= normalizedStartAngle && angle <= normalizedEndAngle) {
          return i
        }
      }
    }
    
    return -1
  },

  onReady() {
    // 页面渲染完成后绘制图表
    setTimeout(() => {
      this.drawChart()
    }, 100)
  }
})

