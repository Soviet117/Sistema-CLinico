import './globals.css'
import DashboardLayout from '@/components/DashboardLayout'
import ThemeProvider from '@/components/ThemeProvider'

export const metadata = {
  title: 'MediHist - Sistema de Gestión Clínica',
  description: 'Sistema de gestión de historias clínicas y dashboard médico profesional',
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
          <DashboardLayout>
            {children}
          </DashboardLayout>
        </ThemeProvider>
      </body>
    </html>
  )
}
