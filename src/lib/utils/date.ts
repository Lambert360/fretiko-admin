/**
 * Date utility functions
 */

/**
 * Get date range for last N days
 */
export function getLastNDays(n: number): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - n);
  
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

/**
 * Get date range for current month
 */
export function getCurrentMonth(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

/**
 * Get date range for last month
 */
export function getLastMonth(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

/**
 * Check if a date is within a date range
 */
export function isDateInRange(date: string | Date, start: string, end: string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const startDate = new Date(start);
  const endDate = new Date(end);
  return dateObj >= startDate && dateObj <= endDate;
}

/**
 * Format date for input[type="date"]
 */
export function formatDateForInput(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString().split('T')[0];
}

