import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: 'ADE ENSA Tetouan | Smart Club Management',
  description: 'ADE ENSA Tetouan - The ultimate platform for managing club spaces, scheduling events, and collaborating seamlessly.',
  generator: 'v0.dev',
  icons: {
    icon: [
      { url: '/images/polaris-logo.png', sizes: 'any' }
    ],
    apple: { url: '/images/polaris-logo.png' }
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}



import './globals.css'