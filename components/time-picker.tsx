"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface TimePickerDemoProps {
  value?: string
  onChange?: (time: string) => void
}

export function TimePickerDemo({ value, onChange }: TimePickerDemoProps) {
  const [time, setTime] = React.useState(value || "")

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = event.target.value
    setTime(newTime)
    if (onChange) {
      onChange(newTime)
    }
  }

  return (
    <div className="flex items-end gap-2">
      <div className="grid gap-1 text-center">
        <Label htmlFor="hours" className="text-xs">
          Hours
        </Label>
        <Input type="number" id="hours" placeholder="00" className="w-16 text-center" min={0} max={23} />
      </div>
      <div className="grid gap-1 text-center">
        <Label htmlFor="minutes" className="text-xs">
          Minutes
        </Label>
        <Input type="number" id="minutes" placeholder="00" className="w-16 text-center" min={0} max={59} />
      </div>
      <div>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  )
}

