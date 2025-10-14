import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Sistema de Gestão de Patrimônio",
  description: "Sistema de gestão de patrimônio orientado a contratos",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} antialiased`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
