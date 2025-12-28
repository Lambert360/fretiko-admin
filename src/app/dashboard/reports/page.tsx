'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { reportsAPI, type Report, type ReportStats, type CreateReportRequest } from '@/lib/api/reports';
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
import { Search, FileText, Clock, CheckCircle, AlertTriangle, PlusCircle, Eye, TrendingUp, Send, CheckCircle2, Image as ImageIcon, Video, File, Download, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

export default function ReportsPage() {
  const { staff, isSuperAdmin, isDepartmentHead, hasPermission } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'all' | 'my-reports' | 'create'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'draft' | 'submitted' | 'under_review' | 'reviewed' | 'archived'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'incident' | 'performance' | 'financial' | 'user_activity' | 'operational' | 'other'>('all');
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // Submit confirmation dialog state
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const [reportToSubmit, setReportToSubmit] = useState<string | null>(null);

  // Create form state
  const [createData, setCreateData] = useState({
    title: '',
    reportType: 'performance' as 'incident' | 'performance' | 'financial' | 'user_activity' | 'operational' | 'other',
    visibility: 'department' as 'department' | 'escalated' | 'all',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'critical',
    content: '',
  });

  // Dialog states
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'under_review' | 'reviewed'>('under_review');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const canViewReports = isSuperAdmin || hasPermission('view_reports');
  const canCreateReports = isSuperAdmin || hasPermission('create_reports');

  useEffect(() => {
    if (canViewReports) {
      fetchStats();
    }
  }, [canViewReports]);

  useEffect(() => {
    if (canViewReports) {
      const timeoutId = setTimeout(() => {
        fetchReports();
      }, searchQuery ? 500 : 0); // Debounce search by 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [canViewReports, activeTab, searchQuery, selectedStatus, selectedType]);

  const fetchStats = async () => {
    try {
      const statsData = await reportsAPI.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch report stats:', err);
    }
  };

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const filters: any = {};
      if (selectedStatus !== 'all') {
        filters.status = selectedStatus;
      }
      if (selectedType !== 'all') {
        filters.reportType = selectedType;
      }
      if (searchQuery) {
        filters.search = searchQuery;
      }
      if (activeTab === 'my-reports' && staff?.id) {
        filters.createdBy = staff.id;
      }

      const reportsData = await reportsAPI.getReports(filters);
      setReports(reportsData);
    } catch (err: any) {
      console.error('Failed to fetch reports:', err);
      setError(err.response?.data?.message || 'Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = async (reportId: string) => {
    try {
      setIsActionLoading(true);
      const report = await reportsAPI.getReportById(reportId);
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

  const handleCreate = async (e: React.FormEvent, submit: boolean = false) => {
    e.preventDefault();
    
    if (!createData.title.trim() || !createData.content.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide both title and content',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsActionLoading(true);
      const reportData: CreateReportRequest = {
        title: createData.title,
        reportType: createData.reportType,
        content: createData.content,
        visibility: createData.visibility,
        priority: createData.priority,
      };

      const newReport = await reportsAPI.createReport(reportData);
      
      if (submit) {
        // Submit immediately after creation
        await reportsAPI.submitReport(newReport.id);
      }

      setActiveTab('all');
      setCreateData({
        title: '',
        reportType: 'performance',
        visibility: 'department',
        priority: 'normal',
        content: '',
      });
      await fetchReports();
      await fetchStats();
      toast({
        title: 'Success',
        description: submit ? 'Report created and submitted successfully' : 'Report created as draft',
      });
    } catch (err: any) {
      console.error('Failed to create report:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to create report',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSubmitClick = (reportId: string) => {
    setReportToSubmit(reportId);
    setIsSubmitConfirmOpen(true);
  };

  const handleSubmit = async () => {
    if (!reportToSubmit) return;

    try {
      setIsActionLoading(true);
      await reportsAPI.submitReport(reportToSubmit);
      setIsDetailDialogOpen(false);
      setIsSubmitConfirmOpen(false);
      setReportToSubmit(null);
      await fetchReports();
      await fetchStats();
      toast({
        title: 'Success',
        description: 'Report submitted successfully',
      });
    } catch (err: any) {
      console.error('Failed to submit report:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to submit report',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReview = async () => {
    if (!selectedReport) return;

    try {
      setIsActionLoading(true);
      await reportsAPI.reviewReport(selectedReport.id, {
        status: reviewStatus,
        reviewNotes: reviewNotes.trim() || undefined,
      });
      setIsReviewDialogOpen(false);
      setIsDetailDialogOpen(false);
      setReviewNotes('');
      await fetchReports();
      await fetchStats();
      toast({
        title: 'Success',
        description: 'Report reviewed successfully',
      });
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

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const statsCards = stats ? [
    {
      label: 'Total Reports',
      value: formatNumber(stats.total),
      color: 'bg-blue-500',
      icon: FileText,
    },
    {
      label: 'Pending Review',
      value: formatNumber(stats.pendingReview),
      color: 'bg-yellow-500',
      icon: Clock,
    },
    {
      label: 'Reviewed',
      value: formatNumber(stats.byStatus.reviewed),
      color: 'bg-green-500',
      icon: CheckCircle,
    },
    {
      label: 'Draft',
      value: formatNumber(stats.byStatus.draft),
      color: 'bg-gray-500',
      icon: AlertTriangle,
    },
  ] : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'reviewed':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!canViewReports) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">You don't have permission to view reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
          <p className="text-muted-foreground mt-2">
            Create and manage internal reports
          </p>
        </div>
        {canCreateReports && (
          <Button onClick={() => setActiveTab('create')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Report
          </Button>
        )}
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

      {/* Reports Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'all' ? 'default' : 'outline'}
                onClick={() => setActiveTab('all')}
              >
                <FileText className="mr-2 h-4 w-4" />
                All Reports
              </Button>
              <Button
                variant={activeTab === 'my-reports' ? 'default' : 'outline'}
                onClick={() => setActiveTab('my-reports')}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                My Reports
              </Button>
              <Button
                variant={activeTab === 'create' ? 'default' : 'outline'}
                onClick={() => setActiveTab('create')}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Create
              </Button>
            </div>
            {activeTab !== 'create' && (
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search reports..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-[200px]"
                  />
                </div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="archived">Archived</option>
                </select>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as any)}
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="incident">Incident</option>
                  <option value="performance">Performance</option>
                  <option value="financial">Financial</option>
                  <option value="user_activity">User Activity</option>
                  <option value="operational">Operational</option>
                  <option value="other">Other</option>
                </select>
              </div>
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
            <>
              {/* Reports List View */}
              {activeTab !== 'create' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="pb-3 font-medium text-sm text-muted-foreground">Report #</th>
                        <th className="pb-3 font-medium text-sm text-muted-foreground">Title</th>
                        <th className="pb-3 font-medium text-sm text-muted-foreground">Type</th>
                        <th className="pb-3 font-medium text-sm text-muted-foreground">Created By</th>
                        <th className="pb-3 font-medium text-sm text-muted-foreground">Department</th>
                        <th className="pb-3 font-medium text-sm text-muted-foreground">Status</th>
                        <th className="pb-3 font-medium text-sm text-muted-foreground">Created</th>
                        <th className="pb-3 font-medium text-sm text-muted-foreground text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-muted-foreground">
                            No reports found
                          </td>
                        </tr>
                      ) : (
                        reports.map((report) => (
                          <tr key={report.id} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="py-4">
                              <span className="font-mono text-sm font-medium">{report.reportNumber}</span>
                            </td>
                            <td className="py-4 font-medium">{report.title}</td>
                            <td className="py-4">
                              <span className="text-xs capitalize">
                                {report.reportType.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-4 text-sm">{report.createdByName}</td>
                            <td className="py-4 text-sm">{report.departmentName || 'N/A'}</td>
                            <td className="py-4">
                              <Badge className={getStatusColor(report.status)}>
                                {report.status.replace('_', ' ')}
                              </Badge>
                            </td>
                            <td className="py-4 text-sm text-muted-foreground">
                              {formatDate(report.createdAt)}
                            </td>
                            <td className="py-4 text-right">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                title="View Details"
                                onClick={() => handleViewDetails(report.id)}
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

              {/* Create Report View */}
              {activeTab === 'create' && (
                <form onSubmit={(e) => handleCreate(e, false)} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Report Type</label>
                      <select
                        value={createData.reportType}
                        onChange={(e) => setCreateData({ ...createData, reportType: e.target.value as any })}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                        required
                      >
                        <option value="incident">Incident Report</option>
                        <option value="performance">Performance Report</option>
                        <option value="financial">Financial Report</option>
                        <option value="user_activity">User Activity Report</option>
                        <option value="operational">Operational Report</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Visibility</label>
                      <select
                        value={createData.visibility}
                        onChange={(e) => setCreateData({ ...createData, visibility: e.target.value as any })}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                        required
                      >
                        <option value="department">Department Only</option>
                        <option value="escalated">Department Heads</option>
                        {isSuperAdmin && <option value="all">All Staff (Super Admin)</option>}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Priority</label>
                      <select
                        value={createData.priority}
                        onChange={(e) => setCreateData({ ...createData, priority: e.target.value as any })}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                        required
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Report Title</label>
                    <Input
                      value={createData.title}
                      onChange={(e) => setCreateData({ ...createData, title: e.target.value })}
                      placeholder="Enter report title..."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Report Content</label>
                    <Textarea
                      value={createData.content}
                      onChange={(e) => setCreateData({ ...createData, content: e.target.value })}
                      placeholder="Enter detailed report content..."
                      rows={12}
                      className="w-full"
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={isActionLoading}>
                      <FileText className="mr-2 h-4 w-4" />
                      {isActionLoading ? 'Saving...' : 'Save as Draft'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="default"
                      onClick={(e) => handleCreate(e, true)}
                      disabled={isActionLoading}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {isActionLoading ? 'Submitting...' : 'Submit Report'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setActiveTab('all')}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}

        </CardContent>
      </Card>

      {/* Report Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogClose onClose={() => setIsDetailDialogOpen(false)} />
          <DialogHeader>
            <DialogTitle>{selectedReport?.title || 'Report Details'}</DialogTitle>
            <DialogDescription>
              View report details and take actions
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Report Number</p>
                  <p className="text-sm font-mono">{selectedReport.reportNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedReport.status)}>
                    {selectedReport.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <p className="text-sm capitalize">{selectedReport.reportType.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Priority</p>
                  <p className="text-sm capitalize">{selectedReport.priority}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created By</p>
                  <p className="text-sm">{selectedReport.createdByName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Department</p>
                  <p className="text-sm">{selectedReport.departmentName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="text-sm">{formatDate(selectedReport.createdAt)}</p>
                </div>
                {selectedReport.submittedAt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Submitted</p>
                    <p className="text-sm">{formatDate(selectedReport.submittedAt)}</p>
                  </div>
                )}
                {selectedReport.reviewedAt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Reviewed</p>
                    <p className="text-sm">{formatDate(selectedReport.reviewedAt)}</p>
                    {selectedReport.reviewedByName && (
                      <p className="text-xs text-muted-foreground">by {selectedReport.reviewedByName}</p>
                    )}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Content</p>
                <p className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-md">{selectedReport.content}</p>
              </div>
              {selectedReport.attachments && selectedReport.attachments.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Attachments ({selectedReport.attachments.length})</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedReport.attachments.map((attachment, index) => {
                      const isImage = attachment.type === 'image' || attachment.url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                      const isVideo = attachment.type === 'video' || attachment.url.match(/\.(mp4|webm|ogg|mov)$/i);
                      
                      return (
                        <div key={index} className="border rounded-md overflow-hidden bg-muted/50 hover:bg-muted transition-colors">
                          {isImage ? (
                            <div className="relative aspect-video group cursor-pointer" onClick={() => setSelectedImage(attachment.url)}>
                              <img
                                src={attachment.url}
                                alt={attachment.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999"%3EImage%3C/text%3E%3C/svg%3E';
                                }}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          ) : isVideo ? (
                            <div className="relative aspect-video bg-black flex items-center justify-center">
                              <video
                                src={attachment.url}
                                className="w-full h-full object-cover"
                                controls
                                onError={(e) => {
                                  // Fallback if video fails to load
                                  const target = e.target as HTMLVideoElement;
                                  target.style.display = 'none';
                                }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ display: 'none' }} id={`video-error-${index}`}>
                                <div className="text-center text-white p-4">
                                  <Video className="h-8 w-8 mx-auto mb-2" />
                                  <p className="text-xs">Video unavailable</p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-video flex flex-col items-center justify-center p-4">
                              <File className="h-8 w-8 text-muted-foreground mb-2" />
                              <p className="text-xs text-center text-muted-foreground truncate w-full">{attachment.name}</p>
                            </div>
                          )}
                          <div className="p-2 border-t">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs text-muted-foreground truncate flex-1" title={attachment.name}>
                                {attachment.name}
                              </p>
                              <a
                                href={attachment.url}
                                download={attachment.name}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80 transition-colors"
                                title="Download"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            </div>
                            {attachment.size && (
                              <p className="text-xs text-muted-foreground mt-1">{attachment.size}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {selectedReport.reviewNotes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Review Notes</p>
                  <p className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-md">{selectedReport.reviewNotes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
            {selectedReport && selectedReport.status === 'draft' && selectedReport.createdBy === staff?.id && (
              <Button onClick={() => handleSubmitClick(selectedReport.id)} disabled={isActionLoading}>
                <Send className="mr-2 h-4 w-4" />
                Submit Report
              </Button>
            )}
            {(isDepartmentHead || isSuperAdmin) && selectedReport && (selectedReport.status === 'submitted' || selectedReport.status === 'under_review') && (
              <Button onClick={() => {
                setReviewStatus('under_review');
                setIsReviewDialogOpen(true);
              }}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Review
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Report Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent>
          <DialogClose onClose={() => setIsReviewDialogOpen(false)} />
          <DialogHeader>
            <DialogTitle>Review Report</DialogTitle>
            <DialogDescription>
              Review and update the status of this report
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Review Status</label>
              <select
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value as 'under_review' | 'reviewed')}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="under_review">Under Review</option>
                <option value="reviewed">Reviewed</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Review Notes</label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Enter review notes (optional)..."
                rows={6}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReview} disabled={isActionLoading || !selectedReport}>
              {isActionLoading ? 'Reviewing...' : 'Submit Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0">
          {selectedImage && (
            <>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => setSelectedImage(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <img
                  src={selectedImage}
                  alt="Preview"
                  className="w-full h-auto max-h-[80vh] object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999"%3EFailed to load image%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Submit Confirmation Dialog */}
      <Dialog open={isSubmitConfirmOpen} onOpenChange={setIsSubmitConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Submission</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit this report? It cannot be edited after submission.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsSubmitConfirmOpen(false);
              setReportToSubmit(null);
            }} disabled={isActionLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isActionLoading}>
              {isActionLoading ? 'Submitting...' : 'Confirm Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
