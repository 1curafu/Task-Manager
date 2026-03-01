'use client'

import { useState, useEffect } from 'react'
import styles from '@/app/dashboard-new/dashboard.module.css'

export function Clock() {
  const [time, setTime] = useState<Date>(new Date())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [])

  if (!mounted) {
    return (
      <div className={styles.clockSkeleton} />
    )
  }

  return (
    <div className={styles.clockContainer}>
      <div className={styles.clockTime}>
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className={styles.clockDate}>
        {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
      </div>
    </div>
  )
}
