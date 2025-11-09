'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabaseClient'
import './NotesPanel.css'

interface Note {
  id: string
  content: string
  createdAt: string
  updatedAt: string
}

export default function NotesPanel({ userId }: { userId: string }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const supabase = createClient()

  const loadNotes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('Note')
        .select('*')
        .eq('userId', userId)
        .order('updatedAt', { ascending: false })

      if (error) throw error
      setNotes(data || [])
    } catch (err) {
      console.error('Error loading notes:', err)
    } finally {
      setLoading(false)
    }
  }, [userId, supabase])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  if (loading) {
    return (
      <div className="notes-panel">
        <div className="notes-header">
          <h3 className="notes-title">Notes</h3>
        </div>
        <div className="notes-loading">Loading...</div>
      </div>
    )
  }

  const handleNoteClick = (noteId: string) => {
    setSelectedNoteId(noteId)
    setShowNotesModal(true)
  }

  return (
    <>
      <div className="notes-panel">
        <div className="notes-header">
          <h3 className="notes-title">Notes</h3>
          <button
            onClick={() => {
              setSelectedNoteId(null)
              setShowNotesModal(true)
            }}
            className="btn btn-small btn-primary"
          >
            + New
          </button>
        </div>
        
        <div className="notes-preview">
          {notes.length === 0 ? (
            <p className="notes-preview-text">No notes yet</p>
          ) : (
            <div className="notes-preview-list">
              {notes.slice(0, 3).map((note) => (
                <div
                  key={note.id}
                  className="note-preview-item"
                  onClick={() => handleNoteClick(note.id)}
                >
                  <div className="note-preview-content">
                    {note.content.substring(0, 60)}
                    {note.content.length > 60 && '...'}
                  </div>
                </div>
              ))}
              {notes.length > 3 && (
                <button
                  className="notes-view-all"
                  onClick={() => {
                    setSelectedNoteId(null)
                    setShowNotesModal(true)
                  }}
                >
                  View all {notes.length} notes →
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showNotesModal && (
        <NotesModal
          userId={userId}
          notes={notes}
          initialNoteId={selectedNoteId}
          onClose={() => {
            setShowNotesModal(false)
            setSelectedNoteId(null)
          }}
          onUpdate={loadNotes}
        />
      )}
    </>
  )
}

function NotesModal({ 
  userId, 
  notes, 
  initialNoteId,
  onClose, 
  onUpdate 
}: { 
  userId: string
  notes: Note[]
  initialNoteId: string | null
  onClose: () => void
  onUpdate: () => void
}) {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const supabase = createClient()

  // Auto-select note if initialNoteId is provided
  useEffect(() => {
    if (initialNoteId) {
      const note = notes.find(n => n.id === initialNoteId)
      if (note) {
        setSelectedNote(note)
        setContent(note.content)
        setIsEditing(true)
      }
    }
  }, [initialNoteId, notes])

  const handleNewNote = () => {
    setSelectedNote(null)
    setContent('')
    setError('')
    setIsEditing(true)
  }

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note)
    setContent(note.content)
    setError('')
    setIsEditing(true)
  }

  const handleSave = async () => {
    setError('')
    
    try {
      const { noteSchema } = await import('@/lib/validations')
      const validatedData = noteSchema.parse({ content })

      if (selectedNote) {
        const { error } = await supabase
          .from('Note')
          .update({ 
            content: validatedData.content, 
            updatedAt: new Date().toISOString() 
          })
          .eq('id', selectedNote.id)

        if (error) {
          console.error('Update error details:', error)
          throw error
        }
      } else {
        const now = new Date().toISOString()
        const { data, error } = await supabase
          .from('Note')
          .insert({ 
            content: validatedData.content, 
            userId,
            createdAt: now,
            updatedAt: now
          })
          .select()

        if (error) {
          console.error('Insert error details:', error)
          throw new Error(`Database error: ${error.message} (Code: ${error.code})`)
        }
        
        console.log('Note created successfully:', data)
      }

      await onUpdate()
      setIsEditing(false)
      setSelectedNote(null)
      setContent('')
    } catch (err) {
      if (err && typeof err === 'object' && 'issues' in err) {
        const zodErrors = err as { issues: Array<{ message: string }> }
        setError(zodErrors.issues[0]?.message || 'Validation error')
        return
      }
      
      console.error('Error saving note:', err)
      setError('Failed to save note')
    }
  }

  const handleDelete = async () => {
    if (!selectedNote) return

    try {
      const { error } = await supabase
        .from('Note')
        .delete()
        .eq('id', selectedNote.id)

      if (error) throw error

      await onUpdate()
      setSelectedNote(null)
      setContent('')
      setIsEditing(false)
      setShowDeleteConfirm(false)
    } catch (err) {
      console.error('Error deleting note:', err)
      setError('Failed to delete note')
      setShowDeleteConfirm(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (typeof window === 'undefined') return dateString
    const date = new Date(dateString)
    return date.toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Separate pinned and regular notes (for future pinning feature)
  const pinnedNotes = notes.filter(() => false) // TODO: Add pinned field
  const regularNotes = notes

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="notes-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="notes-modal-header">
          <h2 className="modal-title">My Notes</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Split View Body */}
        <div className="notes-modal-body">
          {/* Left Sidebar - Notes List */}
          <div className="notes-sidebar">
            <div className="notes-sidebar-header">
              <button
                type="button"
                onClick={handleNewNote}
                className="btn btn-primary btn-full-width"
              >
                + New Note
              </button>
            </div>

            <div className="notes-list-container">
              {notes.length === 0 ? (
                <p className="notes-empty-text">No notes yet</p>
              ) : (
                <>
                  {pinnedNotes.length > 0 && (
                    <div className="notes-list-section">
                      <div className="notes-list-section-title">Pinned</div>
                      <div className="notes-list-scroll">
                        {pinnedNotes.map((note) => (
                          <div
                            key={note.id}
                            className={`note-list-card ${selectedNote?.id === note.id ? 'active' : ''}`}
                            onClick={() => handleSelectNote(note)}
                          >
                            <div className="note-list-preview">
                              {note.content.substring(0, 60)}
                              {note.content.length > 60 && '...'}
                            </div>
                            <div className="note-list-date">
                              {formatDate(note.updatedAt)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="notes-list-section">
                    {pinnedNotes.length > 0 && (
                      <div className="notes-list-section-title">All Notes</div>
                    )}
                    <div className="notes-list-scroll">
                      {regularNotes.map((note) => (
                        <div
                          key={note.id}
                          className={`note-list-card ${selectedNote?.id === note.id ? 'active' : ''}`}
                          onClick={() => handleSelectNote(note)}
                        >
                          <div className="note-list-preview">
                            {note.content.substring(0, 60)}
                            {note.content.length > 60 && '...'}
                          </div>
                          <div className="note-list-date">
                            {formatDate(note.updatedAt)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Content Area - Note Editor */}
          <div className="notes-content">
            {!selectedNote && !isEditing ? (
              <div className="notes-empty-editor">
                <p>Select a note or create a new one</p>
              </div>
            ) : (
              <>
                <div className="notes-editor">
                  <textarea
                    className="notes-textarea-input"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Start writing your note..."
                    autoFocus
                  />
                  {error && <span className="field-error">{error}</span>}
                </div>

                <div className="notes-button-group">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false)
                      setContent(selectedNote?.content || '')
                      if (!selectedNote) {
                        setContent('')
                      }
                      setError('')
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  {selectedNote && (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="btn btn-danger"
                    >
                      Delete
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSave}
                    className="btn btn-primary"
                  >
                    Save
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
              <h3 className="confirm-title">Delete Note</h3>
              <p className="confirm-message">Are you sure you want to delete this note? This action cannot be undone.</p>
              <div className="confirm-buttons">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="btn btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
