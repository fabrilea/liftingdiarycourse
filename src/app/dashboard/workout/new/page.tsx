import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import NewWorkoutForm from './NewWorkoutForm'

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

export default async function NewWorkoutPage({ searchParams }: Props) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { date: dateParam } = await searchParams
  const defaultDate = dateParam ?? todayString()

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
            Lifting Diary — New Workout
          </span>
        </div>

        <div className="p-8">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>New workout</CardTitle>
            </CardHeader>
            <CardContent>
              <NewWorkoutForm defaultDate={defaultDate} />
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
