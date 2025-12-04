import { useState, useEffect, useCallback } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import type { View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addWeeks, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
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

    const style: React.CSSProperties = {
      backgroundColor,
      borderRadius: '5px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block',
    };

    if (event.resource.is_fixed) {
      style.backgroundImage = 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.1) 10px, rgba(255,255,255,.1) 20px)';
    }

    return { style };
  };

  const CustomEvent = ({ event }: { event: ClassEvent }) => (
    <div className="p-2 h-full flex flex-col">
      <div className="font-semibold text-sm leading-tight mb-1">{event.title}</div>
      {event.resource.location && (
        <div className="text-xs opacity-90 leading-tight">📍 {event.resource.location}</div>
      )}
      {event.resource.is_fixed && (
        <div className="text-xs opacity-75 mt-auto">🔒</div>
      )}
    </div>
  );

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-[1400px] mx-auto p-6">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-1">My Schedule</h1>
            <p className="text-slate-600 text-sm">
              {events.length} {events.length === 1 ? 'event' : 'events'} • {user?.email}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/upload')} className="bg-white hover:bg-slate-50">
              📄 Upload PDF
            </Button>
            <Button variant="outline" onClick={() => navigate('/add-event')} className="bg-white hover:bg-slate-50">
              ➕ Add Event
            </Button>
            <Button variant="outline" onClick={() => navigate('/manual')} className="bg-white hover:bg-slate-50">
              📚 Add Classes
            </Button>
            <Button variant="outline" onClick={() => navigate('/catalog')} className="bg-white hover:bg-slate-50">
              📋 Manage Classes
            </Button>
            <Button variant="destructive" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>

        {/* Calendar Container */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6" style={{ height: '700px' }}>
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

        {/* Legend */}
        <div className="mt-6 p-5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
          <h3 className="font-semibold text-slate-900 mb-3 text-sm uppercase tracking-wide">Event Types</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded shadow-sm" style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,.2) 8px, rgba(255,255,255,.2) 16px)'
              }}></div>
              <span className="text-sm font-medium text-slate-700">Fixed Classes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded shadow-sm" style={{ backgroundColor: '#10b981' }}></div>
              <span className="text-sm font-medium text-slate-700">Personal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded shadow-sm" style={{ backgroundColor: '#f59e0b' }}></div>
              <span className="text-sm font-medium text-slate-700">Work</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded shadow-sm" style={{ backgroundColor: '#8b5cf6' }}></div>
              <span className="text-sm font-medium text-slate-700">Study</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded shadow-sm" style={{ backgroundColor: '#ef4444' }}></div>
              <span className="text-sm font-medium text-slate-700">Gym/Exercise</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded shadow-sm" style={{ backgroundColor: '#ec4899' }}></div>
              <span className="text-sm font-medium text-slate-700">Social</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
