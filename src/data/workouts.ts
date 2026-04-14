import { and, eq, gte, lt } from 'drizzle-orm'
import { db } from '@/db'
import { workouts } from '@/db/schema'

export async function getWorkoutsForUserByDate(userId: string, date: string) {
  const dayStart = new Date(`${date}T00:00:00`)
  const dayEnd = new Date(`${date}T00:00:00`)
  dayEnd.setDate(dayEnd.getDate() + 1)

  return db.query.workouts.findMany({
    where: and(
      eq(workouts.userId, userId),
      gte(workouts.createdAt, dayStart),
      lt(workouts.createdAt, dayEnd)
    ),
    with: {
      workoutExercises: {
        with: {
          exercise: true,
          sets: true,
        },
        orderBy: (we, { asc }) => [asc(we.order)],
      },
    },
    orderBy: (w, { desc }) => [desc(w.createdAt)],
  })
}
