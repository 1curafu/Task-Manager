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
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import styles from './Calendar.module.css'
import { motion } from 'framer-motion'

interface Task {
  id: string
  name: string
  dueDate: string
  completed?: boolean
  category?: string | null
  notes?: string | null
  links?: string | null
  teamId?: string | null
  assignedToId?: string | null
  createdById?: string | null
}

interface CalendarProps {
  tasks: Task[]
  onEditTask: (task: Task) => void
}

export default function Calendar({ tasks, onEditTask }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

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
            <button onClick={previousMonth} className={styles.controlButton} title="Previous Month">
              <CaretLeft weight="bold" />
            </button>
            <button onClick={goToToday} className={`${styles.controlButton} ${styles.todayButton}`}>
              Today
            </button>
            <button onClick={nextMonth} className={styles.controlButton} title="Next Month">
              <CaretRight weight="bold" />
            </button>
          </div>
        </div>

        <motion.div 
           className={styles.grid}
           variants={containerVariants}
           initial="hidden"
           animate="show"
           key={currentDate.toISOString()}
        >
          {weekDays.map(day => (
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
                `}
                onClick={() => {
                }}
              >
                <div className={styles.dayContent}>
                  <div className={styles.dayNumber}>{format(day, 'd')}</div>
                  
                  {dayTasks.slice(0, 3).map(task => (
                    <div 
                        key={task.id} 
                        className={styles.taskDot}
                        onClick={(e) => {
                            e.stopPropagation()
                            onEditTask(task)
                        }}
                        title={task.name}
                    >
                      {task.name}
                    </div>
                  ))}
                  
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
    </div>
  )
}
