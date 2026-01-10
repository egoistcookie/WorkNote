// pages/import-data/index.ts
import { Task, TaskStatus, TaskPriority } from '../../types/task'
import { TodoTask } from '../../types/task'
import { getStorageSync, setStorageSync } from '../../utils/storage'
import { getAllCategories, setAllCategories, CategoryItem } from '../../utils/category'

Page({
  data: {
    importText: '',
    isImporting: false,
    importProgress: 0,
    importProgressText: '',
    importResult: {
      success: 0,
      skipped: 0,
      failed: 0,
      details: [] as string[]
    }
  },

  onLoad() {
    // 页面加载时不执行任何操作
  },

  onImportTextChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      importText: e.detail.value
    })
  },

  onImportConfirm() {
    const importText = this.data.importText.trim()
    if (!importText) {
      wx.showToast({
        title: '请输入导入内容',
        icon: 'none'
      })
      return
    }

    this.setData({
      isImporting: true,
      importProgress: 0,
      importProgressText: '准备导入...',
      importResult: {
        success: 0,
        skipped: 0,
        failed: 0,
        details: []
      }
    })

    // 异步执行导入，以便更新进度
    setTimeout(() => {
      this.importData(importText)
    }, 100)
  },

  onCancel() {
    if (this.data.isImporting) {
      wx.showModal({
        title: '提示',
        content: '导入正在进行中，确定要取消吗？',
        success: (res) => {
          if (res.confirm) {
            wx.navigateBack()
          }
        }
      })
    } else {
      wx.navigateBack()
    }
  },

  importData(text: string) {
    //console.log('========== 开始导入数据 ==========')
    const result = {
      success: 0,
      skipped: 0,
      failed: 0,
      details: [] as string[]
    }

    try {
      const lines = text.split('\n')
      let currentSection = ''
      let currentDate = ''
      let currentTaskLines: string[] = []
      
      // 用于批量导入分类时，累积所有分类后再一次性保存
      let pendingCategories: CategoryItem[] = []

      const totalLines = lines.length
      //console.log(`总行数: ${totalLines}`)
      
      // 更新进度：开始解析
      this.setData({
        importProgress: 5,
        importProgressText: '正在解析文本...'
      })

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmedLine = line.trim()
        
        // 更新进度：解析进度
        if (i % 10 === 0 || i === lines.length - 1) {
          const progress = Math.min(5 + Math.floor((i / lines.length) * 60), 65)
          this.setData({
            importProgress: progress,
            importProgressText: `正在解析... ${i + 1}/${lines.length}`
          })
        }
        
        //console.log(`\n[行 ${i + 1}] 原始内容: "${line}"`)
        //console.log(`[行 ${i + 1}] 处理后: "${trimmedLine}"`)
        //console.log(`[行 ${i + 1}] 当前Section: ${currentSection || '未设置'}, 当前Date: ${currentDate || '未设置'}`)
        
        // 先检测章节标题（优先处理，即使是分隔线格式也要识别为章节）
        if (trimmedLine.includes('时间线任务')) {
          //console.log(`[行 ${i + 1}] 处理结果: 检测到章节 - 时间线任务`)
          // 如果遇到新章节，处理之前累积的任务行
          if (currentTaskLines.length > 0 && currentSection === 'timeline' && currentDate) {
            //console.log(`[行 ${i + 1}] 处理之前累积的时间线任务，共 ${currentTaskLines.length} 行`)
            const taskResult = this.importTimelineTask(currentTaskLines.join('\n'), currentDate)
            //console.log(`[行 ${i + 1}] 任务处理结果:`, taskResult)
            if (taskResult.success) {
              result.success++
              result.details.push(`时间线任务: ${taskResult.title} (${currentDate})`)
            } else if (taskResult.skipped) {
              result.skipped++
              result.details.push(`跳过重复: ${taskResult.title} (${currentDate})`)
            } else {
              result.failed++
              result.details.push(`失败: ${currentTaskLines[0]?.substring(0, 30)}...`)
            }
            currentTaskLines = []
          }
          currentSection = 'timeline'
          currentTaskLines = []
          continue
        } else if (trimmedLine.includes('待办任务')) {
          //console.log(`[行 ${i + 1}] 处理结果: 检测到章节 - 待办任务`)
          // 如果遇到新章节，处理之前累积的任务行
          if (currentTaskLines.length > 0 && currentSection === 'todo') {
            //console.log(`[行 ${i + 1}] 处理之前累积的待办任务，共 ${currentTaskLines.length} 行`)
            const taskResult = this.importTodoTask(currentTaskLines.join('\n'))
            //console.log(`[行 ${i + 1}] 任务处理结果:`, taskResult)
            if (taskResult.success) {
              result.success++
              result.details.push(`待办任务: ${taskResult.title}`)
            } else if (taskResult.skipped) {
              result.skipped++
              result.details.push(`跳过重复: ${taskResult.title}`)
            } else {
              result.failed++
              result.details.push(`失败: ${currentTaskLines[0]?.substring(0, 30)}...`)
            }
            currentTaskLines = []
          }
          currentSection = 'todo'
          currentTaskLines = []
          continue
        } else if (trimmedLine.includes('晨间计划') && trimmedLine.includes('晚间总结')) {
          //console.log(`[行 ${i + 1}] 处理结果: 检测到章节 - 晨间计划和晚间总结`)
          // 如果遇到新章节，处理之前累积的内容
          if (currentTaskLines.length > 0 && currentSection === 'log' && currentDate) {
            const logResult = this.importLog(currentTaskLines.join('\n'), currentDate)
            //console.log(`[行 ${i + 1}] 日志处理结果:`, logResult)
            result.success += logResult.success
            result.skipped += logResult.skipped
            logResult.details.forEach((detail: string) => result.details.push(detail))
            currentTaskLines = []
          } else if (currentTaskLines.length > 0 && currentSection === 'timeline' && currentDate) {
            //console.log(`[行 ${i + 1}] 处理之前累积的时间线任务，共 ${currentTaskLines.length} 行`)
            const taskResult = this.importTimelineTask(currentTaskLines.join('\n'), currentDate)
            //console.log(`[行 ${i + 1}] 任务处理结果:`, taskResult)
            if (taskResult.success) {
              result.success++
              result.details.push(`时间线任务: ${taskResult.title} (${currentDate})`)
            } else if (taskResult.skipped) {
              result.skipped++
              result.details.push(`跳过重复: ${taskResult.title} (${currentDate})`)
            } else {
              result.failed++
              result.details.push(`失败: ${currentTaskLines[0]?.substring(0, 30)}...`)
            }
            currentTaskLines = []
          } else if (currentTaskLines.length > 0 && currentSection === 'todo') {
            //console.log(`[行 ${i + 1}] 处理之前累积的待办任务，共 ${currentTaskLines.length} 行`)
            const taskResult = this.importTodoTask(currentTaskLines.join('\n'))
            //console.log(`[行 ${i + 1}] 任务处理结果:`, taskResult)
            if (taskResult.success) {
              result.success++
              result.details.push(`待办任务: ${taskResult.title}`)
            } else if (taskResult.skipped) {
              result.skipped++
              result.details.push(`跳过重复: ${taskResult.title}`)
            } else {
              result.failed++
              result.details.push(`失败: ${currentTaskLines[0]?.substring(0, 30)}...`)
            }
            currentTaskLines = []
          }
          currentSection = 'log'
          currentDate = ''
          currentTaskLines = []
          continue
        } else if (trimmedLine.includes('分类信息')) {
          //console.log(`[行 ${i + 1}] 处理结果: 检测到章节 - 分类信息`)
          // 如果遇到新章节，处理之前累积的内容
          if (currentTaskLines.length > 0 && currentSection === 'log' && currentDate) {
            const logResult = this.importLog(currentTaskLines.join('\n'), currentDate)
            //console.log(`[行 ${i + 1}] 日志处理结果:`, logResult)
            result.success += logResult.success
            result.skipped += logResult.skipped
            logResult.details.forEach((detail: string) => result.details.push(detail))
            currentTaskLines = []
          } else if (currentTaskLines.length > 0 && currentSection === 'timeline' && currentDate) {
            //console.log(`[行 ${i + 1}] 处理之前累积的时间线任务，共 ${currentTaskLines.length} 行`)
            const taskResult = this.importTimelineTask(currentTaskLines.join('\n'), currentDate)
            //console.log(`[行 ${i + 1}] 任务处理结果:`, taskResult)
            if (taskResult.success) {
              result.success++
              result.details.push(`时间线任务: ${taskResult.title} (${currentDate})`)
            } else if (taskResult.skipped) {
              result.skipped++
              result.details.push(`跳过重复: ${taskResult.title} (${currentDate})`)
            } else {
              result.failed++
              result.details.push(`失败: ${currentTaskLines[0]?.substring(0, 30)}...`)
            }
            currentTaskLines = []
          } else if (currentTaskLines.length > 0 && currentSection === 'todo') {
            //console.log(`[行 ${i + 1}] 处理之前累积的待办任务，共 ${currentTaskLines.length} 行`)
            const taskResult = this.importTodoTask(currentTaskLines.join('\n'))
            //console.log(`[行 ${i + 1}] 任务处理结果:`, taskResult)
            if (taskResult.success) {
              result.success++
              result.details.push(`待办任务: ${taskResult.title}`)
            } else if (taskResult.skipped) {
              result.skipped++
              result.details.push(`跳过重复: ${taskResult.title}`)
            } else {
              result.failed++
              result.details.push(`失败: ${currentTaskLines[0]?.substring(0, 30)}...`)
            }
            currentTaskLines = []
          }
          currentSection = 'category'
          currentTaskLines = []
          continue
        }
        
        // 跳过空行和分隔线（在章节检测之后）
        if (!trimmedLine || (trimmedLine.startsWith('===') && !trimmedLine.includes('分类信息') && !trimmedLine.includes('时间线任务') && !trimmedLine.includes('待办任务') && !trimmedLine.includes('晨间计划') && !trimmedLine.includes('晚间总结')) || trimmedLine.startsWith('导出时间:') || trimmedLine.startsWith('总计:')) {
          //console.log(`[行 ${i + 1}] 处理结果: 跳过（空行或分隔线）`)
          // 如果遇到分隔线，处理之前累积的内容
          if (currentTaskLines.length > 0 && currentSection === 'log' && currentDate) {
            const logResult = this.importLog(currentTaskLines.join('\n'), currentDate)
            //console.log(`[行 ${i + 1}] 日志处理结果:`, logResult)
            result.success += logResult.success
            result.skipped += logResult.skipped
            logResult.details.forEach((detail: string) => result.details.push(detail))
            currentTaskLines = []
          } else if (currentTaskLines.length > 0 && currentSection === 'timeline' && currentDate) {
            //console.log(`[行 ${i + 1}] 处理之前累积的时间线任务，共 ${currentTaskLines.length} 行`)
            const taskResult = this.importTimelineTask(currentTaskLines.join('\n'), currentDate)
            //console.log(`[行 ${i + 1}] 任务处理结果:`, taskResult)
            if (taskResult.success) {
              result.success++
              result.details.push(`时间线任务: ${taskResult.title} (${currentDate})`)
            } else if (taskResult.skipped) {
              result.skipped++
              result.details.push(`跳过重复: ${taskResult.title} (${currentDate})`)
            } else {
              result.failed++
              result.details.push(`失败: ${currentTaskLines[0]?.substring(0, 30)}...`)
            }
            currentTaskLines = []
          } else if (currentTaskLines.length > 0 && currentSection === 'todo') {
            //console.log(`[行 ${i + 1}] 处理之前累积的待办任务，共 ${currentTaskLines.length} 行`)
            const taskResult = this.importTodoTask(currentTaskLines.join('\n'))
            //console.log(`[行 ${i + 1}] 任务处理结果:`, taskResult)
            if (taskResult.success) {
              result.success++
              result.details.push(`待办任务: ${taskResult.title}`)
            } else if (taskResult.skipped) {
              result.skipped++
              result.details.push(`跳过重复: ${taskResult.title}`)
            } else {
              result.failed++
              result.details.push(`失败: ${currentTaskLines[0]?.substring(0, 30)}...`)
            }
            currentTaskLines = []
          }
          continue
        }

        // 处理日期行
        if (trimmedLine.match(/^【\d{4}-\d{2}-\d{2}】$/)) {
          //console.log(`[行 ${i + 1}] 处理结果: 检测到日期行 - ${trimmedLine}`)
          const newDate = trimmedLine.replace(/【|】/g, '')
          
          // 处理之前累积的内容
          if (currentTaskLines.length > 0 && currentSection === 'log' && currentDate) {
            //console.log(`[行 ${i + 1}] 处理之前累积的日志，日期: ${currentDate}，共 ${currentTaskLines.length} 行`)
            const logResult = this.importLog(currentTaskLines.join('\n'), currentDate)
            //console.log(`[行 ${i + 1}] 日志处理结果:`, logResult)
            result.success += logResult.success
            result.skipped += logResult.skipped
            logResult.details.forEach((detail: string) => result.details.push(detail))
            currentTaskLines = []
          } else if (currentTaskLines.length > 0 && currentSection === 'timeline' && currentDate) {
            //console.log(`[行 ${i + 1}] 处理之前累积的时间线任务，共 ${currentTaskLines.length} 行`)
            const taskResult = this.importTimelineTask(currentTaskLines.join('\n'), currentDate)
            //console.log(`[行 ${i + 1}] 任务处理结果:`, taskResult)
            if (taskResult.success) {
              result.success++
              result.details.push(`时间线任务: ${taskResult.title} (${currentDate})`)
            } else if (taskResult.skipped) {
              result.skipped++
              result.details.push(`跳过重复: ${taskResult.title} (${currentDate})`)
            } else {
              result.failed++
              result.details.push(`失败: ${currentTaskLines[0]?.substring(0, 30)}...`)
            }
            currentTaskLines = []
          }
          
          currentDate = newDate
          //console.log(`[行 ${i + 1}] 更新当前日期为: ${currentDate}`)
          currentTaskLines = []
          continue
        }

        // 处理时间线任务（累积多行）
        if (currentSection === 'timeline' && currentDate) {
          if (trimmedLine.match(/^\d+\./)) {
            //console.log(`[行 ${i + 1}] 处理结果: 检测到新时间线任务开始`)
            // 新任务开始，处理之前的任务
            if (currentTaskLines.length > 0) {
              //console.log(`[行 ${i + 1}] 处理之前累积的时间线任务，共 ${currentTaskLines.length} 行`)
              const taskResult = this.importTimelineTask(currentTaskLines.join('\n'), currentDate)
              //console.log(`[行 ${i + 1}] 任务处理结果:`, taskResult)
              if (taskResult.success) {
                result.success++
                result.details.push(`时间线任务: ${taskResult.title} (${currentDate})`)
              } else if (taskResult.skipped) {
                result.skipped++
                result.details.push(`跳过重复: ${taskResult.title} (${currentDate})`)
              } else {
                result.failed++
                result.details.push(`失败: ${currentTaskLines[0]?.substring(0, 30)}...`)
              }
            }
            currentTaskLines = [line]
            //console.log(`[行 ${i + 1}] 开始累积新任务，当前累积行数: ${currentTaskLines.length}`)
          } else if (currentTaskLines.length > 0) {
            // 继续累积任务行
            //console.log(`[行 ${i + 1}] 处理结果: 继续累积任务行，当前累积行数: ${currentTaskLines.length + 1}`)
            currentTaskLines.push(line)
          } else {
            //console.log(`[行 ${i + 1}] 处理结果: 忽略（不在任务行中）`)
          }
          continue
        }

        // 处理待办任务（累积多行）
        if (currentSection === 'todo') {
          if (trimmedLine.match(/^\d+\./)) {
            //console.log(`[行 ${i + 1}] 处理结果: 检测到新待办任务开始`)
            // 新任务开始，处理之前的任务
            if (currentTaskLines.length > 0) {
              //console.log(`[行 ${i + 1}] 处理之前累积的待办任务，共 ${currentTaskLines.length} 行`)
              const taskResult = this.importTodoTask(currentTaskLines.join('\n'))
              //console.log(`[行 ${i + 1}] 任务处理结果:`, taskResult)
              if (taskResult.success) {
                result.success++
                result.details.push(`待办任务: ${taskResult.title}`)
              } else if (taskResult.skipped) {
                result.skipped++
                result.details.push(`跳过重复: ${taskResult.title}`)
              } else {
                result.failed++
                result.details.push(`失败: ${currentTaskLines[0]?.substring(0, 30)}...`)
              }
            }
            currentTaskLines = [line]
            //console.log(`[行 ${i + 1}] 开始累积新任务，当前累积行数: ${currentTaskLines.length}`)
          } else if (currentTaskLines.length > 0) {
            // 继续累积任务行
            //console.log(`[行 ${i + 1}] 处理结果: 继续累积任务行，当前累积行数: ${currentTaskLines.length + 1}`)
            currentTaskLines.push(line)
          } else {
            //console.log(`[行 ${i + 1}] 处理结果: 忽略（不在任务行中）`)
          }
          continue
        }

        // 处理日志（晨间计划和晚间总结）
        if (currentSection === 'log') {
          // 如果还没有设置日期，先跳过（等待日期行）
          if (!currentDate) {
            //console.log(`[行 ${i + 1}] 处理结果: 等待日期行，当前日期未设置`)
            continue
          }
          
          // 检查是否是新的日志开始（晨间计划或晚间总结）
          if (trimmedLine.startsWith('晨间计划:') || trimmedLine.startsWith('晚间总结:')) {
            //console.log(`[行 ${i + 1}] 处理结果: 检测到新日志开始 - ${trimmedLine.startsWith('晨间计划:') ? '晨间计划' : '晚间总结'}`)
            // 处理之前累积的日志
            if (currentTaskLines.length > 0) {
              //console.log(`[行 ${i + 1}] 处理之前累积的日志，共 ${currentTaskLines.length} 行`)
              const logResult = this.importLog(currentTaskLines.join('\n'), currentDate)
              //console.log(`[行 ${i + 1}] 日志处理结果:`, logResult)
              result.success += logResult.success
              result.skipped += logResult.skipped
              logResult.details.forEach((detail: string) => result.details.push(detail))
              currentTaskLines = []
            }
            // 开始累积新的日志
            currentTaskLines = [line]
            //console.log(`[行 ${i + 1}] 开始累积新日志，当前累积行数: ${currentTaskLines.length}`)
          } else if (currentTaskLines.length > 0) {
            // 继续累积日志内容
            //console.log(`[行 ${i + 1}] 处理结果: 继续累积日志行，当前累积行数: ${currentTaskLines.length + 1}`)
            currentTaskLines.push(line)
          } else {
            //console.log(`[行 ${i + 1}] 处理结果: 忽略（不在日志行中，等待日志开始）`)
          }
          continue
        }

        // 处理分类信息（单行）
        if (currentSection === 'category' && trimmedLine.match(/^\d+\./)) {
          //console.log(`[行 ${i + 1}] 处理结果: 检测到分类行`)
          const categoryResult = this.parseCategoryLine(trimmedLine)
          //console.log(`[行 ${i + 1}] 分类解析结果:`, categoryResult)
          if (categoryResult.success) {
            // 检查是否重复（与已存在的分类和待导入的分类比较）
            const existingCategories = getAllCategories()
            const isDuplicate = existingCategories.some(c => c.name === categoryResult.name) ||
                                pendingCategories.some(c => c.name === categoryResult.name)
            
            //console.log(`[行 ${i + 1}] 已存在分类数量: ${existingCategories.length}, 待导入分类数量: ${pendingCategories.length}`)
            //console.log(`[行 ${i + 1}] 是否重复: ${isDuplicate}`)
            
            if (isDuplicate) {
              //console.log(`[行 ${i + 1}] 处理结果: 跳过重复分类 - ${categoryResult.name}`)
              result.skipped++
              result.details.push(`跳过重复: ${categoryResult.name}`)
            } else {
              //console.log(`[行 ${i + 1}] 处理结果: 成功解析分类 - ${categoryResult.name} (${categoryResult.category.color})`)
              pendingCategories.push(categoryResult.category)
              result.success++
              result.details.push(`分类: ${categoryResult.name}`)
            }
          } else {
            //console.log(`[行 ${i + 1}] 处理结果: 分类解析失败`)
            result.failed++
            result.details.push(`失败: ${trimmedLine.substring(0, 30)}...`)
          }
          continue
        }
        
        // 未匹配到任何规则
        //console.log(`[行 ${i + 1}] 处理结果: 未匹配到任何规则，跳过`)
      }

      // 处理最后累积的任务
      //console.log('\n========== 处理最后累积的任务 ==========')
      if (currentTaskLines.length > 0) {
        //console.log(`剩余任务行数: ${currentTaskLines.length}, Section: ${currentSection}, Date: ${currentDate}`)
        if (currentSection === 'log' && currentDate) {
          const logResult = this.importLog(currentTaskLines.join('\n'), currentDate)
          //console.log('最后日志处理结果:', logResult)
          result.success += logResult.success
          result.skipped += logResult.skipped
          logResult.details.forEach((detail: string) => result.details.push(detail))
        } else if (currentSection === 'timeline' && currentDate) {
          const taskResult = this.importTimelineTask(currentTaskLines.join('\n'), currentDate)
          //console.log('最后任务处理结果:', taskResult)
          if (taskResult.success) {
            result.success++
            result.details.push(`时间线任务: ${taskResult.title} (${currentDate})`)
          } else if (taskResult.skipped) {
            result.skipped++
            result.details.push(`跳过重复: ${taskResult.title} (${currentDate})`)
          } else {
            result.failed++
            result.details.push(`失败: ${currentTaskLines[0]?.substring(0, 30)}...`)
          }
        } else if (currentSection === 'todo') {
          const taskResult = this.importTodoTask(currentTaskLines.join('\n'))
          //console.log('最后任务处理结果:', taskResult)
          if (taskResult.success) {
            result.success++
            result.details.push(`待办任务: ${taskResult.title}`)
          } else if (taskResult.skipped) {
            result.skipped++
            result.details.push(`跳过重复: ${taskResult.title}`)
          } else {
            result.failed++
            result.details.push(`失败: ${currentTaskLines[0]?.substring(0, 30)}...`)
          }
        }
      }

      // 更新进度：保存分类
      this.setData({
        importProgress: 70,
        importProgressText: '正在保存分类...'
      })

      // 批量保存分类
      //console.log('\n========== 批量保存分类 ==========')
      //console.log(`待保存分类数量: ${pendingCategories.length}`)
      if (pendingCategories.length > 0) {
        pendingCategories.forEach((cat, idx) => {
          //console.log(`  [${idx + 1}] ${cat.name} (${cat.color})`)
        })
        const existingCategories = getAllCategories()
        //console.log(`已存在分类数量: ${existingCategories.length}`)
        const allCategories = [...existingCategories, ...pendingCategories]
        //console.log(`保存后总分类数量: ${allCategories.length}`)
        setAllCategories(allCategories)
        
        // 验证保存结果
        const savedCategories = getAllCategories()
        //console.log(`保存后实际分类数量: ${savedCategories.length}`)
        const savedCount = pendingCategories.filter(pc => 
          savedCategories.some(sc => sc.name === pc.name && sc.color === pc.color)
        ).length
        //console.log(`成功保存的分类数量: ${savedCount}/${pendingCategories.length}`)
        
        if (savedCount < pendingCategories.length) {
          const failedCount = pendingCategories.length - savedCount
          //console.log(`保存失败的数量: ${failedCount}`)
          result.failed += failedCount
          result.success -= failedCount
        }
      }

      //console.log('\n========== 导入完成 ==========')
      //console.log('导入结果统计:')
      //console.log(`  成功: ${result.success} 条`)
      //console.log(`  跳过: ${result.skipped} 条`)
      //console.log(`  失败: ${result.failed} 条`)
      //console.log('详细结果:')
      result.details.forEach((detail, idx) => {
        //console.log(`  [${idx + 1}] ${detail}`)
      })

      // 更新进度：完成
      this.setData({
        importProgress: 100,
        importProgressText: '导入完成！',
        importResult: result,
        isImporting: false
      })

      // 如果成功导入了分类，提示用户刷新分类管理页面
      const hasCategorySuccess = result.details.some(d => d.startsWith('分类:'))
      //console.log(`是否有分类成功导入: ${hasCategorySuccess}`)

      setTimeout(() => {
        wx.showToast({
          title: `导入完成: 成功${result.success}条, 跳过${result.skipped}条, 失败${result.failed}条`,
          icon: result.failed > 0 ? 'none' : 'success',
          duration: 3000
        })

        // 如果导入了分类，提示用户可能需要刷新分类管理页面
        if (hasCategorySuccess) {
          setTimeout(() => {
            wx.showModal({
              title: '提示',
              content: '分类已导入成功，请在分类管理页面查看。',
              showCancel: false
            })
          }, 3500)
        }
      }, 500)
    } catch (err) {
      console.error('导入失败:', err)
      this.setData({
        importProgress: 0,
        importProgressText: '导入失败',
        isImporting: false
      })
      wx.showToast({
        title: '导入失败，请检查格式',
        icon: 'none'
      })
    }
  },

  importTimelineTask(taskText: string, date: string): { success: boolean; skipped: boolean; title: string } {
    try {
      const lines = taskText.split('\n').map(l => l.trim()).filter(l => l)
      if (lines.length === 0) {
        return { success: false, skipped: false, title: '' }
      }

      // 解析第一行: "1. [分类] 标题 - 描述"
      const firstLine = lines[0]
      const match = firstLine.match(/^\d+\.\s*\[([^\]]+)\]\s*(.+?)(?:\s*-\s*(.+))?$/)
      if (!match) {
        return { success: false, skipped: false, title: '' }
      }

      const category = match[1].trim()
      const title = match[2].trim()
      const description = match[3] ? match[3].trim() : ''

      // 检查是否已存在（通过标题和日期判断）
      const tasksKey = `tasks_${date}`
      const existingTasks = getStorageSync<Task[]>(tasksKey) || []
      const isDuplicate = existingTasks.some(t => 
        t.title === title && t.date === date && t.category === category
      )

      if (isDuplicate) {
        return { success: false, skipped: true, title }
      }

      // 解析状态、时间等信息（从所有行中查找）
      const fullText = lines.join(' ')
      const statusMatch = fullText.match(/状态:\s*([^|]+)/)
      const statusText = statusMatch ? statusMatch[1].trim() : '待开始'
      const status = this.parseStatus(statusText)

      const startTimeMatch = fullText.match(/开始:\s*(\d{2}:\d{2})/)
      const startTime = startTimeMatch ? startTimeMatch[1] : '00:00'

      const endTimeMatch = fullText.match(/结束:\s*(\d{2}:\d{2})/)
      const endTime = endTimeMatch ? endTimeMatch[1] : undefined

      const now = Date.now()
      const newTask: Task = {
        id: `task_${now}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        description,
        startTime,
        endTime,
        category: category as any,
        status,
        date,
        createdAt: now,
        updatedAt: now
      }

      existingTasks.push(newTask)
      setStorageSync(tasksKey, existingTasks)

      return { success: true, skipped: false, title }
    } catch (err) {
      return { success: false, skipped: false, title: '' }
    }
  },

  importLog(logText: string, date: string): { success: number; skipped: number; details: string[] } {
    try {
      const lines = logText.split('\n').map(l => l.trim()).filter(l => l)
      if (lines.length === 0) {
        return { success: 0, skipped: 0, details: [] }
      }

      const details: string[] = []
      let successCount = 0
      let skippedCount = 0
      let morningLog = ''
      let eveningLog = ''

      // 解析日志内容
      let currentType: 'morning' | 'evening' | null = null
      
      for (const line of lines) {
        if (line.startsWith('晨间计划:')) {
          // 开始新的晨间计划
          if (currentType === 'morning' && morningLog) {
            // 保存之前的晨间计划
            const morningKey = `log_morning_${date}`
            const existingMorningLog = getStorageSync<string>(morningKey)
            if (!existingMorningLog || existingMorningLog !== morningLog.trim()) {
              setStorageSync(morningKey, morningLog.trim())
              successCount++
              details.push(`晨间计划: ${date}`)
            } else {
              skippedCount++
              details.push(`跳过重复: 晨间计划 ${date}`)
            }
            morningLog = ''
          }
          currentType = 'morning'
          const content = line.replace(/^晨间计划:\s*/, '')
          if (content) {
            morningLog = morningLog ? `${morningLog}\n${content}` : content
          }
        } else if (line.startsWith('晚间总结:')) {
          // 开始新的晚间总结
          if (currentType === 'evening' && eveningLog) {
            // 保存之前的晚间总结
            const eveningKey = `log_evening_${date}`
            const existingEveningLog = getStorageSync<string>(eveningKey)
            if (!existingEveningLog || existingEveningLog !== eveningLog.trim()) {
              setStorageSync(eveningKey, eveningLog.trim())
              successCount++
              details.push(`晚间总结: ${date}`)
            } else {
              skippedCount++
              details.push(`跳过重复: 晚间总结 ${date}`)
            }
            eveningLog = ''
          }
          currentType = 'evening'
          const content = line.replace(/^晚间总结:\s*/, '')
          if (content) {
            eveningLog = eveningLog ? `${eveningLog}\n${content}` : content
          }
        } else if (currentType === 'morning') {
          // 继续累积晨间计划内容
          morningLog = morningLog ? `${morningLog}\n${line}` : line
        } else if (currentType === 'evening') {
          // 继续累积晚间总结内容
          eveningLog = eveningLog ? `${eveningLog}\n${line}` : line
        }
      }

      // 保存最后累积的日志
      if (morningLog) {
        const morningKey = `log_morning_${date}`
        const existingMorningLog = getStorageSync<string>(morningKey)
        if (!existingMorningLog || existingMorningLog !== morningLog.trim()) {
          setStorageSync(morningKey, morningLog.trim())
          successCount++
          details.push(`晨间计划: ${date}`)
        } else {
          skippedCount++
          details.push(`跳过重复: 晨间计划 ${date}`)
        }
      }
      
      if (eveningLog) {
        const eveningKey = `log_evening_${date}`
        const existingEveningLog = getStorageSync<string>(eveningKey)
        if (!existingEveningLog || existingEveningLog !== eveningLog.trim()) {
          setStorageSync(eveningKey, eveningLog.trim())
          successCount++
          details.push(`晚间总结: ${date}`)
        } else {
          skippedCount++
          details.push(`跳过重复: 晚间总结 ${date}`)
        }
      }

      return { success: successCount, skipped: skippedCount, details }
    } catch (err) {
      return { success: 0, skipped: 0, details: [] }
    }
  },

  importTodoTask(taskText: string): { success: boolean; skipped: boolean; title: string } {
    try {
      const lines = taskText.split('\n').map(l => l.trim()).filter(l => l)
      if (lines.length === 0) {
        return { success: false, skipped: false, title: '' }
      }

      // 解析第一行: "1. [优先级] 标题 - 描述"
      const firstLine = lines[0]
      const match = firstLine.match(/^\d+\.\s*\[([^\]]+)\]\s*(.+?)(?:\s*-\s*(.+))?$/)
      if (!match) {
        return { success: false, skipped: false, title: '' }
      }

      const priorityText = match[1].trim()
      const title = match[2].trim()
      const description = match[3] ? match[3].trim() : ''

      // 检查是否已存在（通过标题判断）
      const existingTasks = getStorageSync<TodoTask[]>('todo_tasks') || []
      const isDuplicate = existingTasks.some(t => t.title === title)

      if (isDuplicate) {
        return { success: false, skipped: true, title }
      }

      // 解析优先级
      const priority = this.parsePriority(priorityText)

      // 解析状态、日期等信息（从所有行中查找）
      const fullText = lines.join(' ')
      const statusMatch = fullText.match(/状态:\s*([^|]+)/)
      const statusText = statusMatch ? statusMatch[1].trim() : '待开始'
      const status = this.parseStatus(statusText)

      const startDateMatch = fullText.match(/开始日期:\s*(\d{4}-\d{2}-\d{2})/)
      const startDate = startDateMatch ? startDateMatch[1] : undefined

      const endDateMatch = fullText.match(/结束日期:\s*(\d{4}-\d{2}-\d{2})/)
      const endDate = endDateMatch ? endDateMatch[1] : undefined

      const now = Date.now()
      const newTask: TodoTask = {
        id: `todo_${now}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        description,
        priority,
        startDate,
        endDate,
        category: title as any, // 待办任务的分类就是标题
        status,
        createdAt: now,
        updatedAt: now
      }

      existingTasks.push(newTask)
      setStorageSync('todo_tasks', existingTasks)

      return { success: true, skipped: false, title }
    } catch (err) {
      return { success: false, skipped: false, title: '' }
    }
  },

  parseCategoryLine(line: string): { success: boolean; name: string; category: CategoryItem } {
    try {
      //console.log(`  解析分类行: "${line}"`)
      // 解析格式: "1. [#颜色] 分类名" 或 "22. [#795549] 工作日志开发"
      const match = line.match(/^\d+\.\s*\[([^\]]+)\]\s*(.+)$/)
      if (!match) {
        //console.log(`  解析失败: 正则表达式不匹配`)
        return { success: false, name: '', category: { name: '', color: '' } }
      }

      const color = match[1].trim()
      const name = match[2].trim()
      //console.log(`  提取的颜色: "${color}", 提取的名称: "${name}"`)

      if (!name) {
        //console.log(`  解析失败: 名称为空`)
        return { success: false, name: '', category: { name: '', color: '' } }
      }

      const finalColor = color.startsWith('#') ? color : `#${color}`
      const category: CategoryItem = {
        name,
        color: finalColor
      }
      //console.log(`  解析成功: 名称="${name}", 颜色="${finalColor}"`)

      return { success: true, name, category }
    } catch (err) {
      //console.log(`  解析异常:`, err)
      return { success: false, name: '', category: { name: '', color: '' } }
    }
  },

  parseStatus(statusText: string): TaskStatus {
    const statusMap: Record<string, TaskStatus> = {
      '待开始': TaskStatus.PENDING,
      '进行中': TaskStatus.IN_PROGRESS,
      '已暂停': TaskStatus.PAUSED,
      '已完成': TaskStatus.COMPLETED,
      '已取消': TaskStatus.CANCELLED
    }
    return statusMap[statusText] || TaskStatus.PENDING
  },

  parsePriority(priorityText: string): TaskPriority {
    const priorityMap: Record<string, TaskPriority> = {
      '紧急&重要': TaskPriority.URGENT_IMPORTANT,
      '重要&不紧急': TaskPriority.IMPORTANT_NOT_URGENT,
      '紧急&不重要': TaskPriority.URGENT_NOT_IMPORTANT,
      '不紧急&不重要': TaskPriority.NOT_URGENT_NOT_IMPORTANT
    }
    return priorityMap[priorityText] || TaskPriority.NOT_URGENT_NOT_IMPORTANT
  }
})

