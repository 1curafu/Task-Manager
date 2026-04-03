'use client'

import React, { useState } from 'react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isToday, 
  startOfWeek, 
  endOfWeek, 
  addMonths, 
  subMonths 
} from 'date-fns'
import { CaretLeft as ChevronLeft, CaretRight as ChevronRight } from '@phosphor-icons/react'
import styles from './Calendar.module.css'
import { motion } from 'framer-motion'
import { Task } from '@/types/task'

interface CalendarProps {
  tasks: Task[]
  onEditTask: (task: Task) => void
}

export default function Calendar({ tasks, onEditTask }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month')

  let calendarStart: Date
  let calendarEnd: Date
  let activeWeekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  if (viewMode === 'month') {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  } else if (viewMode === 'week') {
    calendarStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    calendarEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
  } else {
    calendarStart = currentDate
    calendarEnd = currentDate
    activeWeekDays = [format(currentDate, 'EEE')]
  }

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => {
        if (!task.dueDate) return false
        return isSameDay(new Date(task.dueDate), day) && !task.completed
    })
  }

  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const goToToday = () => setCurrentDate(new Date())

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.02
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  }

  return (
    <div className={styles.calendarWrapper}>
      <div className={styles.calendarCard}>
        <div className={styles.header}>
          <h2 className={styles.monthTitle}>
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className={styles.controls}>
            {/* View Mode Toggle */}
            <div className={styles.viewToggle}>
              {(['day', 'week', 'month'] as const).map((mode) => (
                <button
                  key={mode}
                  className={`${styles.viewToggleBtn} ${viewMode === mode ? styles.viewToggleBtnActive : ''}`}
                  onClick={() => setViewMode(mode)}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
            <button onClick={previousMonth} className={styles.controlButton} title="Previous Month">
              <ChevronLeft size={20} />
            </button>
            <button onClick={goToToday} className={`${styles.controlButton} ${styles.todayButton}`}>
              Today
            </button>
            <button onClick={nextMonth} className={styles.controlButton} title="Next Month">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <motion.div 
           className={styles.grid}
           style={{ gridTemplateColumns: viewMode === 'day' ? '1fr' : 'repeat(7, 1fr)' }}
           variants={containerVariants}
           initial="hidden"
           animate="show"
           key={currentDate.toISOString() + viewMode}
        >
          {activeWeekDays.map(day => (
            <div key={day} className={styles.weekday}>
              {day}
            </div>
          ))}

          {days.map((day, index) => {
            const dayTasks = getTasksForDay(day)
            const isCurrentMonth = day.getMonth() === currentDate.getMonth()
            
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className={`
                  ${styles.day} 
                  ${!isCurrentMonth ? styles.dayOtherMonth : ''} 
                  ${isToday(day) ? styles.dayToday : ''}
                  ${selectedDay && isSameDay(day, selectedDay) ? styles.daySelected : ''}
                `}
                onClick={() => setSelectedDay(day)}
              >
                <div className={styles.dayContent}>
                  <div className={styles.dayNumber}>{format(day, 'd')}</div>
                  
                  {dayTasks.slice(0, 3).map(task => {
                    const dotColor = task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#3b82f6'
                    return (
                      <div 
                          key={task.id} 
                          className={styles.taskDot}
                          style={{ borderLeft: `3px solid ${dotColor}` }}
                          onClick={(e) => {
                              e.stopPropagation()
                              onEditTask(task)
                          }}
                          title={task.name}
                      >
                        {task.name}
                      </div>
                    )
                  })}
                  
                  {dayTasks.length > 3 && (
                    <div className={styles.taskMore}>
                      + {dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>

      {/* Selected Day Task List */}
      {selectedDay && (
        <div className={styles.selectedDayPanel}>
          <h3 className={styles.selectedDayTitle}>
            Tasks for {format(selectedDay, 'MMMM d, yyyy')}
          </h3>
          {getTasksForDay(selectedDay).length > 0 ? (
            <div className={styles.selectedDayTasks}>
              {getTasksForDay(selectedDay).map(task => {
                const dotColor = task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#3b82f6'
                return (
                  <div
                    key={task.id}
                    className={styles.selectedDayTaskItem}
                    onClick={() => onEditTask(task)}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                    <span className={styles.selectedDayTaskName}>{task.name}</span>
                    <span className={styles.selectedDayTaskCategory}>{task.category || ''}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className={styles.selectedDayEmpty}>No tasks for this day.</p>
          )}
        </div>
      )}
    </div>
  )
}
