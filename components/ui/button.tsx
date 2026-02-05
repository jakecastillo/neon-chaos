"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: "default" | "secondary" | "ghost" | "destructive" | "neon-magenta" | "neon-green"
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
        "inline-flex select-none items-center justify-center gap-2 rounded-xl text-sm font-medium ring-offset-background transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        "min-h-[44px] px-4 py-2",
        variant === "default" &&
          "bg-cyan-500/20 text-cyan-100 ring-1 ring-cyan-400/50 shadow-[0_0_24px_rgba(0,255,229,0.25)] hover:bg-cyan-500/30 hover:shadow-[0_0_32px_rgba(0,255,229,0.4)] transition-shadow duration-300",
        variant === "secondary" &&
          "bg-white/10 text-white/90 ring-1 ring-white/20 hover:bg-white/15 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-shadow duration-300",
        variant === "ghost" &&
          "bg-transparent text-white/80 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-shadow duration-300",
        variant === "destructive" &&
          "bg-rose-500/20 text-rose-100 ring-1 ring-rose-400/50 shadow-[0_0_24px_rgba(255,0,102,0.25)] hover:bg-rose-500/30 hover:shadow-[0_0_32px_rgba(255,0,102,0.4)] transition-shadow duration-300",
        variant === "neon-magenta" &&
          "bg-magenta-500/20 text-magenta-100 ring-1 ring-magenta-400/50 shadow-[0_0_24px_rgba(255,0,196,0.25)] hover:bg-magenta-500/30 hover:shadow-[0_0_32px_rgba(255,0,196,0.4)] transition-shadow duration-300",
        variant === "neon-green" &&
          "bg-green-500/20 text-green-100 ring-1 ring-green-400/50 shadow-[0_0_24px_rgba(0,255,136,0.25)] hover:bg-green-500/30 hover:shadow-[0_0_32px_rgba(0,255,136,0.4)] transition-shadow duration-300",
        className
      )}
      {...props}
    />
  )
}

