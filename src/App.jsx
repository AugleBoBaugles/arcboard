import { AuthProvider } from './contexts/AuthContext'
import { AuthGate } from './components/auth/AuthGate'
import { Header } from './components/layout/Header'
import { TimelineView } from './components/timeline/TimelineView'

function App() {
  return (
    <AuthProvider>
      <AuthGate>
        <Header />
        <TimelineView />
      </AuthGate>
    </AuthProvider>
  )
}

export default App
