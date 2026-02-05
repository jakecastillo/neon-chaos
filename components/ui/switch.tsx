"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

export function Switch({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer inline-flex h-[28px] w-[50px] shrink-0 cursor-pointer items-center rounded-full border border-white/15 bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-cyan-500/30 data-[state=checked]:border-cyan-400/30",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block h-5 w-5 translate-x-1 rounded-full bg-white/80 shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-[26px] data-[state=checked]:bg-cyan-200"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

