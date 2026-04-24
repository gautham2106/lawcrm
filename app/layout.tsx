import type { Metadata, Viewport } from 'next'
import './globals.css'
import NavbarWrapper from '@/components/layout/NavbarWrapper'

export const metadata: Metadata = {
  title: 'CaseBook — Law Firm CRM',
  description: 'Manage your law firm cases, clients, hearings, and tasks',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CaseBook',
  },
}

export const viewport: Viewport = {
  themeColor: '#1a1814',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#e7e3d8]">
        <div className="max-w-5xl mx-auto px-4 pb-24 pt-6">
          {children}
        </div>
        <NavbarWrapper />
      </body>
    </html>
  )
}
