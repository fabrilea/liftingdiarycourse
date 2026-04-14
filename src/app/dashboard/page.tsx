import { Suspense } from 'react'
import { format } from 'date-fns'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { and, eq, gte, lt } from 'drizzle-orm'
import { db } from '@/db'
import { workouts } from '@/db/schema'
import DatePicker from './DatePicker'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Props {
  searchParams: Promise<{ date?: string }>
}

function todayString() {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

async function WorkoutList({ userId, date }: { userId: string; date: string }) {
  const dayStart = new Date(`${date}T00:00:00`)
  const dayEnd = new Date(`${date}T00:00:00`)
  dayEnd.setDate(dayEnd.getDate() + 1)

  const results = await db.query.workouts.findMany({
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

  if (results.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No workouts logged for this date.
      </p>
    )
  }

  return (
    <ul className="space-y-4">
      {results.map((workout) => (
        <li key={workout.id}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{workout.name}</CardTitle>
                <Badge variant="secondary">
                  {workout.workoutExercises.length}{' '}
                  {workout.workoutExercises.length === 1 ? 'exercise' : 'exercises'}
                </Badge>
              </div>
            </CardHeader>

            {workout.workoutExercises.length > 0 && (
              <CardContent className="space-y-4">
                {workout.workoutExercises.map((we, idx) => (
                  <div key={we.id}>
                    {idx > 0 && <Separator className="mb-4" />}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-sm">{we.exercise.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {we.sets.length} {we.sets.length === 1 ? 'set' : 'sets'}
                      </Badge>
                    </div>
                    {we.sets.length > 0 && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">Set</TableHead>
                            <TableHead className="w-16">Reps</TableHead>
                            <TableHead>Weight (kg)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {we.sets
                            .sort((a, b) => a.setNumber - b.setNumber)
                            .map((s) => (
                              <TableRow key={s.id}>
                                <TableCell>{s.setNumber}</TableCell>
                                <TableCell>{s.reps}</TableCell>
                                <TableCell>{s.weightKg ?? '—'}</TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        </li>
      ))}
    </ul>
  )
}

export default async function DashboardPage({ searchParams }: Props) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { date: dateParam } = await searchParams
  const date = dateParam ?? todayString()

  const formattedDate = format(new Date(`${date}T00:00:00`), 'do MMM yyyy')

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Dashboard</h1>

      <Suspense>
        <DatePicker value={date} />
      </Suspense>

      <Separator className="my-8" />

      <section>
        <h2 className="text-lg font-semibold mb-4">{formattedDate}</h2>
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading workouts…</p>}>
          <WorkoutList userId={userId} date={date} />
        </Suspense>
      </section>
    </main>
  )
}
