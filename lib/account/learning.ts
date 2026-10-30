import { z } from 'zod'

export type LocalText = { zh: string; en: string }
export type CourseContent = {
  disclaimer: LocalText
  notes: LocalText[]
  scenes: { title: LocalText; text: LocalText; mentor: LocalText; choices: { id: string; label: LocalText }[]; cashChoices?: { id: string; label: LocalText }[] }[]
  feedback: Record<string, LocalText>
}
export type Attempt = {
  id: string; user_id: string; course_id: string; script_version: string; scene: number
  status: 'active' | 'stopped' | 'completed' | 'abandoned'; revision: number
  cash_cents: number; shares: number; cost_cents: number; price_cents: number
  realized_cents: number; total_cents: number; unrealized_cents: number
  notes: string[]; review: string | null; started_at: string; updated_at: string; completed_at: string | null
  parent_id: string | null
}
export type ChoiceEvent = { id: string; attempt_id: string; scene: number; action: string; reason: string; created_at: string }
export type Entitlement = { package_id: string; source: 'demo' | 'payment'; active: boolean; granted_at: string }
export type Course = { id: string; script_version: string; title: LocalText; ordinal: number; package_id: string | null; availability: 'published' | 'preparing' | 'internal'; allowed: boolean }
export type LearningData = { courses: Course[]; attempts: Attempt[]; entitlements: Entitlement[] }
export const learningAction = z.object({
  operationId: z.string().uuid(), action: z.enum(['start', 'reset', 'research', 'wait_quarter', 'buy_80', 'buy_40', 'hold_rules', 'sell_fear', 'review', 'reserve_cash', 'reduce_exposure', 'retain_cash', 'enter_pullback', 'keep_position', 'exit_position']),
  courseId: z.string().min(1).max(80), attemptId: z.string().uuid().nullable().default(null),
  revision: z.number().int().nonnegative().default(0), reason: z.string().trim().max(2000).default(''),
}).strict()
export type LearningAction = z.infer<typeof learningAction>
export const money = (cents: number) => (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const noteIds = ['moat', 'valuation', 'position', 'review']
