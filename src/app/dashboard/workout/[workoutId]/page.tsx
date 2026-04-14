import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getWorkoutById } from '@/data/workouts'
import EditWorkoutForm from './EditWorkoutForm'

interface Props {
  params: Promise<{ workoutId: string }>
}

function toDateString(d: Date) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function toTimeString(d: Date) {
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${min}`
}

export default async function EditWorkoutPage({ params }: Props) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { workoutId: workoutIdParam } = await params
  const workoutId = parseInt(workoutIdParam, 10)
  if (isNaN(workoutId)) notFound()

  const workout = await getWorkoutById(workoutId, userId)
  if (!workout) notFound()

  const startedAt = workout.startedAt ?? new Date()
  const defaultDate = toDateString(startedAt)
  const defaultTime = toTimeString(startedAt)

  return (
    <div className="min-h-screen bg-muted/40 flex items-start justify-center p-8">
      <div className="w-full max-w-5xl rounded-xl border bg-background shadow-2xl overflow-hidden">

        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-muted border-b">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <span className="flex-1 text-center text-sm font-medium text-muted-foreground">
            Lifting Diary — Edit Workout
          </span>
        </div>

        <div className="p-8">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Edit workout</CardTitle>
            </CardHeader>
            <CardContent>
              <EditWorkoutForm
                workoutId={workout.id}
                defaultName={workout.name}
                defaultDate={defaultDate}
                defaultTime={defaultTime}
              />
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
