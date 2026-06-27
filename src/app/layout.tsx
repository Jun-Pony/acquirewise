import type { Metadata } from 'next'
import './globals.css'
import { LangProvider } from '@/context/LangContext'

export const metadata: Metadata = {
  title: 'AcquireWise — Oil & Gas M&A Analysis',
  description: 'Professional M&A analysis platform for oil and gas assets',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh" className="h-full">
      <body className="h-full antialiased">
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  )
}
