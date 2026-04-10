import { useEffect, useState } from 'react'
import { BarChart3, CircleCheck, Clock3, Layers, ShieldAlert, TrendingUp } from 'lucide-react'
import { getDeveloperToken } from '../../lib/developerSession'
import { fetchMyProjects, getPlanStatus } from '../../lib/developerApi'

export default function DeveloperDashboardHome() {
  const token = getDeveloperToken()
  const [stats, setStats] = useState({ total: 0, pending: 0, active: 0, rejected: 0, recent7Days: 0, approvalRate: 0 })
  const [recentProjects, setRecentProjects] = useState([])
  const [planState, setPlanState] = useState({ loading: true, hasActivePlan: false })

  const rejectedRate = stats.total ? Math.round((stats.rejected / stats.total) * 100) : 0
  const pendingRate = stats.total ? Math.round((stats.pending / stats.total) * 100) : 0

  useEffect(() => {
    const load = async () => {
      try {
        const [projectsRes, planRes] = await Promise.all([
          fetchMyProjects(token),
          getPlanStatus(token),
        ])

        const projects = projectsRes?.data?.projects || []
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
        const recent = projects.filter((p) => new Date(p.createdAt || p.updatedAt || Date.now()).getTime() >= sevenDaysAgo)
        const approvedCount = projects.filter((p) => p.adminStatus === 'ACTIVE').length
        const approvalRate = projects.length ? Math.round((approvedCount / projects.length) * 100) : 0

        setStats({
          total: projects.length,
          pending: projects.filter((p) => p.adminStatus === 'PENDING').length,
          active: approvedCount,
          rejected: projects.filter((p) => p.adminStatus === 'REJECTED').length,
          recent7Days: recent.length,
          approvalRate,
        })

        setRecentProjects(
          [...projects]
            .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
            .slice(0, 4)
        )

        setPlanState({
          loading: false,
          hasActivePlan: Boolean(planRes?.data?.hasActivePlan),
          userType: planRes?.data?.userType || '-',
          isExpired: Boolean(planRes?.data?.isExpired),
        })
      } catch {
        setPlanState({ loading: false, hasActivePlan: false, userType: '-', isExpired: false })
      }
    }

    load()
  }, [token])

  return (
    <section className="dev-page">
      <header className="dev-page__header">
        <h1>Developer Dashboard</h1>
        <p>Track plan health, project pipeline and approval performance at a glance.</p>
      </header>

      <div className="dev-overviewGrid">
        <article className="dev-heroCard">
          <p className="dev-heroCard__label">Pipeline Overview</p>
          <h2>{stats.total} Total Projects</h2>
          <p className="dev-muted">{stats.recent7Days} new/updated projects in last 7 days.</p>
          <div className="dev-heroCard__chips">
            <span className="dev-chip status-active">Active {stats.active}</span>
            <span className="dev-chip status-pending">Pending {stats.pending}</span>
            <span className="dev-chip status-rejected">Rejected {stats.rejected}</span>
          </div>
        </article>

        <article className="dev-planCardLite dev-planStatus">
          <h3><Layers size={16} /> Subscription Status</h3>
          {planState.loading ? <p>Checking plan...</p> : null}
          {!planState.loading ? (
            <>
              <p>User Type: <b>{planState.userType}</b></p>
              <p>
                Active Plan:{' '}
                <b className={planState.hasActivePlan ? 'ok' : 'warn'}>
                  {planState.hasActivePlan ? 'Yes' : 'No'}
                </b>
              </p>
              {planState.isExpired ? <p className="warn">Your previous plan is expired.</p> : null}
            </>
          ) : null}
        </article>
      </div>

      <div className="dev-kpiGrid dev-kpiGrid--enhanced">
        <article className="dev-kpi dev-kpi--accent"><h3><BarChart3 size={14} /> Total Projects</h3><strong>{stats.total}</strong></article>
        <article className="dev-kpi"><h3><Clock3 size={14} /> Pending</h3><strong>{stats.pending}</strong></article>
        <article className="dev-kpi"><h3><CircleCheck size={14} /> Active</h3><strong>{stats.active}</strong></article>
        <article className="dev-kpi"><h3><ShieldAlert size={14} /> Rejected</h3><strong>{stats.rejected}</strong></article>
        <article className="dev-kpi"><h3><TrendingUp size={14} /> Added in 7 Days</h3><strong>{stats.recent7Days}</strong></article>
        <article className="dev-kpi"><h3><TrendingUp size={14} /> Approval Rate</h3><strong>{stats.approvalRate}%</strong></article>
      </div>

      <div className="dev-analyticsRow">
        <article className="dev-analyticsPanel">
          <h3>Performance Snapshot</h3>
          <div className="dev-barStat">
            <div className="dev-barStat__meta"><span>Approval</span><b>{stats.approvalRate}%</b></div>
            <div className="dev-barStat__track"><span style={{ width: `${stats.approvalRate}%` }} /></div>
          </div>
          <div className="dev-barStat">
            <div className="dev-barStat__meta"><span>Pending</span><b>{pendingRate}%</b></div>
            <div className="dev-barStat__track"><span style={{ width: `${pendingRate}%` }} /></div>
          </div>
          <div className="dev-barStat">
            <div className="dev-barStat__meta"><span>Rejected</span><b>{rejectedRate}%</b></div>
            <div className="dev-barStat__track"><span style={{ width: `${rejectedRate}%` }} /></div>
          </div>
        </article>

        <article className="dev-analyticsPanel dev-recentPanel">
          <h3>Recent Activity</h3>
          {recentProjects.length === 0 ? <p className="dev-muted">No recent project updates.</p> : null}
          <div className="dev-recentList">
            {recentProjects.map((project) => (
              <div key={project._id} className="dev-recentItem">
                <b>{project.nameOfProject || 'Untitled Project'}</b>
                <span>{project.projectLocation?.city || '-'} | {project.adminStatus || '-'}</span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}
