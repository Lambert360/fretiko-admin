'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { auditAPI, type AuditLog, type AuditStats, type AuditAction, type AuditEntityType, type AuditStatus } from '@/lib/api/audit';
import { staffAPI } from '@/lib/api/staff';
import type { Staff } from '@/types/staff';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Search, FileText, CheckCircle, XCircle, Clock, AlertTriangle, Eye, TrendingUp, Activity } from 'lucide-react';

export default function AuditLogsPage() {
  const { isSuperAdmin, hasPermission } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<'all' | AuditAction>('all');
  const [selectedEntityType, setSelectedEntityType] = useState<'all' | AuditEntityType>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | AuditStatus>('all');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Dialog states
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Staff list for filter
  const [staffList, setStaffList] = useState<Staff[]>([]);

  const canViewLogs = isSuperAdmin || hasPermission('view_staff_logs');

  useEffect(() => {
    if (canViewLogs) {
      fetchStats();
      fetchStaffList();
    }
  }, [canViewLogs]);

  useEffect(() => {
    if (canViewLogs) {
      const timeoutId = setTimeout(() => {
        fetchLogs();
      }, searchQuery ? 500 : 0); // Debounce search by 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [canViewLogs, searchQuery, selectedAction, selectedEntityType, selectedStatus, selectedStaffId, startDate, endDate]);

  const fetchStats = async () => {
    try {
      const statsData = await auditAPI.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch audit stats:', err);
    }
  };

  const fetchStaffList = async () => {
    try {
      const staffData = await staffAPI.getAllStaff();
      setStaffList(staffData);
    } catch (err) {
      console.error('Failed to fetch staff list:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const filters: any = {};
      if (selectedAction !== 'all') {
        filters.action = selectedAction;
      }
      if (selectedEntityType !== 'all') {
        filters.entityType = selectedEntityType;
      }
      if (selectedStatus !== 'all') {
        filters.status = selectedStatus;
      }
      if (selectedStaffId !== 'all') {
        filters.staffId = selectedStaffId;
      }
      if (startDate) {
        filters.startDate = startDate;
      }
      if (endDate) {
        filters.endDate = endDate;
      }

      const logsData = await auditAPI.getLogs(filters);
      
      // Apply client-side search if needed
      let filteredLogs = logsData;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredLogs = logsData.filter(log =>
          log.staffName.toLowerCase().includes(query) ||
          log.action.toLowerCase().includes(query) ||
          log.entityType.toLowerCase().includes(query) ||
          (log.entityId && log.entityId.toLowerCase().includes(query)) ||
          (log.details && JSON.stringify(log.details).toLowerCase().includes(query))
        );
      }
      
      setLogs(filteredLogs);
    } catch (err: any) {
      console.error('Failed to fetch audit logs:', err);
      setError(err.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailDialogOpen(true);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getStatusColor = (status: AuditStatus) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getActionLabel = (action: AuditAction) => {
    return action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getEntityTypeLabel = (entityType: AuditEntityType) => {
    return entityType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const statsCards = stats ? [
    {
      label: 'Total Actions',
      value: formatNumber(stats.totalActions),
      color: 'bg-blue-500',
      icon: Activity,
    },
    {
      label: 'Successful',
      value: formatNumber(stats.successfulActions),
      color: 'bg-green-500',
      icon: CheckCircle,
    },
    {
      label: 'Failed',
      value: formatNumber(stats.failedActions),
      color: 'bg-red-500',
      icon: XCircle,
    },
    {
      label: 'Top Staff',
      value: stats.topStaff.length > 0 ? stats.topStaff[0].staffName : 'N/A',
      color: 'bg-purple-500',
      icon: TrendingUp,
    },
  ] : [];

  if (!canViewLogs) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">You don't have permission to view audit logs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
          <p className="text-muted-foreground mt-2">
            Track and monitor all staff actions and system events
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-lg ${stat.color} bg-opacity-10 flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${stat.color.replace('bg-', 'text-')}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters and Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle>Audit Logs</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-[200px]"
                />
              </div>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value as any)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Actions</option>
                <option value="suspend_user">Suspend User</option>
                <option value="unsuspend_user">Unsuspend User</option>
                <option value="delete_user">Delete User</option>
                <option value="approve_product">Approve Product</option>
                <option value="reject_product">Reject Product</option>
                <option value="resolve_dispute">Resolve Dispute</option>
                <option value="create_staff">Create Staff</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
              </select>
              <select
                value={selectedEntityType}
                onChange={(e) => setSelectedEntityType(e.target.value as any)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Entities</option>
                <option value="user">User</option>
                <option value="product">Product</option>
                <option value="service">Service</option>
                <option value="order">Order</option>
                <option value="dispute">Dispute</option>
                <option value="staff">Staff</option>
                <option value="department">Department</option>
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Staff</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.staffId})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Input
              type="date"
              placeholder="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-[150px]"
            />
            <Input
              type="date"
              placeholder="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-[150px]"
            />
            {(startDate || endDate) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Clear Dates
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="pb-3 font-medium text-sm text-muted-foreground">Timestamp</th>
                    <th className="pb-3 font-medium text-sm text-muted-foreground">Staff</th>
                    <th className="pb-3 font-medium text-sm text-muted-foreground">Action</th>
                    <th className="pb-3 font-medium text-sm text-muted-foreground">Entity</th>
                    <th className="pb-3 font-medium text-sm text-muted-foreground">Status</th>
                    <th className="pb-3 font-medium text-sm text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted-foreground">
                        No audit logs found
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-4 text-sm text-muted-foreground">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="py-4 text-sm font-medium">{log.staffName}</td>
                        <td className="py-4 text-sm">
                          <span className="text-xs">{getActionLabel(log.action)}</span>
                        </td>
                        <td className="py-4 text-sm">
                          <div className="flex flex-col">
                            <span className="text-xs capitalize">{getEntityTypeLabel(log.entityType)}</span>
                            {log.entityId && (
                              <span className="text-xs text-muted-foreground font-mono">
                                {log.entityId.substring(0, 8)}...
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4">
                          <Badge className={getStatusColor(log.status)}>
                            {log.status}
                          </Badge>
                        </td>
                        <td className="py-4 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="View Details"
                            onClick={() => handleViewDetails(log)}
                            disabled={isActionLoading}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogClose onClose={() => setIsDetailDialogOpen(false)} />
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Detailed information about this audit log entry
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Timestamp</p>
                  <p className="text-sm">{formatDate(selectedLog.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedLog.status)}>
                    {selectedLog.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Staff</p>
                  <p className="text-sm">{selectedLog.staffName}</p>
                  <p className="text-xs text-muted-foreground font-mono">{selectedLog.staffId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Action</p>
                  <p className="text-sm">{getActionLabel(selectedLog.action)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Entity Type</p>
                  <p className="text-sm capitalize">{getEntityTypeLabel(selectedLog.entityType)}</p>
                </div>
                {selectedLog.entityId && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Entity ID</p>
                    <p className="text-sm font-mono">{selectedLog.entityId}</p>
                  </div>
                )}
                {selectedLog.ipAddress && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">IP Address</p>
                    <p className="text-sm font-mono">{selectedLog.ipAddress}</p>
                  </div>
                )}
                {selectedLog.userAgent && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">User Agent</p>
                    <p className="text-sm text-xs break-all">{selectedLog.userAgent}</p>
                  </div>
                )}
              </div>
              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Details</p>
                  <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-60">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
              {selectedLog.errorMessage && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Error Message</p>
                  <p className="text-sm text-destructive bg-destructive/10 p-4 rounded-md">
                    {selectedLog.errorMessage}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
