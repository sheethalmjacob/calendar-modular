import { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import type { View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import 'react-big-calendar/lib/css/react-big-calendar.css';

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
    course_code: string;
    section: string;
    instructor: string;
    location: string;
    is_fixed: boolean;
  };
}

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
  }, [user]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      
      // Load classes from catalog (only non-hidden ones)
      const { data: classes, error } = await supabase
        .from('class_catalog')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_hidden', false);

      if (error) throw error;

      // Convert classes to calendar events
      // For recurring classes, we need to create events for the current week
      const calendarEvents: ClassEvent[] = [];
      const today = new Date();
      const currentWeekStart = startOfWeek(today, { weekStartsOn: 0 }); // Sunday

      classes?.forEach((classItem) => {
        const dayMap: { [key: string]: number } = {
          'U': 0, // Sunday
          'M': 1, // Monday
          'T': 2, // Tuesday
          'W': 3, // Wednesday
          'R': 4, // Thursday
          'F': 5, // Friday
          'S': 6, // Saturday
        };

        classItem.days.forEach((day: string) => {
          const dayOfWeek = dayMap[day];
          if (dayOfWeek !== undefined) {
            const eventDate = new Date(currentWeekStart);
            eventDate.setDate(currentWeekStart.getDate() + dayOfWeek);

            const [startHour, startMinute] = classItem.start_time.split(':');
            const [endHour, endMinute] = classItem.end_time.split(':');

            const startTime = new Date(eventDate);
            startTime.setHours(parseInt(startHour), parseInt(startMinute), 0);

            const endTime = new Date(eventDate);
            endTime.setHours(parseInt(endHour), parseInt(endMinute), 0);

            calendarEvents.push({
              id: `${classItem.id}-${day}`,
              title: `${classItem.course_code || classItem.course_name}`,
              start: startTime,
              end: endTime,
              resource: {
                course_code: classItem.course_code,
                section: classItem.section,
                instructor: classItem.instructor,
                location: classItem.location,
                is_fixed: true,
              },
            });
          }
        });
      });

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const eventStyleGetter = (event: ClassEvent) => {
    const style: React.CSSProperties = {
      backgroundColor: event.resource.is_fixed ? '#3b82f6' : '#10b981',
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
    <div className="p-1">
      <div className="font-semibold text-sm">{event.title}</div>
      {event.resource.location && (
        <div className="text-xs">{event.resource.location}</div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Schedule</h1>
            <p className="text-gray-600">
              {events.length} class(es) scheduled • {user?.email}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/manual')}>
              Add Classes
            </Button>
            <Button variant="outline" onClick={() => navigate('/catalog')}>
              Manage Classes
            </Button>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4" style={{ height: '700px' }}>
          <BigCalendar
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
          />
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">Legend</h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded" style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.1) 10px, rgba(255,255,255,.1) 20px)'
              }}></div>
              <span className="text-sm">Fixed Classes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm">Flexible Events (coming soon)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
