import { AuthProvider, useAuth } from './hooks/useAuth.jsx'
import { DataProvider } from './hooks/useData.jsx'
import { ToastProvider } from './components/ui/Toast.jsx'
import AuthScreen from './components/screens/AuthScreen.jsx'
import SetupScreen from './components/screens/SetupScreen.jsx'
import MainApp from './components/screens/MainApp.jsx'

function AppRouter() {
  const { user, loading } = useAuth()

  if (loading) {
    // Minimal loading state — avoid flash
    return (
      <div style={{
        minHeight: '100dvh',
        background: 'var(--ink)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          fontFamily: 'var(--f-mono)',
          fontSize: 11,
          letterSpacing: '0.2em',
          color: 'rgba(245,240,232,0.3)',
          textTransform: 'uppercase',
        }}>
          Loading…
        </div>
      </div>
    )
  }

  if (!user) return <AuthScreen />
  if (!user.name) return <SetupScreen />
  return <MainApp />
}

// DataProvider must be inside AuthProvider (it reads useAuth)
function AuthedApp() {
  return (
    <DataProvider>
      <AppRouter />
    </DataProvider>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AuthedApp />
      </AuthProvider>
    </ToastProvider>
  )
}
