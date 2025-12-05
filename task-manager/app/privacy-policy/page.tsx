'use client'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import styles from '@/components/Legal.module.css'

export default function PrivacyPolicy() {
  return (
    <div className={styles.container}>
      <Navbar />
      
      <main className={styles.hero}>
        <div className={styles.heroBgGrid}></div>
        <div className={`${styles.heroBlob} ${styles.blobBlue}`}></div>
        
        <div className={styles.mainContainer}>
          <h1 className={styles.title}>Privacy Policy</h1>
          <p className={styles.lastUpdated}>Last Updated: December 5, 2025</p>
          
          <div className={styles.content}>
            <p>
              At Vela Works (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), we respect your privacy and are committed to protecting the personal information you share with us. This Privacy Policy explains how we collect, use, and safeguard your data when you use the Task Manager application (&quot;Service&quot;).
            </p>

            <h2>1. Information We Collect</h2>
            <p>We collect information to provide and improve our Service:</p>
            <ul>
              <li><strong>Account Information:</strong> When you register, we store your email address and authentication details provided by Supabase Auth (or social providers like Google, Apple, GitHub).</li>
              <li><strong>User Content:</strong> We store the tasks, notes, team information, and other content you create within the application.</li>
              <li><strong>Usage Data:</strong> We may collect anonymous analytics data regarding how you use the Service to improve performance and user experience (via Vercel Analytics).</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>We use your data strictly for the following purposes:</p>
            <ul>
              <li>To provide and maintain the Service.</li>
              <li>To authenticate your identity and secure your account.</li>
              <li>To communicate with you regarding updates, security alerts, and support.</li>
              <li>To improve our application based on aggregated usage patterns.</li>
            </ul>

            <h2>3. Data Storage and Security</h2>
            <p>
              Your data is stored securely in a PostgreSQL database hosted by Supabase. We implement industry-standard security measures, including encryption in transit (SSL/TLS) and strict access controls. 
            </p>

            <h2>4. Third-Party Services</h2>
            <p>We use trusted third-party services to operate our application:</p>
            <ul>
              <li><strong>Supabase:</strong> For database hosting and authentication services.</li>
              <li><strong>Vercel:</strong> For hosting the application and analytics.</li>
            </ul>

            <h2>5. Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your personal data. You can delete your account and all associated data at any time from the account settings page.
            </p>

            <h2>6. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at privacy@vela.works.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
