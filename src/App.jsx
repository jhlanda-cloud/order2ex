import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import OrderPage from './pages/OrderPage.jsx'
import AuthPage from './pages/AuthPage.jsx'
import MyOrdersPage from './pages/MyOrdersPage.jsx'
import AdminPage from './pages/AdminPage.jsx'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/auth" replace />
  return children
}

function RequireOwner({ children }) {
  const { user, isOwner, loading } = useAuth()
  if (loading) return null
  if (!user || !isOwner) return <Navigate to="/" replace />
  return children
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<OrderPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/my"
            element={
              <RequireAuth>
                <MyOrdersPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireOwner>
                <AdminPage />
              </RequireOwner>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
