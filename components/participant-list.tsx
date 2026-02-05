import type { ParticipantRow } from "@/lib/models"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

function roleBadge(role: ParticipantRow["role"]) {
  if (role === "HOST") return "Host"
  if (role === "PLAYER") return "Player"
  return "Spectator"
}

export function ParticipantList({ participants }: { participants: ParticipantRow[] }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-white/85">People</div>
        <Badge className="bg-white/10 text-white/70">{participants.length}</Badge>
      </div>
      <div className="mt-3 space-y-2">
        {participants.slice(0, 18).map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-3">
            <div className="min-w-0 truncate text-sm text-white/85">
              {p.nickname}
            </div>
            <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/70">
              {roleBadge(p.role)}
            </span>
          </div>
        ))}
        {participants.length > 18 ? (
          <div className="pt-1 text-xs text-white/55">
            +{participants.length - 18} more…
          </div>
        ) : null}
      </div>
    </Card>
  )
}

