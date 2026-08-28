import { useAuth } from '../../contexts/AuthContext'

export function Header() {
  const { user, signOut } = useAuth()

  return (
    <header className="app-header">
      <span className="app-title">Arcboard</span>
      <div className="app-header-user">
        <span>{user.email}</span>
        <button type="button" className="link-button" onClick={signOut}>
          Log out
        </button>
      </div>
    </header>
  )
}
