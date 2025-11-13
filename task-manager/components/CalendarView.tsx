'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek } from 'date-fns'

interface Task {
  id: string
  name: string
  dueDate: string
}

interface CalendarViewProps {
  tasks: Task[]
}

export default function CalendarView({ tasks }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => 
      isSameDay(new Date(task.dueDate), day)
    )
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  return (
    <div className="card">
      <div className="calendar-header">
        <h2 className="calendar-month-title">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="calendar-controls">
          <button onClick={previousMonth} className="btn btn-secondary btn-small">
            ←
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="btn btn-secondary btn-small"
          >
            Today
          </button>
          <button onClick={nextMonth} className="btn btn-secondary btn-small">
            →
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        {weekDays.map(day => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
        {days.map((day, index) => {
          const dayTasks = getTasksForDay(day)
          const hasTasks = dayTasks.length > 0
          const isCurrentMonth = day.getMonth() === currentDate.getMonth()
          
          return (
            <div
              key={index}
              className={`calendar-day ${isToday(day) ? 'calendar-day-today' : ''} ${hasTasks ? 'calendar-day-has-tasks' : ''} ${!isCurrentMonth ? 'calendar-day-other-month' : ''}`}
              title={hasTasks ? dayTasks.map(t => t.name).join(', ') : ''}
            >
              <div className="calendar-day-content">
                <span className="calendar-day-number">{format(day, 'd')}</span>
                {hasTasks && (
                  <div className={`calendar-day-tasks ${isToday(day) ? 'calendar-day-tasks-today' : 'calendar-day-tasks-default'}`}>
                    {dayTasks.length} task{dayTasks.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
