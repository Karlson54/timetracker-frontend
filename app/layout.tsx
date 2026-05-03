import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/lib/AuthContext"
import I18nProvider from "@/lib/I18nProvider"

export const metadata: Metadata = {
  title: "MediaCom TimeTracker",
  description: "Система обліку робочого часу MediaCom",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  )
}