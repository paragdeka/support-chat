import { adjectives, names, uniqueNamesGenerator } from 'unique-names-generator';
import { differenceInCalendarDays, format } from 'date-fns';

export function createName(): string {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, names],
    separator: ' ',
    length: 2,
  });
}

export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const daysDiff = differenceInCalendarDays(now, date);

  const timeStr = format(date, 'h:mm a').toLowerCase(); // 12-hour format

  if (daysDiff === 0) {
    return `Today ${timeStr}`;
  } else if (daysDiff === 1) {
    return `Yesterday ${timeStr}`;
  } else if (daysDiff <= 6) {
    // e.g., "Mon 7:16 pm"
    return `${format(date, 'EEE')} ${timeStr}`;
  } else {
    // fallback for older dates
    return `${format(date, 'MMM d yyyy')} ${timeStr}`;
  }
}
