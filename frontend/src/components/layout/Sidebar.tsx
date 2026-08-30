import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ClipboardIcon, HomeIcon, LogoMark, RepeatIcon, SettingsIcon, TagIcon, UsersIcon } from '../icons/Icons'

interface NavItem {
  label: string
  to: string
  icon: ReactNode
}

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { account } = useAuth()

  if (!account) {
    return null
  }

  const items: NavItem[] =
    account.type === 'admin'
      ? [
          { label: 'Dashboard', to: '/dashboard', icon: <HomeIcon /> },
          { label: 'Technicians', to: '/admin/technicians', icon: <UsersIcon /> },
          { label: 'Tasks', to: '/admin/tasks', icon: <ClipboardIcon /> },
          { label: 'Work Tags', to: '/admin/work-tags', icon: <TagIcon /> },
          { label: 'Frequencies', to: '/admin/frequencies', icon: <RepeatIcon /> },
          { label: 'Settings', to: '/settings', icon: <SettingsIcon /> },
        ]
      : [
          { label: 'Dashboard', to: '/technician/dashboard', icon: <HomeIcon /> },
          { label: 'Settings', to: '/settings', icon: <SettingsIcon /> },
        ]

  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <LogoMark />
          <span>Lyden Kreats</span>
        </div>

        <nav className="sidebar-nav">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              onClick={onClose}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
