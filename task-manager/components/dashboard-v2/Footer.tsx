'use client'

import React from 'react'
import Link from 'next/link'
import { GithubLogo as Github } from '@phosphor-icons/react'


export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer style={{ 
      marginTop: 'auto', 
      paddingTop: '2rem', 
      borderTop: '1px solid var(--color-slate-200)',
      color: 'var(--color-slate-400)',
      fontSize: '0.875rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <span style={{ fontWeight: 500, color: 'var(--color-slate-500)' }}>Vela Works</span>
        <span style={{ margin: '0 0.5rem' }}>•</span>
        <span>© {currentYear}</span>
      </div>
      
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <Link href="/privacy-policy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</Link>
        <Link href="/terms-of-service" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</Link>
        <a href="https://github.com/1curafu" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <Github size={20} />
        </a>
      </div>
    </footer>
  )
}
