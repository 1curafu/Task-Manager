'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import {
  CheckCircle, EnvelopeSimple, SquaresFour,
  ListDashes, Kanban, CalendarBlank,
  ArrowRight, Spinner, CheckSquare,
} from '@phosphor-icons/react'
import styles from './OnboardingModal.module.css'

interface OnboardingModalProps {
  userProfile: { id: string; name: string; email: string }
  onComplete: () => void
}

const STEPS = [
  { num: 1, label: 'Task',  icon: CheckSquare },
  { num: 2, label: 'Team',  icon: EnvelopeSimple },
  { num: 3, label: 'View',  icon: SquaresFour },
]

const stepVariants = {
  enter:  { opacity: 0, y: 24 },
  center: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 320, damping: 28 } },
  exit:   { opacity: 0, y: -16, transition: { duration: 0.18 } },
}

export function OnboardingModal({ userProfile, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1)
  const [taskName, setTaskName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleNextStep1 = async () => {
    if (!taskName.trim()) return
    setLoading(true)
    try {
      await supabase.from('Task').insert({
        name: taskName.trim(),
        dueDate: new Date().toISOString(),
        userId: userProfile.id,
      })
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
    setStep(2)
  }

  const handleNextStep2 = async () => {
    if (inviteEmail.trim()) {
      setLoading(true)
      try {
        const { data: teams } = await supabase
          .from('Team')
          .select('id')
          .eq('ownerId', userProfile.id)
          .limit(1)

        let teamId = teams?.[0]?.id

        if (!teamId) {
          const { data: newTeam } = await supabase
            .from('Team')
            .insert({ name: `${userProfile.name || 'My'} Team`, ownerId: userProfile.id })
            .select('id')
            .single()
          if (newTeam) teamId = newTeam.id
        }

        if (teamId) {
          await supabase.from('TeamMember').insert({
            teamId,
            userEmail: inviteEmail.trim(),
            invitedBy: userProfile.id,
          })
        }
      } catch (e) {
        console.error(e)
      }
      setLoading(false)
    }
    setStep(3)
  }

  const handleFinish = async (viewPath: string) => {
    setLoading(true)

    // Primary: API route (Prisma upsert, bypasses RLS)
    let saved = false
    try {
      const res = await fetch('/api/user/update-onboarding', { method: 'POST' })
      saved = res.ok
      if (!res.ok) console.error('Onboarding API returned', res.status)
    } catch (e) {
      console.error('Onboarding API unreachable:', e)
    }

    // Fallback: direct Supabase update in case API failed for any reason
    if (!saved) {
      try {
        const { error } = await supabase
          .from('Profile')
          .update({ hasCompletedOnboarding: true })
          .eq('userId', userProfile.id)
        if (error) console.error('Onboarding fallback error:', error)
        else saved = true
      } catch (e) {
        console.error('Onboarding fallback failed:', e)
      }
    }

    setLoading(false)
    onComplete() // Always dismiss in current session regardless of save result
    router.push(viewPath)
  }

  return (
    <div className={styles.overlay}>
      {/* ── Top bar ── */}
      <div className={styles.topBar}>
        <div className={styles.logo}>
          <Image src="/favicon.svg" alt="Vela Works" width={26} height={26} />
          Vela Works
        </div>

        <div className={styles.stepIndicator}>
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const isActive = step === s.num
            const isDone   = step > s.num
            return (
              <React.Fragment key={s.num}>
                <div
                  className={[
                    styles.stepPill,
                    isActive ? styles.stepPillActive : '',
                    isDone   ? styles.stepPillDone   : '',
                  ].join(' ')}
                >
                  <span className={styles.stepPillNum}>
                    {isDone ? <CheckCircle weight="fill" size={14} /> : <Icon size={14} />}
                  </span>
                  <span>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={styles.stepConnector} />}
              </React.Fragment>
            )
          })}
        </div>

        <div className={styles.topBarSpacer} />
      </div>

      {/* ── Main content ── */}
      <div className={styles.content}>
        <AnimatePresence mode="wait">

          {step === 1 && (
            <motion.div
              key="step1"
              className={styles.stepCard}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <div className={styles.stepIconWrap} style={{ background: 'rgba(0, 113, 227, 0.1)', color: '#0071e3' }}>
                <CheckSquare size={36} weight="duotone" />
              </div>
              <h1 className={styles.stepTitle}>Create your first task</h1>
              <p className={styles.stepSubtitle}>
                What&apos;s something you need to get done today? Add your first task and see Vela in action.
              </p>
              <div className={styles.inputWrap}>
                <input
                  type="text"
                  autoFocus
                  className={styles.input}
                  placeholder="e.g., Review Q3 Marketing Plan"
                  value={taskName}
                  onChange={e => setTaskName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && taskName.trim()) void handleNextStep1() }}
                />
              </div>
              <button
                className={styles.btnPrimary}
                onClick={() => void handleNextStep1()}
                disabled={!taskName.trim() || loading}
              >
                {loading
                  ? <Spinner size={18} className={styles.spin} />
                  : <><span>Create Task</span><ArrowRight size={18} weight="bold" /></>
                }
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              className={styles.stepCard}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <div className={styles.stepIconWrap} style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                <EnvelopeSimple size={36} weight="duotone" />
              </div>
              <h1 className={styles.stepTitle}>Work is better together</h1>
              <p className={styles.stepSubtitle}>
                Invite a teammate to collaborate. You can always do this later from the Teams page.
              </p>
              <div className={styles.inputWrap}>
                <input
                  type="email"
                  autoFocus
                  className={styles.input}
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') void handleNextStep2() }}
                />
              </div>
              <button
                className={styles.btnPrimary}
                onClick={() => void handleNextStep2()}
                disabled={loading}
              >
                {loading
                  ? <Spinner size={18} className={styles.spin} />
                  : <><span>{inviteEmail.trim() ? 'Send Invite' : 'Skip for now'}</span><ArrowRight size={18} weight="bold" /></>
                }
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              className={styles.stepCard}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <div className={styles.stepIconWrap} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <SquaresFour size={36} weight="duotone" />
              </div>
              <h1 className={styles.stepTitle}>How do you prefer to work?</h1>
              <p className={styles.stepSubtitle}>
                Pick your default view. You can switch anytime from the sidebar.
              </p>
              <div className={styles.viewGrid}>
                <button className={styles.viewOption} onClick={() => void handleFinish('/dashboard/tasks')} disabled={loading}>
                  <div className={styles.viewOptionIcon}><ListDashes size={28} weight="duotone" /></div>
                  <span className={styles.viewOptionLabel}>List</span>
                  <span className={styles.viewOptionDesc}>Classic to-do style</span>
                </button>
                <button className={styles.viewOption} onClick={() => void handleFinish('/dashboard/kanban')} disabled={loading}>
                  <div className={styles.viewOptionIcon}><Kanban size={28} weight="duotone" /></div>
                  <span className={styles.viewOptionLabel}>Board</span>
                  <span className={styles.viewOptionDesc}>Drag-and-drop columns</span>
                </button>
                <button className={styles.viewOption} onClick={() => void handleFinish('/dashboard/calendar')} disabled={loading}>
                  <div className={styles.viewOptionIcon}><CalendarBlank size={28} weight="duotone" /></div>
                  <span className={styles.viewOptionLabel}>Calendar</span>
                  <span className={styles.viewOptionDesc}>Timeline view</span>
                </button>
              </div>
              {loading && <Spinner size={22} className={styles.spin} style={{ marginTop: '1rem' }} />}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Bottom progress bar ── */}
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${(step / 3) * 100}%` }} />
      </div>
    </div>
  )
}
