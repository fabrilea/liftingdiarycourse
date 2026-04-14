import { and, eq, gte, lt } from 'drizzle-orm'
import { db } from '@/db'
import { workouts } from '@/db/schema'

export async function insertWorkout(data: {
  userId: string
  name: string
  startedAt: Date
}) {
  const result = await db.insert(workouts).values(data).returning({ id: workouts.id })
  return result[0]
}

export async function getWorkoutById(workoutId: number, userId: string) {
  return db.query.workouts.findFirst({
    where: and(eq(workouts.id, workoutId), eq(workouts.userId, userId)),
  })
}

export async function updateWorkout(
  workoutId: number,
  userId: string,
  data: { name: string; startedAt: Date }
) {
  return db
    .update(workouts)
    .set({ name: data.name, startedAt: data.startedAt })
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
}

export async function getWorkoutsForUserByDate(userId: string, date: string) {
  const dayStart = new Date(`${date}T00:00:00`)
  const dayEnd = new Date(`${date}T00:00:00`)
  dayEnd.setDate(dayEnd.getDate() + 1)

  return db.query.workouts.findMany({
    where: and(
      eq(workouts.userId, userId),
      gte(workouts.startedAt, dayStart),
      lt(workouts.startedAt, dayEnd)
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
    orderBy: (w, { asc }) => [asc(w.startedAt)],
  })
}
