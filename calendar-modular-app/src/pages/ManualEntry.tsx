import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Trash2 } from 'lucide-react';

interface ClassEntry {
  id: string;
  course_name: string;
  course_code: string;
  section: string;
  instructor: string;
  location: string;
  days: string[];
  start_time: string;
  end_time: string;
}

export function ManualEntry() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addNewClass = () => {
    setClasses([
      ...classes,
      {
        id: Date.now().toString(),
        course_name: '',
        course_code: '',
        section: '',
        instructor: '',
        location: '',
        days: [],
        start_time: '',
        end_time: ''
      }
    ]);
  };

  const updateClass = (id: string, field: keyof ClassEntry, value: any) => {
    console.log('updateClass called:', { id, field, value });
    setClasses(prevClasses => {
      const updated = prevClasses.map(c => 
        c.id === id ? { ...c, [field]: value } : c
      );
      console.log('Updated classes:', updated);
      return updated;
    });
  };

  const removeClass = (id: string) => {
    setClasses(classes.filter(c => c.id !== id));
  };

  const toggleDay = (id: string, day: string) => {
    setClasses(classes.map(c => {
      if (c.id === id) {
        const days = c.days.includes(day)
          ? c.days.filter(d => d !== day)
          : [...c.days, day];
        return { ...c, days };
      }
      return c;
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);
      setError('');

      // Validate all classes have required fields
      for (let i = 0; i < classes.length; i++) {
        const c = classes[i];
        console.log('Validating class:', c); // Debug log
        if (!c.course_name) {
          throw new Error(`Class ${i + 1}: Course name is required`);
        }
        if (c.days.length === 0) {
          throw new Error(`Class ${i + 1}: At least one day must be selected`);
        }
        if (!c.start_time) {
          throw new Error(`Class ${i + 1}: Start time is required`);
        }
        if (!c.end_time) {
          throw new Error(`Class ${i + 1}: End time is required`);
        }
      }

      const classesToInsert = classes.map(c => ({
        user_id: user.id,
        course_name: c.course_name,
        course_code: c.course_code || null,
        section: c.section || null,
        instructor: c.instructor || null,
        location: c.location || null,
        days: c.days,
        start_time: c.start_time + ':00', // Add seconds
        end_time: c.end_time + ':00', // Add seconds
        is_hidden: false
      }));

      const { error: dbError } = await supabase
        .from('class_catalog')
        .insert(classesToInsert);

      if (dbError) throw dbError;

      navigate('/catalog');
    } catch (err: any) {
      setError(err.message || 'Failed to save classes');
    } finally {
      setSaving(false);
    }
  };

  const days = ['M', 'T', 'W', 'R', 'F', 'S', 'U'];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Manual Class Entry</h1>
          <p className="text-gray-600">
            Enter your class schedule manually (temporary workaround for AI extraction)
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-4">
          {classes.map((classEntry) => (
            <Card key={classEntry.id}>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label>Course Name *</Label>
                    <Input
                      value={classEntry.course_name}
                      onChange={(e) => updateClass(classEntry.id, 'course_name', e.target.value)}
                      placeholder="Introduction to Computer Science"
                    />
                  </div>
                  <div>
                    <Label>Course Code</Label>
                    <Input
                      value={classEntry.course_code}
                      onChange={(e) => updateClass(classEntry.id, 'course_code', e.target.value)}
                      placeholder="CS101"
                    />
                  </div>
                  <div>
                    <Label>Section</Label>
                    <Input
                      value={classEntry.section}
                      onChange={(e) => updateClass(classEntry.id, 'section', e.target.value)}
                      placeholder="001"
                    />
                  </div>
                  <div>
                    <Label>Instructor</Label>
                    <Input
                      value={classEntry.instructor}
                      onChange={(e) => updateClass(classEntry.id, 'instructor', e.target.value)}
                      placeholder="Dr. Smith"
                    />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input
                      value={classEntry.location}
                      onChange={(e) => updateClass(classEntry.id, 'location', e.target.value)}
                      placeholder="Room 204"
                    />
                  </div>
                  <div>
                    <Label>Days *</Label>
                    <div className="flex gap-2 mt-2">
                      {days.map(day => (
                        <button
                          key={day}
                          onClick={() => toggleDay(classEntry.id, day)}
                          className={`px-3 py-1 rounded ${
                            classEntry.days.includes(day)
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Start Time * (HH:MM 24hr)</Label>
                    <Input
                      type="text"
                      placeholder="09:00"
                      value={classEntry.start_time}
                      onChange={(e) => {
                        console.log('Start time changed:', e.target.value);
                        updateClass(classEntry.id, 'start_time', e.target.value);
                      }}
                    />
                  </div>
                  <div>
                    <Label>End Time * (HH:MM 24hr)</Label>
                    <Input
                      type="text"
                      placeholder="10:00"
                      value={classEntry.end_time}
                      onChange={(e) => {
                        console.log('End time changed:', e.target.value);
                        updateClass(classEntry.id, 'end_time', e.target.value);
                      }}
                    />
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeClass(classEntry.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Class
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-4">
          <Button onClick={addNewClass} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Class
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || classes.length === 0}
          >
            {saving ? 'Saving...' : `Save ${classes.length} Class(es)`}
          </Button>
        </div>
      </div>
    </div>
  );
}
