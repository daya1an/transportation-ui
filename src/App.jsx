import { Navigate, Route, Routes } from 'react-router-dom'
import RequireAuth from './features/auth/RequireAuth'
import AppShell from './layout/AppShell'
import DashboardPage from './features/dashboard/DashboardPage'
import LoginPage from './features/auth/LoginPage'
import ExplorerPage from './features/explorer/ExplorerPage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/explorer" element={<ExplorerPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
