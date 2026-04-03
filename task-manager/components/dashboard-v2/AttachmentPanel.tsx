'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Attachment } from '@/types/task'
import styles from './AttachmentPanel.module.css'
import { UploadSimple, Trash, DownloadSimple, File } from '@phosphor-icons/react'

interface AttachmentPanelProps {
  taskId: string
  currentUserId: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AttachmentPanel({ taskId, currentUserId }: AttachmentPanelProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchAttachments = useCallback(async () => {
    const res = await fetch(`/api/attachments?taskId=${taskId}`)
    if (res.ok) {
      const data = await res.json() as { attachments: Attachment[] }
      setAttachments(data.attachments)
    }
  }, [taskId])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchAttachments() }, [fetchAttachments])

  const uploadFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { setError('File exceeds 10MB'); return }
    setUploading(true)
    setError(null)
    const form = new FormData()
    form.append('file', file)
    form.append('taskId', taskId)
    const res = await fetch('/api/attachments/upload', { method: 'POST', body: form })
    if (!res.ok) { setError('Upload failed') } else { void fetchAttachments() }
    setUploading(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void uploadFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) void uploadFile(file)
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/attachments/${id}`, { method: 'DELETE' })
    if (res.ok) void fetchAttachments()
    else setError('Delete failed')
  }

  const handleDownload = async (attachment: Attachment) => {
    const res = await fetch(`/api/attachments/${attachment.id}/url`)
    if (!res.ok) { setError('Could not get download link'); return }
    const { url } = await res.json() as { url: string }
    const a = document.createElement('a')
    a.href = url
    a.download = attachment.fileName
    a.click()
  }

  return (
    <div className={styles.panel}>
      <div
        className={styles.dropZone}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadSimple size={20} />
        <span>{uploading ? 'Uploading…' : 'Drop a file or click to upload (max 10MB)'}</span>
        <input ref={fileInputRef} type="file" hidden onChange={handleFileChange} />
      </div>
      {error && <p className={styles.error}>{error}</p>}
      {attachments.length === 0 && !uploading && (
        <p className={styles.empty}>No attachments yet</p>
      )}
      <ul className={styles.list}>
        {attachments.map(a => (
          <li key={a.id} className={styles.item}>
            <File size={18} className={styles.fileIcon} />
            <div className={styles.itemInfo}>
              <span className={styles.fileName}>{a.fileName}</span>
              <span className={styles.fileMeta}>{formatBytes(a.fileSize)}</span>
            </div>
            <div className={styles.itemActions}>
              <button onClick={() => void handleDownload(a)} title="Download">
                <DownloadSimple size={16} />
              </button>
              {a.uploadedById === currentUserId && (
                <button onClick={() => void handleDelete(a.id)} title="Delete" className={styles.deleteBtn}>
                  <Trash size={16} />
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
