import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { accountAuth, accountError, AccountError, readBody } from '@/lib/account/server'
import { learningAction } from '@/lib/account/learning'

export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  try {
    const ctx = await accountAuth.require(req)
    const id = req.nextUrl.searchParams.get('attempt')
    const course = req.nextUrl.searchParams.get('course')
    if (id) {
      if (!z.string().uuid().safeParse(id).success) throw new AccountError(400, 'Invalid attempt.')
      const { data: attempt, error } = await ctx.db.from('learning_attempts').select('*').eq('id', id).eq('user_id', ctx.user.id).maybeSingle()
      if (error) throw error
      if (!attempt) throw new AccountError(404, 'Attempt not found.')
      const [content, choices] = await Promise.all([
        ctx.db.from('learning_content').select('content').eq('course_id', attempt.course_id).eq('script_version', attempt.script_version).maybeSingle(),
        ctx.db.from('learning_choices').select('*').eq('attempt_id', id).eq('user_id', ctx.user.id).order('created_at'),
      ])
      if (content.error || choices.error) throw content.error || choices.error
      if (!content.data) throw new AccountError(403, '课程尚未开放或需要解锁 / Course unavailable or locked.')
      return ctx.finish(NextResponse.json({ attempt, content: content.data.content, choices: choices.data }))
    }
    if (course) {
      const { data, error } = await ctx.db.from('learning_content').select('content,script_version').eq('course_id', course).order('script_version', { ascending: false }).limit(1).maybeSingle()
      if (error) throw error
      if (!data) throw new AccountError(403, '课程尚未开放或需要解锁 / Course unavailable or locked.')
      return ctx.finish(NextResponse.json(data))
    }
    const [courses, attempts, entitlements, accessible] = await Promise.all([
      ctx.db.from('learning_courses').select('*').order('ordinal'),
      ctx.db.from('learning_attempts').select('*').eq('user_id', ctx.user.id).order('started_at', { ascending: false }).limit(100),
      ctx.db.from('course_entitlements').select('package_id,source,active,granted_at').eq('user_id', ctx.user.id),
      ctx.db.from('learning_content').select('course_id,script_version'),
    ])
    for (const result of [courses, attempts, entitlements, accessible]) if (result.error) throw result.error
    const catalog = courses.data?.filter(c => !courses.data?.some(other => other.id === c.id && other.script_version > c.script_version))
    return ctx.finish(NextResponse.json({ courses: catalog?.map(c => ({ ...c, allowed: accessible.data?.some(a => a.course_id === c.id && a.script_version === c.script_version) })), attempts: attempts.data, entitlements: entitlements.data }))
  } catch (error) { return accountError(error) }
}
export async function POST(req: NextRequest) {
  try {
    const ctx = await accountAuth.require(req)
    const parsed = learningAction.safeParse(await readBody(req))
    if (!parsed.success) throw new AccountError(400, 'Invalid learning action.')
    const p = parsed.data
    const { data, error } = await ctx.db.rpc('learning_act', { p_operation_id: p.operationId, p_course_id: p.courseId, p_attempt_id: p.attemptId, p_revision: p.revision, p_action: p.action, p_reason: p.reason })
    if (error) {
      if (error.message.includes('Attempt not found')) throw new AccountError(404, 'Attempt not found.')
      if (error.message.includes('Course locked')) throw new AccountError(403, '课程尚未开放或需要解锁 / Course unavailable or locked.')
      if (/Stale attempt|Operation conflict/.test(error.message)) throw new AccountError(409, '进度已改变，请重新加载 / Progress changed. Reload before continuing.')
      if (error.message.includes('Invalid action')) throw new AccountError(400, '无效选择或复盘 / Invalid choice or review.')
      throw error
    }
    return ctx.finish(NextResponse.json({ attempt: data, saved: true }))
  } catch (error) { return accountError(error) }
}
