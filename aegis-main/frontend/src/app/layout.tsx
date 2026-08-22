import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AEGIS AI | Autonomous Disaster Command Center',
  description: 'Multi-agent AI-powered emergency operations center for autonomous disaster response and coordination.',
  keywords: 'disaster response, AI, emergency management, autonomous agents, flood response',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark min-h-full">
      <body className="min-h-full overflow-x-hidden bg-[#0a0e1a]">
        {children}
      </body>
    </html>
  )
}
