import { z } from "zod"

export async function parseJson<T extends z.ZodTypeAny>(req: Request, schema: T) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten() }
  }
  return { ok: true as const, data: parsed.data as z.infer<T> }
}

export function json(data: any, init?: ResponseInit) {
  return Response.json(data, init)
}

export function jsonError(message: string, status = 400, extra?: any) {
  return Response.json({ ok: false, error: message, ...extra }, { status })
}

