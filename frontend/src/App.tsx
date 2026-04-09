import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Sidebar from '@/components/Sidebar'
import Dashboard from '@/pages/Dashboard'
import NodeDetail from '@/pages/NodeDetail'
import AlertsPage from '@/pages/AlertsPage'
import RulesPage from '@/pages/RulesPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 4000,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 flex flex-col overflow-hidden">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/nodes/:id" element={<NodeDetail />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/rules" element={<RulesPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
