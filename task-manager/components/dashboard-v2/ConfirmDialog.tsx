'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './TaskActionModal.module.css'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  isDestructive?: boolean
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isDestructive = false,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className={styles.overlay} 
          onClick={loading ? undefined : onCancel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div 
            className={styles.modal} 
            style={{ maxWidth: '400px' }} 
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <h2 className={styles.title} style={{ color: isDestructive ? '#dc2626' : undefined }}>{title}</h2>
            <p style={{ color: 'var(--color-slate-600)', lineHeight: '1.5' }}>{message}</p>
            
            <div className={styles.footer}>
              <button 
                onClick={onCancel} 
                className={styles.btnCancel}
                disabled={loading}
              >
                {cancelLabel}
              </button>
              <button 
                onClick={onConfirm} 
                className={styles.btnSave}
                disabled={loading}
                style={{ 
                  background: isDestructive ? '#dc2626' : undefined,
                  boxShadow: isDestructive ? '0 4px 6px -1px rgba(220, 38, 38, 0.2)' : undefined
                }}
              >
                {loading ? 'Processing...' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
