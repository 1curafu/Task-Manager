'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ThemeToggle } from '@/components/ThemeToggle'
import styles from './Navbar.module.css'
import { 
  CodeIcon, 
  ListBulletsIcon, 
  ArrowRightIcon
} from '@phosphor-icons/react'

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContent}>
        <div 
          className={styles.logo} 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        >
          <div className={styles.logoIcon}>
            <Image src="/apple-touch-icon.png" alt="Vela Works Logo" width={32} height={32} />
          </div>
          <Link href="/" className={styles.logoText}>Vela Works</Link>
        </div>
        <div className={styles.navLinks}>
          <Link href="/#features">Features</Link>
          <Link href="/#speed">Performance</Link>
          <Link href="/#security">Security</Link>
          
          <div className={styles.navActions}>
            <ThemeToggle />
            
            <a 
              href="https://github.com/1curafu/Task-Manager" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.navBtnGithub}
            >
              <CodeIcon weight="bold" size={18} />
              <span>Source</span>
            </a>
            <Link 
              href="/auth/login"
              className={styles.navBtnLogin}
            >
              Login
              <ArrowRightIcon weight="bold" />
            </Link>
          </div>
        </div>
        <button 
          className={styles.mobileMenuBtn}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileMenuOpen}
        >
          <ListBulletsIcon />
        </button>
      </div>
      {isMobileMenuOpen && (
        <div className={styles.mobileMenu}>
          <Link href="/#features" onClick={() => setIsMobileMenuOpen(false)}>Features</Link>
          <Link href="/#speed" onClick={() => setIsMobileMenuOpen(false)}>Performance</Link>
          <Link href="/#security" onClick={() => setIsMobileMenuOpen(false)}>Security</Link>
          <div className={styles.mobileMenuDivider}></div>
          <div className={styles.mobileMenuRow}>
            <span className={styles.mobileMenuLabel}>Theme</span>
            <ThemeToggle />
          </div>
          <Link href="/auth/login" className={`${styles.navBtnLogin} ${styles.mobileMenuBtnFull}`} onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
          <a href="https://github.com/1curafu/Task-Manager" target="_blank" rel="noopener noreferrer" className={`${styles.navBtnGithub} ${styles.mobileMenuBtnFull}`} onClick={() => setIsMobileMenuOpen(false)}>View Source Code</a>
        </div>
      )}
    </nav>
  )
}
