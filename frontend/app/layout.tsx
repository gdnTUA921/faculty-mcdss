import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MCDSS — Faculty Multi-Criteria Decision Support System',
  description: 'A web-based platform for faculty hiring and teaching load allocation.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
