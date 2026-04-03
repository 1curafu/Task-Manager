'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabaseClient'
import styles from '@/app/dashboard/dashboard.module.css'
import { Footer } from '@/components/dashboard-v2/Footer'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import { CheckCircle, Clock, SquaresFour, Users, ChartLineUp, ArrowDown } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { PageSkeleton } from '@/components/dashboard-v2/PageSkeleton'

interface WeeklyPoint {
  date: string
  completed: number
  created: number
}

interface DistributionItem {
  name: string
  value: number
  color: string
}

interface Stats {
  total: number
  completed: number
  overdue: number
  teamTasks: number
}

const STAT_COLORS = {
  total:     '#3b82f6',
  completed: '#10b981',
  overdue:   '#ef4444',
  team:      '#8b5cf6',
}

const CHART_COLORS = {
  created:   '#6366f1',
  completed: '#10b981',
}

const containerVariants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.analyticsTooltip}>
      <p className={styles.analyticsTooltipLabel}>{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any) => (
        <p key={entry.dataKey} style={{ color: entry.color }} className={styles.analyticsTooltipRow}>
          <span className={styles.analyticsTooltipDot} style={{ background: entry.color }} />
          {entry.name}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0, overdue: 0, teamTasks: 0 })
  const [weeklyData, setWeeklyData] = useState<WeeklyPoint[]>([])
  const [distributionData, setDistributionData] = useState<DistributionItem[]>([])

  const supabase = createClient()

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const userId = session.user.id

      const { data: memberTeams } = await supabase.rpc('get_user_member_teams', { user_id_param: userId })
      const { data: ownedTeams }  = await supabase.from('Team').select('id').eq('ownerId', userId)
      const teamIds = [
        ...(ownedTeams?.map(t => t.id)  ?? []),
        ...(memberTeams?.map((t: { id: string }) => t.id) ?? []),
      ]

      const query = supabase
        .from('Task')
        .select('id, completed, dueDate, createdAt, teamId, lastUpdated, assignedToId, userId')
        .eq('isTemplate', false)
        .or(`userId.eq.${userId},assignedToId.eq.${userId}${teamIds.length > 0 ? `,teamId.in.(${teamIds.join(',')})` : ''}`)

      const { data: tasks, error: tasksError } = await query

      if (tasksError) throw tasksError

      if (tasks) {
        const now = new Date()
        let completedCount = 0
        let overdueCount   = 0
        let teamTasksCount = 0
        let personalCount  = 0
        let assignedCount  = 0

        for (const t of tasks) {
          if (t.completed) {
            completedCount++
          } else if (t.dueDate && new Date(t.dueDate) < now) {
            // Only count as overdue if dueDate is explicitly set and in the past
            overdueCount++
          }

          if (t.teamId) {
            teamTasksCount++
          } else if (t.assignedToId && t.assignedToId !== t.userId) {
            assignedCount++
          } else {
            personalCount++
          }
        }

        setStats({ total: tasks.length, completed: completedCount, overdue: overdueCount, teamTasks: teamTasksCount })

        const dist: DistributionItem[] = [
          { name: 'Personal', value: personalCount,  color: STAT_COLORS.total },
          { name: 'Team',     value: teamTasksCount, color: STAT_COLORS.team },
          { name: 'Assigned', value: assignedCount,  color: '#f59e0b' },
        ].filter(d => d.value > 0)
        setDistributionData(dist)

        const last7: WeeklyPoint[] = []
        for (let i = 6; i >= 0; i--) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          d.setHours(0, 0, 0, 0)

          const nextDay = new Date(d)
          nextDay.setDate(nextDay.getDate() + 1)

          const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' })

          const completedOnDay = tasks.filter(
            t => t.completed && t.lastUpdated &&
            new Date(t.lastUpdated) >= d && new Date(t.lastUpdated) < nextDay
          ).length
          const createdOnDay = tasks.filter(
            t => t.createdAt && new Date(t.createdAt) >= d && new Date(t.createdAt) < nextDay
          ).length

          last7.push({ date: dayStr, completed: completedOnDay, created: createdOnDay })
        }
        setWeeklyData(last7)
      }

      setLoading(false)
    } catch {
      setError('Failed to load analytics. Please refresh.')
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { void fetchAnalytics() }, [fetchAnalytics])

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
  const ringRadius     = 44
  const ringCircumference = 2 * Math.PI * ringRadius
  const ringOffset     = ringCircumference - (completionRate / 100) * ringCircumference

  const statCards = [
    { title: 'Total Tasks', value: stats.total,     color: STAT_COLORS.total,     icon: <SquaresFour size={20} />, sub: 'All tasks' },
    { title: 'Completed',   value: stats.completed, color: STAT_COLORS.completed, icon: <CheckCircle size={20} />, sub: `${completionRate}% rate` },
    { title: 'Overdue',     value: stats.overdue,   color: STAT_COLORS.overdue,   icon: <Clock size={20} />,       sub: 'Needs attention' },
    { title: 'Team Tasks',  value: stats.teamTasks, color: STAT_COLORS.team,      icon: <Users size={20} />,       sub: 'Collaborative' },
  ]

  const distTotal = distributionData.reduce((s, d) => s + d.value, 0)

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p>{error}</p>
        <button onClick={() => { setError(null); setLoading(true); void fetchAnalytics() }} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <>
      <div className={styles.pageHeaderContainerFlex}>
        <div>
          <h2 className={styles.pageTitle}>Analytics</h2>
          <p className={styles.pageSubtitle}>Track your productivity and task completion.</p>
        </div>
      </div>

      {loading ? (
        <PageSkeleton />
      ) : (
        <motion.div
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* ── Stat Cards ── */}
          <motion.div className={styles.analyticsStatGrid} variants={itemVariants}>
            {statCards.map((card) => (
              <div key={card.title} className={styles.analyticsStatCard} style={{ borderLeftColor: card.color }}>
                <div className={styles.analyticsStatIcon} style={{ background: `${card.color}15`, color: card.color }}>
                  {card.icon}
                </div>
                <div className={styles.analyticsStatBody}>
                  <p className={styles.analyticsStatTitle}>{card.title}</p>
                  <h3 className={styles.analyticsStatValue} style={{ color: card.color }}>{card.value}</h3>
                  {card.title === 'Completed' ? (
                    <span className={completionRate >= 50 ? styles.trendUp : styles.trendDown}>
                      {completionRate >= 50 ? <ChartLineUp size={12} weight="bold" /> : <ArrowDown size={12} weight="bold" />}
                      {card.sub}
                    </span>
                  ) : (
                    <span className={styles.analyticsStatSub}>{card.sub}</span>
                  )}
                </div>
              </div>
            ))}
          </motion.div>

          {/* ── Main Charts Row ── */}
          <motion.div className={styles.analyticsMainGrid} variants={itemVariants}>

            {/* Line chart — 7-day trend */}
            <div className={styles.analyticsChartCard}>
              <h3 className={styles.analyticsChartTitle}>7-Day Activity Trend</h3>
              <div style={{ height: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                      dy={8}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: '0.8rem', paddingTop: '0.75rem' }}
                      formatter={(value) => <span style={{ color: 'var(--text-secondary)' }}>{value}</span>}
                    />
                    <Line
                      type="monotone"
                      dataKey="created"
                      stroke={CHART_COLORS.created}
                      strokeWidth={2.5}
                      dot={{ r: 3, strokeWidth: 0, fill: CHART_COLORS.created }}
                      activeDot={{ r: 5 }}
                      name="Created"
                    />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      stroke={CHART_COLORS.completed}
                      strokeWidth={2.5}
                      dot={{ r: 3, strokeWidth: 0, fill: CHART_COLORS.completed }}
                      activeDot={{ r: 5 }}
                      name="Completed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right column: completion ring + distribution */}
            <div className={styles.analyticsRightCol}>

              {/* Completion ring */}
              <div className={styles.analyticsChartCard}>
                <h3 className={styles.analyticsChartTitle} style={{ marginBottom: '1rem' }}>Overall Completion</h3>
                <div className={styles.analyticsRingRow}>
                  <div className={styles.progressRing}>
                    <svg
                      className={styles.progressRingSvg}
                      width="108"
                      height="108"
                      viewBox="0 0 108 108"
                    >
                      <circle className={styles.progressRingCircleBg} cx="54" cy="54" r={ringRadius} />
                      <circle
                        className={styles.progressRingCircle}
                        cx="54"
                        cy="54"
                        r={ringRadius}
                        strokeDasharray={ringCircumference}
                        strokeDashoffset={ringOffset}
                      />
                    </svg>
                    <span className={styles.progressRingText}>{completionRate}%</span>
                  </div>
                  <div className={styles.analyticsRingMeta}>
                    <p className={styles.analyticsRingCount}>{stats.completed} <span>/ {stats.total}</span></p>
                    <p className={styles.analyticsRingLabel}>tasks completed</p>
                  </div>
                </div>
              </div>

              {/* Distribution bars */}
              {distributionData.length > 0 && (
                <div className={styles.analyticsChartCard}>
                  <h3 className={styles.analyticsChartTitle} style={{ marginBottom: '1rem' }}>Task Distribution</h3>
                  <div className={styles.analyticsDistList}>
                    {distributionData.map((item) => (
                      <div key={item.name} className={styles.analyticsDistItem}>
                        <div className={styles.analyticsDistHeader}>
                          <span className={styles.analyticsDistName}>
                            <span className={styles.analyticsDistDot} style={{ background: item.color }} />
                            {item.name}
                          </span>
                          <span className={styles.analyticsDistPct}>
                            {distTotal > 0 ? Math.round((item.value / distTotal) * 100) : 0}%
                          </span>
                        </div>
                        <div className={styles.analyticsDistTrack}>
                          <div
                            className={styles.analyticsDistFill}
                            style={{
                              width: `${distTotal > 0 ? (item.value / distTotal) * 100 : 0}%`,
                              background: item.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      <Footer />
    </>
  )
}
