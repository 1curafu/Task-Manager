'use client'

import React from 'react'
import styles from '@/app/dashboard/dashboard.module.css'
import { Circle } from '@phosphor-icons/react'
import { isToday, isPast, isFuture, parseISO } from 'date-fns'
import { motion } from 'framer-motion'

interface Task {
  id: string
  name: string
  category?: string | null
  dueDate: string
  completed?: boolean
  priority?: string | null
  teamId?: string | null
}

interface TaskGridProps {
  tasks: Task[]
  onTaskClick?: (task: Task) => void
}

export function TaskGrid({ tasks, onTaskClick }: TaskGridProps) {
  
  const activeTasks = tasks.filter(t => !t.completed)

  const dueToday = activeTasks.filter(t => {
      if (!t.dueDate) return false
      return isToday(parseISO(t.dueDate))
  })

  const highPriority = activeTasks.filter(t => t.priority === 'high')

  const overdue = activeTasks.filter(t => {
      if (!t.dueDate) return false
      const date = parseISO(t.dueDate)
      return isPast(date) && !isToday(date)
  })

  const upcoming = activeTasks.filter(t => {
      if (!t.dueDate) return false
      const date = parseISO(t.dueDate)
      return isFuture(date) && !isToday(date)
  })

  const cards = [
    { 
      title: 'Due Today', 
      subtitle: 'MY FOCUS',
      tasks: dueToday, 
      icon: <Circle size={20} color="#a855f7" strokeWidth={2.5} />, 
      style: styles.cardBorderPurple,
      emptyMsg: 'No tasks due today',
      countColor: '#a855f7'
    },
    { 
      title: 'High Priority', 
      subtitle: 'NEEDS ATTENTION',
      tasks: highPriority, 
      icon: <Circle size={20} color="#ef4444" strokeWidth={2.5} />, 
      style: styles.cardBorderRed,
      emptyMsg: 'No high priority tasks',
      countColor: '#ef4444'
    },
    { 
      title: 'Overdue', 
      subtitle: 'MISSED DEADLINES',
      tasks: overdue, 
      icon: <Circle size={20} color="#f59e0b" strokeWidth={2.5} />, 
      style: styles.cardBorderOrange,
      emptyMsg: 'All caught up!',
      countColor: '#f59e0b'
    },
     { 
      title: 'Upcoming', 
      subtitle: 'SCHEDULED',
      tasks: upcoming, 
      icon: <Circle size={20} color="#06b6d4" strokeWidth={2.5} />,
      style: styles.cardBorderTeal,
      emptyMsg: 'Nothing scheduled soon',
      countColor: '#06b6d4'
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  }

  return (
    <motion.div 
      className={styles.grid}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {cards.map((card, i) => (
        <motion.div 
          key={i} 
          className={`${styles.card} ${card.style}`}
          variants={itemVariants}
        >
          <div className={styles.cardHeader}>
             <div className={styles.iconBox}>{card.icon}</div>
             <div className={styles.cardHeaderCount} style={{ color: card.countColor }}>
               {String(card.tasks.length).padStart(2, '0')}
             </div>
          </div>
          <div className={styles.cardTitleBlock}>
            <h3 className={styles.cardTitle}>{card.title}</h3>
            <p className={styles.cardSubtitle}>{card.subtitle}</p>
          </div>
          
          <div className={styles.taskList}>
            {card.tasks.length > 0 ? (
              card.tasks.slice(0, 3).map(task => (
                <div 
                    key={task.id} 
                    className={`${styles.taskItem} ${onTaskClick ? styles.taskItemClickable : ''}`}
                    onClick={() => onTaskClick?.(task)}
                >
                  <div className={styles.taskPriorityDot} style={{ background: task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#22c55e' }}></div>
                  <span className={styles.taskNameEllipsis}>{task.name}</span>
                </div>
              ))
            ) : (
               <div className={styles.taskEmptyMessage}>{card.emptyMsg}</div>
            )}
          </div>
          
          <div className={styles.taskCardFooter}>
             <span>{card.tasks.length} tasks</span>
             {card.tasks.length > 0 && <span>View all</span>}
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
