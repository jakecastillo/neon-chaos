import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { templates } from "@/lib/templates"

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-4 pb-[calc(20px+env(safe-area-inset-bottom))] pt-[calc(20px+env(safe-area-inset-top))]">
      <header className="flex items-center justify-between pt-2">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Neon Chaos</h1>
          <p className="text-sm text-white/70">
            Chaotic arcade casino decisions for groups.
          </p>
        </div>
        <Badge className="bg-white/10 text-white/80">MVP</Badge>
      </header>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-white/85">Games</h2>
        <div className="space-y-3">
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white/90">
                    Roulette Vote
                  </div>
                  <div className="text-xs text-white/65">
                    Everyone drops one chip. House Chaos decides the rest.
                  </div>
                </div>
                <Badge className="bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/30">
                  Playable
                </Badge>
              </div>
              <Button asChild className="h-12 w-full">
                <Link href="/create">Create room</Link>
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-white/90">
                  Coming soon
                </div>
                <Badge className="bg-white/10 text-white/70 ring-1 ring-white/15">
                  Soon
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="ghost"
                  disabled
                  className="h-11 border border-white/10 text-white/60"
                >
                  Marble Pachinko
                </Button>
                <Button
                  variant="ghost"
                  disabled
                  className="h-11 border border-white/10 text-white/60"
                >
                  Spin Duel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-white/85">Templates</h2>
        <div className="grid grid-cols-1 gap-2">
          {templates.map((t) => (
            <Card key={t.id} className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-white/60">
                    {t.options.slice(0, 3).join(" • ")}
                    {t.options.length > 3 ? " • …" : ""}
                  </div>
                </div>
                <Button
                  asChild
                  variant="secondary"
                  className="h-10 shrink-0 px-3"
                >
                  <Link
                    href={`/create?template=${encodeURIComponent(t.id)}`}
                  >
                    Use
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <footer className="mt-auto pt-4 text-center text-xs text-white/50">
        No login required. Share a link, chaos follows.
      </footer>
    </main>
  )
}
