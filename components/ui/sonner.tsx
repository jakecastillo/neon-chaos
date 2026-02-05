"use client"

import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "border border-white/10 bg-black/70 text-white backdrop-blur-md",
          title: "text-white",
          description: "text-white/75",
          actionButton:
            "bg-cyan-500/20 text-cyan-100 ring-1 ring-cyan-400/35",
          cancelButton: "bg-white/10 text-white/80"
        }
      }}
    />
  )
}

