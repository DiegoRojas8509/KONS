import type { Metadata } from "next"
import { Anton, Inter, JetBrains_Mono } from "next/font/google"

import "./globals.css"

// Display: condensed bold for the giant artist names. Sans: running text. Mono: nav and metadata.
const anton = Anton({ variable: "--font-anton", weight: "400", subsets: ["latin"] })
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] })
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] })

export const metadata: Metadata = {
  title: { default: "KONS", template: "%s" },
  description: "Renovamos tu espacio con arte original.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${anton.variable} ${inter.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">{children}</body>
    </html>
  )
}
