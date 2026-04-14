'use server'

import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { getWorkoutById, updateWorkout } from '@/data/workouts'

const updateWorkoutSchema = z.object({
  workoutId: z.number().int().positive(),
  name: z.string().min(1, 'Name is required').max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time'),
})

type UpdateWorkoutInput = z.infer<typeof updateWorkoutSchema>

export async function editWorkout(input: UpdateWorkoutInput) {
  const parsed = updateWorkoutSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { userId } = await auth()
  if (!userId) return { error: 'Unauthorized' }

  const existing = await getWorkoutById(parsed.data.workoutId, userId)
  if (!existing) return { error: 'Workout not found' }

  const startedAt = new Date(`${parsed.data.date}T${parsed.data.time}:00`)
  if (isNaN(startedAt.getTime())) {
    return { error: 'Invalid date or time' }
  }

  await updateWorkout(parsed.data.workoutId, userId, {
    name: parsed.data.name,
    startedAt,
  })

  return { redirectTo: `/dashboard?date=${parsed.data.date}` }
}
