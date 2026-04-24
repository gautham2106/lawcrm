import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'

export const metadata: Metadata = {
  title: 'CaseBook — Law Firm CRM',
  description: 'Manage your law firm cases, clients, hearings, and tasks',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#e7e3d8]">
        <div className="max-w-5xl mx-auto px-4 pb-24 pt-6">
          {children}
        </div>
        <Navbar />
      </body>
    </html>
  )
}
