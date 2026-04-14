import { Suspense } from 'react'
import { format } from 'date-fns'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getWorkoutsForUserByDate } from '@/data/workouts'
import DatePicker from './DatePicker'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  const results = await getWorkoutsForUserByDate(userId, date)

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-sm text-muted-foreground italic">
          No workouts logged for this date.
        </p>
        <Button asChild size="sm">
          <Link href={`/dashboard/workout/new?date=${date}`}>
            + New workout
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {results.map((workout) => (
        <div key={workout.id}>
          {/* Workout header with time */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-base">{workout.name}</h3>
              {workout.startedAt && (
                <span className="text-xs text-muted-foreground font-medium tabular-nums">
                  {format(new Date(workout.startedAt), 'HH:mm')}
                </span>
              )}
            </div>
            <Badge variant="secondary">
              {workout.workoutExercises.length}{' '}
              {workout.workoutExercises.length === 1 ? 'exercise' : 'exercises'}
            </Badge>
          </div>

          {workout.workoutExercises.length > 0 && (
            <div className="space-y-4">
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
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default async function DashboardPage({ searchParams }: Props) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { date: dateParam } = await searchParams
  const date = dateParam ?? todayString()

  const formattedDate = format(new Date(`${date}T00:00:00`), 'do MMM yyyy')

  return (
    <div className="min-h-screen bg-muted/40 flex items-start justify-center p-8">
      {/* Desktop window chrome */}
      <div className="w-full max-w-5xl rounded-xl border bg-background shadow-2xl overflow-hidden">

        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-muted border-b">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <span className="flex-1 text-center text-sm font-medium text-muted-foreground">
            Lifting Diary — Dashboard
          </span>
        </div>

        {/* Window body: two-column layout */}
        <div className="flex divide-x min-h-[600px]">

          {/* Left panel: Calendar */}
          <div className="flex flex-col p-6 gap-4 shrink-0">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Calendar
            </h2>
            <Suspense>
              <DatePicker value={date} />
            </Suspense>
          </div>

          {/* Right panel: Workout detail */}
          <div className="flex-1 flex flex-col p-6 gap-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Workouts
              </h2>
              <span className="text-sm font-medium">{formattedDate}</span>
            </div>

            <Separator />

            <Suspense fallback={<p className="text-sm text-muted-foreground">Loading workouts…</p>}>
              <WorkoutList userId={userId} date={date} />
            </Suspense>
          </div>

        </div>
      </div>
    </div>
  )
}
