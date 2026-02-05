import * as React from "react"
import { cn } from "@/lib/utils"

export function Input({
  className,
  type,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-12 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/45 outline-none ring-offset-black transition-all duration-300",
        "focus-visible:ring-2 focus-visible:ring-cyan-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:shadow-[0_0_20px_rgba(0,255,229,0.3)]",
        "focus-visible:border-cyan-400/50",
        className
      )}
      {...props}
    />
  )
}

