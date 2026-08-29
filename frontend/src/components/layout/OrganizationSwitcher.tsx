import { useMemo, useState } from 'react'
import { ApiError } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { CheckCircleIcon, ChevronDownIcon, SearchIcon } from '../icons/Icons'
import Spinner from '../ui/Spinner'
import type { Organization } from '../../types'

const SEARCH_THRESHOLD = 5

// Stable reference so useMemo's dependency doesn't change identity on
// every render when there's no technician account (a fresh [] literal
// would).
const NO_ORGANIZATIONS: Organization[] = []

export default function OrganizationSwitcher() {
  const { account, activeOrganization, switchingOrganization, selectOrganization } = useAuth()
  const { notify } = useToast()

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const organizations = account?.type === 'technician' ? account.organizations : NO_ORGANIZATIONS

  const filtered = useMemo(() => {
    if (organizations.length <= SEARCH_THRESHOLD || query.trim() === '') {
      return organizations
    }

    const term = query.trim().toLowerCase()
    return organizations.filter((organization) => organization.name.toLowerCase().includes(term))
  }, [organizations, query])

  if (!account || account.type !== 'technician' || organizations.length === 0) {
    return null
  }

  async function handleSelect(organization: Organization) {
    if (organization.id === activeOrganization?.id) {
      setOpen(false)
      return
    }

    try {
      await selectOrganization(organization)
      setOpen(false)
      setQuery('')
    } catch (error) {
      notify('error', error instanceof ApiError ? error.message : 'Could not switch organization.')
    }
  }

  return (
    <div className="org-switcher">
      <button
        type="button"
        className="org-switcher-btn"
        onClick={() => setOpen((value) => !value)}
        disabled={switchingOrganization}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {switchingOrganization ? (
          <>
            <Spinner size={14} />
            <span className="org-switcher-label">Switching...</span>
          </>
        ) : (
          <span className="org-switcher-label">{activeOrganization ? activeOrganization.name : 'Select Organization'}</span>
        )}
        <ChevronDownIcon />
      </button>

      {open && (
        <div className="org-switcher-dropdown" onMouseLeave={() => setOpen(false)}>
          <div className="org-switcher-header">Select Organization</div>

          {organizations.length > SEARCH_THRESHOLD && (
            <div className="org-switcher-search">
              <SearchIcon />
              <input
                type="text"
                placeholder="Search organizations"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                autoFocus
              />
            </div>
          )}

          <div className="org-switcher-list">
            {filtered.length === 0 ? (
              <div className="org-switcher-empty">No organizations match.</div>
            ) : (
              filtered.map((organization) => {
                const isActive = organization.id === activeOrganization?.id

                return (
                  <button
                    key={organization.id}
                    type="button"
                    className={`org-switcher-item${isActive ? ' active' : ''}`}
                    onClick={() => handleSelect(organization)}
                    disabled={switchingOrganization}
                  >
                    <span>{organization.name}</span>
                    {isActive && <CheckCircleIcon />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
