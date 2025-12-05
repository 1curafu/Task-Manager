'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabaseClient'
import { ThemeToggle } from '@/components/ThemeToggle'
import styles from './page.module.css'
import { 
  Code, 
  List, 
  ArrowRight, 
  UsersThree, 
  ShieldCheck, 
  CheckSquare, 
  Bell, 
  Calendar, 
  Gear, 
  Lightning, 
  Database, 
  LockKey, 
  Desktop, 
  GithubLogo 
} from '@phosphor-icons/react'

export default function Landing() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard')
      }
    }
    checkAuth()
  }, [router, supabase])

  return (
    <div className={styles.container}>
      
      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <div 
            className={styles.logo} 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className={styles.logoIcon}>
              <Image src="/apple-touch-icon.png" alt="Vela Works Logo" width={32} height={32} />
            </div>
            <span className={styles.logoText}>Vela Works</span>
          </div>
          <div className={styles.navLinks}>
            <Link href="#features">Features</Link>
            <Link href="#speed">Performance</Link>
            <Link href="#security">Security</Link>
            
            <div className={styles.navActions}>
              <ThemeToggle />
              
              <a 
                href="https://github.com/1curafu/Task-Manager" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.navBtnGithub}
              >
                <Code weight="bold" size={18} />
                <span>Source</span>
              </a>
              <Link 
                href="/auth/login"
                className={styles.navBtnLogin}
              >
                Login
                <ArrowRight weight="bold" />
              </Link>
            </div>
          </div>
          <button 
            className={styles.mobileMenuBtn}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <List />
          </button>
        </div>
        {isMobileMenuOpen && (
          <div className={styles.mobileMenu}>
            <Link href="#features" onClick={() => setIsMobileMenuOpen(false)}>Features</Link>
            <Link href="#speed" onClick={() => setIsMobileMenuOpen(false)}>Performance</Link>
            <Link href="#security" onClick={() => setIsMobileMenuOpen(false)}>Security</Link>
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

      <section className={styles.hero}>
        <div className={styles.heroBgGrid}></div>
        <div className={`${styles.heroBlob} ${styles.blobBlue}`}></div>
        <div className={`${styles.heroBlob} ${styles.blobPurple}`}></div>
        <div className={styles.mainContainer}>
          <div className={styles.badge}>
            <span className={styles.badgeDot}></span>
            Ready for Production
          </div>
          <h1>
            Manage tasks with clarity. <br />
            <span className={styles.gradientText}>
              Collaborate without chaos.
            </span>
          </h1>
          <p>
            A dedicated workspace designed for your team. Built by <strong>Vela Works</strong> to bring speed, security, and simplicity to your daily workflow.
          </p>
          <div className={styles.heroActions}>
            <Link href="/auth/login" className={`${styles.btn} ${styles.btnPrimary}`}>
              Start Organizing
              <ArrowRight weight="bold" />
            </Link>
            <a href="https://github.com/1curafu/Task-Manager" target="_blank" rel="noopener noreferrer" className={`${styles.btn} ${styles.btnSecondary}`}>
              View Technical Details
              <Code weight="bold" />
            </a>
          </div>
          <div className={styles.mockupContainer}>
            <div className={styles.mockupHeader}>
              <div className={styles.mockupDots}>
                <div className={`${styles.dot} ${styles.dotRed}`}></div>
                <div className={`${styles.dot} ${styles.dotYellow}`}></div>
                <div className={`${styles.dot} ${styles.dotGreen}`}></div>
              </div>
              <div className={styles.urlBar}>vela.works/dashboard</div>
            </div>
            <div className={styles.mockupBody}>
              <div className={styles.uiGrid}>
                <div className={styles.uiSidebar}>
                  <div className={styles.mockupSidebarIcon}></div>
                  <div className={`${styles.mockupSidebarLine} ${styles.w70}`}></div>
                  <div className={`${styles.mockupSidebarLine} ${styles.w50}`}></div>
                </div>
                
                <div className={styles.mockupContent}>
                  <div className={styles.mockupHeaderRow}>
                    <div className={styles.mockupTitleBar}></div>
                    <div className={styles.mockupAvatar}></div>
                  </div>
                  <div className={styles.mockupGrid}>
                    {[
                      { bg: 'var(--color-blue-50)', icon: 'var(--color-brand-blue)' },
                      { bg: 'var(--color-purple-50)', icon: 'var(--color-purple-600)' },
                      { bg: 'var(--color-orange-50)', icon: '#ea580c' }
                    ].map((card, i) => (
                      <div key={i} className={styles.uiCard}>
                        <div className={styles.mockupCardIconBox} style={{ background: card.bg }}>
                           <div className={styles.mockupCardIcon} style={{ background: card.icon }}></div>
                        </div>
                        <div className={styles.mockupCardLine}></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className={styles.glassOverlay}>
                 <p className={styles.overlayLabel}>Preview</p>
                 <h3 className={styles.overlayTitle}>Redesigned Dashboard</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className={styles.featuresSection}>
        <div className={styles.mainContainer}>
          <div className={styles.sectionHeader}>
            <span className={styles.subtitle}>Why Choose Task Manager</span>
            <h2 className={styles.sectionTitle}>Everything you need to stay organized.</h2>
            <p className={styles.textMutedLarge}>We stripped away the clutter to focus on what matters: your tasks, your team, and your time.</p>
          </div>
          <div className={styles.featuresGrid}>
            {[
              { 
                icon: <UsersThree weight="fill" />, 
                title: "Work Together Seamlessly", 
                desc: "Invite your team via email and start collaborating instantly. Assign roles, delegate tasks, and keep everyone on the same page.",
                bgClass: styles.bgBlueLight
              },
              { 
                icon: <ShieldCheck weight="fill" />, 
                title: "Enterprise-Grade Security", 
                desc: "Your data is protected by industry-standard encryption and strict access controls. Only the right people see your information.",
                bgClass: styles.bgPurpleLight
              },
              { 
                icon: <CheckSquare weight="fill" />, 
                title: "Stay on Track", 
                desc: "Never miss a deadline. Organize tasks by category, set due dates, and mark progress with a single click.",
                bgClass: styles.bgGreenLight
              },
              { 
                icon: <Bell weight="fill" />, 
                title: "Instant Notifications", 
                desc: "Get alerted the moment a task is assigned to you or a project status updates. Stay in the loop without checking email.",
                bgClass: styles.bgOrangeLight
              },
              { 
                icon: <Calendar weight="fill" />, 
                title: "Visual Calendar", 
                desc: "See your week at a glance. Switch to calendar view to visualize bottlenecks and plan your upcoming sprints effectively.",
                bgClass: styles.bgRedLight
              },
              { 
                icon: <Gear weight="fill" />, 
                title: "Powerful Administration", 
                desc: "Team owners have full control. Manage user access, oversee multiple teams, and audit activity from a dedicated panel.",
                bgClass: styles.bgIndigoLight
              }
            ].map((feature, i) => (
              <div key={i} className={styles.featureCard}>
                <div className={`${styles.featureIcon} ${feature.bgClass}`}>
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="speed" className={styles.stackSection}>
        <div className={styles.mainContainer}>
          <div className={styles.stackGrid}>
            
            <div>
              <h2 className={styles.sectionTitleLight}>Built for Reliability & Speed</h2>
              <p className={styles.textLightLarge}>
                We use the latest technology not just because it&apos;s new, but because it makes your experience faster, smoother, and more secure.
              </p>
              
              <ul className={styles.stackList}>
                {[
                  { icon: <Lightning weight="fill" />, title: "Lightning Fast Loads", desc: "Powered by Next.js, pages load instantly so you never wait to add a task." },
                  { icon: <Database weight="fill" />, title: "Real-Time Sync", desc: "Your data syncs across devices instantly via Supabase's realtime engine." },
                  { icon: <LockKey weight="fill" />, title: "Secure by Design", desc: "Strict type-checking ensures the application is robust and bug-free." }
                ].map((item, i) => (
                  <li key={i} className={styles.stackItem}>
                    {item.icon}
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <div className={styles.linkActionContainer}>
                <a href="https://github.com/1curafu/Task-Manager" target="_blank" rel="noopener noreferrer" className={styles.linkAction}>
                  For Developers: View the Code <ArrowRight weight="bold" />
                </a>
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <div className={styles.codeGlow}></div>
              <div className={styles.codeBlock}>
                <pre>
                  <code>
                    <span className={styles.tokenComment}>{"// How we ensure your data is safe"}</span>{'\n'}
                    <span className={styles.tokenKeyword}>const</span> <span className={styles.tokenVariable}>securityProtocols</span> = {'{'}{'\n'}
                    {'  '}encryption: <span className={styles.tokenString}>&quot;AES-256&quot;</span>,{'\n'}
                    {'  '}accessControl: <span className={styles.tokenString}>&quot;Strict&quot;</span>,{'\n'}
                    {'  '}backups: <span className={styles.tokenString}>&quot;Automated&quot;</span>,{'\n'}
                    {'  '}privacy: <span className={styles.tokenString}>&quot;First-Priority&quot;</span>{'\n'}
                    {'}'};{'\n\n'}
                    <span className={styles.tokenComment}>{"// Your experience"}</span>{'\n'}
                    <span className={styles.tokenFunction}>function</span> <span className={styles.tokenFunction}>userExperience</span>() {'{'}{'\n'}
                    {'  '}<span className={styles.tokenKeyword}>return</span> {'{'}{'\n'}
                    {'    '}speed: <span className={styles.tokenString}>&quot;Instant&quot;</span>,{'\n'}
                    {'    '}reliability: <span className={styles.tokenString}>&quot;100%&quot;</span>{'\n'}
                    {'  '}{'}'};{'\n'}
                    {'}'}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="security" className={styles.archSection}>
        <div className={styles.mainContainer}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>How Your Data is Protected</h2>
            <p className={styles.archDesc}>We believe in transparency. Here is how your information flows securely through our system.</p>
          </div>
          <div className={styles.archContainer}>
            <div className={styles.flowDiagram}>
              
              <div className={styles.flowNode}>
                <div className={`${styles.nodeIcon} ${styles.client}`}>
                  <Desktop weight="duotone" />
                </div>
                <h3 className={styles.nodeTitle}>Your Device</h3>
                <p className={styles.nodeDesc}>Secure Connection (SSL)</p>
              </div>
              <div className={styles.flowConnector}>
                <span className={styles.connectorLabel}>Encrypted Request</span>
                <div className={styles.connectorLine}>
                  <div className={styles.connectorArrow}></div>
                </div>
              </div>
              {/* Server */}
              <div className={styles.flowNode}>
                <div className={`${styles.nodeIcon} ${styles.server}`}>
                  <ShieldCheck weight="duotone" />
                </div>
                <h3 className={styles.nodeTitle}>Secure Validation</h3>
                <p className={styles.nodeDesc}>Identity Check</p>
              </div>
              <div className={styles.flowConnector}>
                <span className={styles.connectorLabel}>Verified Access</span>
                <div className={styles.connectorLine}>
                  <div className={styles.connectorArrow}></div>
                </div>
              </div>
              <div className={styles.flowNode}>
                <div className={`${styles.nodeIcon} ${styles.db}`}>
                  <LockKey weight="duotone" />
                </div>
                <h3 className={styles.nodeTitle}>Protected Storage</h3>
                <p className={styles.nodeDesc}>Encrypted Database</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.mainContainer}>
          <div className={styles.footerContent}>
            <div className={styles.logo}>
              <div className={styles.logoIcon}>
                <Image src="/apple-touch-icon.png" alt="Vela Works Logo" width={32} height={32} />
              </div>
              <span className={styles.logoText}>Vela Works</span>
            </div>
            
            <div className={styles.footerSocial}>
              <a href="https://github.com/1curafu" target="_blank" rel="noopener noreferrer" className={styles.footerSocialLink}>
                <GithubLogo weight="fill" />
              </a>
            </div>
          </div>
          
          <div className={styles.footerBottom}>
            <p>© 2025 Vela Works. All rights reserved.</p>
            <div className={styles.footerLinks}>
              <a href="#" className={styles.footerLink}>Privacy Policy</a>
              <a href="#" className={styles.footerLink}>Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
