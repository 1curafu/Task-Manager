'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { useTheme } from 'next-themes'
import { ProfileForm } from '@/components/dashboard-v2/Settings/ProfileForm'
import { AccountSettings } from '@/components/dashboard-v2/Settings/AccountSettings'
import { Sun, Moon, Desktop as Monitor } from '@phosphor-icons/react'
import styles from '@/app/dashboard/dashboard.module.css'
import { motion } from 'framer-motion'
import { PageSkeleton } from '@/components/dashboard-v2/PageSkeleton'
import { toast } from 'sonner'

interface UserProfile {
  id: string
  userId: string
  name: string
  avatar?: string
}

function ToggleSwitch({ active, onToggle }: { active: boolean, onToggle: () => void }) {
  return (
    <button 
      className={`${styles.settingsToggle} ${active ? styles.settingsToggleActive : ''}`}
      onClick={onToggle}
    >
      <span className={styles.settingsToggleKnob} />
    </button>
  )
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [userId, setUserId] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifReminders, setNotifReminders] = useState(true)
  const [notifTeam, setNotifTeam] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/auth/login')
        return
      }

      const tempUserId = session.user.id
      setUserId(tempUserId)
      setEmail(session.user.email || '')

      const { data } = await supabase
        .from('Profile')
        .select('*')
        .eq('userId', tempUserId)
        .single()

      if (data) {
        setProfile(data)
      } else {
        setProfile({ id: '', userId: tempUserId, name: '' }) 
      }
      
      setLoading(false)

      const savedPrefs = localStorage.getItem('vela_notif_prefs')
      if (savedPrefs) {
        const prefs = JSON.parse(savedPrefs) as { email?: boolean; reminders?: boolean; team?: boolean }
        if (prefs.email !== undefined) setNotifEmail(prefs.email)
        if (prefs.reminders !== undefined) setNotifReminders(prefs.reminders)
        if (prefs.team !== undefined) setNotifTeam(prefs.team)
      }
    }

    init()
  }, [router, supabase])

  if (loading) {
    return <PageSkeleton />
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  }

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.pageHeaderContainer}>
        <h2 className={styles.pageTitle}>Settings</h2>
        <p className={styles.pageSubtitle}>Manage your account and preferences.</p>
      </div>

      <motion.div 
        className={styles.settingsSectionStack}
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        
        {/* Profile Section */}
        <motion.section variants={itemVariants}>
            <h3 className={styles.settingsSectionTitle}>Personal Information</h3>
            <ProfileForm initialProfile={profile} userId={userId} /> 
        </motion.section>

        {/* Appearance Section */}
        <motion.section variants={itemVariants}>
            <h3 className={styles.settingsSectionTitle}>Appearance</h3>
            <div className={styles.card}>
                <div className={styles.settingsSubTitle}>Theme</div>
                <div className={styles.settingsSubDesc}>
                    Choose how Vela looks on your device.
                </div>
                
                <div className={styles.settingsThemeGrid}>
                    <ThemeButton theme="light" icon={<Sun size={24} />} label="Light" />
                    <ThemeButton theme="dark" icon={<Moon size={24} />} label="Dark" />
                    <ThemeButton theme="system" icon={<Monitor size={24} />} label="System" />
                </div>
            </div>
        </motion.section>

        {/* Notifications Section */}
        <motion.section variants={itemVariants}>
            <h3 className={styles.settingsSectionTitle}>Notifications</h3>
            <div className={styles.card} style={{ padding: '1.5rem' }}>
                <div className={styles.settingsNotifRow}>
                  <div>
                    <div className={styles.settingsNotifLabel}>Email Notifications</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-slate-400)' }}>Receive updates via email</div>
                  </div>
                  <ToggleSwitch active={notifEmail} onToggle={() => { const v = !notifEmail; setNotifEmail(v); localStorage.setItem('vela_notif_prefs', JSON.stringify({ email: v, reminders: notifReminders, team: notifTeam })); toast.success('Preferences saved') }} />
                </div>
                <div className={styles.settingsNotifRow}>
                  <div>
                    <div className={styles.settingsNotifLabel}>Due Date Reminders</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-slate-400)' }}>Get notified before tasks are due</div>
                  </div>
                  <ToggleSwitch active={notifReminders} onToggle={() => { const v = !notifReminders; setNotifReminders(v); localStorage.setItem('vela_notif_prefs', JSON.stringify({ email: notifEmail, reminders: v, team: notifTeam })); toast.success('Preferences saved') }} />
                </div>
                <div className={styles.settingsNotifRow}>
                  <div>
                    <div className={styles.settingsNotifLabel}>Team Updates</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-slate-400)' }}>Notify when team members complete tasks</div>
                  </div>
                  <ToggleSwitch active={notifTeam} onToggle={() => { const v = !notifTeam; setNotifTeam(v); localStorage.setItem('vela_notif_prefs', JSON.stringify({ email: notifEmail, reminders: notifReminders, team: v })); toast.success('Preferences saved') }} />
                </div>
            </div>
        </motion.section>

         {/* Account Section */}
         <motion.section variants={itemVariants}>
            <h3 className={styles.settingsSectionTitle}>Account</h3>
                {userId && <AccountSettings userId={userId} userEmail={email} />}
         </motion.section>



      </motion.div>
    </div>
  )
}

function ThemeButton({ theme, icon, label }: { theme: string, icon: React.ReactNode, label: string }) {
  const { theme: currentTheme, setTheme } = useTheme()
  const isActive = currentTheme === theme

  return (
    <button
        onClick={() => setTheme(theme)}
        className={`${styles.themeBtn} ${isActive ? styles.themeBtnActive : ''}`}
    >
        {icon}
        <span className={styles.themeBtnLabel}>{label}</span>
    </button>
  )
}
