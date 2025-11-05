'use client'

import { useState, useEffect } from 'react'

export default function Clock() {
  const [time, setTime] = useState({
    hours: '00',
    minutes: '00',
    period: 'AM',
    weekday: 'Monday'
  })

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      let hours = now.getHours()
      const minutes = now.getMinutes()
      const period = hours >= 12 ? 'PM' : 'AM'
      
      hours %= 12
      hours = hours || 12
      
      const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const weekday = weekdays[now.getDay()]

      setTime({
        hours: hours.toString().padStart(2, '0'),
        minutes: minutes.toString().padStart(2, '0'),
        period,
        weekday: weekday.substring(0, 3) // Show first 3 letters
      })
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="clock-container">
      <div className="clock-grid">
        <div className="clock-unit">
          <div className="clock-value">{time.hours}</div>
          <div className="clock-label">Hours</div>
        </div>
        <div className="clock-unit">
          <div className="clock-value">{time.minutes}</div>
          <div className="clock-label">Minutes</div>
        </div>
        <div className="clock-unit">
          <div className="clock-value">{time.period}</div>
          <div className="clock-label">Period</div>
        </div>
        <div className="clock-unit">
          <div className="clock-value">{time.weekday}</div>
          <div className="clock-label">Day</div>
        </div>
      </div>
    </div>
  )
}
