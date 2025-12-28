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
import { departmentsAPI, type Department } from '@/lib/api/departments';
import { uploadAPI } from '@/lib/api/upload';

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
  const limit = 20;

  // Dialog states
  const [selectedDispute, setSelectedDispute] = useState<DisputeDetail | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [isEscalateDialogOpen, setIsEscalateDialogOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [resolveForm, setResolveForm] = useState({ resolution: '', outcome: 'favor_complainant' as 'favor_complainant' | 'favor_respondent' | 'partial' });
  const [escalateForm, setEscalateForm] = useState({
    reason: '',
    departmentId: '',
    createReport: false,
    attachments: [] as Array<{ type: string; url: string; name: string; size?: string }>,
  });
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
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
  }, [canViewDisputes, page, selectedStatus, selectedType, searchQuery]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setIsLoadingDepartments(true);
        const depts = await departmentsAPI.getAllDepartments();
        setDepartments(depts.map(d => ({ id: d.id, name: d.name })));
      } catch (err) {
        console.error('Failed to fetch departments:', err);
      } finally {
        setIsLoadingDepartments(false);
      }
    };
    
    if (canEscalateDisputes) {
      fetchDepartments();
    }
  }, [canEscalateDisputes]);

  const fetchStats = async () => {
    try {
      const statsData = await disputesAPI.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch dispute stats:', err);
      setError('Failed to load dispute statistics');
    }
  };

  const fetchDisputes = async () => {
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
      setDisputes(response.disputes || []);
      setTotal(response.total || 0);
    } catch (err: any) {
      console.error('Failed to fetch disputes:', err);
      setError(err.response?.data?.message || 'Failed to load disputes');
      setDisputes([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = async (disputeId: string) => {
    try {
      setIsActionLoading(true);
      const dispute = await disputesAPI.getDisputeById(disputeId);
      setSelectedDispute(dispute);
      setIsDetailDialogOpen(true);
    } catch (err: any) {
      console.error('Failed to fetch dispute details:', err);
      console.error('Error response:', err.response?.data);
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
    if (!selectedDispute || !escalateForm.reason.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a reason for escalation',
        variant: 'destructive',
      });
      return;
    }

    if (escalateForm.createReport && !escalateForm.departmentId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a department when creating a report',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsActionLoading(true);
      
      // Upload files if any
      let attachments: Array<{ type: string; url: string; name: string; size?: string }> = [];
      if (selectedFiles.length > 0) {
        try {
          // Upload all files
          const uploadResult = await uploadAPI.uploadMultipleFiles(selectedFiles);
          
          // Map uploaded files to attachment format
          attachments = uploadResult.files.map((file, index) => ({
            type: file.fileData.type,
            url: file.url,
            name: file.fileData.name,
            size: `${file.fileData.size} bytes`,
          }));
        } catch (uploadError: any) {
          toast({
            title: 'Upload Error',
            description: uploadError.response?.data?.message || 'Failed to upload files. Please try again.',
            variant: 'destructive',
          });
          setIsActionLoading(false);
          return;
        }
      }

      const result = await disputesAPI.escalateDispute(selectedDispute.id, escalateForm.reason, {
        departmentId: escalateForm.createReport ? escalateForm.departmentId : undefined,
        createReport: escalateForm.createReport,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      
      setIsEscalateDialogOpen(false);
      setEscalateForm({
        reason: '',
        departmentId: '',
        createReport: false,
        attachments: [],
      });
      setSelectedFiles([]);
      await fetchDisputes();
      await fetchStats();
      toast({
        title: 'Success',
        description: result.reportCreated 
          ? `Dispute escalated and report ${result.reportNumber} created successfully` 
          : 'Dispute escalated successfully',
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogClose onClose={() => {
            setIsEscalateDialogOpen(false);
            setEscalateForm({
              reason: '',
              departmentId: '',
              createReport: false,
              attachments: [],
            });
            setSelectedFiles([]);
          }} />
          <DialogHeader>
            <DialogTitle>Escalate Dispute</DialogTitle>
            <DialogDescription>
              Provide reason for escalating this dispute. Optionally create a report and send it to a department.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="escalate-reason">Escalation Reason *</Label>
              <Textarea
                id="escalate-reason"
                value={escalateForm.reason}
                onChange={(e) => setEscalateForm({ ...escalateForm, reason: e.target.value })}
                placeholder="Explain why this dispute needs to be escalated..."
                rows={4}
                className="w-full mt-2"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="create-report"
                checked={escalateForm.createReport}
                onChange={(e) => setEscalateForm({ ...escalateForm, createReport: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="create-report" className="cursor-pointer">
                Create and send as report to department
              </Label>
            </div>

            {escalateForm.createReport && (
              <div className="space-y-4 pl-6 border-l-2 border-primary/20">
                <div className="space-y-2">
                  <Label htmlFor="escalate-department">Target Department *</Label>
                  <div className="relative">
                    <select
                      id="escalate-department"
                      value={escalateForm.departmentId}
                      onChange={(e) => setEscalateForm({ ...escalateForm, departmentId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer hover:border-primary/50 transition-colors"
                      disabled={isLoadingDepartments}
                    >
                      <option value="">Select a department...</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg
                        className="h-4 w-4 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {isLoadingDepartments && (
                    <p className="text-xs text-muted-foreground">Loading departments...</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="escalate-attachments">Attachments (Optional)</Label>
                  <div className="space-y-2">
                    <label
                      htmlFor="escalate-attachments"
                      className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed rounded-md bg-background hover:bg-accent hover:border-primary/50 cursor-pointer transition-colors group"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <svg
                          className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {selectedFiles.length > 0
                            ? `${selectedFiles.length} file(s) selected`
                            : 'Choose files to upload'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Click to browse or drag and drop
                        </span>
                      </div>
                      <input
                        id="escalate-attachments"
                        type="file"
                        multiple
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          
                          // Validate file sizes (max 50MB per file)
                          const maxSize = 50 * 1024 * 1024; // 50MB
                          const invalidFiles = files.filter(file => file.size > maxSize);
                          
                          if (invalidFiles.length > 0) {
                            toast({
                              title: 'File Too Large',
                              description: `Some files exceed the 50MB limit. Please select smaller files.`,
                              variant: 'destructive',
                            });
                            // Filter out invalid files
                            const validFiles = files.filter(file => file.size <= maxSize);
                            setSelectedFiles(validFiles);
                          } else {
                            setSelectedFiles(files);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Accepted: Images, Videos, Audio, PDF, Word, Excel, Text files (Max 50MB per file)
                    </p>
                    {selectedFiles.length > 0 && (
                      <div className="mt-2 p-3 bg-muted/50 rounded-md space-y-2">
                        <p className="text-sm font-medium text-foreground">{selectedFiles.length} file(s) selected:</p>
                        <ul className="space-y-1">
                          {selectedFiles.map((file, idx) => (
                            <li key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                              <svg
                                className="h-3 w-3 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              <span className="truncate">{file.name}</span>
                              <span className="text-muted-foreground/70">({(file.size / 1024).toFixed(2)} KB)</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEscalateDialogOpen(false);
                setEscalateForm({
                  reason: '',
                  departmentId: '',
                  createReport: false,
                  attachments: [],
                });
                setSelectedFiles([]);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEscalate} 
              disabled={
                isActionLoading || 
                !escalateForm.reason.trim() || 
                (escalateForm.createReport && !escalateForm.departmentId)
              }
            >
              {isActionLoading ? 'Escalating...' : 'Escalate Dispute'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
