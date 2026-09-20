import type { Metadata } from 'next'
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/lib/theme'
import './globals.css'

const dmSans = Inter({
  subsets:  ['latin'],
  weight:   ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display:  'swap',
})

const dmSerif = Space_Grotesk({
  subsets:  ['latin'],
  weight:   ['400', '500', '600', '700'],
  variable: '--font-serif',
  display:  'swap',
  // NOTE: Space Grotesk ships normal style only — no italic axis.
})

const dmMono = JetBrains_Mono({
  subsets:  ['latin'],
  weight:   ['400', '500', '600', '700'],
  variable: '--font-mono',
  display:  'swap',
})

export const metadata: Metadata = {
  title:       'AurumOS Admin',
  description: 'License management for AurumOS Jewelry ERP',
}

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmSerif.variable} ${dmMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            const t = localStorage.getItem('aurum-theme');
            if (t === 'dark') document.documentElement.classList.add('dark');
          } catch(e) {}
        ` }} />
      </head>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      </body>
    </html>
  )
}
