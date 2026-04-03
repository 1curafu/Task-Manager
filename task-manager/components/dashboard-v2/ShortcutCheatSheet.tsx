'use client'

import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import styles from '@/app/dashboard/dashboard.module.css'

interface ShortcutCheatSheetProps {
  onClose: () => void
}

const SHORTCUTS = [
  { keys: ['⌘', 'Shift', 'A'], label: 'New task' },
  { keys: ['⌘', 'Shift', 'K'], label: 'Go to Kanban' },
  { keys: ['⌘', 'K'], label: 'Focus search' },
  { keys: ['/'], label: 'Focus search' },
  { keys: ['⌘', '/'], label: 'Toggle shortcuts' },
  { keys: ['Esc'], label: 'Close overlay' },
]

export function ShortcutCheatSheet({ onClose }: ShortcutCheatSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <motion.div
      ref={panelRef}
      className={styles.shortcutPanel}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      <div className={styles.shortcutPanelHeader}>Keyboard Shortcuts</div>
      {SHORTCUTS.map((s) => (
        <div key={s.label + s.keys.join('')} className={styles.shortcutRow}>
          <span>{s.label}</span>
          <span className={styles.shortcutKeys}>
            {s.keys.map((k) => (
              <kbd key={k} className={styles.kbdBadge}>{k}</kbd>
            ))}
          </span>
        </div>
      ))}
    </motion.div>
  )
}
