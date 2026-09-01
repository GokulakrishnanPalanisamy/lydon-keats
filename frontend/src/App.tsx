import { Navigate, Route, Routes } from 'react-router-dom'
import './auth.css'
import './dashboard.css'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardPage from './pages/DashboardPage'
import FrequenciesPage from './pages/FrequenciesPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import SettingsPage from './pages/SettingsPage'
import TaskBuilderPage from './pages/TaskBuilderPage'
import TechnicianDashboardPage from './pages/TechnicianDashboardPage'
import TechnicianRegisterPage from './pages/TechnicianRegisterPage'
import TechnicianSearchPage from './pages/TechnicianSearchPage'
import TechnicianTaskDetailPage from './pages/TechnicianTaskDetailPage'
import TechnicianTasksPage from './pages/TechnicianTasksPage'
import WorkTagsPage from './pages/WorkTagsPage'

function App() {
  return (
    <Routes>
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/technician/register" element={<TechnicianRegisterPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute role="admin">
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/technicians"
        element={
          <ProtectedRoute role="admin">
            <TechnicianSearchPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tasks"
        element={
          <ProtectedRoute role="admin">
            <TaskBuilderPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/work-tags"
        element={
          <ProtectedRoute role="admin">
            <WorkTagsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/frequencies"
        element={
          <ProtectedRoute role="admin">
            <FrequenciesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/technician/dashboard"
        element={
          <ProtectedRoute role="technician">
            <TechnicianDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/technician/tasks"
        element={
          <ProtectedRoute role="technician">
            <TechnicianTasksPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/technician/tasks/:taskId"
        element={
          <ProtectedRoute role="technician">
            <TechnicianTaskDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/register" replace />} />
    </Routes>
  )
}

export default App
