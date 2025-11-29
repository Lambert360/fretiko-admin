'use client';

import { Button } from './button';
import { Checkbox } from './checkbox';
import { Trash2, Ban, CheckCircle, XCircle, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';

interface BulkActionsProps<T extends { id: string }> {
  selectedItems: T[];
  onSelectAll: (selected: boolean) => void;
  onClearSelection: () => void;
  totalItems: number;
  actions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: (items: T[]) => void;
    variant?: 'default' | 'destructive';
    disabled?: boolean;
  }>;
  className?: string;
}

export function BulkActions<T extends { id: string }>({
  selectedItems,
  onSelectAll,
  onClearSelection,
  totalItems,
  actions = [],
  className,
}: BulkActionsProps<T>) {
  const allSelected = selectedItems.length === totalItems && totalItems > 0;
  const someSelected = selectedItems.length > 0 && selectedItems.length < totalItems;

  if (selectedItems.length === 0 && actions.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center justify-between p-4 bg-muted/50 rounded-lg border ${className || ''}`}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allSelected}
            onCheckedChange={(checked) => onSelectAll(checked === true)}
            aria-label="Select all"
          />
          <span className="text-sm text-muted-foreground">
            {selectedItems.length > 0
              ? `${selectedItems.length} of ${totalItems} selected`
              : `${totalItems} items`}
          </span>
        </div>
        {selectedItems.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearSelection}>
            Clear selection
          </Button>
        )}
      </div>

      {selectedItems.length > 0 && actions.length > 0 && (
        <div className="flex items-center gap-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'default'}
              size="sm"
              onClick={() => action.onClick(selectedItems)}
              disabled={action.disabled}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

