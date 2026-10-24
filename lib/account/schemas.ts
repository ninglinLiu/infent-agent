import { z } from 'zod'

export const profilePatch = z.object({ display_name: z.string().trim().min(1).max(20), language: z.enum(['zh', 'en']).optional() }).strict()
export const progressPatch = z.object({
  name: z.string().trim().max(20), storyStep: z.number().int().min(0).max(3),
  lessonStep: z.number().int().min(0).max(6), simulationStep: z.number().int().min(0).max(4),
  reducedMotion: z.boolean(), presentation: z.enum(['classic', 'immersive']),
}).partial().strict().refine(value => Object.keys(value).length > 0)
export const watchItem = z.object({ symbol: z.string().trim().toUpperCase().regex(/^[A-Z0-9.^=-]{1,20}$/) }).strict()
