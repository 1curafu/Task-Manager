'use client'

import React, { useState, useMemo } from 'react'
import { Task, normalizeStatus } from '@/types/task'
import { parseISO, startOfWeek, endOfWeek, addWeeks, isToday, format, max, min, isBefore, isAfter } from 'date-fns'
import styles from './GanttCalendar.module.css'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'

interface GanttCalendarProps {
  tasks: Task[]
}

const STATUS_COLOR: Record<string, string> = {
  todo: '#c7c7cc',
  in_progress: 'var(--primary-color)',
  in_review: 'var(--status-in-review)',
  done: 'var(--success-color, #30d158)',
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function GanttCalendar({ tasks }: GanttCalendarProps) {
  const [weekOffset, setWeekOffset] = useState(0)

  const { weekStart, weekEnd, days } = useMemo(() => {
    const now = new Date()
    const base = weekOffset === 0 ? now : addWeeks(now, weekOffset)
    const ws = startOfWeek(base, { weekStartsOn: 1 }) // Monday
    const we = endOfWeek(base, { weekStartsOn: 1 })
    const ds: Date[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(ws)
      d.setDate(d.getDate() + i)
      ds.push(d)
    }
    return { weekStart: ws, weekEnd: we, days: ds }
  }, [weekOffset])

  const tasksWithBars = useMemo(() => {
    return tasks
      .filter(t => !!t.dueDate)
      .map(t => {
        const created = parseISO(t.createdAt)
        const due = parseISO(t.dueDate)
        // Guard: dueDate < createdAt → single-day bar at dueDate
        const barStart = isBefore(due, created) ? due : max([created, weekStart])
        const barEnd = isBefore(due, created) ? due : min([due, weekEnd])
        // Skip if bar is entirely outside the week
        if (isAfter(barStart, weekEnd) || isBefore(barEnd, weekStart)) return null

        const startIdx = Math.max(0, days.findIndex(d => format(d, 'yyyy-MM-dd') === format(barStart, 'yyyy-MM-dd')))
        const endIdx = Math.max(startIdx, days.findIndex(d => format(d, 'yyyy-MM-dd') === format(barEnd, 'yyyy-MM-dd')))
        const colStart = startIdx + 1
        const colSpan = Math.max(1, endIdx - startIdx + 1)

        return { task: t, colStart, colSpan }
      })
      .filter(Boolean) as { task: Task; colStart: number; colSpan: number }[]
  }, [tasks, weekStart, weekEnd, days])

  const todayIdx = days.findIndex(d => isToday(d))

  return (
    <div className={styles.gantt}>
      <div className={styles.header}>
        <button className={styles.navBtn} onClick={() => setWeekOffset(o => o - 1)}>
          <CaretLeft size={16} />
        </button>
        <span className={styles.weekLabel}>
          {format(days[0], 'MMM d')} – {format(days[6], 'MMM d, yyyy')}
        </span>
        <button className={styles.navBtn} onClick={() => setWeekOffset(o => o + 1)}>
          <CaretRight size={16} />
        </button>
      </div>

      <div className={styles.grid} style={{ gridTemplateColumns: `180px repeat(7, 1fr)` }}>
        {/* Header row */}
        <div className={styles.gridLabelCell} />
        {days.map((d, i) => (
          <div key={i} className={`${styles.gridDayHeader} ${isToday(d) ? styles.todayHeader : ''}`}>
            <span className={styles.dayLabel}>{DAY_LABELS[i]}</span>
            <span className={styles.dayDate}>{format(d, 'd')}</span>
          </div>
        ))}

        {/* Today marker */}
        {todayIdx >= 0 && (
          <div
            className={styles.todayLine}
            style={{ gridColumn: todayIdx + 2, gridRow: '2 / -1' }}
          />
        )}

        {/* Task rows */}
        {tasksWithBars.map(({ task, colStart, colSpan }) => (
          <React.Fragment key={task.id}>
            <div className={styles.taskLabel}>{task.name}</div>
            <div
              className={styles.bar}
              style={{
                gridColumn: `${colStart + 1} / span ${colSpan}`,
                background: STATUS_COLOR[normalizeStatus(task.status)],
              }}
              title={task.name}
            />
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
