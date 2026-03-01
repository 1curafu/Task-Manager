'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabaseClient'
import styles from './TaskActionModal.module.css'
import { X, CalendarBlank, Tag, Flag, TextAa, Trash } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { ConfirmDialog } from './ConfirmDialog'
import { CustomDropdown } from './CustomDropdown'

interface Task {
  id: string
  name: string
  dueDate: string
  category?: string | null
  notes?: string | null
  links?: string | null
  teamId?: string | null
  assignedToId?: string | null
  createdById?: string | null
  priority?: string | null
}

interface TaskActionModalProps {
  task: Task | null
  userId: string
  onClose: () => void
  onSave: () => void
  viewMode?: boolean
}

export function TaskActionModal({ task, userId, onClose, onSave, viewMode = false }: TaskActionModalProps) {
  const [isViewing, setIsViewing] = useState(viewMode && !!task)
  const [formData, setFormData] = useState({
    name: task?.name || '',
    dueDate: task?.dueDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    category: task?.category || '',
    notes: task?.notes || '',
    links: task?.links || '',
    teamId: task?.teamId || '',
    assignedToId: task?.assignedToId || '',
    priority: task?.priority || 'medium'
  })
  
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const supabase = createClient()

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [formData.notes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.name.trim()) {
          alert('Task name is required')
          setLoading(false)
          return
      }

      const now = new Date().toISOString()
      const taskData = {
        name: formData.name,
        dueDate: new Date(formData.dueDate).toISOString(),
        category: formData.category,
        notes: formData.notes,
        links: formData.links,
        userId: userId,
        lastUpdated: now,
        priority: formData.priority,
        teamId: formData.teamId || null,
        assignedToId: formData.assignedToId || null,
        createdById: task?.createdById || userId,
      }

      if (task) {
        const { error } = await supabase
          .from('Task')
          .update(taskData)
          .eq('id', task.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('Task')
          .insert({
            ...taskData,
            createdAt: now,
          })
        if (error) throw error
      }

      onSave()
    } catch (error) {
      const err = error as { message?: string }
      console.error('Error saving task:', err?.message || error)
      alert('Failed to save task')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
        if (!task) return
        const { error } = await supabase.from('Task').delete().eq('id', task.id)
        if (error) throw error
        onSave()
    } catch (error) {
        console.error('Error deleting task:', error)
        alert('Failed to delete task')
        setLoading(false)
    }
  }

  const PriorityOption = ({ value, label }: { value: string, label: string }) => {
      const isSelected = formData.priority === value
      let className = styles.priorityOption
      if (isSelected) {
          className += ` ${styles.prioritySelected}`
          if (value === 'low') className += ` ${styles.priorityLow}`
          if (value === 'medium') className += ` ${styles.priorityMedium}`
          if (value === 'high') className += ` ${styles.priorityHigh}`
      }
      return (
          <div className={className} onClick={() => setFormData({...formData, priority: value})}>
             <Flag weight={isSelected ? 'fill' : 'regular'} />
             {label}
          </div>
      )
  }

  return (
    <motion.div 
      className={styles.overlay} 
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div 
        className={styles.modal} 
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        
        <div className={styles.header}>
            <span className={styles.title}>{isViewing ? 'Task Details' : task ? 'Edit Task' : 'New Task'}</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                {isViewing && task ? (
                    <button 
                        className={styles.closeButton} 
                        style={{ color: 'var(--color-brand-blue)', fontSize: '0.875rem', fontWeight: 500, padding: '0.25rem 0.75rem', border: '1px solid var(--color-slate-200)' }}
                        onClick={() => setIsViewing(false)}
                        type="button"
                    >
                        Edit
                    </button>
                ) : task ? (
                    <button 
                        className={styles.closeButton} 
                        style={{ color: '#ef4444' }}
                        onClick={() => setShowDeleteConfirm(true)}
                        type="button"
                    >
                        <Trash size={20} />
                    </button>
                ) : null}
                <button className={styles.closeButton} onClick={onClose} type="button">
                    <X size={20} />
                </button>
            </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
            
            <div className={styles.formGroup}>
                <div className={styles.inputWrapper}>
                    {isViewing ? (
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-slate-900)', margin: '0.5rem 0' }}>
                            {formData.name}
                        </h3>
                    ) : (
                        <input 
                            type="text" 
                            placeholder="What needs to be done?" 
                            className={styles.input} 
                            style={{ fontSize: '1.25rem', fontWeight: 500 }}
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            autoFocus
                        />
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                    <label className={styles.label}><CalendarBlank size={16} /> Due Date</label>
                    {isViewing ? (
                        <div style={{ padding: '0.75rem 1rem', background: 'var(--color-slate-50)', borderRadius: '0.75rem', fontSize: '0.9375rem', color: 'var(--color-slate-900)' }}>
                            {new Date(formData.dueDate).toLocaleDateString()}
                        </div>
                    ) : (
                        <input 
                            type="date" 
                            className={styles.input}
                            value={formData.dueDate}
                            onChange={e => setFormData({...formData, dueDate: e.target.value})}
                        />
                    )}
                </div>
                
                <div className={styles.formGroup}>
                    <label className={styles.label}><Tag size={16} /> Category</label>
                    {isViewing ? (
                        <div style={{ padding: '0.75rem 1rem', background: 'var(--color-slate-50)', borderRadius: '0.75rem', fontSize: '0.9375rem', color: 'var(--color-slate-900)' }}>
                            {formData.category || 'None'}
                        </div>
                    ) : (
                        <div className={styles.inputWrapper} style={{ padding: 0, border: 'none', background: 'transparent' }}>
                             <CustomDropdown
                                value={formData.category}
                                onChange={(val) => setFormData({...formData, category: val})}
                                options={[
                                    { label: 'No Category', value: '' },
                                    { label: 'Work', value: 'Work' },
                                    { label: 'Personal', value: 'Personal' },
                                    { label: 'Projects', value: 'Projects' }
                                ]}
                                placeholder="Select Category"
                                triggerStyle={{
                                    background: 'var(--color-slate-50)',
                                    border: '1px solid var(--color-slate-200)',
                                    padding: '0.75rem',
                                    fontSize: '1rem',
                                    height: '100%'
                                }}
                             />
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.formGroup}>
                 <label className={styles.label}><Flag size={16} /> Priority</label>
                 {isViewing ? (
                     <div style={{ display: 'inline-flex', padding: '0.5rem 0.75rem', background: 'var(--color-slate-50)', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-slate-700)', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }}>
                         <Flag weight="fill" color={formData.priority === 'high' ? '#dc2626' : formData.priority === 'medium' ? '#ea580c' : '#16a34a'} />
                         {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)}
                     </div>
                 ) : (
                     <div className={styles.priorityGrid}>
                        <PriorityOption value="low" label="Low" />
                        <PriorityOption value="medium" label="Medium" />
                        <PriorityOption value="high" label="High" />
                     </div>
                 )}
            </div>

            <div className={styles.formGroup}>
                 <label className={styles.label}><TextAa size={16} /> Notes</label>
                 {isViewing ? (
                     <div style={{ padding: '1rem', background: 'var(--color-slate-50)', borderRadius: '0.75rem', fontSize: '0.9375rem', color: formData.notes ? 'var(--color-slate-900)' : 'var(--color-slate-400)', minHeight: '100px', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                         {formData.notes || 'No description provided.'}
                     </div>
                 ) : (
                     <textarea 
                        ref={textareaRef}
                        className={`${styles.input} ${styles.textarea}`}
                        placeholder="Add details..."
                        value={formData.notes}
                        onChange={e => setFormData({...formData, notes: e.target.value})}
                     />
                 )}
            </div>

            {!isViewing && (
                <div className={styles.footer}>
                     <button type="button" className={styles.btnCancel} onClick={onClose}>Cancel</button>
                     <button type="submit" className={styles.btnSave} disabled={loading}>
                         {loading ? 'Saving...' : (task ? 'Save Changes' : 'Create Task')}
                     </button>
                </div>
            )}

        </form>
      </motion.div>
      
      <ConfirmDialog 
        isOpen={showDeleteConfirm}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        isDestructive
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        loading={loading}
      />
    </motion.div>
  )
}
