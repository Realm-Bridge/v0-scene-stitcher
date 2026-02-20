import type { Metadata } from 'next'
import { Orbitron, Montserrat, Fira_Code } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _orbitron = Orbitron({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });
const _montserrat = Montserrat({ subsets: ["latin"] });
const _firaCode = Fira_Code({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Scene Stitcher — Foundry VTT Module',
  description: 'Merge split map scenes back into unified scenes in Foundry VTT v13+. Supports 4K video backgrounds, walls, lights, tokens, and all embedded objects.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
