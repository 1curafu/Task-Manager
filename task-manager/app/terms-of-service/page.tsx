'use client'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import styles from '@/components/Legal.module.css'

export default function TermsOfService() {
  return (
    <div className={styles.container}>
      <Navbar />
      
      <main className={styles.hero}>
        <div className={styles.heroBgGrid}></div>
        <div className={`${styles.heroBlob} ${styles.blobBlue}`}></div>
        
        <div className={styles.mainContainer}>
          <h1 className={styles.title}>Terms of Service</h1>
          <p className={styles.lastUpdated}>Last Updated: December 5, 2025</p>
          
          <div className={styles.content}>
            <p>
              Welcome to Vela Works Task Manager. By accessing or using our website and services, you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, please do not use our Service.
            </p>

            <h2>1. Use of Service</h2>
            <p>
              We grant you a limited, non-exclusive, non-transferable license to use our Service for your personal or internal business purposes. You agree not to misuse the Service or help anyone else do so.
            </p>

            <h2>2. User Accounts</h2>
            <p>
              You are responsible for safeguarding your account credentials. You are also responsible for all activities that occur under your account. You must notify us immediately if you become aware of any breach of security or unauthorized use of your account.
            </p>

            <h2>3. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Service for any illegal purpose or in violation of any local, state, national, or international law.</li>
              <li>Violate any right of a third party, including by infringing or misappropriating any third-party intellectual property right.</li>
              <li>Interfere with security-related features of the Service.</li>
            </ul>

            <h2>4. Termination</h2>
            <p>
              We may terminate or suspend your access to the Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>

            <h2>5. Limitation of Liability</h2>
            <p>
              In no event shall Vela Works, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
            </p>

            <h2>6. Changes to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will try to provide at least 30 days&apos; notice prior to any new terms taking effect.
            </p>

            <h2>7. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at legal@vela.works.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
