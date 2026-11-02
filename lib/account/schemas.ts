import { z } from 'zod'

export const profilePatch = z.object({ display_name: z.string().trim().min(1).max(20), language: z.enum(['zh', 'en']).optional() }).strict()
export const progressPatch = z.object({
  name: z.string().trim().max(20), storyStep: z.number().int().min(0).max(3),
  lessonStep: z.number().int().min(0).max(6), simulationStep: z.number().int().min(0).max(4),
  reducedMotion: z.boolean(), presentation: z.enum(['classic', 'immersive']),
  replays: z.record(z.string().regex(/^[a-z0-9-]{1,24}$/), z.object({
    final: z.number().finite().min(0).max(10_000_000), hold: z.number().finite().min(0).max(10_000_000),
    decisions: z.array(z.enum(['add', 'hold', 'trim', 'exit'])).max(8), at: z.string().datetime(),
  }).strict()).refine(value => Object.keys(value).length <= 12),
}).partial().strict().refine(value => Object.keys(value).length > 0)
export const watchItem = z.object({ symbol: z.string().trim().toUpperCase().regex(/^[A-Z0-9.^=-]{1,20}$/) }).strict()
