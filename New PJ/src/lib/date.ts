/**
 * Date formatting and manipulation utilities
 */

/**
 * Format date to readable string
 */
export const formatDate = (date: Date | string, format: string = 'MMM DD, YYYY'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = d.getDate().toString().padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();

  return format
    .replace('MMM', month)
    .replace('DD', day)
    .replace('YYYY', year.toString())
    .replace('MM', (d.getMonth() + 1).toString().padStart(2, '0'));
};

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export const getRelativeTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((new Date().getTime() - d.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;

  return formatDate(d);
};

/**
 * Check if date is today
 */
export const isToday = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return d.toDateString() === today.toDateString();
};

/**
 * Check if date is in the past
 */
export const isPast = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getTime() < new Date().getTime();
};

/**
 * Check if date is in the future
 */
export const isFuture = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getTime() > new Date().getTime();
};

/**
 * Get date range (start and end of day, week, month, year)
 */
export const getDateRange = (type: 'day' | 'week' | 'month' | 'year', date?: Date) => {
  const d = date || new Date();

  const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

  const startOfWeek = new Date(d);
  startOfWeek.setDate(d.getDate() - d.getDay());

  const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
  const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);

  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const endOfYear = new Date(d.getFullYear(), 11, 31);

  const ranges = {
    day: { start: startOfDay, end: endOfDay },
    week: { start: startOfWeek, end: endOfDay },
    month: { start: startOfMonth, end: endOfMonth },
    year: { start: startOfYear, end: endOfYear },
  };

  return ranges[type];
};

/**
 * Add days to a date
 */
export const addDays = (date: Date | string, days: number): Date => {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/**
 * Subtract days from a date
 */
export const subtractDays = (date: Date | string, days: number): Date => {
  return addDays(date, -days);
};
