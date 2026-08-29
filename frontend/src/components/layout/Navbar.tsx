import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import Avatar from '../ui/Avatar'
import ConfirmDialog from '../ui/ConfirmDialog'
import { BellIcon, ChevronDownIcon, LogoutIcon, MenuIcon } from '../icons/Icons'
import OrganizationSwitcher from './OrganizationSwitcher'

export default function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { account, logout } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()

  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (!account) {
    return null
  }

  const { name, email } = account.user
  const roleLabel = account.type === 'admin' ? 'Organization Admin' : 'Technician'

  async function handleLogout() {
    setConfirmOpen(false)
    await logout()
    notify('success', 'You have been logged out.')
    navigate('/login')
  }

  return (
    <header className="navbar">
      <button type="button" className="navbar-menu-btn" onClick={onMenuClick} aria-label="Open menu">
        <MenuIcon />
      </button>

      <OrganizationSwitcher />

      <div className="navbar-spacer" />

      <button type="button" className="navbar-icon-btn" title="No new notifications" aria-label="Notifications">
        <BellIcon />
      </button>

      <div className="navbar-user">
        <button
          type="button"
          className="navbar-user-btn"
          onClick={() => setMenuOpen((value) => !value)}
          aria-haspopup="true"
          aria-expanded={menuOpen}
        >
          <Avatar name={name} />
          <span className="navbar-user-info">
            <span className="navbar-user-name">{name}</span>
            <span className="navbar-user-role">{roleLabel}</span>
          </span>
          <ChevronDownIcon />
        </button>

        {menuOpen && (
          <div className="navbar-dropdown" onMouseLeave={() => setMenuOpen(false)}>
            <div className="navbar-dropdown-header">
              <div className="navbar-dropdown-name">{name}</div>
              <div className="navbar-dropdown-email">{email}</div>
            </div>
            <button
              type="button"
              className="navbar-dropdown-item"
              onClick={() => {
                setMenuOpen(false)
                setConfirmOpen(true)
              }}
            >
              <LogoutIcon /> Logout
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Log out?"
        description="You'll need to sign in again to access your dashboard."
        confirmLabel="Log out"
        tone="danger"
        onConfirm={handleLogout}
        onCancel={() => setConfirmOpen(false)}
      />
    </header>
  )
}
