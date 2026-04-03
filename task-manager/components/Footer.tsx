import Link from 'next/link'
import Image from 'next/image'
import styles from './Footer.module.css'
import { GithubLogoIcon } from '@phosphor-icons/react/dist/ssr'

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.mainContainer}>
        <div className={styles.footerContent}>
          <div className={styles.logo}>
            <Image src="/favicon.svg" alt="Vela Works Logo" width={32} height={32} />
            <span className={styles.logoText}>Vela Works</span>
          </div>
          
          <div className={styles.footerSocial}>
            <a href="https://github.com/1curafu" target="_blank" rel="noopener noreferrer" className={styles.footerSocialLink}>
              <GithubLogoIcon weight="fill" />
            </a>
          </div>
        </div>
        
        <div className={styles.footerBottom}>
          <p>© 2025 Vela Works. All rights reserved.</p>
          <div className={styles.footerLinks}>
            <Link href="/privacy-policy" className={styles.footerLink}>Privacy Policy</Link>
            <Link href="/terms-of-service" className={styles.footerLink}>Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
