import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { Calendar } from './pages/Calendar'
import { PDFUpload } from './pages/PDFUpload'
import { ClassCatalog } from './pages/ClassCatalog'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }
  
  if (!user) {
    return <Navigate to="/login" />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <PDFUpload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/catalog"
            element={
              <ProtectedRoute>
                <ClassCatalog />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <Calendar />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/upload" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
