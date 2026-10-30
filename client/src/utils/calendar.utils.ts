/**
 * Universal Calendar Helper
 * Generates direct calendar event links for Google Calendar, Apple Calendar (iOS/macOS), Outlook, and .ics download
 */

export interface CalendarEventDetails {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  durationMinutes?: number;
}

/**
 * Formats a Date object into iCalendar UTC format (YYYYMMDDTHHmmssZ)
 */
function formatToUtcIcs(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

/**
 * 1. Google Calendar Web Template Link
 */
export function getGoogleCalendarUrl(event: CalendarEventDetails): string {
  const start = formatToUtcIcs(event.startDate);
  const duration = event.durationMinutes || 60;
  const endDate = new Date(event.startDate.getTime() + duration * 60 * 1000);
  const end = formatToUtcIcs(endDate);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
    details: event.description || '',
    location: event.location || ''
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * 2. Microsoft Outlook Web Link
 */
export function getOutlookCalendarUrl(event: CalendarEventDetails): string {
  const duration = event.durationMinutes || 60;
  const endDate = new Date(event.startDate.getTime() + duration * 60 * 1000);

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: event.startDate.toISOString(),
    enddt: endDate.toISOString(),
    body: event.description || '',
    location: event.location || ''
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * 3. Generates a valid .ics string (Apple Calendar & universal file standard)
 */
export function generateIcsContent(event: CalendarEventDetails): string {
  const start = formatToUtcIcs(event.startDate);
  const duration = event.durationMinutes || 60;
  const endDate = new Date(event.startDate.getTime() + duration * 60 * 1000);
  const end = formatToUtcIcs(endDate);
  const now = formatToUtcIcs(new Date());

  const cleanTitle = (event.title || '').replace(/[,;]/g, ' ');
  const cleanDesc = (event.description || '').replace(/\n/g, '\\n');
  const cleanLoc = (event.location || '').replace(/[,;]/g, ' ');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ApplyTrack//Universal Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:applytrack-${Date.now()}@applytrack.app`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${cleanTitle}`,
    `DESCRIPTION:${cleanDesc}`,
    `LOCATION:${cleanLoc}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: 24h before deadline',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT6H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Urgent Reminder: 6h before deadline',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

/**
 * 4. Downloads .ics file (Triggers native Apple Calendar on iOS / macOS, or imports to desktop)
 */
export function downloadIcsFile(event: CalendarEventDetails, filename = 'event.ics'): void {
  const icsData = generateIcsContent(event);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.ics') ? filename : `${filename}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
