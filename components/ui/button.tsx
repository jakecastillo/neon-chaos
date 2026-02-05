"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: "default" | "secondary" | "ghost" | "destructive"
}

export function Button({
  className,
  variant = "default",
  asChild,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 rounded-xl text-sm font-medium ring-offset-background transition-colors active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        "min-h-[44px] px-4 py-2",
        variant === "default" &&
          "bg-cyan-500/20 text-cyan-100 ring-1 ring-cyan-400/35 shadow-[0_0_24px_rgba(0,255,229,0.18)] hover:bg-cyan-500/25",
        variant === "secondary" &&
          "bg-white/10 text-white/90 ring-1 ring-white/15 hover:bg-white/15",
        variant === "ghost" &&
          "bg-transparent text-white/80 hover:bg-white/10",
        variant === "destructive" &&
          "bg-rose-500/20 text-rose-100 ring-1 ring-rose-400/30 hover:bg-rose-500/25",
        className
      )}
      {...props}
    />
  )
}

