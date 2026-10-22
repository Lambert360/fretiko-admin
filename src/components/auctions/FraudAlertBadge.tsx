'use client';

import { useState } from 'react';
import { AlertTriangle, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { runFraudCheck, type FraudAlert } from '@/lib/api/auctions';
import { toast } from '@/hooks/use-toast';

interface FraudAlertBadgeProps {
  auctionId: string;
  initialAlerts?: FraudAlert[];
  onAlertsUpdated?: (alerts: FraudAlert[]) => void;
}

export function FraudAlertBadge({ auctionId, initialAlerts = [], onAlertsUpdated }: FraudAlertBadgeProps) {
  const [alerts, setAlerts] = useState<FraudAlert[]>(initialAlerts);
  const [checking, setChecking] = useState(false);

  const handleRunCheck = async () => {
    setChecking(true);
    try {
      const result = await runFraudCheck(auctionId);
      setAlerts(result.alerts);
      onAlertsUpdated?.(result.alerts);
      
      if (result.alerts_found === 0) {
        toast({
          title: 'No fraud alerts detected',
          description: 'This auction appears to be legitimate',
        });
      } else {
        toast({
          title: `${result.alerts_found} fraud alert(s) detected`,
          description: 'Review bid history for details',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Fraud check failed',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setChecking(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600 hover:bg-red-700';
      case 'high':
        return 'bg-orange-600 hover:bg-orange-700';
      case 'medium':
        return 'bg-yellow-600 hover:bg-yellow-700';
      case 'low':
        return 'bg-blue-600 hover:bg-blue-700';
      default:
        return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  const highestSeverity = alerts.reduce((max, alert) => {
    const levels = { low: 1, medium: 2, high: 3, critical: 4 };
    const currentLevel = levels[alert.severity] || 0;
    const maxLevel = levels[max] || 0;
    return currentLevel > maxLevel ? alert.severity : max;
  }, 'low' as FraudAlert['severity']);

  if (alerts.length === 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRunCheck}
              disabled={checking}
              className="h-7 px-2"
            >
              {checking ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600" />
              ) : (
                <Shield className="h-3 w-3" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Run fraud check</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            className={`${getSeverityColor(highestSeverity)} cursor-pointer`}
            onClick={handleRunCheck}
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            {alerts.length} Alert{alerts.length > 1 ? 's' : ''}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">Fraud Alerts Detected</p>
            {alerts.slice(0, 3).map((alert, idx) => (
              <p key={idx} className="text-xs">
                • {alert.message}
              </p>
            ))}
            {alerts.length > 3 && (
              <p className="text-xs italic">+ {alerts.length - 3} more...</p>
            )}
            <p className="text-xs text-gray-400 mt-2">Click to re-check</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

