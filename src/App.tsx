import DashboardScreen from '@/features/dashboard/dashboard-screen'

// Auth guard is handled in __root.tsx via beforeLoad — no need for a useEffect here.
function App() {
  return <DashboardScreen />
}

export default App
