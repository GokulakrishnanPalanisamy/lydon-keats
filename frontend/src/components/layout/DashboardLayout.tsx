import { useState, type ReactNode } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function DashboardLayout({
  title,
  breadcrumb,
  children,
}: {
  title: string
  breadcrumb?: string[]
  children: ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="app-main">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="app-content">
          <div className="page-header">
            {breadcrumb && breadcrumb.length > 0 && <div className="breadcrumb">{breadcrumb.join(' / ')}</div>}
            <h1>{title}</h1>
          </div>

          {children}
        </main>
      </div>
    </div>
  )
}
