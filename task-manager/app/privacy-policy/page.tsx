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
          <p className={styles.lastUpdated}>Last Updated: March 9, 2026</p>
          
          <div className={styles.content}>
            <p>
              At Vela Works (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), we respect your privacy and are committed to protecting the personal information you share with us. This Privacy Policy explains how we collect, use, and safeguard your data when you use the Task Manager application (&quot;Service&quot;).
            </p>

            <h2>1. Information We Collect</h2>
            <p>We collect information to provide and improve our Service:</p>
            <ul>
              <li><strong>Account Information:</strong> When you register, we store your email address, profile name, avatar, and authentication details provided by Supabase Auth.</li>
              <li><strong>User &amp; Team Content:</strong> We store the tasks, notes, team names, invitations, and other content you create or share within the application.</li>
              <li><strong>Usage Data:</strong> We may collect anonymous analytics data regarding how you use the Service to improve performance and user experience.</li>
            </ul>

            <h2>2. How We Use and Share Your Information</h2>
            <p>We use your data strictly for the following purposes:</p>
            <ul>
              <li><strong>Core Services:</strong> To provide, maintain, and secure the Service and your account.</li>
              <li><strong>Team Collaboration:</strong> If you join or create a Team, your profile name, email, and avatar will be visible to other members of that Team to facilitate task assignments and communication.</li>
              <li><strong>Communication:</strong> To communicate with you regarding updates, invitations, security alerts, and support.</li>
              <li><strong>Improvement:</strong> To improve our application based on aggregated usage patterns.</li>
            </ul>

            <h2>3. Data Storage, Retention, and Security</h2>
            <p>
              Your data is stored securely in a PostgreSQL database hosted by Supabase. We implement industry-standard security measures, including encryption in transit (SSL/TLS), Row Level Security (RLS) policies, and strict access controls. We retain your data only for as long as your account is active. If you delete your account, your personal data and standalone tasks will be permanently removed.
            </p>

            <h2>4. Cookies and Tracking Technologies</h2>
            <p>
              We use necessary cookies and local storage mechanisms to maintain your authenticated session and save your theme preferences (Light/Dark mode). We do not use third-party tracking cookies for targeted advertising.
            </p>

            <h2>5. Third-Party Services</h2>
            <p>We use trusted third-party services to operate our application:</p>
            <ul>
              <li><strong>Supabase:</strong> For database hosting, real-time subscriptions, and authentication services.</li>
              <li><strong>Vercel:</strong> For hosting the application infrastructure.</li>
            </ul>

            <h2>6. Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your personal data. You can export your data, leave teams, or permanently delete your account directly from your personalized Account Settings dashboard at any time.
            </p>

            <h2>7. Contact Us</h2>
            <p>
              If you have any questions or concerns regarding this Privacy Policy, please contact us at privacy@vela.works.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
