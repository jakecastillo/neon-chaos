"use client"

import * as React from "react"
import { Toaster } from "@/components/ui/sonner"
import { QualityProvider } from "@/lib/quality"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QualityProvider>
      {children}
      <Toaster />
    </QualityProvider>
  )
}

