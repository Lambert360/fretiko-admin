/**
 * Export utilities for converting data to CSV/Excel formats
 */

export interface ExportableData {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Convert an array of objects to CSV format
 */
export function convertToCSV(data: ExportableData[], headers?: string[]): string {
  if (data.length === 0) {
    return '';
  }

  // Use provided headers or extract from first object
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create header row
  const headerRow = csvHeaders.map(header => `"${String(header).replace(/"/g, '""')}"`).join(',');
  
  // Create data rows
  const dataRows = data.map(row => {
    return csvHeaders.map(header => {
      const value = row[header];
      if (value === null || value === undefined) {
        return '""';
      }
      // Escape quotes and wrap in quotes
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',');
  });
  
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Download data as CSV file
 */
export function downloadCSV(data: ExportableData[], filename: string, headers?: string[]): void {
  const csv = convertToCSV(data, headers);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Convert data to Excel-compatible format (TSV for simplicity)
 */
export function downloadExcel(data: ExportableData[], filename: string, headers?: string[]): void {
  if (data.length === 0) {
    return;
  }

  const csvHeaders = headers || Object.keys(data[0]);
  const headerRow = csvHeaders.map(header => String(header)).join('\t');
  
  const dataRows = data.map(row => {
    return csvHeaders.map(header => {
      const value = row[header];
      if (value === null || value === undefined) {
        return '';
      }
      return String(value).replace(/\t/g, ' ').replace(/\n/g, ' ');
    }).join('\t');
  });
  
  const tsv = [headerRow, ...dataRows].join('\n');
  const blob = new Blob([tsv], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.xls`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Format date for export
 * Handles null, undefined, and invalid dates gracefully
 */
export function formatDateForExport(date: string | Date | null | undefined): string {
  // Handle null/undefined
  if (!date) {
    return '';
  }

  // Convert string to Date if needed
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(d.getTime())) {
    return '';
  }

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Format currency for export
 */
export function formatCurrencyForExport(amount: number): string {
  return amount.toFixed(2);
}

