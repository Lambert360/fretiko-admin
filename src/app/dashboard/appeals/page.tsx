'use client';

/**
 * Suspension Appeals Management Page
 * 
 * Allows staff to review and manage user suspension appeals
 * Features:
 * - View all appeals with filtering by status
 * - Review appeals (approve/reject)
 * - View appeal details and user information
 * 
 * Requires: suspend_users permission
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { appealsAPI, type Appeal, type AppealsFilters } from '@/lib/api/appeals';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, CheckCircle2, XCircle, Clock, FileText } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner, SkeletonTable } from '@/components/ui/loading';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { formatNumber } from '@/lib/utils/formatting';

export default function AppealsPage() {
  const { isSuperAdmin, hasPermission } = useAuth();
  const { toast } = useToast();
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'pending' | 'under_review' | 'approved' | 'rejected' | 'all'>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Dialog states
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'rejected'>('approved');
  const [reviewNotes, setReviewNotes] = useState('');

  // Check if user has permission
  const canManageAppeals = isSuperAdmin || hasPermission('suspend_users');

  const fetchAppeals = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const filters: AppealsFilters = {
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        page,
        limit,
      };

      const response = await appealsAPI.getAppeals(filters);
      setAppeals(response.appeals);
      setTotal(response.total);
    } catch (err: any) {
      console.error('Failed to fetch appeals:', err);
      setError(err.response?.data?.message || 'Failed to load appeals. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (canManageAppeals) {
      fetchAppeals();
    }
  }, [canManageAppeals, page, selectedStatus]);

  const handleReviewClick = (appeal: Appeal) => {
    setSelectedAppeal(appeal);
    setReviewDecision('approved');
    setReviewNotes('');
    setIsReviewDialogOpen(true);
  };

  const handleReviewAppeal = async () => {
    if (!selectedAppeal) return;

    try {
      setIsActionLoading(selectedAppeal.id);
      await appealsAPI.reviewAppeal(selectedAppeal.id, reviewDecision, reviewNotes || undefined);
      await fetchAppeals();
      setIsReviewDialogOpen(false);
      setSelectedAppeal(null);
      setReviewNotes('');
      toast({
        title: 'Success',
        description: `Appeal ${reviewDecision} successfully`,
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to review appeal',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'under_review':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'under_review':
        return <FileText className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Permission check
  if (!canManageAppeals) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">You don't have permission to manage appeals. Please contact your administrator.</p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const stats = React.useMemo(() => {
    const pending = appeals.filter(a => a.status === 'pending').length;
    const underReview = appeals.filter(a => a.status === 'under_review').length;
    const approved = appeals.filter(a => a.status === 'approved').length;
    const rejected = appeals.filter(a => a.status === 'rejected').length;

    return [
      { label: 'Total', value: formatNumber(total), color: 'bg-blue-500' },
      { label: 'Pending', value: formatNumber(pending), color: 'bg-yellow-500' },
      { label: 'Under Review', value: formatNumber(underReview), color: 'bg-blue-500' },
      { label: 'Approved', value: formatNumber(approved), color: 'bg-green-500' },
      { label: 'Rejected', value: formatNumber(rejected), color: 'bg-red-500' },
    ];
  }, [appeals, total]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Suspension Appeals</h2>
          <p className="text-muted-foreground mt-2">
            Review and manage user suspension appeals
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchAppeals}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-lg ${stat.color} bg-opacity-10 flex items-center justify-center`}>
                  <div className={`h-6 w-6 rounded ${stat.color}`}></div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Appeals List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle>All Appeals</CardTitle>
              <CardDescription>Review and manage suspension appeals</CardDescription>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as typeof selectedStatus);
                setPage(1);
              }}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {/* Loading State */}
          {isLoading ? (
            <SkeletonTable rows={5} />
          ) : appeals.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No appeals found"
              description={
                selectedStatus !== 'all'
                  ? "No appeals match your current filter. Try selecting a different status."
                  : "There are no suspension appeals in the system yet."
              }
            />
          ) : (
            <>
              {/* Appeals Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="pb-3 font-medium text-sm text-muted-foreground">User</th>
                      <th className="pb-3 font-medium text-sm text-muted-foreground">Suspension Reason</th>
                      <th className="pb-3 font-medium text-sm text-muted-foreground">Appeal Reason</th>
                      <th className="pb-3 font-medium text-sm text-muted-foreground">Status</th>
                      <th className="pb-3 font-medium text-sm text-muted-foreground">Submitted</th>
                      <th className="pb-3 font-medium text-sm text-muted-foreground text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appeals.map((appeal) => {
                      const isActionLoadingForAppeal = isActionLoading === appeal.id;
                      const canReview = appeal.status === 'pending' || appeal.status === 'under_review';

                      return (
                        <tr key={appeal.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-4">
                            <div>
                              <p className="font-medium">{appeal.user?.username || 'Unknown User'}</p>
                              <p className="text-sm text-muted-foreground">{appeal.user?.email || ''}</p>
                            </div>
                          </td>
                          <td className="py-4 text-sm">
                            <p className="line-clamp-2 max-w-xs">
                              {appeal.suspensionReason || 'Not specified'}
                            </p>
                          </td>
                          <td className="py-4 text-sm">
                            <p className="line-clamp-2 max-w-xs">
                              {appeal.appealReason}
                            </p>
                          </td>
                          <td className="py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appeal.status)}`}>
                              {getStatusIcon(appeal.status)}
                              {appeal.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-4 text-sm text-muted-foreground">
                            {new Date(appeal.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {canReview && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReviewClick(appeal)}
                                  disabled={isActionLoadingForAppeal}
                                >
                                  Review
                                </Button>
                              )}
                              {appeal.status === 'approved' && (
                                <span className="text-xs text-green-600">Account Reactivated</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {appeals.length} of {total} appeals
                  {total > limit && ` (Page ${page} of ${Math.ceil(total / limit)})`}
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
                    disabled={page >= Math.ceil(total / limit) || isLoading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Review Appeal Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogClose onClose={() => {
            setIsReviewDialogOpen(false);
            setSelectedAppeal(null);
            setReviewNotes('');
            setReviewDecision('approved');
          }} />
          <DialogHeader>
            <DialogTitle>Review Appeal</DialogTitle>
            <DialogDescription>
              Review the appeal from {selectedAppeal?.user?.username || 'user'}
            </DialogDescription>
          </DialogHeader>
          {selectedAppeal && (
            <div className="space-y-4">
              {/* Appeal Details */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Suspension Reason</p>
                  <p className="text-sm bg-muted p-3 rounded-md">
                    {selectedAppeal.suspensionReason || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Appeal Reason</p>
                  <p className="text-sm bg-muted p-3 rounded-md">
                    {selectedAppeal.appealReason}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Submitted</p>
                  <p className="text-sm">
                    {new Date(selectedAppeal.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Review Decision */}
              <div>
                <label className="text-sm font-medium mb-2 block">Decision</label>
                <select
                  value={reviewDecision}
                  onChange={(e) => setReviewDecision(e.target.value as 'approved' | 'rejected')}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="approved">Approve (Unsuspend User)</option>
                  <option value="rejected">Reject (Keep Suspended)</option>
                </select>
              </div>

              {/* Review Notes */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Review Notes {reviewDecision === 'rejected' && <span className="text-destructive">*</span>}
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={reviewDecision === 'rejected' ? 'Please provide a reason for rejection...' : 'Optional notes about your decision...'}
                  className="w-full px-3 py-2 border rounded-md bg-background min-h-[100px]"
                  rows={4}
                  required={reviewDecision === 'rejected'}
                />
                {reviewDecision === 'rejected' && !reviewNotes.trim() && (
                  <p className="text-xs text-destructive mt-1">Review notes are required when rejecting an appeal</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsReviewDialogOpen(false);
                setSelectedAppeal(null);
                setReviewNotes('');
                setReviewDecision('approved');
              }}
              disabled={isActionLoading !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReviewAppeal}
              disabled={isActionLoading !== null || (reviewDecision === 'rejected' && !reviewNotes.trim())}
              variant={reviewDecision === 'approved' ? 'default' : 'destructive'}
            >
              {isActionLoading ? 'Processing...' : `${reviewDecision === 'approved' ? 'Approve' : 'Reject'} Appeal`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

