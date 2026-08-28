import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { LoginForm } from './LoginForm'
import { SignupForm } from './SignupForm'

export function AuthGate({ children }) {
  const { user, loading } = useAuth()
  const [mode, setMode] = useState('login')

  if (loading) {
    return <div className="centered-message">Loading…</div>
  }

  if (!user) {
    return (
      <div className="auth-screen">
        {mode === 'login' ? (
          <LoginForm onSwitchToSignup={() => setMode('signup')} />
        ) : (
          <SignupForm onSwitchToLogin={() => setMode('login')} />
        )}
      </div>
    )
  }

  return children
}
