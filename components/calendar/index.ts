// components/calendar/index.ts
import { getWeekDates, formatDate, isSameDay, getWeekdayAbbr, formatDateChinese } from '../../utils/date'

Component({
  properties: {
    selectedDate: {
      type: String,
      value: '',
      observer: 'onDateChange'
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
    dateText: ''
  },

  lifetimes: {
    attached() {
      this.initCalendar()
    }
  },

  methods: {
    initCalendar() {
      const today = new Date()
      const weekDates = getWeekDates(today)
      const selectedDate = this.properties.selectedDate || formatDate(today)
      const currentDateStr = formatDate(today)
      
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
        dateText: formatDateChinese(new Date(selectedDate))
      })
    },

    onDateChange(newDate: string) {
      if (newDate) {
        this.updateWeekDates(newDate)
        this.setData({
          selectedDateStr: newDate,
          dateText: formatDateChinese(new Date(newDate))
        })
      }
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
      
      this.updateWeekDates(selectedDate)
      this.setData({
        selectedDateStr: selectedDate,
        dateText: formatDateChinese(new Date(selectedDate))
      })
      
      this.triggerEvent('datechange', { date: selectedDate })
    },

    onDatePickerTap() {
      // 后续实现日期选择器
      console.log('打开日期选择器')
    }
  }
})

