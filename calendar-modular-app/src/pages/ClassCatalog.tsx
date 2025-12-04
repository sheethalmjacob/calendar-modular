import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, Trash2, Upload } from 'lucide-react'

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
}

export function ClassCatalog() {
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [filteredClasses, setFilteredClasses] = useState<ClassItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    loadClasses()
  }, [user])

  useEffect(() => {
    // Filter classes based on search term
    const filtered = classes.filter(cls =>
      cls.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.course_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.instructor?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredClasses(filtered)
  }, [searchTerm, classes])

  const loadClasses = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('class_catalog')
        .select('*')
        .eq('user_id', user.id)
        .order('course_name')

      if (error) throw error
      setClasses(data || [])
      setFilteredClasses(data || [])
    } catch (err) {
      console.error('Error loading classes:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleVisibility = async (classId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('class_catalog')
        .update({ is_hidden: !currentStatus })
        .eq('id', classId)

      if (error) throw error

      // Update local state
      setClasses(classes.map(cls =>
        cls.id === classId ? { ...cls, is_hidden: !currentStatus } : cls
      ))
    } catch (err) {
      console.error('Error toggling visibility:', err)
    }
  }

  const deleteClass = async (classId: string) => {
    if (!confirm('Are you sure you want to delete this class?')) return

    try {
      const { error } = await supabase
        .from('class_catalog')
        .delete()
        .eq('id', classId)

      if (error) throw error

      setClasses(classes.filter(cls => cls.id !== classId))
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

  const visibleCount = classes.filter(cls => !cls.is_hidden).length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading classes...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Class Catalog</h1>
            <p className="text-gray-600">
              {visibleCount} of {classes.length} classes selected
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/upload')}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Another PDF
            </Button>
            <Button onClick={() => navigate('/calendar')}>
              View Calendar
            </Button>
          </div>
        </div>

        {classes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600 mb-4">No classes found. Upload a PDF to get started!</p>
              <Button onClick={() => navigate('/upload')}>
                Upload PDF
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
                className="max-w-md"
              />
            </div>

            <div className="grid gap-4">
              {filteredClasses.map((cls) => (
                <Card key={cls.id} className={cls.is_hidden ? 'opacity-50' : ''}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{cls.course_name}</h3>
                          {cls.course_code && (
                            <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {cls.course_code}
                            </span>
                          )}
                          {cls.is_hidden && (
                            <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              Hidden
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
