'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { MagnifyingGlass as Search, Calendar, Users, CheckCircle } from '@phosphor-icons/react'
import styles from '@/app/dashboard/dashboard.module.css'
import { useRouter } from 'next/navigation'

interface SearchResult {
  id: string
  name: string
  dueDate: string
  completed: boolean
  category?: string | null
  teamId?: string | null
}

interface GlobalSearchProps {
  userId: string | null
  focusRef?: { current: (() => void) | null }
}

export function GlobalSearch({ userId, focusRef }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (focusRef) focusRef.current = () => inputRef.current?.focus()
  }, [focusRef])

  useEffect(() => {
    if (!userId || query.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const { data } = await supabase
          .from('Task')
          .select('id, name, dueDate, completed, category, teamId')
          .eq('isTemplate', false)
          .or(`userId.eq.${userId},assignedToId.eq.${userId}`)
          .ilike('name', `%${query}%`)
          .order('dueDate', { ascending: true })
          .limit(10)

        setResults(data || [])
        setIsOpen(true)
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, userId, supabase])

  const handleResultClick = (taskId: string) => {
    router.push(`/dashboard/tasks?taskId=${taskId}`)
    setIsOpen(false)
    setQuery('')
  }

  return (
    <div ref={wrapperRef} className={styles.searchWrapper}>
      <div className={styles.searchBox}>
        <Search size={18} color="var(--color-slate-400)" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search tasks..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true) }}
          className={styles.searchInput}
        />
      </div>

      {isOpen && query.length >= 2 && (
        <div className={styles.searchResultsDropdown}>
          {loading ? (
            <div className={styles.searchLoading}>
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className={styles.searchResultsScroll}>
              <div className={styles.searchResultsHeader}>
                Tasks
              </div>
              {results.map(task => (
                <div 
                  key={task.id} 
                  onClick={() => handleResultClick(task.id)}
                  className={styles.searchResultItem}
                >
                  <div className={styles.searchResultItemMain}>
                     {task.completed ? (
                         <CheckCircle size={16} color="var(--color-slate-400)" />
                     ) : (
                         <div className={styles.searchResultItemHollowCircle} />
                     )}
                    <span className={task.completed ? styles.searchResultItemTitleCompleted : styles.searchResultItemTitlePending}>
                        {task.name}
                    </span>
                  </div>
                  
                  <div className={styles.searchResultItemMeta}>
                    <span className={styles.searchResultItemMetaDate}>
                        <Calendar size={14} />
                        {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                    {task.teamId && (
                        <span className={styles.searchResultItemMetaTeam}>
                            <Users size={14} /> Team Task
                        </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.searchNoResults}>
              <Search size={24} className={styles.searchNoResultsIcon} />
              <div className={styles.searchNoResultsTitle}>No tasks found</div>
              <div className={styles.searchNoResultsSub}>Try a different search term</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
