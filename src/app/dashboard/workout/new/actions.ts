'use server'

import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { insertWorkout } from '@/data/workouts'

const createWorkoutSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  // ISO date string: "YYYY-MM-DD"
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  // 24-hour time string: "HH:MM"
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time'),
})

type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>

export async function createWorkout(input: CreateWorkoutInput) {
  const parsed = createWorkoutSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { userId } = await auth()
  if (!userId) return { error: 'Unauthorized' }

  const startedAt = new Date(`${parsed.data.date}T${parsed.data.time}:00`)
  if (isNaN(startedAt.getTime())) {
    return { error: 'Invalid date or time' }
  }

  await insertWorkout({ name: parsed.data.name, userId, startedAt })
  return { redirectTo: `/dashboard?date=${parsed.data.date}` }
}
