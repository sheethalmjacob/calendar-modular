import { useState, useEffect, useCallback } from 'react'
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns'
import { supabase } from '../lib/supabase'

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  description?: string
  location?: string
  color?: string
}

export default function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showEventModal, setShowEventModal] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    start: '',
    end: '',
    description: '',
    location: '',
    color: '#3B82F6'
  })
  const [user, setUser] = useState<any>(null)

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  // Load events from Supabase
  const loadEvents = useCallback(async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)

    if (error) {
      console.error('Error loading events:', error)
      return
    }

    if (data) {
      const formattedEvents = data.map((event: any) => ({
        id: event.id,
        title: event.title,
        start: new Date(event.start_time),
        end: new Date(event.end_time),
        description: event.description,
        location: event.location,
        color: event.color || '#3B82F6'
      }))
      setEvents(formattedEvents)
    }
  }, [user])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  // Handle create event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    const { error } = await supabase
      .from('events')
      .insert([
        {
          user_id: user.id,
          title: newEvent.title,
          start_time: new Date(newEvent.start).toISOString(),
          end_time: new Date(newEvent.end).toISOString(),
          description: newEvent.description,
          location: newEvent.location,
          color: newEvent.color,
          source_calendar: 'manual'
        }
      ])

    if (error) {
      console.error('Error creating event:', error)
      alert('Error creating event: ' + error.message)
      return
    }

    // Reset form and close modal
    setNewEvent({
      title: '',
      start: '',
      end: '',
      description: '',
      location: '',
      color: '#3B82F6'
    })
    setShowEventModal(false)

    // Reload events
    loadEvents()
  }

  // Generate week days
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(event.start, day))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">📅 Calendar Modular</h1>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="mb-6 bg-white p-4 rounded-xl shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setCurrentDate(addDays(currentDate, -7))}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
              >
                ← Previous
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-medium text-sm"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentDate(addDays(currentDate, 7))}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
              >
                Next →
              </button>
              <span className="text-base font-semibold text-gray-700 ml-2">
                {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
              </span>
            </div>

            <button
              onClick={() => setShowEventModal(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md font-medium whitespace-nowrap"
            >
              + New Event
            </button>
          </div>
        </div>

        {/* Week View Calendar */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b">
            {weekDays.map((day, index) => (
              <div
                key={index}
                className={`p-4 text-center border-r last:border-r-0 ${
                  isSameDay(day, new Date()) ? 'bg-blue-50' : ''
                }`}
              >
                <div className="text-sm font-medium text-gray-500">
                  {format(day, 'EEE')}
                </div>
                <div className={`text-2xl font-bold ${
                  isSameDay(day, new Date()) ? 'text-blue-600' : 'text-gray-900'
                }`}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-7 min-h-[500px]">
            {weekDays.map((day, index) => {
              const dayEvents = getEventsForDay(day)
              return (
                <div
                  key={index}
                  className={`border-r last:border-r-0 p-3 ${
                    isSameDay(day, new Date()) ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <div className="space-y-2">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className="p-2 rounded-lg text-white text-sm cursor-pointer hover:opacity-90 transition"
                        style={{ backgroundColor: event.color }}
                      >
                        <div className="font-semibold">{event.title}</div>
                        <div className="text-xs opacity-90">
                          {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                        </div>
                        {event.location && (
                          <div className="text-xs opacity-75 mt-1">📍 {event.location}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>

      {/* Create Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Event</h2>
            
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  value={newEvent.start}
                  onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  value={newEvent.end}
                  onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="flex space-x-2">
                  {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewEvent({ ...newEvent, color })}
                      className={`w-10 h-10 rounded-full border-2 ${
                        newEvent.color === color ? 'border-gray-900' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
