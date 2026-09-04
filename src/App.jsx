import { AuthProvider } from './contexts/AuthContext'
import { AuthGate } from './components/auth/AuthGate'
import { Header } from './components/layout/Header'
import { Board } from './components/timeline/Board'

function App() {
  return (
    <AuthProvider>
      <AuthGate>
        <Header />
        <Board />
      </AuthGate>
    </AuthProvider>
  )
}

export default App
