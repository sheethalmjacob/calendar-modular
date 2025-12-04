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
  const [selectedEvent, setSelectedEvent] = useState<ClassEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

      console.log('Loaded classes from database:', classes);
      console.log('Number of classes:', classes?.length);
      if (classes && classes.length > 0) {
        console.log('First class ID:', classes[0].id);
        console.log('First class structure:', classes[0]);
      }

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
                  title: `${classItem.course_name}`,
                  start: startTime,
                  end: endTime,
                  resource: {
                    class_id: classItem.id,
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
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
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
      personal: '#EEDC5B',
      work: '#f59e0b',
      study: '#8b5cf6',
      gym: '#ef4444',
      social: '#ec4899',
    };

    const backgroundColor = event.resource.is_fixed 
      ? '#D8B2D9' 
      : (event.resource.category ? categoryColors[event.resource.category] : '#EEDC5B');

    // Check for overlaps
    const hasOverlap = getOverlappingEvents(event).length > 0;

    const style: React.CSSProperties = {
      backgroundColor,
      borderRadius: '16px',
      opacity: 0.95,
      color: '#000',
      border: hasOverlap ? '3px solid #ef4444' : '0px',
      display: 'block',
      boxShadow: hasOverlap ? '0 0 0 2px #fee2e2, 0 0 10px rgba(239, 68, 68, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
    };

    if (event.resource.is_fixed) {
      style.backgroundImage = 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.1) 10px, rgba(255,255,255,.1) 20px)';
    }

    return { style };
  };

  const CustomEvent = ({ event }: { event: ClassEvent }) => {
    const hasOverlap = getOverlappingEvents(event).length > 0;
    
    return (
      <div className="h-full flex items-center" style={{ padding: '8px' }}>
        <div className="font-medium leading-tight flex items-center gap-1" style={{ fontSize: '13px' }}>
          {hasOverlap && <span className="text-red-600">⚠️</span>}
          {event.title}
        </div>
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

  const handleSelectEvent = (event: ClassEvent) => {
    console.log('Event selected:', {
      title: event.title,
      isFixed: event.resource.is_fixed,
      eventId: event.id,
      resource: event.resource
    });
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleHideClass = async () => {
    if (!selectedEvent || !selectedEvent.resource.is_fixed || !user) {
      console.log('Cannot hide class:', { 
        hasEvent: !!selectedEvent, 
        isFixed: selectedEvent?.resource.is_fixed, 
        hasUser: !!user 
      });
      return;
    }
    
    if (!confirm('Hide this class from your calendar? You can unhide it later from the Class Catalog.')) {
      return;
    }
    
    try {
      // Get the class ID from the resource object
      const classId = selectedEvent.resource.class_id;
      console.log('Attempting to hide class:', classId, 'for user:', user.id);
      console.log('Full event ID:', selectedEvent.id);
      
      const { data, error } = await supabase
        .from('class_catalog')
        .update({ is_hidden: true })
        .eq('id', classId)
        .eq('user_id', user.id)
        .select();
      
      if (error) {
        console.error('Supabase error details:', JSON.stringify(error, null, 2));
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        throw error;
      }
      
      console.log('Hide successful, updated rows:', data);
      
      setIsModalOpen(false);
      setSelectedEvent(null);
      await loadClasses(); // Reload to update view
    } catch (error) {
      console.error('Error hiding class:', error);
      alert(`Failed to hide class. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent || selectedEvent.resource.is_fixed || !user) {
      console.log('Cannot delete event:', { 
        hasEvent: !!selectedEvent, 
        isFixed: selectedEvent?.resource.is_fixed, 
        hasUser: !!user 
      });
      return;
    }
    
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }
    
    try {
      console.log('Attempting to delete event:', selectedEvent.id, 'for user:', user.id);
      
      const { data, error } = await supabase
        .from('events')
        .delete()
        .eq('id', selectedEvent.id)
        .eq('user_id', user.id)
        .select();
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Delete successful, deleted rows:', data);
      
      setIsModalOpen(false);
      setSelectedEvent(null);
      await loadClasses(); // Reload to update view
    } catch (error) {
      console.error('Error deleting event:', error);
      alert(`Failed to delete event. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    <div className="min-h-screen bg-[#F3F0E9] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-5xl font-bold text-gray-900 mb-2">Class Schedule Manager</h1>
              <p className="text-base" style={{ color: '#646464', lineHeight: '1.5' }}>
                {events.length} {events.length === 1 ? 'event' : 'events'} • {user?.email}
              </p>
            </div>
            <Button variant="destructive" onClick={signOut}>
              Sign Out
            </Button>
          </div>
          
          {/* Primary Actions Row */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            {/* Upload PDF - Primary Action */}
            <Button 
              onClick={() => navigate('/upload')} 
              className="bg-black text-white hover:bg-gray-800 border-0"
              style={{ 
                borderRadius: '999px', 
                height: '48px',
                paddingLeft: '24px',
                paddingRight: '24px',
                fontSize: '15px',
                fontWeight: '500'
              }}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload PDF Schedule
            </Button>
            
            {/* Day/Week Toggle */}
            <div className="flex" style={{ gap: '0' }}>
              <Button
                onClick={() => setView('day')}
                variant="outline"
                className={view === 'day' 
                  ? 'bg-black text-white border-black hover:bg-gray-800 hover:text-white' 
                  : 'bg-white text-black border-black hover:bg-gray-50'}
                style={{
                  borderRadius: '999px 0 0 999px',
                  height: '48px',
                  paddingLeft: '20px',
                  paddingRight: '20px',
                  borderRight: '0',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Day by Day
              </Button>
              <Button
                onClick={() => setView('week')}
                variant="outline"
                className={view === 'week' 
                  ? 'bg-black text-white border-black hover:bg-gray-800 hover:text-white' 
                  : 'bg-white text-black border-black hover:bg-gray-50'}
                style={{
                  borderRadius: '0 999px 999px 0',
                  height: '48px',
                  paddingLeft: '20px',
                  paddingRight: '20px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Weekly View
              </Button>
            </div>
          </div>
          
          {/* Secondary Actions Row */}
          <div className="flex flex-wrap items-center" style={{ gap: '12px' }}>
            <Button 
              variant="outline" 
              onClick={() => navigate('/add-event')} 
              className="bg-white border-gray-300 hover:bg-gray-50"
              style={{ height: '44px' }}
            >
              Add Event
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/manual')} 
              className="bg-white border-gray-300 hover:bg-gray-50"
              style={{ height: '44px' }}
            >
              Add Classes
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/catalog')} 
              className="bg-white border-gray-300 hover:bg-gray-50"
              style={{ height: '44px' }}
            >
              Manage Classes
            </Button>
            
            {/* Export Section */}
            <div className="flex items-center" style={{ gap: '8px', marginLeft: '12px', paddingLeft: '12px', borderLeft: '1px solid #d1d5db' }}>
              <span className="text-sm text-gray-600" style={{ marginRight: '4px' }}>Export:</span>
              <Button 
                variant="outline" 
                onClick={() => handleExport('google')} 
                disabled={exporting || events.length === 0}
                className="bg-white border-gray-300 hover:bg-gray-50"
                style={{ height: '44px', fontSize: '13px' }}
              >
                📅 Google
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleExport('outlook')} 
                disabled={exporting || events.length === 0}
                className="bg-white border-gray-300 hover:bg-gray-50"
                style={{ height: '44px', fontSize: '13px' }}
              >
                📅 Outlook
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleExport('apple')} 
                disabled={exporting || events.length === 0}
                className="bg-white border-gray-300 hover:bg-gray-50"
                style={{ height: '44px', fontSize: '13px' }}
              >
                📅 Apple
              </Button>
            </div>
          </div>
        </div>
        
        {/* Week Navigation */}
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="outline"
            onClick={() => {
              const newDate = new Date(date);
              if (view === 'week') {
                newDate.setDate(date.getDate() - 7);
              } else {
                newDate.setDate(date.getDate() - 1);
              }
              setDate(newDate);
            }}
            className="bg-white border-gray-300 hover:bg-gray-50"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          
          <h2 className="text-xl font-semibold text-gray-900">
            {format(date, view === 'week' ? 'MMMM yyyy' : 'EEEE, MMMM d, yyyy')}
          </h2>
          
          <Button
            variant="outline"
            onClick={() => {
              const newDate = new Date(date);
              if (view === 'week') {
                newDate.setDate(date.getDate() + 7);
              } else {
                newDate.setDate(date.getDate() + 1);
              }
              setDate(newDate);
            }}
            className="bg-white border-gray-300 hover:bg-gray-50"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>

        {/* Calendar Container */}
        <div className="bg-white border border-gray-300" style={{ borderRadius: '20px', padding: '24px' }}>
          <div style={{ height: 'calc(100vh - 450px)', minHeight: '600px' }}>
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
            onSelectEvent={handleSelectEvent}
            resizable
            draggableAccessor={(event: ClassEvent) => !event.resource.is_fixed}
          />
          </div>
        </div>

        <div className="p-5 bg-white border border-gray-300" style={{ marginTop: '24px', borderRadius: '20px' }}>
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">Event Types</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center" style={{ gap: '8px' }}>
              <div className="w-5 h-5 rounded-full" style={{
                backgroundColor: '#D8B2D9'
              }}></div>
              <span className="text-sm text-gray-700">Class</span>
            </div>
            <div className="flex items-center" style={{ gap: '8px' }}>
              <div className="w-5 h-5 rounded-full" style={{ backgroundColor: '#EEDC5B' }}></div>
              <span className="text-sm text-gray-700">Personal</span>
            </div>
            <div className="flex items-center" style={{ gap: '8px' }}>
              <div className="w-5 h-5 rounded-full" style={{ backgroundColor: '#f59e0b' }}></div>
              <span className="text-sm text-gray-700">Work</span>
            </div>
            <div className="flex items-center" style={{ gap: '8px' }}>
              <div className="w-5 h-5 rounded-full" style={{ backgroundColor: '#8b5cf6' }}></div>
              <span className="text-sm text-gray-700">Study</span>
            </div>
            <div className="flex items-center" style={{ gap: '8px' }}>
              <div className="w-5 h-5 rounded-full" style={{ backgroundColor: '#ef4444' }}></div>
              <span className="text-sm text-gray-700">Gym/Exercise</span>
            </div>
            <div className="flex items-center" style={{ gap: '8px' }}>
              <div className="w-5 h-5 rounded-full" style={{ backgroundColor: '#ec4899' }}></div>
              <span className="text-sm text-gray-700">Social</span>
            </div>
            <div className="flex items-center" style={{ gap: '8px' }}>
              <div className="w-5 h-5 rounded-full border-4 border-red-500" style={{ backgroundColor: '#EEDC5B' }}></div>
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
            <div className="p-5 bg-red-50 border-2 border-red-200" style={{ marginTop: '24px', borderRadius: '20px' }}>
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

        {/* Event Detail Modal */}
        {isModalOpen && selectedEvent && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setIsModalOpen(false)}
          >
            <div 
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
              style={{ borderRadius: '20px' }}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedEvent.resource.is_fixed ? 'Class Details' : 'Event Details'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3 mb-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Title</p>
                  <p className="text-base font-medium text-gray-900">{selectedEvent.title}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Time</p>
                  <p className="text-base text-gray-900">
                    {format(selectedEvent.start, 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-base text-gray-900">
                    {format(selectedEvent.start, 'h:mm a')} - {format(selectedEvent.end, 'h:mm a')}
                  </p>
                </div>

                {selectedEvent.resource.location && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Location</p>
                    <p className="text-base text-gray-900">{selectedEvent.resource.location}</p>
                  </div>
                )}

                {selectedEvent.resource.is_fixed && (
                  <>
                    {selectedEvent.resource.course_code && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Course Code</p>
                        <p className="text-base text-gray-900">{selectedEvent.resource.course_code}</p>
                      </div>
                    )}
                    {selectedEvent.resource.section && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Section</p>
                        <p className="text-base text-gray-900">{selectedEvent.resource.section}</p>
                      </div>
                    )}
                    {selectedEvent.resource.instructor && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Instructor</p>
                        <p className="text-base text-gray-900">{selectedEvent.resource.instructor}</p>
                      </div>
                    )}
                  </>
                )}

                {!selectedEvent.resource.is_fixed && selectedEvent.resource.category && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Category</p>
                    <p className="text-base text-gray-900 capitalize">{selectedEvent.resource.category}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                {selectedEvent.resource.is_fixed ? (
                  <Button
                    onClick={handleHideClass}
                    variant="outline"
                    className="flex-1 border-gray-300"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                    Hide Class
                  </Button>
                ) : (
                  <Button
                    onClick={handleDeleteEvent}
                    variant="destructive"
                    className="flex-1 bg-red-600 text-white hover:bg-red-700"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Event
                  </Button>
                )}
                <Button
                  onClick={() => setIsModalOpen(false)}
                  variant="outline"
                  className="flex-1 border-gray-300"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
