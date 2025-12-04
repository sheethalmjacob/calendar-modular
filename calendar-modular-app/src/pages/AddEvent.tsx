import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';

export function AddEvent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    category: 'personal',
    date: '',
    start_time: '',
    end_time: '',
  });

  const categories = [
    { value: 'personal', label: 'Personal', color: '#10b981' },
    { value: 'work', label: 'Work', color: '#f59e0b' },
    { value: 'study', label: 'Study', color: '#8b5cf6' },
    { value: 'gym', label: 'Gym/Exercise', color: '#ef4444' },
    { value: 'social', label: 'Social', color: '#ec4899' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      setSaving(true);
      setError('');

      // Validate required fields
      if (!formData.title || !formData.date || !formData.start_time || !formData.end_time) {
        throw new Error('Please fill in all required fields');
      }

      // Combine date and time into proper datetime format
      const eventDate = new Date(formData.date);
      const [startHour, startMinute] = formData.start_time.split(':');
      const [endHour, endMinute] = formData.end_time.split(':');

      const startDateTime = new Date(eventDate);
      startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0);

      const endDateTime = new Date(eventDate);
      endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0);

      const { error: dbError } = await supabase
        .from('events')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description || null,
          location: formData.location || null,
          category: formData.category,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          is_flexible: true,
          event_type: 'flexible',
        });

      if (dbError) throw dbError;

      navigate('/calendar');
    } catch (err: any) {
      setError(err.message || 'Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Add Personal Event</h1>
          <p className="text-gray-600">
            Create a flexible event that you can move around your schedule
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Event Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Study Session, Workout, Meeting..."
                />
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional details about the event"
                />
              </div>

              <div>
                <Label>Location</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Library, Gym, Coffee Shop..."
                />
              </div>

              <div>
                <Label>Category</Label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time * (HH:MM 24hr)</Label>
                  <Input
                    type="text"
                    placeholder="09:00"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label>End Time * (HH:MM 24hr)</Label>
                  <Input
                    type="text"
                    placeholder="10:00"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate('/calendar')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Event'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">💡 About Flexible Events</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Can be dragged to different times on the calendar</li>
            <li>• Can be resized by dragging the edges</li>
            <li>• Color-coded by category for easy identification</li>
            <li>• Different from fixed classes which cannot be moved</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
