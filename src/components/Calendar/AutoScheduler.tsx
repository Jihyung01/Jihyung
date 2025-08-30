import { useState } from 'react'
import { Target, Calendar, Clock, CheckCircle } from '@phosphor-icons/react'
import { Zap, Wand2, Settings } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

interface ScheduleSuggestion {
  task: string
  time: string
  duration: number
}

interface AutoSchedulerProps {
  tasks: any[]
  events: any[]
  onSchedule: (suggestions: ScheduleSuggestion[]) => void
  onScheduleCreated?: (schedule: any) => void
}

export function AutoScheduler({ tasks, events, onSchedule, onScheduleCreated }: AutoSchedulerProps) {
  const [scheduling, setScheduling] = useState(false)
  const [preferences, setPreferences] = useState({
    energyPeak: '09:00',
    energyLow: '15:00',
    preferredDuration: 60,
    breakTime: 15
  })
  const [suggestions, setSuggestions] = useState<ScheduleSuggestion[]>([])

  const generateSchedule = async () => {
    setScheduling(true)
    try {
      const response = await fetch('http://localhost:8006/api/schedule/auto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-token'
        },
        body: JSON.stringify({
          tasks,
          existingEvents: events,
          preferences
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      const newSuggestions: ScheduleSuggestion[] = data.suggestions || []
      setSuggestions(newSuggestions)
      onSchedule(newSuggestions)
      onScheduleCreated?.(data)
    } catch (error) {
      console.error('Auto-scheduling failed:', error)
    } finally {
      setScheduling(false)
    }
  }

  return (
    <Card className="border border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
      <CardHeader className="space-y-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Wand2 className="h-5 w-5 text-purple-500" />
          </div>
          <CardTitle className="text-lg font-semibold">Auto Scheduler</CardTitle>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-green-500" />
            <span>{tasks.length} tasks pending</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span>{events.length} events today</span>
          </div>
        </div>

        <Button
          onClick={generateSchedule}
          disabled={scheduling}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {scheduling ? 'Generating...' : 'Generate Smart Schedule'}
        </Button>
      </CardHeader>

      <CardContent>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <h4 className="font-semibold text-sm text-purple-800">Suggested Schedule</h4>
            {suggestions.map((suggestion, index) => (
              <div key={index} className="p-3 bg-white rounded-lg border border-purple-100">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{suggestion.task}</p>
                  <div className="text-xs text-gray-500">
                    {suggestion.time} ({suggestion.duration} min)
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        <div className="mt-4 pt-4 border-t border-purple-100">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <Clock className="h-5 w-5 text-blue-500 mx-auto mb-1" />
              <div className="text-xs text-gray-600">Peak Energy</div>
              <div className="text-sm font-medium">{preferences.energyPeak}</div>
            </div>
            <div>
              <Zap className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
              <div className="text-xs text-gray-600">Preferred Duration</div>
              <div className="text-sm font-medium">{preferences.preferredDuration}min</div>
            </div>
            <div>
              <CheckCircle className="h-5 w-5 text-green-500 mx-auto mb-1" />
              <div className="text-xs text-gray-600">Break Time</div>
              <div className="text-sm font-medium">{preferences.breakTime}min</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
