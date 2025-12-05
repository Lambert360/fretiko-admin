'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { disputesAPI, type Dispute, type DisputeDetail, type DisputeStats } from '@/lib/api/disputes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Search, AlertCircle, Clock, CheckCircle, XCircle, Eye, MessageSquare, CheckCircle2, ArrowUp, RefreshCw } from 'lucide-react';
import { ExportButton } from '@/components/ui/export-button';
import { formatDateForExport } from '@/lib/utils/export';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

// Mock data for testing action buttons
const mockDisputes: Dispute[] = [
  {
    id: 'mock-1',
    disputeId: 'DSP-2025-0001',
    orderNumber: 'ORD-2025-0123',
    complainant: 'John Doe',
    respondent: 'Fresh Foods Market',
    type: 'item_not_as_described',
    status: 'open',
    priority: 'urgent',
    createdAt: new Date().toISOString(),
    description: 'Received damaged products that do not match the description. The item was supposed to be new but arrived with visible scratches and missing parts.',
  },
  {
    id: 'mock-2',
    disputeId: 'DSP-2025-0002',
    orderNumber: 'ORD-2025-0118',
    complainant: 'Jane Smith',
    respondent: 'Quick Delivery Co.',
    type: 'delivery_issue',
    status: 'under_review',
    priority: 'high',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Package not delivered on time. The order was supposed to arrive within 24 hours but has been delayed for 3 days with no updates from the vendor.',
  },
  {
    id: 'mock-3',
    disputeId: 'DSP-2025-0003',
    orderNumber: 'ORD-2025-0115',
    complainant: 'Mike Johnson',
    respondent: 'Tech Gadgets Store',
    type: 'wrong_item',
    status: 'resolved',
    priority: 'medium',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Received wrong product variant. Ordered a 64GB model but received 32GB instead. Need exchange or refund.',
  },
  {
    id: 'mock-4',
    disputeId: 'DSP-2025-0004',
    orderNumber: 'ORD-2025-0110',
    complainant: 'Sarah Williams',
    respondent: 'Fashion Boutique',
    type: 'refund_request',
    status: 'escalated',
    priority: 'urgent',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Requesting refund for cancelled order. The vendor cancelled the order after payment was processed and is refusing to issue a refund.',
  },
  {
    id: 'mock-5',
    disputeId: 'DSP-2025-0005',
    orderNumber: 'ORD-2025-0105',
    complainant: 'David Brown',
    respondent: 'Electronics Hub',
    type: 'damaged_item',
    status: 'open',
    priority: 'high',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Product arrived damaged due to poor packaging. The screen is cracked and the device does not power on. Photos attached as evidence.',
  },
];

const mockStats: DisputeStats = {
  totalDisputes: 5,
  openDisputes: 2,
  underReviewDisputes: 1,
  resolvedDisputes: 1,
  escalatedDisputes: 1,
};

