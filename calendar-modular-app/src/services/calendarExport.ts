import { supabase } from '../lib/supabase';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
}

/**
 * Generate iCalendar (.ics) format content
 * Compatible with Google Calendar, Outlook, and Apple Calendar
 */
function generateICS(events: CalendarEvent[], calendarName: string = 'My Schedule'): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  // Helper to format date for iCal
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  // Helper to escape text for iCal
  const escapeText = (text: string): string => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };
  
  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Calendar Modular//EN',
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    'X-WR-TIMEZONE:America/New_York',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];
  
  events.forEach(event => {
    ics.push('BEGIN:VEVENT');
    ics.push(`UID:${event.id}@calendar-modular.app`);
    ics.push(`DTSTAMP:${timestamp}`);
    ics.push(`DTSTART:${formatDate(event.start)}`);
    ics.push(`DTEND:${formatDate(event.end)}`);
    ics.push(`SUMMARY:${escapeText(event.title)}`);
    
    if (event.location) {
      ics.push(`LOCATION:${escapeText(event.location)}`);
    }
    
    if (event.description) {
      ics.push(`DESCRIPTION:${escapeText(event.description)}`);
    }
    
    ics.push('STATUS:CONFIRMED');
    ics.push('SEQUENCE:0');
    ics.push('END:VEVENT');
  });
  
  ics.push('END:VCALENDAR');
  
  return ics.join('\r\n');
}

/**
 * Download ICS file to user's computer
 */
function downloadICS(content: string, filename: string = 'schedule.ics'): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export user's schedule to calendar format
 */
export async function exportCalendar(userId: string, format: 'download' | 'google' | 'outlook' | 'apple' = 'download'): Promise<void> {
  try {
    // Fetch all visible classes
    const { data: classes, error: classError } = await supabase
      .from('class_catalog')
      .select('*')
      .eq('user_id', userId)
      .eq('is_hidden', false);
    
    if (classError) throw classError;
    
    // Fetch all personal events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId);
    
    if (eventsError) throw eventsError;
    
    // Convert to calendar events
    const calendarEvents: CalendarEvent[] = [];
    
    // Add classes (we'll create recurring events for each day)
    classes?.forEach(classItem => {
      classItem.days.forEach((day: string) => {
        // Create a representative event for the first occurrence
        const baseDate = getNextDayOfWeek(new Date(), day);
        const [startHour, startMin] = classItem.start_time.split(':').map(Number);
        const [endHour, endMin] = classItem.end_time.split(':').map(Number);
        
        const start = new Date(baseDate);
        start.setHours(startHour, startMin, 0, 0);
        
        const end = new Date(baseDate);
        end.setHours(endHour, endMin, 0, 0);
        
        calendarEvents.push({
          id: `${classItem.id}-${day}`,
          title: classItem.course_code 
            ? `${classItem.course_code}: ${classItem.course_name}` 
            : classItem.course_name,
          start,
          end,
          location: classItem.location || undefined,
          description: [
            classItem.section && `Section: ${classItem.section}`,
            classItem.instructor && `Instructor: ${classItem.instructor}`,
          ].filter(Boolean).join('\n'),
        });
      });
    });
    
    // Add personal events
    events?.forEach(event => {
      calendarEvents.push({
        id: event.id,
        title: event.title,
        start: new Date(event.start_time),
        end: new Date(event.end_time),
        location: event.location || undefined,
        description: event.description || undefined,
      });
    });
    
    // Generate ICS content
    const icsContent = generateICS(calendarEvents, 'My Class Schedule');
    
    if (format === 'download') {
      // Direct download
      downloadICS(icsContent);
    } else if (format === 'google') {
      // For Google Calendar, we download the file and user imports it manually
      downloadICS(icsContent, 'google-calendar-import.ics');
      alert('File downloaded! Import it to Google Calendar:\n1. Go to calendar.google.com\n2. Click Settings (gear icon)\n3. Click "Import & export"\n4. Select the downloaded file');
    } else if (format === 'outlook') {
      // For Outlook, same process
      downloadICS(icsContent, 'outlook-import.ics');
      alert('File downloaded! Import it to Outlook:\n1. Open Outlook\n2. Go to File > Open & Export > Import/Export\n3. Select "Import an iCalendar (.ics) file"\n4. Choose the downloaded file');
    } else if (format === 'apple') {
      // For Apple Calendar, open directly
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      alert('Calendar file opened! Your system will prompt you to add it to Apple Calendar.');
    }
    
  } catch (error) {
    console.error('Error exporting calendar:', error);
    throw error;
  }
}

/**
 * Helper: Get the next occurrence of a day of week
 */
function getNextDayOfWeek(date: Date, dayCode: string): Date {
  const days: { [key: string]: number } = {
    'U': 0, // Sunday
    'M': 1, // Monday
    'T': 2, // Tuesday
    'W': 3, // Wednesday
    'R': 4, // Thursday
    'F': 5, // Friday
    'S': 6, // Saturday
  };
  
  const targetDay = days[dayCode];
  const currentDay = date.getDay();
  const daysToAdd = (targetDay - currentDay + 7) % 7 || 7;
  
  const result = new Date(date);
  result.setDate(date.getDate() + daysToAdd);
  return result;
}
