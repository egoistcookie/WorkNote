// components/calendar/index.ts
import { getWeekDates, formatDate, isSameDay, getWeekdayAbbr, formatDateChinese, dateStringToTimestamp } from '../../utils/date'
import { getCurrentTheme, getThemeColors, type ThemeType, type ThemeColors } from '../../utils/theme'

Component({
  properties: {
    selectedDate: {
      type: String,
      value: '',
      observer: 'onDateChange'
    },
    theme: {
      type: String,
      value: 'warm' as ThemeType
    }
  },

  data: {
    weekDates: [] as Array<{
      dateStr: string
      weekday: string
      dayNumber: number
      isSelected: boolean
      isToday: boolean
    }>,
    currentDateStr: '',
    selectedDateStr: '',
    dateText: '',
    showDatePicker: false,
    currentDate: new Date().getTime(),
    minDate: new Date(2020, 0, 1).getTime(),
    maxDate: new Date(2099, 11, 31).getTime(),
    themeColors: null as ThemeColors | null
  },

  lifetimes: {
    attached() {
      const theme = this.properties.theme || getCurrentTheme()
      const themeColors = getThemeColors(theme)
      this.setData({ themeColors })
      this.initCalendar()
    }
  },

  observers: {
    'theme': function(theme: ThemeType) {
      if (theme) {
        const themeColors = getThemeColors(theme)
        this.setData({ themeColors })
      }
    }
  },

  methods: {
    initCalendar() {
      const today = new Date()
      const weekDates = getWeekDates(today)
      const selectedDate = this.properties.selectedDate || formatDate(today)
      const currentDateStr = formatDate(today)
      
      // 从日期字符串创建 Date 对象
      const selectedDateObj = this.parseDateString(selectedDate)
      
      this.setData({
        weekDates: weekDates.map(d => {
          const dateStr = formatDate(d)
          return {
            dateStr,
            weekday: getWeekdayAbbr(d),
            dayNumber: d.getDate(),
            isSelected: dateStr === selectedDate,
            isToday: dateStr === currentDateStr
          }
        }),
        currentDateStr,
        selectedDateStr: selectedDate,
        dateText: formatDateChinese(selectedDateObj)
      })
    },

    onDateChange(newDate: string) {
      if (newDate) {
        this.updateWeekDates(newDate)
        const dateObj = this.parseDateString(newDate)
        this.setData({
          selectedDateStr: newDate,
          dateText: formatDateChinese(dateObj)
        })
      }
    },
    
    parseDateString(dateStr: string): Date {
      // 解析 YYYY-MM-DD 格式的日期字符串
      if (!dateStr) {
        console.warn('parseDateString: empty dateStr, using current date')
        return new Date()
      }
      const parts = dateStr.split('-')
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1 // 月份从0开始
        const day = parseInt(parts[2], 10)
        
        // 验证解析结果
        if (isNaN(year) || isNaN(month) || isNaN(day)) {
          console.error('parseDateString: invalid date parts:', { year, month, day, dateStr, parts })
          return new Date()
        }
        
        const date = new Date(year, month, day)
        if (isNaN(date.getTime())) {
          console.error('parseDateString: invalid date object:', { year, month, day, date })
          return new Date()
        }
        
        return date
      }
      // 如果格式不正确，尝试直接用 new Date 解析
      const date = new Date(dateStr)
      // 如果解析失败，返回今天的日期
      if (isNaN(date.getTime())) {
        console.error('parseDateString: failed to parse date string:', dateStr)
        return new Date()
      }
      return date
    },
    
    updateWeekDates(selectedDate: string) {
      const weekDates = this.data.weekDates.map((item: {
        dateStr: string
        weekday: string
        dayNumber: number
        isSelected: boolean
        isToday: boolean
      }) => ({
        ...item,
        isSelected: item.dateStr === selectedDate
      }))
      this.setData({
        weekDates
      })
    },

    onDateSelect(e: WechatMiniprogram.TouchEvent) {
      const { date } = e.currentTarget.dataset
      const selectedDate = date
      
      const dateObj = this.parseDateString(selectedDate)
      this.updateWeekDates(selectedDate)
      this.setData({
        selectedDateStr: selectedDate,
        dateText: formatDateChinese(dateObj)
      })
      
      this.triggerEvent('datechange', { date: selectedDate })
    },

    onDatePickerTap() {
      // 打开日期选择器，设置当前选中的日期
      const selectedDate = this.data.selectedDateStr || this.properties.selectedDate
      let currentTimestamp = new Date().getTime()
      if (selectedDate) {
        currentTimestamp = dateStringToTimestamp(selectedDate)
        console.log('Opening date picker with selected date:', {
          selectedDate,
          currentTimestamp,
          date: new Date(currentTimestamp)
        })
      } else {
        console.log('Opening date picker with current date:', {
          currentTimestamp,
          date: new Date(currentTimestamp)
        })
      }
      
      // 验证时间戳
      if (isNaN(currentTimestamp) || currentTimestamp <= 0) {
        console.error('Invalid timestamp in onDatePickerTap:', currentTimestamp)
        currentTimestamp = new Date().getTime()
      }
      
      this.setData({
        showDatePicker: true,
        currentDate: currentTimestamp
      })
    },

    onDatePickerClose() {
      this.setData({
        showDatePicker: false
      })
    },


    onDatePickerConfirmFromComponent(e: WechatMiniprogram.CustomEvent) {
      // 从日期选择器组件的 confirm 事件中获取值
      console.log('Date picker confirmed from component:', { detail: e.detail, fullEvent: e })
      
      // 尝试多种方式获取值（参考 todo-task-modal 的实现）
      let value: any = undefined
      
      // 如果 e.detail 本身就是数字（时间戳）
      if (typeof e.detail === 'number') {
        value = e.detail
      } 
      // 如果 e.detail 有 value 属性
      else if (e.detail && typeof e.detail === 'object' && 'value' in e.detail) {
        value = (e.detail as any).value
      }
      // 如果 e.detail 是对象但没有 value，尝试其他可能的属性
      else if (e.detail && typeof e.detail === 'object') {
        // 尝试获取第一个数字属性值
        const keys = Object.keys(e.detail)
        for (const key of keys) {
          const val = (e.detail as any)[key]
          if (typeof val === 'number' && val > 0) {
            value = val
            break
          }
        }
      }
      else {
        value = e.detail
      }
      
      if (value === undefined || value === null) {
        // 如果 confirm 事件也没有传递值，尝试使用 currentDate
        console.warn('Confirm event value is undefined, using currentDate:', this.data.currentDate)
        value = this.data.currentDate
      }
      
      // 处理不同的返回值格式
      let timestamp: number
      if (typeof value === 'number') {
        timestamp = value
      } else if (typeof value === 'string') {
        // 如果是日期字符串，转换为时间戳
        timestamp = dateStringToTimestamp(value)
      } else {
        console.error('Invalid value format from confirm event:', value)
        this.setData({
          showDatePicker: false
        })
        return
      }
      
      // 验证时间戳是否有效
      if (isNaN(timestamp) || timestamp <= 0) {
        console.error('Invalid timestamp from confirm event:', timestamp)
        this.setData({
          showDatePicker: false
        })
        return
      }
      
      this.processDateSelection(timestamp)
    },


    processDateSelection(selectedTimestamp: number) {
      // 验证时间戳是否有效
      if (selectedTimestamp === null || selectedTimestamp === undefined) {
        console.error('Timestamp is null or undefined:', selectedTimestamp)
        this.setData({
          showDatePicker: false
        })
        return
      }
      
      // 确保是数字类型
      let timestamp = selectedTimestamp
      if (typeof timestamp !== 'number') {
        timestamp = Number(timestamp)
      }
      
      if (isNaN(timestamp) || timestamp <= 0) {
        console.error('Invalid timestamp:', timestamp, typeof timestamp, 'original:', selectedTimestamp)
        this.setData({
          showDatePicker: false
        })
        return
      }
      
      const selectedDate = new Date(timestamp)
      
      // 验证 Date 对象是否有效
      if (isNaN(selectedDate.getTime())) {
        console.error('Invalid date object from timestamp:', timestamp, selectedDate)
        this.setData({
          showDatePicker: false
        })
        return
      }
      
      const dateStr = formatDate(selectedDate)
      const dateText = formatDateChinese(selectedDate)
      
      console.log('Processing date selection:', {
        timestamp,
        date: selectedDate,
        dateStr,
        dateText,
        month: selectedDate.getMonth() + 1,
        day: selectedDate.getDate(),
        year: selectedDate.getFullYear()
      })
      
      // 再次验证格式化后的文本
      if (dateText.includes('NaN')) {
        console.error('Formatted date contains NaN:', {
          timestamp,
          date: selectedDate,
          month: selectedDate.getMonth(),
          day: selectedDate.getDate(),
          getMonth: selectedDate.getMonth(),
          getDate: selectedDate.getDate()
        })
        // 使用当前日期作为后备
        const today = new Date()
        const fallbackDateStr = formatDate(today)
        const fallbackDateText = formatDateChinese(today)
        this.updateWeekDates(fallbackDateStr)
        this.setData({
          selectedDateStr: fallbackDateStr,
          dateText: fallbackDateText,
          showDatePicker: false
        })
        this.triggerEvent('datechange', { date: fallbackDateStr })
        return
      }
      
      this.updateWeekDates(dateStr)
      this.setData({
        selectedDateStr: dateStr,
        dateText: dateText,
        showDatePicker: false
      })
      
      this.triggerEvent('datechange', { date: dateStr })
    }
  }
})

