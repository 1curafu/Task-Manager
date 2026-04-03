'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import styles from '../dashboard.module.css'
import { Footer } from '@/components/dashboard-v2/Footer'
import { motion, AnimatePresence } from 'framer-motion'
import { MagnifyingGlass as Search, Plus, Trash as Trash2, FloppyDisk as Save, TextB as Bold, TextItalic as Italic, TextUnderline as Underline, TextStrikethrough as Strikethrough, ListBullets as List, ListNumbers as ListOrdered, Link as LinkIcon, Code } from '@phosphor-icons/react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { PageSkeleton } from '@/components/dashboard-v2/PageSkeleton'
interface Note {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  userId: string
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [editorContent, setEditorContent] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit')
  const router = useRouter()
  const supabase = createClient()

  const loadNotes = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from('Note')
      .select('*')
      .eq('userId', uid)
      .order('updatedAt', { ascending: false })

    if (error) {
      console.error('Error loading notes:', error)
      return
    }
    setNotes(data || [])
  }, [supabase])

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }
      setUserId(session.user.id)
      await loadNotes(session.user.id)
      setLoading(false)
    }
    init()
  }, [supabase, router, loadNotes])

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes
    return notes.filter(n => 
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [notes, searchQuery])

  const selectedNote = useMemo(() => {
    return notes.find(n => n.id === selectedNoteId) || null
  }, [notes, selectedNoteId])



  const getNoteTitle = (content: string) => {
    const firstLine = content.split('\n')[0].trim()
    return firstLine.length > 0 ? firstLine.substring(0, 50) : 'Untitled'
  }

  const getNotePreview = (content: string) => {
    const lines = content.split('\n').filter(l => l.trim())
    const preview = lines.slice(1).join(' ').trim()
    return preview.length > 80 ? preview.substring(0, 80) + '...' : preview || 'No additional text'
  }

  const handleCreateNote = async () => {
    if (!userId) return
    const { data, error } = await supabase
      .from('Note')
      .insert({ 
        userId, 
        content: '',
        updatedAt: new Date().toISOString() 
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating note:', error)
      return
    }
    if (data) {
      setNotes(prev => [data, ...prev])
      setSelectedNoteId(data.id)
      setEditorContent('')
    }
  }

  const handleSaveNote = async () => {
    if (!selectedNoteId) return
    setSaving(true)
    await supabase
      .from('Note')
      .update({ content: editorContent, updatedAt: new Date().toISOString() })
      .eq('id', selectedNoteId)

    setNotes(prev =>
      prev.map(n =>
        n.id === selectedNoteId
          ? { ...n, content: editorContent, updatedAt: new Date().toISOString() }
          : n
      )
    )
    setSaving(false)
  }

  const handleDeleteNote = async () => {
    if (!selectedNoteId) return
    await supabase.from('Note').delete().eq('id', selectedNoteId)
    setNotes(prev => prev.filter(n => n.id !== selectedNoteId))
    setSelectedNoteId(null)
    setEditorContent('')
    setConfirmDelete(false)
  }

  const applyFormatting = (format: string) => {
    const textarea = document.getElementById('notes-editor-textarea') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = editorContent.substring(start, end)

    let replacement = ''
    let cursorOffset = 0

    switch (format) {
      case 'bold':
        replacement = `**${selected || 'bold text'}**`
        cursorOffset = selected ? 0 : -2
        break
      case 'italic':
        replacement = `*${selected || 'italic text'}*`
        cursorOffset = selected ? 0 : -1
        break
      case 'underline':
        replacement = `__${selected || 'underlined text'}__`
        cursorOffset = selected ? 0 : -2
        break
      case 'strikethrough':
        replacement = `~~${selected || 'struck text'}~~`
        cursorOffset = selected ? 0 : -2
        break
      case 'unordered-list':
        replacement = `\n- ${selected || 'List item'}`
        break
      case 'ordered-list':
        replacement = `\n1. ${selected || 'List item'}`
        break
      case 'link':
        replacement = `[${selected || 'link text'}](url)`
        break
      case 'code':
        replacement = selected.includes('\n') 
          ? `\`\`\`\n${selected || 'code'}\n\`\`\``
          : `\`${selected || 'code'}\``
        break
    }

    const newContent = editorContent.substring(0, start) + replacement + editorContent.substring(end)
    setEditorContent(newContent)
    
    setTimeout(() => {
      textarea.focus()
      const newPos = start + replacement.length + cursorOffset
      textarea.setSelectionRange(newPos, newPos)
    }, 0)
  }

  if (loading) {
    return <PageSkeleton />
  }

  return (
    <>
      <div className={styles.pageHeaderContainerFlex}>
        <div>
          <h2 className={styles.pageTitle}>Notes</h2>
          <p className={styles.pageSubtitle}>Write, organize, and find your notes.</p>
        </div>
      </div>

      <div className={styles.notesPageLayout}>
        {/* Left Panel — Note List */}
        <div className={styles.notesListPanel}>
          <div className={styles.notesListHeader}>
            <div className={styles.notesListHeaderTop}>
              <span className={styles.notesListCount}>
                My Notes <span className={styles.notesCountBadge}>{notes.length}</span>
              </span>
              <button className={styles.notesNewBtn} onClick={handleCreateNote}>
                <Plus size={14} /> New Note
              </button>
            </div>
            <div className={styles.notesSearchWrapper}>
              <Search size={14} className={styles.notesSearchIcon} />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.notesSearchInput}
              />
            </div>
          </div>

          <div className={styles.notesListScroll}>
            <AnimatePresence>
              {filteredNotes.length === 0 ? (
                <div className={styles.notesEmptyState}>
                  {searchQuery ? 'No matching notes' : 'No notes yet. Create one!'}
                </div>
              ) : (
                filteredNotes.map(note => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className={`${styles.noteListCard} ${selectedNoteId === note.id ? styles.noteListCardActive : ''}`}
                    onClick={() => {
                      setSelectedNoteId(note.id)
                      setEditorContent(note.content)
                    }}
                  >
                    <div className={styles.noteListTitle}>{getNoteTitle(note.content)}</div>
                    <div className={styles.noteListPreview}>{getNotePreview(note.content)}</div>
                    <div className={styles.noteListTimestamp}>
                      {formatDistanceToNow(parseISO(note.updatedAt), { addSuffix: true })}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Panel — Editor */}
        <div className={styles.notesEditorPanel}>
          {selectedNote ? (
            <>
              <div className={styles.notesEditorHeader}>
                <div>
                  <h3 className={styles.notesEditorTitle}>{getNoteTitle(selectedNote.content)}</h3>
                  <div className={styles.notesEditorMeta}>
                    Created: {new Date(selectedNote.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {' · '}
                    Last edited: {formatDistanceToNow(parseISO(selectedNote.updatedAt), { addSuffix: true })}
                  </div>
                </div>
              </div>

              {/* Formatting Toolbar */}
              <div className={styles.notesToolbar}>
                <div style={{ display: 'flex', gap: '0.25rem', flex: 1 }}>
                  <button className={styles.notesToolbarBtn} onClick={() => applyFormatting('bold')} title="Bold">
                    <Bold size={16} />
                  </button>
                  <button className={styles.notesToolbarBtn} onClick={() => applyFormatting('italic')} title="Italic">
                    <Italic size={16} />
                  </button>
                  <button className={styles.notesToolbarBtn} onClick={() => applyFormatting('underline')} title="Underline">
                    <Underline size={16} />
                  </button>
                  <button className={styles.notesToolbarBtn} onClick={() => applyFormatting('strikethrough')} title="Strikethrough">
                    <Strikethrough size={16} />
                  </button>
                  <div className={styles.notesToolbarDivider} />
                  <button className={styles.notesToolbarBtn} onClick={() => applyFormatting('unordered-list')} title="Bullet List">
                    <List size={16} />
                  </button>
                  <button className={styles.notesToolbarBtn} onClick={() => applyFormatting('ordered-list')} title="Numbered List">
                    <ListOrdered size={16} />
                  </button>
                  <div className={styles.notesToolbarDivider} />
                  <button className={styles.notesToolbarBtn} onClick={() => applyFormatting('link')} title="Link">
                    <LinkIcon size={16} />
                  </button>
                  <button className={styles.notesToolbarBtn} onClick={() => applyFormatting('code')} title="Code">
                    <Code size={16} />
                  </button>
                </div>
                
                {/* View Mode Toggle */}
                <div style={{ display: 'flex', background: 'var(--color-slate-200)', borderRadius: '0.375rem', padding: '0.125rem' }} className="notesViewToggle">
                  <button 
                    style={{ 
                      padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, border: 'none', borderRadius: '0.25rem',
                      background: viewMode === 'edit' ? 'var(--color-white)' : 'transparent',
                      color: viewMode === 'edit' ? 'var(--color-slate-900)' : 'var(--color-slate-600)',
                      boxShadow: viewMode === 'edit' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                      cursor: 'pointer', transition: 'all 0.15s'
                    }}
                    onClick={() => setViewMode('edit')}
                  >
                    Edit
                  </button>
                  <button 
                    style={{ 
                      padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, border: 'none', borderRadius: '0.25rem',
                      background: viewMode === 'preview' ? 'var(--color-white)' : 'transparent',
                      color: viewMode === 'preview' ? 'var(--color-slate-900)' : 'var(--color-slate-600)',
                      boxShadow: viewMode === 'preview' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                      cursor: 'pointer', transition: 'all 0.15s'
                    }}
                    onClick={() => setViewMode('preview')}
                  >
                    Preview
                  </button>
                </div>
              </div>

              {/* Editor Area */}
              {viewMode === 'edit' ? (
                <textarea
                  id="notes-editor-textarea"
                  className={styles.notesTextarea}
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                  placeholder="Start writing..."
                />
              ) : (
                <div className={styles.markdownPreview}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {editorContent || '*No content*'}
                  </ReactMarkdown>
                </div>
              )}

              {/* Bottom Actions */}
              <div className={styles.notesEditorActions}>
                <button 
                  className={styles.notesSaveBtn} 
                  onClick={handleSaveNote}
                  disabled={saving}
                >
                  <Save size={16} /> {saving ? 'Saving...' : 'Save'}
                </button>
                <button 
                  className={styles.notesDeleteBtn} 
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>

              {/* Delete Confirmation */}
              {confirmDelete && (
                <div className={styles.notesConfirmOverlay}>
                  <div className={styles.notesConfirmDialog}>
                    <h4 className={styles.notesConfirmTitle}>Delete Note</h4>
                    <p className={styles.notesConfirmText}>
                      Are you sure you want to delete this note? This cannot be undone.
                    </p>
                    <div className={styles.notesConfirmActions}>
                      <button className={styles.notesConfirmCancel} onClick={() => setConfirmDelete(false)}>
                        Cancel
                      </button>
                      <button className={styles.notesConfirmDelete} onClick={handleDeleteNote}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className={styles.notesEditorEmpty}>
              <div className={styles.notesEmptyIcon}>📝</div>
              <h3>Select a note or create a new one</h3>
              <p>Your notes will appear here for editing.</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  )
}
