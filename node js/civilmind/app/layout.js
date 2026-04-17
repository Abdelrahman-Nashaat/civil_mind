import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata = {
  title: 'CivilMind — AI للمهندسين المدنيين',
  description: 'مساعد ذكي متخصص في الكودات الهندسية المصرية والسعودية',
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="ar" dir="rtl">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
