import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { PrimeReactProvider } from 'primereact/api'
import 'primereact/resources/primereact.min.css' // structural CSS. The colors come from the swappable theme file
import './index.css'
import AppRoutes from './App'
import { AuthProvider } from './features/auth/AuthProvider'
import { createQueryClient } from './lib/queryClient'
import { ThemeProvider } from './features/theme/ThemeProvider'

const queryClient = createQueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <PrimeReactProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </AuthProvider>
        </QueryClientProvider>
      </PrimeReactProvider>
    </ThemeProvider>
  </StrictMode>,
)
