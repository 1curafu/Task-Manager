import React, { useState, useRef, useEffect } from 'react'
import { CaretDown, Check } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'

export interface DropdownOption {
  label: string
  value: string
  icon?: React.ReactNode
}

interface CustomDropdownProps {
  value: string
  onChange: (value: string) => void
  options: DropdownOption[]
  className?: string
  style?: React.CSSProperties
  triggerStyle?: React.CSSProperties
  dropdownStyle?: React.CSSProperties
  align?: 'left' | 'right'
  placeholder?: string
}

export function CustomDropdown({
  value,
  onChange,
  options,
  className,
  style,
  triggerStyle,
  dropdownStyle,
  align = 'left',
  placeholder = 'Select...'
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div 
      ref={dropdownRef} 
      className={className} 
      style={{ position: 'relative', display: 'inline-block', width: '100%', ...style }}
    >
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          padding: '0.5rem 0.75rem',
          borderRadius: '0.5rem',
          border: '1px solid var(--color-slate-200)',
          background: 'var(--color-white)',
          userSelect: 'none',
          ...triggerStyle
        }}
      >
        <span style={{ 
            color: selectedOption ? 'inherit' : 'var(--color-slate-400)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <CaretDown 
            size={16} 
            color="var(--color-slate-400)" 
            style={{ 
                marginLeft: '0.5rem', 
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                flexShrink: 0
            }} 
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              [align === 'left' ? 'left' : 'right']: 0,
              minWidth: '100%',
              background: 'var(--color-white)',
              border: '1px solid var(--color-slate-100)',
              borderRadius: '0.75rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              zIndex: 100,
              overflow: 'hidden',
              padding: '0.25rem',
              ...dropdownStyle
            }}
          >
            {options.map((option) => {
              const isSelected = option.value === value
              return (
                <div
                  key={option.value}
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  style={{
                    padding: '0.5rem 0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    borderRadius: '0.5rem',
                    background: isSelected ? 'var(--color-brand-blue)' : 'transparent',
                    color: isSelected ? 'white' : 'var(--color-slate-700)',
                    fontSize: '0.875rem',
                    transition: 'all 0.1s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                        e.currentTarget.style.background = 'var(--color-slate-50)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                        e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  <div style={{ width: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isSelected && <Check size={14} weight="bold" color={isSelected ? 'white' : 'var(--color-brand-blue)'} />}
                  </div>
                  {option.icon && <span>{option.icon}</span>}
                  <span style={{ fontWeight: isSelected ? 500 : 400 }}>{option.label}</span>
                </div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
