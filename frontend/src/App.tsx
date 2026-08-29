import { Navigate, Route, Routes } from 'react-router-dom'
import './auth.css'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import TechnicianDashboardPage from './pages/TechnicianDashboardPage'
import TechnicianRegisterPage from './pages/TechnicianRegisterPage'
import TechnicianSearchPage from './pages/TechnicianSearchPage'

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
        path="/technician/dashboard"
        element={
          <ProtectedRoute role="technician">
            <TechnicianDashboardPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/register" replace />} />
    </Routes>
  )
}

export default App
