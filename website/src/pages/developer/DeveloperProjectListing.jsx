import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, MapPin, CalendarDays, BadgeCheck } from 'lucide-react'
import { getDeveloperToken } from '../../lib/developerSession'
import { fetchMyProjects } from '../../lib/developerApi'

export default function DeveloperProjectListing() {
  const token = getDeveloperToken()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchMyProjects(token)
        setProjects(res?.data?.projects || [])
      } catch (e) {
        setError(e.message || 'Failed to load projects')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  return (
    <section className="dev-page">
      <header className="dev-page__header">
        <h1>Project Listing</h1>
        <p>View and edit your posted projects.</p>
      </header>

      {loading ? <p>Loading projects...</p> : null}
      {error ? <p className="dev-error">{error}</p> : null}

      {!loading && projects.length === 0 ? <p>No projects found.</p> : null}

      <div className="dev-projectGrid">
        {projects.map((project) => (
          <article key={project._id} className="dev-projectItem">
            <div className="dev-projectItem__head">
              <h3><Building2 size={16} /> {project.nameOfProject}</h3>
              <span className={`dev-chip status-${(project.adminStatus || '').toLowerCase()}`}>{project.adminStatus || '-'}</span>
            </div>

            <p><MapPin size={13} /> {project.projectLocation?.city || '-'} | {project.projectLocation?.state || '-'}</p>
            <p><BadgeCheck size={13} /> {project.projectStatus || '-'} | Type: {(project.projectType || []).join(', ') || '-'}</p>
            <p><CalendarDays size={13} /> Updated: {new Date(project.updatedAt || project.createdAt || Date.now()).toLocaleDateString()}</p>

            <div className="dev-projectActions">
              <button
                type="button"
                onClick={() => navigate(`/developer/post-project?edit=${project._id}`)}
                disabled={project.adminStatus !== 'PENDING'}
              >
                {project.adminStatus === 'PENDING' ? 'Edit Project' : 'Edit Locked'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
