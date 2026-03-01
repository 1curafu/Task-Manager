'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { useTheme } from 'next-themes'
import { ProfileForm } from '@/components/dashboard-v2/Settings/ProfileForm'
import { AccountSettings } from '@/components/dashboard-v2/Settings/AccountSettings'
import { Sun, Moon, Desktop } from '@phosphor-icons/react'
import styles from '@/app/dashboard-new/dashboard.module.css'
import { motion } from 'framer-motion'

interface UserProfile {
  id: string
  userId: string
  name: string
  avatar?: string
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [userId, setUserId] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [loading, setLoading] = useState(true)
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
        // Fallback layout if no profile row exists yet
        setProfile({ id: '', userId: tempUserId, name: '' }) 
      }
      
      setLoading(false)
    }

    init()
  }, [router, supabase])

  

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--color-slate-500)' }}>
         Loading...
      </div>
    )
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
                    <ThemeButton theme="system" icon={<Desktop size={24} />} label="System" />
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
