import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Providers } from "@/components/providers"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Neon Chaos",
  description: "Chaotic arcade casino decision-making for groups."
}

export const viewport: Viewport = {
  themeColor: "#07070b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={cn("nc-scanlines min-h-dvh")}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

