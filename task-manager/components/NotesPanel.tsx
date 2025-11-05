'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import './NotesPanel.css'

export default function NotesPanel({ userId }: { userId: string }) {
  const [content, setContent] = useState('')
  const [noteId, setNoteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const loadNote = async () => {
      try {
        const { data } = await supabase
          .from('Note')
          .select('*')
          .eq('userId', userId)
          .single()

        if (data) {
          setContent(data.content)
          setNoteId(data.id)
        }
      } catch {
        console.log('No existing note found')
      } finally {
        setLoading(false)
      }
    }

    loadNote()
  }, [userId, supabase])

  const saveNote = async () => {
    setError('')
    
    try {
      const { noteSchema } = await import('@/lib/validations')
      const validatedData = noteSchema.parse({ content })

      if (noteId) {
        await supabase
          .from('Note')
          .update({ content: validatedData.content, updatedAt: new Date().toISOString() })
          .eq('id', noteId)
      } else {
        const { data } = await supabase
          .from('Note')
          .insert({ content: validatedData.content, userId })
          .select()
          .single()

        if (data) {
          setNoteId(data.id)
        }
      }
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

  const handleBlur = () => {
    if (content.trim()) {
      saveNote()
    }
  }

  if (loading) {
    return (
      <div className="notes-panel">
        <div className="card-header">
          <h3 className="card-title">Notes</h3>
        </div>
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div className="notes-panel">
      <div className="notes-header">
        <h3 className="notes-title">Notes</h3>
        <button
          onClick={saveNote}
          className="btn btn-small btn-secondary notes-save-btn"
        >
          Save
        </button>
      </div>
      <textarea
        className={`notes-textarea ${error ? 'notes-textarea-error' : ''}`}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={handleBlur}
        placeholder="Write your notes here..."
      />
      {error && <span className="notes-error-text">{error}</span>}
    </div>
  )
}
