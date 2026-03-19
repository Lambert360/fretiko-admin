/** @jsxImportSource react */
'use client';

/**
 * System Monitoring Dashboard
 *
 * Real-time system health monitoring and background task management
 * Features:
 * - System health metrics display
 * - Provider performance monitoring
 * - Alert management interface
 * - Manual control buttons for critical operations
 *
 * Requires: view_revenue permission
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { monitoringAPI, type HealthMetrics, type Alert } from '@/lib/api/monitoring';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Cpu, 
  Database, 
  Globe, 
  Loader2, 
  RefreshCw, 
  Server, 
  TrendingUp, 
  Wifi, 
  WifiOff,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  MoreVertical
} from 'lucide-react';
import { LoadingPage, LoadingSpinner } from '@/components/ui/loading';
import { formatDateTime, formatDuration, formatBytes } from '@/lib/utils/formatting';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';

const MonitoringPage = () => {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [health, alertsData] = await Promise.all([
        monitoringAPI.getHealthMetrics(),
        monitoringAPI.getAlerts(20)
      ]);
      
      setHealthMetrics(health);
      setAlerts(alertsData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load monitoring data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualRateUpdate = async () => {
    try {
      setRefreshing(true);
      const result = await monitoringAPI.manualRateUpdate();
      
      toast({
        title: 'Rate Update Triggered',
        description: result.message,
      });
      
      // Refresh data after operation
      await loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to trigger rate update',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleManualReconciliation = async () => {
    try {
      setRefreshing(true);
      const result = await monitoringAPI.manualReconciliation();
      
      toast({
        title: 'Reconciliation Triggered',
        description: result.message,
      });
      
      // Refresh data after operation
      await loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to trigger reconciliation',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleDismissAlert = async (alertId: string) => {
    try {
      await monitoringAPI.dismissAlert(alertId);
      
      toast({
        title: 'Alert Dismissed',
        description: 'The alert has been dismissed',
      });
      
      // Refresh alerts
      await loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to dismiss alert',
        variant: 'destructive',
      });
    }
  };

  const handleResolveAlert = async (alertId: string, notes?: string) => {
    try {
      await monitoringAPI.resolveAlert(alertId, notes);
      
      toast({
        title: 'Alert Resolved',
        description: 'The alert has been resolved',
      });
      
      setAlertDialogOpen(false);
      setSelectedAlert(null);
      
      // Refresh alerts
      await loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to resolve alert',
        variant: 'destructive',
      });
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getAlertIcon = (alert: Alert) => {
    if (alert.resolved) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    
    switch (alert.severity) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'low': return <Eye className="h-4 w-4 text-blue-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!hasPermission('view_revenue')) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">You don't have permission to access monitoring.</p>
      </div>
    );
  }

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-gray-600">Real-time system health and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => loadData()}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthMetrics ? formatDuration(healthMetrics.uptime) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Continuous operation time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthMetrics ? formatBytes(healthMetrics.memory.heapUsed) : 'N/A'}
            </div>
            <Progress 
              value={healthMetrics ? (healthMetrics.memory.heapUsed / healthMetrics.memory.heapTotal) * 100 : 0}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground">
              {healthMetrics ? formatBytes(healthMetrics.memory.heapTotal) : 'N/A'} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rate Updates</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthMetrics?.successfulUpdates || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {healthMetrics?.failedUpdates || 0} failed today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alerts.filter(a => !a.resolved).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {alerts.length} total alerts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Provider Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Provider Health Status
          </CardTitle>
          <CardDescription>
            Real-time status of payment and rate providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {healthMetrics?.providerHealth && Object.entries(healthMetrics.providerHealth).map(([provider, health]) => (
              <div key={provider} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {health.healthy ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <WifiOff className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium">{provider}</p>
                    <p className="text-sm text-gray-500">
                      {health.responseTime ? `${health.responseTime}ms` : 'No response'}
                    </p>
                  </div>
                </div>
                <Badge variant={health.healthy ? 'default' : 'destructive'}>
                  {health.healthy ? 'Healthy' : 'Unhealthy'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Manual Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Manual Controls
          </CardTitle>
          <CardDescription>
            Trigger manual operations for system maintenance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Exchange Rate Update</h4>
              <p className="text-sm text-gray-600 mb-4">
                Manually trigger exchange rate updates from all providers
              </p>
              <Button 
                onClick={handleManualRateUpdate}
                disabled={refreshing}
                className="w-full"
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Update Rates
              </Button>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Wallet Reconciliation</h4>
              <p className="text-sm text-gray-600 mb-4">
                Manually trigger wallet balance reconciliation
              </p>
              <Button 
                onClick={handleManualReconciliation}
                disabled={refreshing}
                className="w-full"
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                Reconcile Wallets
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Recent Alerts
          </CardTitle>
          <CardDescription>
            Latest system alerts and notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No recent alerts</p>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getAlertIcon(alert)}
                    <div>
                      <p className="font-medium">{alert.type}</p>
                      <p className="text-sm text-gray-600">{alert.message}</p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(alert.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getAlertSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    {!alert.resolved && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleDismissAlert(alert.id)}>
                            Dismiss
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedAlert(alert);
                            setAlertDialogOpen(true);
                          }}>
                            Resolve
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alert Resolution Dialog */}
      <Dialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Alert</DialogTitle>
            <DialogDescription>
              Mark this alert as resolved and add optional notes
            </DialogDescription>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div>
                <p className="font-medium">{selectedAlert.type}</p>
                <p className="text-sm text-gray-600">{selectedAlert.message}</p>
                <p className="text-xs text-gray-500">
                  {formatDateTime(selectedAlert.timestamp)}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAlertDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => selectedAlert && handleResolveAlert(selectedAlert.id)}>
              Resolve Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MonitoringPage;
