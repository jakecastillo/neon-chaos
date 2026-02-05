import * as React from "react"
import { cn } from "@/lib/utils"

export function Card({
  className,
  neon = false,
  neonColor = "cyan",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { neon?: boolean; neonColor?: "cyan" | "magenta" | "green" }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/5 shadow-sm backdrop-blur-md transition-all duration-300",
        neon && `neon-border-${neonColor}`,
        neon && "hover:shadow-[0_0_25px_rgba(0,255,229,0.3)]",
        className
      )}
      {...props}
    />
  )
}

