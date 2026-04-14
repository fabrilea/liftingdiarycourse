'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'

interface Props {
  value: string // YYYY-MM-DD
}

function parseLocalDate(str: string): Date {
  const [year, month, day] = str.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function toLocalDateString(date: Date): string {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function DatePicker({ value }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selected, setSelected] = useState<Date>(parseLocalDate(value))

  function handleSelect(date: Date | undefined) {
    if (!date) return
    setSelected(date)
    const params = new URLSearchParams(searchParams.toString())
    params.set('date', toLocalDateString(date))
    router.push(`/dashboard?${params.toString()}`)
  }

  return (
    <Calendar
      mode="single"
      selected={selected}
      onSelect={handleSelect}
      className="rounded-md border"
    />
  )
}
