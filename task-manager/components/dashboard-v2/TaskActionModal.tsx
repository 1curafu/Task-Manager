'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabaseClient'
import styles from './TaskActionModal.module.css'
import { X, Calendar, Tag, Flag, TextT as Type, User, Users, Plus, CheckCircle, CaretDown } from '@phosphor-icons/react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import ConfirmModal from './ConfirmModal'
import { LabelSelector, Label } from './LabelSelector'
import { Task as BaseTask, TaskPriority } from '@/types/task'

interface TaskLabelJoin {
  label?: Label
  Label?: Label
}

// Extend canonical Task with the label join shape and make server-only fields optional
// so callers that fetch partial task shapes still satisfy this type.
interface Task extends Omit<BaseTask, 'userId' | 'lastUpdated' | 'createdAt'> {
  userId?: string | null
  lastUpdated?: string | null
  createdAt?: string | null
  labels?: (TaskLabelJoin | Label)[]
}

interface TaskActionModalProps {
  task: Task | null
  templateTask?: Partial<Task> & { id: string } | null
  userId: string
  onClose: () => void
  onSave: () => void
  viewMode?: boolean
}

function getInitials(name: string | null | undefined) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export function TaskActionModal({ task, templateTask, userId, onClose, onSave }: TaskActionModalProps) {
  const sourceTask = task || templateTask
  const [formData, setFormData] = useState({
    name: sourceTask?.name || '',
    dueDate: sourceTask?.dueDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    category: sourceTask?.category || '',
    notes: sourceTask?.notes || '',
    links: sourceTask?.links || '',
    teamId: sourceTask?.teamId || '',
    assignedToId: sourceTask?.assignedToId || '',
    priority: (sourceTask?.priority || 'medium') as TaskPriority,
    recurrence: sourceTask?.recurrence || '',
    selectedLabels: [] as Label[]
  })
  
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const [teamMembers, setTeamMembers] = useState<{ id: string, userId: string | null, name: string | null, avatar: string | null }[]>([])
  const [teamsLoaded, setTeamsLoaded] = useState(false)
  const [teams, setTeams] = useState<{ id: string, name: string }[]>([])
  
  const [comments, setComments] = useState<{ id: string, content: string, createdAt: string, userId: string, user?: { name: string | null, avatar: string | null } }[]>([])
  const [newComment, setNewComment] = useState('')
  const [, setCommentsLoading] = useState(false)
  
  const [subtasks, setSubtasks] = useState<{ id: string, content: string, completed: boolean, orderIndex: number }[]>([])
  const [currentUserProfile, setCurrentUserProfile] = useState<{ name: string | null, avatar: string | null } | null>(null)
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [formData.notes])

  useEffect(() => {
    const fetchLabels = async () => {
      const activeTask = task || templateTask
      if (activeTask?.id) {
        if (activeTask.labels && Array.isArray(activeTask.labels)) {
           const mapped = activeTask.labels.map((l) => {
               if ('color' in l) return l as Label
               return (l as TaskLabelJoin).label || (l as TaskLabelJoin).Label
           })
           setFormData(prev => ({...prev, selectedLabels: mapped.filter(Boolean) as Label[]}))
           return
        }

        const { data, error } = await supabase
          .from('TaskLabel')
          .select('labelId, Label(*)')
          .eq('taskId', activeTask.id)
        
        if (!error && data) {
           const mappedLabels = data.map((item) => item.Label)
           setFormData(prev => ({...prev, selectedLabels: mappedLabels.filter(Boolean) as unknown as Label[]}))
        }
      }
    }
    fetchLabels()
  }, [task, templateTask, supabase])

  useEffect(() => {
    const fetchTeams = async () => {
      const { data: ownedTeams } = await supabase
        .from('Team')
        .select('id, name')
        .eq('ownerId', userId)

      const { data: memberTeams } = await supabase.rpc('get_user_member_teams', { user_id_param: userId })

      const allTeams = [
        ...(ownedTeams || []),
        ...(memberTeams || []).filter((mt: { id: string }) => !ownedTeams?.find(ot => ot.id === mt.id))
      ]

      setTeams(allTeams)
      setTeamsLoaded(true)
    }
    void fetchTeams()
  }, [userId, supabase])

  useEffect(() => {
     const fetchMembers = async () => {
         if (!formData.teamId) {
             setTeamMembers([{ id: 'me', userId: userId, name: currentUserProfile?.name || 'Myself', avatar: currentUserProfile?.avatar || null }])
             if (formData.assignedToId && formData.assignedToId !== userId) {
                 setFormData(prev => ({ ...prev, assignedToId: '' }))
             }
             return
         }
         try {
             const { data: membersData } = await supabase.rpc('get_team_members', { team_id_param: formData.teamId, user_id_param: userId })
             
             if (membersData) {
                 const memberIds = membersData.map((m: { userId: string | null }) => m.userId).filter(Boolean) as string[]
                 let profiles: { userId: string, name: string | null, avatar: string | null }[] = []
                 if (memberIds.length > 0) {
                     const { data } = await supabase.from('Profile').select('userId, name, avatar').in('userId', memberIds)
                     profiles = data || []
                 }
                 const enriched = membersData.map((m: { id: string, userId: string | null, userEmail: string }) => {
                     const prof = profiles.find(p => p.userId === m.userId)
                     return {
                         id: m.id,
                         userId: m.userId,
                         name: prof?.name || m.userEmail,
                         avatar: prof?.avatar
                     }
                 })
                 setTeamMembers(enriched)
             }
         } catch (err) {
             console.error('Failed to load members', err)
         }
     }
     void fetchMembers()
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.teamId, userId, supabase])

  useEffect(() => {
     const activeTask = task || templateTask
     if (!activeTask?.id) return
     const fetchComments = async () => {
         const { data } = await supabase.from('TaskComment').select('*').eq('taskId', activeTask.id).order('createdAt', { ascending: true })
         if (data && data.length > 0) {
             const userIds = [...new Set(data.map(c => c.userId))]
             const { data: profiles } = await supabase.from('Profile').select('userId, name, avatar').in('userId', userIds)
             const enriched = data.map(c => ({
                 ...c,
                 user: profiles?.find(p => p.userId === c.userId) || { name: 'Unknown User', avatar: null }
             }))
             // Only load comments if editing a task, templates shouldn't carry comments over.
             if (task) setComments(enriched)
         }
     }
     const fetchSubtasks = async () => {
         const { data } = await supabase.from('Subtask').select('*').eq('taskId', activeTask.id).order('orderIndex', { ascending: true })
         if (data) {
             if (templateTask) {
                // If it's a template, we want to treat them as new subtasks
                setSubtasks(data.map((s, idx) => ({ ...s, id: `temp-${Date.now()}-${idx}`, completed: false })))
             } else {
                setSubtasks(data)
             }
         }
     }
     
     void fetchComments()
     void fetchSubtasks()

     if (templateTask) return // no realtime comments for templates

     const channel = supabase
         .channel(`comments-${task?.id}`)
         .on('postgres_changes', {
             event: 'INSERT',
             schema: 'public',
             table: 'TaskComment',
             filter: `taskId=eq.${task?.id}`
         }, async (payload) => {
             const newComment = payload.new as { id: string, taskId: string, userId: string, content: string, createdAt: string };
             const { data: profile } = await supabase.from('Profile').select('userId, name, avatar').eq('userId', newComment.userId).single();
             const enriched = {
                 ...newComment,
                 user: profile || { name: 'Unknown User', avatar: null }
             };
             setComments(prev => {
                 if (prev.some(c => c.id === enriched.id)) return prev;
                 return [...prev, enriched];
             });
         })
         .subscribe()

     return () => {
         void supabase.removeChannel(channel)
     }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id, templateTask?.id, supabase])

  useEffect(() => {
    const client = createClient()
    const fetchCurrentUser = async () => {
      const { data } = await client.from('Profile').select('name, avatar').eq('userId', userId).single()
      if (data) setCurrentUserProfile(data)
    }
    void fetchCurrentUser()
  }, [userId])

  const handlePostComment = async () => {
      if (!newComment.trim()) return
      
      const { data: profile } = await supabase.from('Profile').select('name, avatar').eq('userId', userId).single()
      const commentData = {
          id: `temp-${Date.now()}`,
          userId: userId,
          content: newComment.trim(),
          createdAt: new Date().toISOString(),
          user: profile || { name: 'Me', avatar: null }
      }

      if (task?.id) {
          setCommentsLoading(true)
          const { data } = await supabase.from('TaskComment').insert({
              taskId: task.id,
              userId: userId,
              content: newComment.trim()
          }).select().single()
          
          if (data) {
              setComments(prev => [...prev, { ...data, user: profile || { name: 'Me', avatar: null } }])
              setNewComment('')
          }
          setCommentsLoading(false)
      } else {
          setComments(prev => [...prev, commentData])
          setNewComment('')
      }
  }

  const handleSubmit = async (e: React.FormEvent, isTemplateSave = false) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.name.trim()) {
          alert('Task name is required')
          setLoading(false)
          return
      }

      const now = new Date().toISOString()
      
      let calculatedNextNode = null
      if (formData.recurrence) {
         const currentDue = new Date(formData.dueDate)
         const nextDue = new Date(currentDue)
         if (formData.recurrence === 'daily') nextDue.setDate(currentDue.getDate() + 1)
         else if (formData.recurrence === 'weekly') nextDue.setDate(currentDue.getDate() + 7)
         else if (formData.recurrence === 'monthly') nextDue.setMonth(currentDue.getMonth() + 1)
         calculatedNextNode = nextDue.toISOString()
      }

      const taskData = {
        name: formData.name,
        dueDate: new Date(formData.dueDate).toISOString(),
        category: formData.category,
        notes: formData.notes,
        links: formData.links,
        userId: userId,
        lastUpdated: now,
        priority: formData.priority,
        recurrence: formData.recurrence || null,
        nextRecurrenceDate: calculatedNextNode,
        teamId: formData.teamId || null,
        assignedToId: formData.assignedToId || null,
        createdById: task?.createdById || userId,
        isTemplate: isTemplateSave
      }

      let taskId = ''

      if (task) {
        const { error } = await supabase
          .from('Task')
          .update(taskData)
          .eq('id', task.id)
        if (error) throw error
        taskId = task.id
      } else {
        const { data, error } = await supabase
          .from('Task')
          .insert({
            ...taskData,
            createdAt: now,
          })
          .select('id')
          .single()
        if (error) throw error
        if (data) {
           taskId = data.id
           // Ensure the record is propagated before inserting relations
           await new Promise(r => setTimeout(r, 100))
        }
      }

      // Sync labels
      if (taskId) {
        // Delete old labels first
        await supabase.from('TaskLabel').delete().eq('taskId', taskId)
        
        // Insert new selected labels
        if (formData.selectedLabels.length > 0) {
          const newMappings = formData.selectedLabels.map(label => ({
            taskId: taskId,
            labelId: label.id
          }))
          await supabase.from('TaskLabel').insert(newMappings)
        }
        
        // Insert pending subtasks for new tasks
        if (!task && subtasks.length > 0) {
            const newSubtasks = subtasks.map(s => ({
                taskId: taskId,
                content: s.content,
                completed: s.completed,
                orderIndex: s.orderIndex
            }))
            const { error: subtaskError } = await supabase.from('Subtask').insert(newSubtasks)
            if (subtaskError) console.error('Error inserting subtasks:', subtaskError)
        }
        
        // Insert pending comments for new tasks
        if (!task && comments.length > 0) {
            const newComments = comments.map(c => ({
                taskId: taskId,
                userId: c.userId,
                content: c.content
            }))
            const { error: commentError } = await supabase.from('TaskComment').insert(newComments)
            if (commentError) console.error('Error inserting comments:', commentError)
        }
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

  const STATUS_OPTIONS = [
    { value: 'todo',        label: 'To-do',       color: '#c7c7cc' },
    { value: 'in_progress', label: 'On Progress',  color: 'var(--primary-color, #6366f1)' },
    { value: 'in_review',   label: 'In Review',    color: 'var(--status-in-review, #6e40c9)' },
    { value: 'done',        label: 'Completed',    color: 'var(--success-color, #30d158)' },
  ]
  const selectedStatus = STATUS_OPTIONS.find(s => s.value === (formData as { status?: string }).status) || STATUS_OPTIONS[1]

  const PRIORITY_OPTIONS = [
    { value: 'high',   label: 'Urgent',  cls: styles.priorityBadgeHigh },
    { value: 'medium', label: 'Medium',  cls: styles.priorityBadgeMedium },
    { value: 'low',    label: 'Low',     cls: styles.priorityBadgeLow },
  ]

  const assigneeDisplayName = (() => {
    if (!formData.assignedToId) return null
    const member = teamMembers.find(m => m.userId === formData.assignedToId)
    return member?.name || 'Assigned'
  })()

  const assigneeChipColor = '#e8f5e9'

  if (!teamsLoaded && task?.teamId) {
      return (
        <motion.div className={styles.overlay}>
           <div className={styles.modal} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
              Loading...
           </div>
        </motion.div>
      )
  }

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        className={styles.modal}
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        transition={{ duration: 0.18 }}
      >
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.modalTitle}>{task ? 'Edit Task' : 'Create Task'}</span>
          <button className={styles.closeBtn} onClick={onClose}><X size={16} /></button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Task name */}
          <div className={styles.taskNameRow}>
            <input
              className={styles.taskNameInput}
              placeholder="Task name…"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              autoFocus
            />
          </div>

          {/* Status */}
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}><CheckCircle size={14} /> Status</span>
            <div className={styles.fieldControl} style={{ position: 'relative' }}>
              <button
                type="button"
                className={styles.statusBtn}
                onClick={() => {
                  setStatusDropdownOpen(v => !v);
                  setAssigneeDropdownOpen(false);
                }}
              >
                <span className={styles.statusDot} style={{ color: selectedStatus.color }} />
                {selectedStatus.label}
                <CaretDown size={12} style={{ marginLeft: 'auto' }} />
              </button>
              {statusDropdownOpen && (
                <div className={styles.dropdownMenu} style={{ top: '100%', left: 0 }}>
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      className={`${styles.dropdownItem} ${selectedStatus.value === opt.value ? styles.active : ''}`}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, status: opt.value } as typeof prev))
                        setStatusDropdownOpen(false)
                      }}
                    >
                      <span style={{ width: 10, height: 10, borderRadius: '50%', border: `2px dashed ${opt.color}`, display: 'inline-block' }} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Due date */}
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}><Calendar size={14} /> Due date</span>
            <div className={styles.fieldControl}>
              <input
                type="date"
                className={styles.dateInput}
                value={formData.dueDate}
                onChange={e => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
          </div>

          {/* Team */}
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}><Users size={14} /> Team</span>
            <div className={styles.fieldControl}>
              <select
                className={styles.statusBtn}
                value={formData.teamId || ''}
                onChange={e => setFormData(prev => ({ ...prev, teamId: e.target.value, assignedToId: '' }))}
                style={{ appearance: 'none' }}
              >
                <option value="">Personal</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          {/* Assignee */}
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}><User size={14} /> Assignee</span>
            <div className={styles.fieldControl} style={{ position: 'relative' }}>
              <div className={styles.chipRow}>
                {assigneeDisplayName && (
                  <span
                    className={styles.assigneeChip}
                    style={{ background: assigneeChipColor, color: '#2d6a4f' }}
                  >
                    {assigneeDisplayName}
                    <button
                      type="button"
                      className={styles.chipRemove}
                      onClick={() => setFormData(prev => ({ ...prev, assignedToId: '' }))}
                    >×</button>
                  </span>
                )}
                {teamsLoaded && teamMembers.length > 0 && (
                  <button
                    type="button"
                    className={styles.addChipBtn}
                    onClick={() => {
                      setAssigneeDropdownOpen(v => !v);
                      setStatusDropdownOpen(false);
                    }}
                  >
                    <Plus size={12} />
                  </button>
                )}
              </div>
              {assigneeDropdownOpen && (
                <div className={styles.dropdownMenu} style={{ top: '100%', left: 0 }}>
                  {teamMembers.map(m => (
                    <button
                      key={m.id}
                      className={`${styles.dropdownItem} ${formData.assignedToId === m.userId ? styles.active : ''}`}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, assignedToId: m.userId || '' }))
                        setAssigneeDropdownOpen(false)
                      }}
                    >
                      {m.name || m.userId?.slice(0, 8)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tags / Labels */}
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}><Tag size={14} /> Tags</span>
            <div className={styles.fieldControl}>
              <LabelSelector
                userId={userId}
                selectedLabels={formData.selectedLabels}
                onChange={labels => setFormData(prev => ({ ...prev, selectedLabels: labels }))}
              />
            </div>
          </div>

          {/* Priority */}
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}><Flag size={14} /> Priority</span>
            <div className={styles.fieldControl}>
              <div className={styles.priorityRow}>
                {PRIORITY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.priorityBadge} ${opt.cls} ${formData.priority === opt.value ? styles.selected : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, priority: opt.value as TaskPriority }))}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className={styles.fieldRow} style={{ alignItems: 'flex-start', paddingTop: '0.625rem', paddingBottom: '0.625rem' }}>
            <span className={styles.fieldLabel} style={{ paddingTop: '0.25rem' }}><Type size={14} /> Description</span>
            <div className={styles.fieldControl} style={{ width: '100%' }}>
              <textarea
                ref={textareaRef}
                className={styles.descTextarea}
                placeholder="Add a description…"
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          {/* Subtasks */}
          <div className={styles.fieldRow} style={{ alignItems: 'flex-start', paddingTop: '0.625rem', paddingBottom: '0.625rem' }}>
            <span className={styles.fieldLabel} style={{ paddingTop: '0.25rem' }}><CheckCircle size={14} /> Subtasks</span>
            <div className={styles.fieldControl} style={{ width: '100%', flexDirection: 'column', alignItems: 'stretch' }}>
              {subtasks.map((s) => (
                 <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                   <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--border)', flexShrink: 0 }} />
                   <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{s.content}</span>
                   <button type="button" style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 0 }} onClick={() => setSubtasks(prev => prev.filter(st => st.id !== s.id))}>
                     <X size={14} />
                   </button>
                 </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: subtasks.length > 0 ? '0.25rem' : '0' }}>
                <input
                  type="text"
                  placeholder="Add a subtask... (press Enter)"
                  style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.8125rem', background: 'var(--surface)', outline: 'none', color: 'var(--text-primary)' }}
                  onKeyDown={e => {
                     if (e.key === 'Enter') {
                         e.preventDefault();
                         const val = (e.target as HTMLInputElement).value;
                         if (val.trim()) {
                             setSubtasks(prev => [...prev, { id: `temp-${Date.now()}`, content: val.trim(), completed: false, orderIndex: prev.length }]);
                             (e.target as HTMLInputElement).value = '';
                         }
                     }
                  }}
                />
              </div>
            </div>
          </div>

          <hr className={styles.divider} />

          {/* Comment */}
          <div className={styles.commentRow}>
            <div className={styles.commentAvatar}>
              {currentUserProfile?.avatar ? (
                <Image src={currentUserProfile.avatar} alt="avatar" width={32} height={32} style={{ borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                getInitials(currentUserProfile?.name)
              )}
            </div>
            <textarea
              className={styles.commentInput}
              placeholder="Add a comment…"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void handlePostComment()
              }}
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer} style={{ justifyContent: 'flex-end' }}>

          <div className={styles.footerActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button
              type="button"
              className={styles.saveBtn}
              disabled={loading}
              onClick={e => void handleSubmit(e as unknown as React.FormEvent)}
            >
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </motion.div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Task"
        message="Are you sure you want to delete this task?"
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={async () => {
          if (task) {
            await supabase.from('Task').delete().eq('id', task.id)
            onSave()
          }
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </motion.div>
  )
}
