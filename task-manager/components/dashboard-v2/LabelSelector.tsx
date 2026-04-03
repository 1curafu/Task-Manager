'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Tag, Plus, X } from '@phosphor-icons/react'
import styles from './LabelSelector.module.css'

export interface Label {
  id: string
  name: string
  color: string
}

interface LabelSelectorProps {
  userId: string
  selectedLabels: Label[]
  onChange: (labels: Label[]) => void
  disabled?: boolean
}

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', 
  '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', 
  '#d946ef', '#f43f5e', '#64748b'
]

export function LabelSelector({ userId, selectedLabels, onChange, disabled }: LabelSelectorProps) {
  const [labels, setLabels] = useState<Label[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState(COLORS[7])
  const [loading, setLoading] = useState(false)
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchLabels = async () => {
      const { data } = await supabase
        .from('Label')
        .select('*')
        .eq('userId', userId)
        .order('name')
      
      if (data) setLabels(data)
    }
    fetchLabels()
  }, [userId, supabase])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setIsCreating(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleSelect = (label: Label) => {
    if (disabled) return
    const isSelected = selectedLabels.some(l => l.id === label.id)
    if (isSelected) {
      onChange(selectedLabels.filter(l => l.id !== label.id))
    } else {
      onChange([...selectedLabels, label])
    }
  }

  const handleCreate = async () => {
    if (!newLabelName.trim()) return
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('Label')
        .insert({
          name: newLabelName.trim(),
          color: newLabelColor,
          userId: userId
        })
        .select()
        .single()
      
      if (error) throw error
      if (data) {
        const newLabel = data as Label
        setLabels(prev => [...prev, newLabel].sort((a, b) => a.name.localeCompare(b.name)))
        onChange([...selectedLabels, newLabel])
        setIsCreating(false)
        setNewLabelName('')
      }
    } catch (err) {
      const e = err as { message?: string }
      console.error('Error creating label:', e)
      alert(`Failed to create label: ${e?.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container} ref={dropdownRef}>
      <div 
        className={`${styles.trigger} ${disabled ? styles.disabled : ''}`} 
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {selectedLabels.length === 0 ? (
          <span className={styles.placeholder}><Tag size={16} /> Select Labels...</span>
        ) : (
          <div className={styles.selectedList}>
            {selectedLabels.map(label => (
              <span 
                key={label.id} 
                className={styles.labelPill}
                style={{ backgroundColor: `${label.color}20`, color: label.color, borderColor: `${label.color}40` }}
              >
                {label.name}
                {!disabled && (
                  <button 
                    className={styles.removeBtn} 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(label);
                    }}
                  >
                    <X size={12} strokeWidth={3} />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {isOpen && (
        <div className={styles.dropdown}>
          {isCreating ? (
            <div className={styles.createArea}>
              <h4>Create New Label</h4>
              <input 
                autoFocus
                type="text" 
                placeholder="Label name"
                value={newLabelName}
                onChange={e => setNewLabelName(e.target.value)}
                maxLength={20}
                className={styles.input}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreate();
                  }
                }}
              />
              <div className={styles.colorGrid}>
                {COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`${styles.colorBtn} ${newLabelColor === color ? styles.selectedColor : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewLabelColor(color)}
                  />
                ))}
              </div>
              <div className={styles.actions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsCreating(false)}>Cancel</button>
                <button type="button" className={styles.saveBtn} onClick={handleCreate} disabled={loading || !newLabelName.trim()}>
                  {loading ? '...' : 'Create'}
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.listArea}>
              <div className={styles.list}>
                {labels.length === 0 ? (
                  <p className={styles.emptyMsg}>No labels yet.</p>
                ) : (
                  labels.map(label => {
                    const isSelected = selectedLabels.some(l => l.id === label.id)
                    return (
                      <div 
                        key={label.id} 
                        className={`${styles.listItem} ${isSelected ? styles.selectedItem : ''}`}
                        onClick={() => toggleSelect(label)}
                      >
                        <div className={styles.colorDot} style={{ backgroundColor: label.color }} />
                        <span className={styles.listName}>{label.name}</span>
                        {isSelected && <span className={styles.check}>✓</span>}
                      </div>
                    )
                  })
                )}
              </div>
              <button className={styles.createBtn} onClick={() => setIsCreating(true)}>
                <Plus size={14} /> Create New Label
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
