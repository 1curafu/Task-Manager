'use client'

import { motion } from 'framer-motion'
import styles from './PageSkeleton.module.css'

export function PageSkeleton() {
  return (
    <div className={styles.skeletonContainer}>
      {/* Header Skeleton */}
      <div className={styles.headerRow}>
        <motion.div 
          className={styles.pulseBox} 
          style={{ width: '250px', height: '36px', borderRadius: '12px' }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className={styles.pulseBox} 
          style={{ width: '120px', height: '40px', borderRadius: '12px' }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Stats row skeleton */}
      <div className={styles.statsRow}>
        {[1, 2, 3, 4].map(i => (
          <motion.div 
            key={i}
            className={styles.pulseBox} 
            style={{ flex: 1, minWidth: '200px', height: '100px', borderRadius: '16px' }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 }}
          />
        ))}
      </div>

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        <motion.div 
          className={styles.pulseBox}
          style={{ width: '100%', height: '400px', borderRadius: '24px' }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
        />
      </div>
    </div>
  )
}
