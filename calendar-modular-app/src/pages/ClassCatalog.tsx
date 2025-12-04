import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, Trash2, Upload, ChevronDown, ChevronRight, Edit2 } from 'lucide-react'

interface ClassItem {
  id: string
  course_name: string
  course_code: string | null
  section: string | null
  instructor: string | null
  location: string | null
  days: string[]
  start_time: string
  end_time: string
  is_hidden: boolean
  track_id: string | null
}

interface ScheduleTrack {
  id: string
  name: string
  pdf_filename: string | null
  created_at: string
  classes: ClassItem[]
}

export function ClassCatalog() {
  const [tracks, setTracks] = useState<ScheduleTrack[]>([])
  const [expandedTracks, setExpandedTracks] = useState<Set<string>>(new Set())
  const [editingTrack, setEditingTrack] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    loadTracks()
  }, [user])

  const loadTracks = async () => {
    if (!user) return

    try {
      // Load all tracks
      const { data: tracksData, error: tracksError } = await supabase
        .from('schedule_tracks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (tracksError) throw tracksError

      // Load all classes
      const { data: classesData, error: classesError } = await supabase
        .from('class_catalog')
        .select('*')
        .eq('user_id', user.id)
        .order('course_name')

      if (classesError) throw classesError

      // Group classes by track
      const tracksWithClasses: ScheduleTrack[] = tracksData.map(track => ({
        ...track,
        classes: classesData.filter(cls => cls.track_id === track.id)
      }))

      // Add untracked classes (classes without a track_id) if any exist
      const untrackedClasses = classesData.filter(cls => !cls.track_id)
      if (untrackedClasses.length > 0) {
        tracksWithClasses.push({
          id: 'untracked',
          name: 'Untracked Classes',
          pdf_filename: null,
          created_at: new Date().toISOString(),
          classes: untrackedClasses
        })
      }

      setTracks(tracksWithClasses)
      // Expand first track by default
      if (tracksWithClasses.length > 0) {
        setExpandedTracks(new Set([tracksWithClasses[0].id]))
      }
    } catch (err) {
      console.error('Error loading tracks:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleTrack = (trackId: string) => {
    setExpandedTracks(prev => {
      const next = new Set(prev)
      if (next.has(trackId)) {
        next.delete(trackId)
      } else {
        next.add(trackId)
      }
      return next
    })
  }

  const startEditingTrack = (track: ScheduleTrack) => {
    setEditingTrack(track.id)
    setEditingName(track.name)
  }

  const saveTrackName = async (trackId: string) => {
    if (trackId === 'untracked' || !editingName.trim()) {
      setEditingTrack(null)
      return
    }

    try {
      const { error } = await supabase
        .from('schedule_tracks')
        .update({ name: editingName.trim() })
        .eq('id', trackId)

      if (error) throw error

      setTracks(tracks.map(track =>
        track.id === trackId ? { ...track, name: editingName.trim() } : track
      ))
      setEditingTrack(null)
    } catch (err) {
      console.error('Error updating track name:', err)
      alert('Failed to update track name')
    }
  }

  const deleteTrack = async (track: ScheduleTrack) => {
    const confirmMessage = `Delete "${track.name}" and all ${track.classes.length} classes in it? This cannot be undone.`
    if (!confirm(confirmMessage)) return

    if (track.id === 'untracked') {
      // Delete all untracked classes individually
      try {
        const { error } = await supabase
          .from('class_catalog')
          .delete()
          .is('track_id', null)
          .eq('user_id', user?.id)

        if (error) throw error
        setTracks(tracks.filter(t => t.id !== 'untracked'))
      } catch (err) {
        console.error('Error deleting untracked classes:', err)
        alert('Failed to delete classes')
      }
      return
    }

    try {
      // Deleting the track will cascade delete all classes due to ON DELETE CASCADE
      const { error } = await supabase
        .from('schedule_tracks')
        .delete()
        .eq('id', track.id)

      if (error) throw error
      setTracks(tracks.filter(t => t.id !== track.id))
    } catch (err) {
      console.error('Error deleting track:', err)
      alert('Failed to delete track')
    }
  }

  const hideAllInTrack = async (track: ScheduleTrack) => {
    if (!confirm(`Hide all ${track.classes.length} classes in "${track.name}"?`)) return

    try {
      const classIds = track.classes.map(cls => cls.id)
      const { error } = await supabase
        .from('class_catalog')
        .update({ is_hidden: true })
        .in('id', classIds)

      if (error) throw error
      await loadTracks()
    } catch (err) {
      console.error('Error hiding classes:', err)
      alert('Failed to hide classes')
    }
  }

  const showAllInTrack = async (track: ScheduleTrack) => {
    if (!confirm(`Show all ${track.classes.length} classes in "${track.name}"?`)) return

    try {
      const classIds = track.classes.map(cls => cls.id)
      const { error } = await supabase
        .from('class_catalog')
        .update({ is_hidden: false })
        .in('id', classIds)

      if (error) throw error
      await loadTracks()
    } catch (err) {
      console.error('Error showing classes:', err)
      alert('Failed to show classes')
    }
  }

  const toggleVisibility = async (classId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('class_catalog')
        .update({ is_hidden: !currentStatus })
        .eq('id', classId)

      if (error) throw error
      await loadTracks()
    } catch (err) {
      console.error('Error toggling visibility:', err)
    }
  }

  const deleteClass = async (classId: string) => {
    if (!confirm('Delete this class permanently?')) return

    try {
      const { error } = await supabase
        .from('class_catalog')
        .delete()
        .eq('id', classId)

      if (error) throw error
      await loadTracks()
    } catch (err) {
      console.error('Error deleting class:', err)
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const totalClasses = tracks.reduce((sum, track) => sum + track.classes.length, 0)
  const visibleClasses = tracks.reduce((sum, track) => 
    sum + track.classes.filter(cls => !cls.is_hidden).length, 0
  )

  const filteredTracks = searchTerm
    ? tracks.map(track => ({
        ...track,
        classes: track.classes.filter(cls =>
          cls.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cls.course_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cls.instructor?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(track => track.classes.length > 0)
    : tracks

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading classes...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F3F0E9] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-gray-900">Manage Class Schedules</h1>
            <p className="text-gray-600">
              {tracks.length} {tracks.length === 1 ? 'schedule' : 'schedules'} • {' '}
              {visibleClasses} of {totalClasses} classes selected
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/upload')} className="bg-white">
              <Upload className="mr-2 h-4 w-4" />
              Upload PDF
            </Button>
            <Button onClick={() => navigate('/calendar')} className="bg-black text-white hover:bg-gray-800">
              View Calendar
            </Button>
          </div>
        </div>

        {totalClasses === 0 ? (
          <Card className="bg-white">
            <CardContent className="py-12 text-center">
              <div className="mb-4">
                <Upload className="h-16 w-16 mx-auto text-gray-400" />
              </div>
              <p className="text-gray-600 mb-4 text-lg">No class schedules yet</p>
              <p className="text-gray-500 mb-6">Upload a PDF to extract your class schedule</p>
              <Button onClick={() => navigate('/upload')} className="bg-black text-white hover:bg-gray-800">
                <Upload className="mr-2 h-4 w-4" />
                Upload PDF Schedule
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6">
              <Input
                type="text"
                placeholder="Search by course name, code, or instructor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md bg-white"
              />
            </div>

            <div className="space-y-4">
              {filteredTracks.map((track) => {
                const isExpanded = expandedTracks.has(track.id)
                const hiddenCount = track.classes.filter(cls => cls.is_hidden).length
                const visibleCount = track.classes.length - hiddenCount

                return (
                  <Card key={track.id} className="bg-white border-2">
                    {/* Track Header */}
                    <div className="p-5 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <button
                            onClick={() => toggleTrack(track.id)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-gray-600" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-gray-600" />
                            )}
                          </button>

                          {editingTrack === track.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onBlur={() => saveTrackName(track.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveTrackName(track.id)
                                  if (e.key === 'Escape') setEditingTrack(null)
                                }}
                                className="max-w-md"
                                autoFocus
                              />
                            </div>
                          ) : (
                            <div className="flex-1">
                              <h2 className="text-xl font-semibold text-gray-900">{track.name}</h2>
                              <p className="text-sm text-gray-500 mt-1">
                                {track.classes.length} {track.classes.length === 1 ? 'class' : 'classes'}
                                {' • '}
                                {visibleCount} visible, {hiddenCount} hidden
                                {track.pdf_filename && ` • ${track.pdf_filename}`}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Track Actions */}
                        <div className="flex gap-2">
                          {track.id !== 'untracked' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEditingTrack(track)}
                              title="Rename this schedule"
                            >
                              <Edit2 className="h-4 w-4 mr-1" />
                              Rename
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => showAllInTrack(track)}
                            disabled={hiddenCount === 0}
                            title="Show all classes in this schedule"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Show All
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => hideAllInTrack(track)}
                            disabled={visibleCount === 0}
                            title="Hide all classes in this schedule"
                          >
                            <EyeOff className="h-4 w-4 mr-1" />
                            Hide All
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteTrack(track)}
                            className="text-red-600 hover:bg-red-50"
                            title="Delete this entire schedule"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete Schedule
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Classes List */}
                    {isExpanded && (
                      <div className="p-5">
                        <div className="space-y-3">
                          {track.classes.map((cls) => (
                            <div
                              key={cls.id}
                              className={`p-4 border rounded-lg ${cls.is_hidden ? 'opacity-50 bg-gray-50' : 'bg-white'}`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-base font-semibold">{cls.course_name}</h3>
                                    {cls.course_code && (
                                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                        {cls.course_code}
                                      </span>
                                    )}
                                    {cls.is_hidden && (
                                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                                        Hidden
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
                                    {cls.section && (
                                      <div>
                                        <span className="font-medium">Section:</span> {cls.section}
                                      </div>
                                    )}
                                    {cls.instructor && (
                                      <div>
                                        <span className="font-medium">Instructor:</span> {cls.instructor}
                                      </div>
                                    )}
                                    <div>
                                      <span className="font-medium">Days:</span> {cls.days.join(', ')}
                                    </div>
                                    <div>
                                      <span className="font-medium">Time:</span>{' '}
                                      {formatTime(cls.start_time)} - {formatTime(cls.end_time)}
                                    </div>
                                    {cls.location && (
                                      <div>
                                        <span className="font-medium">Location:</span> {cls.location}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => toggleVisibility(cls.id, cls.is_hidden)}
                                    title={cls.is_hidden ? 'Show in calendar' : 'Hide from calendar'}
                                  >
                                    {cls.is_hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => deleteClass(cls.id)}
                                    title="Delete class"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
