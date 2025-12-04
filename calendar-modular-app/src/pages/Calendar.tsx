import { useState, useEffect, useCallback } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import type { View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addWeeks, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { exportCalendar } from '@/services/calendarExport';
// @ts-ignore
import dndModule from 'react-big-calendar/lib/addons/dragAndDrop/index.js';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

const withDragAndDrop = dndModule.default || dndModule;

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface ClassEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    course_code: string | null;
    section: string | null;
    instructor: string | null;
    location: string | null;
    is_fixed: boolean;
    category: string | null;
  };
}

const DragAndDropCalendar = withDragAndDrop<ClassEvent>(BigCalendar);

export function Calendar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<ClassEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [view, setView] = useState<View>('week');
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    if (user) {
      loadClasses();
    }
  }, [user, date, view]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      
      // Load classes from catalog (only non-hidden ones)
      const { data: classes, error: classError } = await supabase
        .from('class_catalog')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_hidden', false);

      if (classError) throw classError;

      // Load flexible events
      const { data: flexibleEvents, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user?.id);

      if (eventsError) throw eventsError;

      // Convert classes to calendar events
      const calendarEvents: ClassEvent[] = [];
      
      // Calculate date range based on current view
      let rangeStart: Date;
      let rangeEnd: Date;
      
      if (view === 'week') {
        // Show current week plus 2 weeks before and after for smooth scrolling
        rangeStart = addWeeks(startOfWeek(date, { weekStartsOn: 0 }), -2);
        rangeEnd = addWeeks(startOfWeek(date, { weekStartsOn: 0 }), 3);
      } else if (view === 'month') {
        // Show entire month
        rangeStart = startOfMonth(date);
        rangeEnd = endOfMonth(date);
      } else {
        // Day view - show current day plus a few days around it
        rangeStart = addWeeks(date, -1);
        rangeEnd = addWeeks(date, 1);
      }

      // Add fixed classes (recurring for all weeks in range)
      classes?.forEach((classItem) => {
        const dayMap: { [key: string]: number } = {
          'U': 0, 'M': 1, 'T': 2, 'W': 3, 'R': 4, 'F': 5, 'S': 6,
        };

        classItem.days.forEach((day: string) => {
          const dayOfWeek = dayMap[day];
          if (dayOfWeek !== undefined) {
            // Generate occurrences for each week in the range
            const allDaysInRange = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
            
            allDaysInRange.forEach((currentDate) => {
              if (getDay(currentDate) === dayOfWeek) {
                const [startHour, startMinute] = classItem.start_time.split(':');
                const [endHour, endMinute] = classItem.end_time.split(':');

                const startTime = new Date(currentDate);
                startTime.setHours(parseInt(startHour), parseInt(startMinute), 0);

                const endTime = new Date(currentDate);
                endTime.setHours(parseInt(endHour), parseInt(endMinute), 0);

                calendarEvents.push({
                  id: `${classItem.id}-${day}-${currentDate.toISOString()}`,
                  title: `${classItem.course_code || classItem.course_name}`,
                  start: startTime,
                  end: endTime,
                  resource: {
                    course_code: classItem.course_code,
                    section: classItem.section,
                    instructor: classItem.instructor,
                    location: classItem.location,
                    is_fixed: true,
                    category: null,
                  },
                });
              }
            });
          }
        });
      });

      // Add flexible events
      flexibleEvents?.forEach((event: any) => {
        calendarEvents.push({
          id: event.id,
          title: event.title,
          start: new Date(event.start_time),
          end: new Date(event.end_time),
          resource: {
            course_code: null,
            section: null,
            instructor: null,
            location: event.location,
            is_fixed: false,
            category: event.category,
          },
        });
      });

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if two events overlap
  const eventsOverlap = (event1: ClassEvent, event2: ClassEvent): boolean => {
    return (
      event1.id !== event2.id &&
      event1.start < event2.end &&
      event1.end > event2.start
    );
  };

  // Find all events that overlap with a given event
  const getOverlappingEvents = (event: ClassEvent): ClassEvent[] => {
    return events.filter(e => eventsOverlap(event, e));
  };

  const eventStyleGetter = (event: ClassEvent) => {
    const categoryColors: { [key: string]: string } = {
      personal: '#10b981',
      work: '#f59e0b',
      study: '#8b5cf6',
      gym: '#ef4444',
      social: '#ec4899',
    };

    const backgroundColor = event.resource.is_fixed 
      ? '#3b82f6' 
      : (event.resource.category ? categoryColors[event.resource.category] : '#10b981');

    // Check for overlaps
    const hasOverlap = getOverlappingEvents(event).length > 0;

    const style: React.CSSProperties = {
      backgroundColor,
      borderRadius: '5px',
      opacity: 0.8,
      color: 'white',
      border: hasOverlap ? '3px solid #ef4444' : '0px',
      display: 'block',
      boxShadow: hasOverlap ? '0 0 0 2px #fee2e2, 0 0 10px rgba(239, 68, 68, 0.3)' : 'none',
    };

    if (event.resource.is_fixed) {
      style.backgroundImage = 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.1) 10px, rgba(255,255,255,.1) 20px)';
    }

    return { style };
  };

  const CustomEvent = ({ event }: { event: ClassEvent }) => {
    const hasOverlap = getOverlappingEvents(event).length > 0;
    
    return (
      <div className="p-2 h-full">
        <div className="font-semibold text-sm leading-tight flex items-center gap-1">
          {hasOverlap && <span className="text-red-200">⚠️</span>}
          {event.title}
        </div>
        {event.resource.location && (
          <div className="text-xs opacity-90 mt-1">{event.resource.location}</div>
        )}
      </div>
    );
  };

  const handleEventDrop = useCallback(async ({ event, start, end }: any) => {
    // Only allow dragging flexible events
    if (event.resource.is_fixed) {
      alert('Fixed classes cannot be moved. Only flexible events can be dragged.');
      return;
    }

    try {
      // Update in database
      const { error } = await supabase
        .from('events')
        .update({
          start_time: start.toISOString(),
          end_time: end.toISOString(),
        })
        .eq('id', event.id);

      if (error) throw error;

      // Update local state
      setEvents((prevEvents) =>
        prevEvents.map((evt) =>
          evt.id === event.id
            ? { ...evt, start, end }
            : evt
        )
      );
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Failed to update event');
      // Reload to get correct state
      loadClasses();
    }
  }, [user]);

  const handleEventResize = useCallback(async ({ event, start, end }: any) => {
    // Only allow resizing flexible events
    if (event.resource.is_fixed) {
      alert('Fixed classes cannot be resized. Only flexible events can be resized.');
      return;
    }

    try {
      // Update in database
      const { error } = await supabase
        .from('events')
        .update({
          start_time: start.toISOString(),
          end_time: end.toISOString(),
        })
        .eq('id', event.id);

      if (error) throw error;

      // Update local state
      setEvents((prevEvents) =>
        prevEvents.map((evt) =>
          evt.id === event.id
            ? { ...evt, start, end }
            : evt
        )
      );
    } catch (error) {
      console.error('Error resizing event:', error);
      alert('Failed to resize event');
      // Reload to get correct state
      loadClasses();
    }
  }, [user]);

  const handleExport = async (format: 'download' | 'google' | 'outlook' | 'apple') => {
    if (!user) return;
    
    try {
      setExporting(true);
      await exportCalendar(user.id, format);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export calendar. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-1">My Schedule</h1>
            <p className="text-gray-600 text-sm">
              {events.length} {events.length === 1 ? 'event' : 'events'} • {user?.email}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/upload')} className="bg-white border-gray-300">
                Upload PDF
              </Button>
              <Button variant="outline" onClick={() => navigate('/add-event')} className="bg-white border-gray-300">
                Add Event
              </Button>
              <Button variant="outline" onClick={() => navigate('/manual')} className="bg-white border-gray-300">
                Add Classes
              </Button>
              <Button variant="outline" onClick={() => navigate('/catalog')} className="bg-white border-gray-300">
                Manage Classes
              </Button>
            </div>
            
            <div className="flex gap-2 border-l pl-2 ml-2">
              <Button 
                variant="outline" 
                onClick={() => handleExport('google')} 
                disabled={exporting || events.length === 0}
                className="bg-white border-gray-300"
              >
                📅 Export to Google
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleExport('outlook')} 
                disabled={exporting || events.length === 0}
                className="bg-white border-gray-300"
              >
                📅 Export to Outlook
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleExport('apple')} 
                disabled={exporting || events.length === 0}
                className="bg-white border-gray-300"
              >
                📅 Export to Apple
              </Button>
            </div>
            
            <Button variant="destructive" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6" style={{ height: '700px' }}>
          <DragAndDropCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            defaultView="week"
            views={['week', 'day', 'agenda']}
            step={15}
            timeslots={4}
            eventPropGetter={eventStyleGetter}
            components={{
              event: CustomEvent,
            }}
            min={new Date(2024, 0, 1, 7, 0)}
            max={new Date(2024, 0, 1, 22, 0)}
            onEventDrop={handleEventDrop}
            onEventResize={handleEventResize}
            resizable
            draggableAccessor={(event: ClassEvent) => !event.resource.is_fixed}
          />
        </div>

        <div className="mt-6 p-5 bg-white rounded-xl border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">Event Types</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-400 rounded" style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,.25) 8px, rgba(255,255,255,.25) 16px)'
              }}></div>
              <span className="text-sm text-gray-700">Fixed Classes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded" style={{ backgroundColor: '#10b981' }}></div>
              <span className="text-sm text-gray-700">Personal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
              <span className="text-sm text-gray-700">Work</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded" style={{ backgroundColor: '#8b5cf6' }}></div>
              <span className="text-sm text-gray-700">Study</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded" style={{ backgroundColor: '#ef4444' }}></div>
              <span className="text-sm text-gray-700">Gym/Exercise</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded" style={{ backgroundColor: '#ec4899' }}></div>
              <span className="text-sm text-gray-700">Social</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded border-4 border-red-500" style={{ backgroundColor: '#10b981' }}></div>
              <span className="text-sm text-gray-700">⚠️ Time Conflict</span>
            </div>
          </div>
        </div>

        {/* Overlap Warnings Section */}
        {(() => {
          const overlappingPairs: Array<{ event1: ClassEvent; event2: ClassEvent }> = [];
          const seen = new Set<string>();
          
          events.forEach(event => {
            const overlaps = getOverlappingEvents(event);
            overlaps.forEach(overlap => {
              const pairKey = [event.id, overlap.id].sort().join('-');
              if (!seen.has(pairKey)) {
                seen.add(pairKey);
                overlappingPairs.push({ event1: event, event2: overlap });
              }
            });
          });

          if (overlappingPairs.length === 0) return null;

          return (
            <div className="mt-6 p-5 bg-red-50 rounded-xl border-2 border-red-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">⚠️</span>
                <h3 className="font-semibold text-red-900 text-sm">
                  {overlappingPairs.length} Time {overlappingPairs.length === 1 ? 'Conflict' : 'Conflicts'} Detected
                </h3>
              </div>
              <div className="space-y-2">
                {overlappingPairs.map((pair, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg border border-red-200">
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-red-600 font-semibold">•</span>
                      <div>
                        <span className="font-semibold text-gray-900">{pair.event1.title}</span>
                        <span className="text-gray-600"> overlaps with </span>
                        <span className="font-semibold text-gray-900">{pair.event2.title}</span>
                        <div className="text-xs text-gray-500 mt-1">
                          {format(pair.event1.start, 'MMM d, h:mm a')} - {format(pair.event1.end, 'h:mm a')} 
                          {' & '}
                          {format(pair.event2.start, 'MMM d, h:mm a')} - {format(pair.event2.end, 'h:mm a')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
