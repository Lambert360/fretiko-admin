'use client';

/**
 * Content Reports Page
 * 
 * Handle user-submitted content reports for moderation
 * Features:
 * - View all content reports with filters
 * - Review and take action on reports
 * - View report details and evidence
 * - Statistics dashboard
 * 
 * Requires: Admin/Moderator access
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { contentReportsAPI, type ContentReport, type ContentReportStats, type ReviewContentReportRequest } from '@/lib/api/content-reports';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { 
  Flag, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Search, 
  RefreshCw,
  Package,
  Briefcase,
  MessageSquare,
  User,
  Loader2,
  FileText,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { formatDateForExport } from '@/lib/utils/export';
import { ExportButton } from '@/components/ui/export-button';

export default function ContentReportsPage() {
  const { isSuperAdmin, hasPermission } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'under_review' | 'approved' | 'action_taken' | 'dismissed'>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'product' | 'service' | 'chat' | 'user'>('all');
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [stats, setStats] = useState<ContentReportStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Dialog states
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState<ReviewContentReportRequest>({
    status: 'approved',
    actionTaken: 'no_action',
    actionReason: '',
  });

  const canViewReports = isSuperAdmin || hasPermission('view_products'); // Using view_products as proxy for moderator access
  const canReviewReports = isSuperAdmin || hasPermission('approve_products'); // Using approve_products as proxy

  useEffect(() => {
    if (canViewReports) {
      fetchStats();
      fetchReports();
    }
  }, [canViewReports, page, selectedStatus, selectedCategory, searchQuery]);

  const fetchStats = async () => {
    try {
      const statsData = await contentReportsAPI.getStats();
      setStats(statsData);
    } catch (err: any) {
      console.error('Failed to fetch content report stats:', err);
      // Set default stats on error
      setStats({
        totalReports: 0,
        pendingReports: 0,
        underReviewReports: 0,
        actionTakenReports: 0,
        dismissedReports: 0,
        byCategory: { product: 0, service: 0, chat: 0, user: 0 },
      });
    }
  };

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await contentReportsAPI.getReports({
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchQuery || undefined,
        page,
        limit,
      });
      setReports(response.reports);
      setTotal(response.total);
    } catch (err: any) {
      console.error('Failed to fetch content reports:', err);
      setError(err.response?.data?.message || 'Failed to load content reports');
      toast({
        title: 'Error',
        description: 'Failed to load content reports',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = async (reportId: string) => {
    try {
      setIsActionLoading(true);
      const report = await contentReportsAPI.getReport(reportId);
      setSelectedReport(report);
      setIsDetailDialogOpen(true);
    } catch (err: any) {
      console.error('Failed to fetch report details:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load report details',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReview = async () => {
    if (!selectedReport || !reviewForm.actionReason.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a reason for your action',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsActionLoading(true);
      await contentReportsAPI.reviewReport(selectedReport.id, reviewForm);
      toast({
        title: 'Success',
        description: 'Report reviewed successfully',
      });
      setIsReviewDialogOpen(false);
      setReviewForm({ status: 'approved', actionTaken: 'no_action', actionReason: '' });
      await fetchReports();
      await fetchStats();
    } catch (err: any) {
      console.error('Failed to review report:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to review report',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const getStatusBadge = (status: ContentReport['status']) => {
    const variants: Record<ContentReport['status'], { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'secondary', label: 'Pending' },
      under_review: { variant: 'default', label: 'Under Review' },
      approved: { variant: 'outline', label: 'Approved' },
      action_taken: { variant: 'default', label: 'Action Taken' },
      dismissed: { variant: 'outline', label: 'Dismissed' },
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getCategoryIcon = (category: ContentReport['reportCategory']) => {
    switch (category) {
      case 'product': return <Package className="h-4 w-4" />;
      case 'service': return <Briefcase className="h-4 w-4" />;
      case 'chat': return <MessageSquare className="h-4 w-4" />;
      case 'user': return <User className="h-4 w-4" />;
    }
  };

  if (!canViewReports) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">You don't have permission to view content reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Content Reports</h1>
          <p className="text-muted-foreground mt-1">Review and moderate user-submitted content reports</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              fetchReports();
              fetchStats();
            }}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Reports</p>
                  <p className="text-2xl font-bold">{stats.totalReports}</p>
                </div>
                <Flag className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{stats.pendingReports}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Under Review</p>
                  <p className="text-2xl font-bold">{stats.underReviewReports}</p>
                </div>
                <Eye className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Action Taken</p>
                  <p className="text-2xl font-bold">{stats.actionTakenReports}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Dismissed</p>
                  <p className="text-2xl font-bold">{stats.dismissedReports}</p>
                </div>
                <XCircle className="h-8 w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as any);
                setPage(1);
              }}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="action_taken">Action Taken</option>
              <option value="dismissed">Dismissed</option>
            </select>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value as any);
                setPage(1);
              }}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">All Categories</option>
              <option value="product">Products</option>
              <option value="service">Services</option>
              <option value="chat">Chats</option>
              <option value="user">Users</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Reports List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getCategoryIcon(report.reportCategory)}
                      <div>
                        <h3 className="font-semibold capitalize">
                          {report.reportCategory} Report - {report.reportType.replace(/_/g, ' ')}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Reported by {report.reporterName || 'Unknown'} • {formatDateForExport(report.createdAt)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">
                      {report.reason}
                    </p>
                    {report.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {report.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(report.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(report.id)}
                      disabled={isActionLoading}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {canReviewReports && report.status === 'pending' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setSelectedReport(report);
                          setReviewForm({ status: 'approved', actionTaken: 'no_action', actionReason: '' });
                          setIsReviewDialogOpen(true);
                        }}
                      >
                        Review
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {reports.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No content reports found
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} reports
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page * limit >= total || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Report Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Content Report Details</DialogTitle>
            <DialogDescription>
              Review the full details of this content report
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedReport.status)}</div>
                </div>
                <div>
                  <Label>Category</Label>
                  <div className="mt-1 flex items-center gap-2 capitalize">
                    {getCategoryIcon(selectedReport.reportCategory)}
                    {selectedReport.reportCategory}
                  </div>
                </div>
                <div>
                  <Label>Report Type</Label>
                  <p className="mt-1 text-sm capitalize">{selectedReport.reportType.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <Label>Reported By</Label>
                  <p className="mt-1 text-sm">{selectedReport.reporterName || 'Unknown'}</p>
                </div>
                <div>
                  <Label>Created At</Label>
                  <p className="mt-1 text-sm">{formatDateForExport(selectedReport.createdAt)}</p>
                </div>
                {selectedReport.moderatedAt && (
                  <div>
                    <Label>Moderated At</Label>
                    <p className="mt-1 text-sm">{formatDateForExport(selectedReport.moderatedAt)}</p>
                  </div>
                )}
              </div>
              <div>
                <Label>Reason</Label>
                <p className="mt-1 text-sm">{selectedReport.reason}</p>
              </div>
              {selectedReport.description && (
                <div>
                  <Label>Description</Label>
                  <p className="mt-1 text-sm">{selectedReport.description}</p>
                </div>
              )}
              {selectedReport.evidence && selectedReport.evidence.length > 0 && (
                <div>
                  <Label>Evidence</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {selectedReport.evidence.map((item, idx) => (
                      <div key={idx} className="border rounded p-2">
                        {item.type === 'image' ? (
                          <img src={item.url} alt={item.description} className="w-full h-32 object-cover rounded" />
                        ) : (
                          <div className="flex items-center gap-2 p-4">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                            <span className="text-sm">{item.description}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedReport.actionTaken && (
                <div>
                  <Label>Action Taken</Label>
                  <p className="mt-1 text-sm capitalize">{selectedReport.actionTaken.replace(/_/g, ' ')}</p>
                  {selectedReport.actionReason && (
                    <p className="mt-1 text-sm text-muted-foreground">{selectedReport.actionReason}</p>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {canReviewReports && selectedReport?.status === 'pending' && (
              <Button
                onClick={() => {
                  setIsDetailDialogOpen(false);
                  setReviewForm({ status: 'approved', actionTaken: 'no_action', actionReason: '' });
                  setIsReviewDialogOpen(true);
                }}
              >
                Review Report
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Content Report</DialogTitle>
            <DialogDescription>
              Take action on this content report
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Action</Label>
              <select
                value={reviewForm.status}
                onChange={(e) => {
                  const status = e.target.value as 'approved' | 'action_taken' | 'dismissed';
                  setReviewForm(prev => ({
                    ...prev,
                    status,
                    actionTaken: status === 'action_taken' ? prev.actionTaken : undefined,
                  }));
                }}
                className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              >
                <option value="approved">Approve (No Action)</option>
                <option value="action_taken">Take Action</option>
                <option value="dismissed">Dismiss</option>
              </select>
            </div>
            {reviewForm.status === 'action_taken' && (
              <div>
                <Label>Action Type</Label>
                <select
                  value={reviewForm.actionTaken || 'no_action'}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, actionTaken: e.target.value as any }))}
                  className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                >
                  <option value="no_action">No Action</option>
                  <option value="content_removed">Remove Content</option>
                  <option value="content_hidden">Hide Content</option>
                  <option value="user_warned">Warn User</option>
                  <option value="user_suspended">Suspend User</option>
                  <option value="user_banned">Ban User</option>
                </select>
              </div>
            )}
            <div>
              <Label>Reason *</Label>
              <Textarea
                value={reviewForm.actionReason}
                onChange={(e) => setReviewForm(prev => ({ ...prev, actionReason: e.target.value }))}
                placeholder="Explain your decision..."
                rows={4}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)} disabled={isActionLoading}>
              Cancel
            </Button>
            <Button onClick={handleReview} disabled={isActionLoading || !reviewForm.actionReason.trim()}>
              {isActionLoading ? 'Processing...' : 'Submit Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

