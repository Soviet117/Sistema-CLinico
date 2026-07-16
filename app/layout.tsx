import './globals.css'
import DashboardLayout from '@/components/DashboardLayout'
import ThemeProvider from '@/components/ThemeProvider'
import AuthProvider from '@/components/AuthProvider'
import ToastProvider from '@/components/ToastProvider'
import ErrorBoundary from '@/components/ErrorBoundary'

export const metadata = {
  title: 'Silvestre Clinic Manager',
  description: 'Silvestre Clinic Manager - Sistema de gestión clínica profesional',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <ErrorBoundary>
                <DashboardLayout>
                  {children}
                </DashboardLayout>
              </ErrorBoundary>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