export default function DisputesPage() {
  const { isSuperAdmin, hasPermission } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'open' | 'under_review' | 'resolved' | 'escalated'>('all');
  const [selectedType, setSelectedType] = useState('all');
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [stats, setStats] = useState<DisputeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [useMockData, setUseMockData] = useState(false);
  const limit = 20;

  // Dialog states
  const [selectedDispute, setSelectedDispute] = useState<DisputeDetail | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [isEscalateDialogOpen, setIsEscalateDialogOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [resolveForm, setResolveForm] = useState({ resolution: '', outcome: 'favor_complainant' as 'favor_complainant' | 'favor_respondent' | 'partial' });
  const [escalateReason, setEscalateReason] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageThreadRefreshing, setMessageThreadRefreshing] = useState(false);

  const canViewDisputes = isSuperAdmin || hasPermission('view_disputes');
  const canResolveDisputes = isSuperAdmin || hasPermission('resolve_disputes');
  const canEscalateDisputes = isSuperAdmin || hasPermission('escalate_disputes');

  useEffect(() => {
    if (canViewDisputes) {
      fetchStats();
      fetchDisputes();
    }
  }, [canViewDisputes, page, selectedStatus, selectedType, searchQuery, useMockData]);

  const fetchStats = async () => {
    if (useMockData) {
      setStats(mockStats);
      return;
    }
    try {
      const statsData = await disputesAPI.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch dispute stats:', err);
      // Fallback to mock data on error
      setStats(mockStats);
    }
  };

  const fetchDisputes = async () => {
    if (useMockData) {
      setIsLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Filter mock data
      let filtered = [...mockDisputes];
      if (selectedStatus !== 'all') {
        filtered = filtered.filter(d => d.status === selectedStatus);
      }
      if (selectedType !== 'all') {
        filtered = filtered.filter(d => d.type === selectedType);
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(d => 
          d.disputeId.toLowerCase().includes(query) ||
          d.orderNumber.toLowerCase().includes(query) ||
          d.complainant.toLowerCase().includes(query) ||
          d.respondent.toLowerCase().includes(query)
        );
      }
      
      setDisputes(filtered);
      setTotal(filtered.length);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await disputesAPI.getDisputes({
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        type: selectedType !== 'all' ? selectedType : undefined,
        search: searchQuery || undefined,
        page,
        limit,
      });
      setDisputes(response.disputes);
      setTotal(response.total);
    } catch (err: any) {
      console.error('Failed to fetch disputes:', err);
      setError(err.response?.data?.message || 'Failed to load disputes');
      // Fallback to mock data on error
      setDisputes(mockDisputes);
      setTotal(mockDisputes.length);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = async (disputeId: string) => {
    try {
      setIsActionLoading(true);
      
      // Use mock data for testing
      if (useMockData || disputeId.startsWith('mock-')) {
        const mockDispute = mockDisputes.find(d => d.id === disputeId);
        if (mockDispute) {
          // Create a mock DisputeDetail from the mock Dispute
          const mockDetail: DisputeDetail = {
            ...mockDispute,
            orderId: 'mock-order-id',
            complainant: {
              id: 'mock-complainant-id',
              name: mockDispute.complainant,
            },
            respondent: {
              id: 'mock-respondent-id',
              name: mockDispute.respondent,
            },
            reason: mockDispute.description || 'Mock dispute reason',
            evidence: [],
            updatedAt: mockDispute.createdAt,
            messages: [],
          };
          setSelectedDispute(mockDetail);
          setIsDetailDialogOpen(true);
          setIsActionLoading(false);
          return;
        }
      }
      
      const dispute = await disputesAPI.getDisputeById(disputeId);
      setSelectedDispute(dispute);
      setIsDetailDialogOpen(true);
    } catch (err: any) {
      console.error('Failed to fetch dispute details:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load dispute details',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedDispute || !messageText.trim()) return;

    try {
      setIsSendingMessage(true);
      await disputesAPI.sendMessage(selectedDispute.id, messageText.trim());
      
      // Refresh dispute to get updated messages
      const updatedDispute = await disputesAPI.getDisputeById(selectedDispute.id);
      setSelectedDispute(updatedDispute);
      setMessageText('');
      
      toast({
        title: 'Success',
        description: 'Message sent successfully',
      });
    } catch (err: any) {
      console.error('Failed to send message:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleRefreshMessages = async () => {
    if (!selectedDispute) return;

    try {
      setMessageThreadRefreshing(true);
      const updatedDispute = await disputesAPI.getDisputeById(selectedDispute.id);
      setSelectedDispute(updatedDispute);
    } catch (err: any) {
      console.error('Failed to refresh messages:', err);
      toast({
        title: 'Error',
        description: 'Failed to refresh messages',
        variant: 'destructive',
      });
    } finally {
      setMessageThreadRefreshing(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedDispute || !resolveForm.resolution.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a resolution reason',
        variant: 'destructive',
      });
      return;
    }

    // Handle mock data
    if (useMockData || selectedDispute.id.startsWith('mock-')) {
      setIsActionLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsResolveDialogOpen(false);
      setResolveForm({ resolution: '', outcome: 'favor_complainant' });
      // Update mock dispute status
      setDisputes(prev => prev.map(d => 
        d.id === selectedDispute.id ? { ...d, status: 'resolved' as const } : d
      ));
      setStats(prev => prev ? {
        ...prev,
        resolvedDisputes: prev.resolvedDisputes + 1,
        openDisputes: Math.max(0, prev.openDisputes - 1),
      } : null);
      toast({
        title: 'Success',
        description: 'Dispute resolved successfully (Mock)',
      });
      setIsActionLoading(false);
      return;
    }

    try {
      setIsActionLoading(true);
      await disputesAPI.resolveDispute(selectedDispute.id, resolveForm.resolution, resolveForm.outcome);
      setIsResolveDialogOpen(false);
      setResolveForm({ resolution: '', outcome: 'favor_complainant' });
      await fetchDisputes();
      await fetchStats();
      toast({
        title: 'Success',
        description: 'Dispute resolved successfully',
      });
    } catch (err: any) {
      console.error('Failed to resolve dispute:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to resolve dispute',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEscalate = async () => {
    if (!selectedDispute || !escalateReason.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a reason for escalation',
        variant: 'destructive',
      });
      return;
    }

    // Handle mock data
    if (useMockData || selectedDispute.id.startsWith('mock-')) {
      setIsActionLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsEscalateDialogOpen(false);
      setEscalateReason('');
      // Update mock dispute status
      setDisputes(prev => prev.map(d => 
        d.id === selectedDispute.id ? { ...d, status: 'escalated' as const } : d
      ));
      setStats(prev => prev ? {
        ...prev,
        escalatedDisputes: prev.escalatedDisputes + 1,
        openDisputes: Math.max(0, prev.openDisputes - 1),
      } : null);
      toast({
        title: 'Success',
        description: 'Dispute escalated successfully (Mock)',
      });
      setIsActionLoading(false);
      return;
    }

    try {
      setIsActionLoading(true);
      await disputesAPI.escalateDispute(selectedDispute.id, escalateReason);
      setIsEscalateDialogOpen(false);
      setEscalateReason('');
      await fetchDisputes();
      await fetchStats();
      toast({
        title: 'Success',
        description: 'Dispute escalated successfully',
      });
    } catch (err: any) {
      console.error('Failed to escalate dispute:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to escalate dispute',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const statsCards = stats ? [
    {
      label: 'Total Disputes',
      value: formatNumber(stats.totalDisputes),
      color: 'bg-blue-500',
      icon: AlertCircle,
    },
    {
      label: 'Open',
      value: formatNumber(stats.openDisputes),
      color: 'bg-yellow-500',
      icon: Clock,
    },
    {
      label: 'Resolved',
      value: formatNumber(stats.resolvedDisputes),
      color: 'bg-green-500',
      icon: CheckCircle,
    },
    {
      label: 'Escalated',
      value: formatNumber(stats.escalatedDisputes),
      color: 'bg-red-500',
      icon: XCircle,
    },
  ] : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'escalated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!canViewDisputes) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">You don't have permission to view disputes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dispute Management</h2>
          <p className="text-muted-foreground mt-2">
            Handle customer disputes and resolution
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              setIsLoading(true);
              await fetchDisputes();
              await fetchStats();
              setIsLoading(false);
            }}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <ExportButton
            data={disputes.map(dispute => ({
              'Dispute ID': dispute.disputeId,
              'Order Number': dispute.orderNumber,
              'Complainant': dispute.complainant,
              'Respondent': dispute.respondent,
              'Type': dispute.type.replace(/_/g, ' '),
              'Status': dispute.status.replace(/_/g, ' '),
              'Priority': dispute.priority || 'medium',
              'Created': formatDateForExport(dispute.createdAt),
            }))}
            filename="disputes"
            headers={['Dispute ID', 'Order Number', 'Complainant', 'Respondent', 'Type', 'Status', 'Priority', 'Created']}
            disabled={isLoading || disputes.length === 0}
          />
          {process.env.NODE_ENV === 'development' && (
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={useMockData}
                onChange={(e) => {
                  setUseMockData(e.target.checked);
                  setPage(1);
                }}
                className="rounded"
              />
              Use Mock Data (Dev Only)
            </label>
          )}
        </div>
      </div>

      {/* Mock Data Indicator */}
      {useMockData && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Using Mock Data for Testing</span>
            <span className="text-sm">- Action buttons will simulate responses</span>
          </div>
        </div>
      )}

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

      {/* Disputes List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle>All Disputes</CardTitle>
              <CardDescription>View and manage customer disputes</CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search disputes..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10 w-full sm:w-[250px]"
                />
              </div>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value as any);
                  setPage(1);
                }}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="under_review">Under Review</option>
                <option value="resolved">Resolved</option>
                <option value="escalated">Escalated</option>
              </select>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Types</option>
                <option value="item_not_received">Item Not Received</option>
                <option value="item_not_as_described">Item Not As Described</option>
                <option value="damaged_item">Damaged Item</option>
                <option value="wrong_item">Wrong Item</option>
                <option value="refund_request">Refund Request</option>
                <option value="quality_issue">Quality Issue</option>
                <option value="delivery_issue">Delivery Issue</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Disputes Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="pb-3 font-medium text-sm text-muted-foreground">Dispute ID</th>
                      <th className="pb-3 font-medium text-sm text-muted-foreground">Order #</th>
                      <th className="pb-3 font-medium text-sm text-muted-foreground">Complainant</th>
                      <th className="pb-3 font-medium text-sm text-muted-foreground">Respondent</th>
                      <th className="pb-3 font-medium text-sm text-muted-foreground">Type</th>
                      <th className="pb-3 font-medium text-sm text-muted-foreground">Priority</th>
                      <th className="pb-3 font-medium text-sm text-muted-foreground">Status</th>
                      <th className="pb-3 font-medium text-sm text-muted-foreground">Created</th>
                      <th className="pb-3 font-medium text-sm text-muted-foreground text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disputes.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-8 text-muted-foreground">
                          No disputes found
                        </td>
                      </tr>
                    ) : (
                      disputes.map((dispute) => (
                        <tr key={dispute.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-4">
                            <span className="font-mono text-sm font-medium">{dispute.disputeId}</span>
                          </td>
                          <td className="py-4">
                            <span className="font-mono text-sm">{dispute.orderNumber}</span>
                          </td>
                          <td className="py-4 text-sm">{dispute.complainant}</td>
                          <td className="py-4 text-sm">{dispute.respondent}</td>
                          <td className="py-4">
                            <span className="text-xs capitalize">
                              {dispute.type.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getPriorityColor(dispute.priority || 'medium')}`}>
                              {dispute.priority || 'medium'}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(dispute.status)}`}>
                              {dispute.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-4 text-sm text-muted-foreground">
                            {formatDate(dispute.createdAt)}
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                title="View Details"
                                onClick={() => handleViewDetails(dispute.id)}
                                disabled={isActionLoading}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {dispute.status !== 'resolved' && canResolveDisputes && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Resolve"
                                  onClick={async () => {
                                    await handleViewDetails(dispute.id);
                                    setTimeout(() => setIsResolveDialogOpen(true), 300);
                                  }}
                                  disabled={isActionLoading}
                                >
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                </Button>
                              )}
                              {dispute.status !== 'escalated' && dispute.status !== 'resolved' && canEscalateDisputes && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Escalate"
                                  onClick={async () => {
                                    await handleViewDetails(dispute.id);
                                    setTimeout(() => setIsEscalateDialogOpen(true), 300);
                                  }}
                                  disabled={isActionLoading}
                                >
                                  <ArrowUp className="h-4 w-4 text-orange-600" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {total > limit && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} disputes
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page * limit >= total}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dispute Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogClose onClose={() => setIsDetailDialogOpen(false)} />
          <DialogHeader>
            <DialogTitle>Dispute Details</DialogTitle>
            <DialogDescription>
              View and manage dispute information
            </DialogDescription>
          </DialogHeader>
          {selectedDispute && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dispute ID</p>
                  <p className="font-mono text-sm">{selectedDispute.disputeId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Order Number</p>
                  <p className="font-mono text-sm">{selectedDispute.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedDispute.status)}>
                    {selectedDispute.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <p className="text-sm capitalize">{selectedDispute.type.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Complainant</p>
                  <p className="text-sm">{selectedDispute.complainant.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Respondent</p>
                  <p className="text-sm">{selectedDispute.respondent.name}</p>
                </div>
              </div>
              {selectedDispute.reason && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Reason</p>
                  <p className="text-sm">{selectedDispute.reason}</p>
                </div>
              )}
              {selectedDispute.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                  <p className="text-sm">{selectedDispute.description}</p>
                </div>
              )}
              {selectedDispute.adminNotes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Admin Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{selectedDispute.adminNotes}</p>
                </div>
              )}
              {selectedDispute.resolution && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Resolution</p>
                  <p className="text-sm">{selectedDispute.resolutionReason || selectedDispute.resolution}</p>
                </div>
              )}

              {/* Message Thread */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium">Message Thread</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefreshMessages}
                    disabled={messageThreadRefreshing}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${messageThreadRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto mb-4 p-3 bg-muted/30 rounded-md">
                  {selectedDispute.messages && selectedDispute.messages.length > 0 ? (
                    selectedDispute.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          msg.isStaffMessage ? 'items-end' : msg.isAdminMessage ? 'items-center' : 'items-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.isStaffMessage
                              ? 'bg-primary text-primary-foreground'
                              : msg.isAdminMessage
                              ? 'bg-muted border border-dashed'
                              : 'bg-background border'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {msg.isStaffMessage && (
                              <Badge variant="secondary" className="text-xs">
                                Customer Care
                              </Badge>
                            )}
                            <span className="text-xs font-medium opacity-80">
                              {msg.senderName || 'Unknown'}
                            </span>
                            <span className="text-xs opacity-60">
                              {new Date(msg.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {msg.attachments.map((att, idx) => (
                                <a
                                  key={idx}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-500 hover:underline block"
                                >
                                  {att.type === 'image' ? '📷 Image' : '📄 Document'}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No messages yet. Start the conversation below.
                    </p>
                  )}
                </div>

                {/* Message Input */}
                {canResolveDisputes && selectedDispute.status !== 'resolved' && (
                  <div className="space-y-2">
                    <Label htmlFor="message-input">Send Message</Label>
                    <div className="flex gap-2">
                      <Textarea
                        id="message-input"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type your message..."
                        rows={3}
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={isSendingMessage || !messageText.trim()}
                        className="self-end"
                      >
                        {isSendingMessage ? 'Sending...' : 'Send'}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Press Ctrl+Enter (Cmd+Enter on Mac) to send
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
            {selectedDispute && selectedDispute.status !== 'resolved' && canResolveDisputes && (
              <Button onClick={() => {
                setIsDetailDialogOpen(false);
                setIsResolveDialogOpen(true);
              }}>
                Resolve Dispute
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Dispute Dialog */}
      <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
        <DialogContent>
          <DialogClose onClose={() => setIsResolveDialogOpen(false)} />
          <DialogHeader>
            <DialogTitle>Resolve Dispute</DialogTitle>
            <DialogDescription>
              Provide resolution details for this dispute
            </DialogDescription>
          </DialogHeader>
          {selectedDispute && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Resolution Outcome</label>
                <select
                  value={resolveForm.outcome}
                  onChange={(e) => setResolveForm({ ...resolveForm, outcome: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="favor_complainant">Favor Complainant (Refund Buyer)</option>
                  <option value="favor_respondent">Favor Respondent (Release to Vendor)</option>
                  <option value="partial">Partial Resolution</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Resolution Reason</label>
                <Textarea
                  value={resolveForm.resolution}
                  onChange={(e) => setResolveForm({ ...resolveForm, resolution: e.target.value })}
                  placeholder="Explain the resolution decision..."
                  rows={4}
                  className="w-full"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResolveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={isActionLoading || !resolveForm.resolution.trim()}>
              {isActionLoading ? 'Resolving...' : 'Resolve Dispute'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Escalate Dispute Dialog */}
      <Dialog open={isEscalateDialogOpen} onOpenChange={setIsEscalateDialogOpen}>
        <DialogContent>
          <DialogClose onClose={() => setIsEscalateDialogOpen(false)} />
          <DialogHeader>
            <DialogTitle>Escalate Dispute</DialogTitle>
            <DialogDescription>
              Provide reason for escalating this dispute
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Escalation Reason</label>
              <Textarea
                value={escalateReason}
                onChange={(e) => setEscalateReason(e.target.value)}
                placeholder="Explain why this dispute needs to be escalated..."
                rows={4}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEscalateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEscalate} disabled={isActionLoading || !escalateReason.trim()}>
              {isActionLoading ? 'Escalating...' : 'Escalate Dispute'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
