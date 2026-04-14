'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { createWorkout } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface Props {
  defaultDate: string // "YYYY-MM-DD"
}

function toDateString(d: Date) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function nowTimeString() {
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  return `${hh}:${min}`
}

export default function NewWorkoutForm({ defaultDate }: Props) {
  const [name, setName] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date>(
    new Date(`${defaultDate}T00:00:00`)
  )
  const [time, setTime] = useState(nowTimeString)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await createWorkout({
        name,
        date: toDateString(selectedDate),
        time,
      })
      if (result?.error) {
        setError(result.error)
        return
      }
      if (result?.redirectTo) {
        router.push(result.redirectTo)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Workout name</Label>
        <Input
          id="name"
          placeholder="e.g. Push Day, Leg Day…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isPending}
          autoFocus
        />
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label>Date</Label>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              className={cn(
                'w-full justify-start text-left font-normal',
                !selectedDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDate, 'do MMM yyyy')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => {
                if (d) {
                  setSelectedDate(d)
                  setCalendarOpen(false)
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Time */}
      <div className="space-y-2">
        <Label htmlFor="time">Time</Label>
        <Input
          id="time"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          disabled={isPending}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating…' : 'Create workout'}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
