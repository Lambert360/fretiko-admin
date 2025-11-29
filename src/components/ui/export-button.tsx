'use client';

import { Button } from './button';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { downloadCSV, downloadExcel, type ExportableData } from '@/lib/utils/export';

interface ExportButtonProps {
  data: ExportableData[];
  filename: string;
  headers?: string[];
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ExportButton({
  data,
  filename,
  headers,
  disabled = false,
  variant = 'outline',
  size = 'default',
}: ExportButtonProps) {
  const handleExportCSV = () => {
    downloadCSV(data, filename, headers);
  };

  const handleExportExcel = () => {
    downloadExcel(data, filename, headers);
  };

  if (data.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={disabled || data.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCSV}>
          <FileText className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportExcel}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

