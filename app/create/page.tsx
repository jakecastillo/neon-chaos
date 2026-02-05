import { Suspense } from "react"
import CreateRoomClient from "./create-client"
import { Card } from "@/components/ui/card"

function Loading() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-4 pb-[calc(20px+env(safe-area-inset-bottom))] pt-[calc(20px+env(safe-area-inset-top))]">
      <header className="space-y-1 pt-2">
        <div className="text-xs text-white/55">Create room</div>
        <h1 className="text-xl font-semibold tracking-tight">Set the chaos.</h1>
      </header>
      <Card className="h-40 animate-pulse p-4" />
      <Card className="h-64 animate-pulse p-4" />
      <div className="mt-auto h-24 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
    </main>
  )
}

export default function CreateRoomPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CreateRoomClient />
    </Suspense>
  )
}

