import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, PlusSquare, ListChecks, LogOut } from 'lucide-react'
import { clearDeveloperSession, getDeveloperUser } from '../../lib/developerSession'
import './DeveloperModule.css'

const menu = [
  { label: 'Dashboard', to: '/developer/dashboard', icon: LayoutDashboard },
  { label: 'Post Project', to: '/developer/post-project', icon: PlusSquare },
  { label: 'Project Listing', to: '/developer/projects', icon: ListChecks },
]

export default function DeveloperLayout() {
  const user = getDeveloperUser()
  const navigate = useNavigate()

  return (
    <div className="dev-shell">
      <aside className="dev-sidebar">
        <div className="dev-sidebar__brand">Tocken Developer</div>

        <nav className="dev-sidebar__nav">
          {menu.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `dev-sidebar__link${isActive ? ' is-active' : ''}`}
              >
                <Icon size={16} /> {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="dev-sidebar__footer">
          <p className="dev-sidebar__user">{user?.name || user?.phone || 'Developer'}</p>
          <button
            className="dev-sidebar__logout"
            type="button"
            onClick={() => {
              clearDeveloperSession()
              navigate('/developer/login', { replace: true })
            }}
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>

      <main className="dev-main">
        <Outlet />
      </main>
    </div>
  )
}
