'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { memosAPI, type Memo, type MemoStats, type SendMemoRequest } from '@/lib/api/memos';
import { departmentsAPI, type Department } from '@/lib/api/departments';
import { staffAPI } from '@/lib/api/staff';
import type { Staff } from '@/types/staff';
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
import { Search, Mail, Send, Inbox, AlertCircle, PlusCircle, Eye, Reply } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function MemosPage() {
  const { staff, isSuperAdmin, hasPermission } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'compose'>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<'all' | 'low' | 'normal' | 'high' | 'urgent'>('all');
  const [memos, setMemos] = useState<Memo[]>([]);
  const [stats, setStats] = useState<MemoStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Compose form state
  const [composeData, setComposeData] = useState({
    recipientType: 'department' as 'department' | 'staff' | 'all',
    recipientId: '',
    subject: '',
    body: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
  });

  // Dialog states
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [replySubject, setReplySubject] = useState('');
  const [replyMessage, setReplyMessage] = useState('');

  // Dropdown data
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false);

  const canViewMemos = isSuperAdmin || hasPermission('view_memos');
  const canSendMemos = isSuperAdmin || hasPermission('send_memos');

  useEffect(() => {
    if (canViewMemos) {
      fetchStats();
    }
  }, [canViewMemos]);

  useEffect(() => {
    if (canViewMemos) {
      const timeoutId = setTimeout(() => {
        fetchMemos();
      }, searchQuery ? 500 : 0); // Debounce search by 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [canViewMemos, activeTab, searchQuery, selectedPriority]);

  useEffect(() => {
    if (activeTab === 'compose' && canSendMemos) {
      fetchDropdowns();
    }
  }, [activeTab, canSendMemos]);

  const fetchStats = async () => {
    try {
      const statsData = await memosAPI.getStats();
      setStats(statsData);
    } catch (err: any) {
      console.error('Failed to fetch memo stats:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load memo statistics',
        variant: 'destructive',
      });
    }
  };

  const fetchMemos = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const filters: any = {};
      if (selectedPriority !== 'all') {
        filters.priority = selectedPriority;
      }
      if (searchQuery) {
        filters.search = searchQuery;
      }

      const memosData = activeTab === 'inbox' 
        ? await memosAPI.getReceivedMemos(filters)
        : await memosAPI.getSentMemos(filters);
      
      setMemos(memosData);
    } catch (err: any) {
      console.error('Failed to fetch memos:', err);
      setError(err.response?.data?.message || 'Failed to load memos');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    if (departments.length > 0 && staffList.length > 0) return; // Already loaded
    
    try {
      setIsLoadingDropdowns(true);
      const [deptsData, staffData] = await Promise.all([
        departmentsAPI.getAllDepartments(),
        staffAPI.getAllStaff(),
      ]);
      setDepartments(deptsData);
      setStaffList(staffData);
    } catch (err: any) {
      console.error('Failed to fetch dropdowns:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load dropdown data',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingDropdowns(false);
    }
  };

  const handleViewDetails = async (memoId: string) => {
    try {
      setIsActionLoading(true);
      const memo = await memosAPI.getMemoById(memoId);
      setSelectedMemo(memo);
      setIsDetailDialogOpen(true);
      
      // Mark as read if viewing received memo
      if (activeTab === 'inbox' && !memo.isRead) {
        await memosAPI.markAsRead(memoId);
        // Update local state
        setMemos(prev => prev.map(m => m.id === memoId ? { ...m, isRead: true } : m));
        await fetchStats();
      }
    } catch (err: any) {
      console.error('Failed to fetch memo details:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load memo details',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReply = async () => {
    if (!selectedMemo || !replySubject.trim() || !replyMessage.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide both subject and message',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsActionLoading(true);
      await memosAPI.replyToMemo(selectedMemo.id, replySubject, replyMessage);
      setIsReplyDialogOpen(false);
      setReplySubject('');
      setReplyMessage('');
      await fetchMemos();
      await fetchStats();
      toast({
        title: 'Success',
        description: 'Reply sent successfully',
      });
    } catch (err: any) {
      console.error('Failed to send reply:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to send reply',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!composeData.subject.trim() || !composeData.body.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide both subject and message',
        variant: 'destructive',
      });
      return;
    }

    if (composeData.recipientType !== 'all' && !composeData.recipientId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a recipient',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsActionLoading(true);
      const sendData: SendMemoRequest = {
        subject: composeData.subject,
        body: composeData.body,
        recipientType: composeData.recipientType,
        priority: composeData.priority,
      };

      if (composeData.recipientType !== 'all') {
        sendData.recipientId = composeData.recipientId;
      }

      await memosAPI.sendMemo(sendData);
      setActiveTab('sent');
      setComposeData({
        recipientType: 'department',
        recipientId: '',
        subject: '',
        body: '',
        priority: 'normal',
      });
      await fetchMemos();
      await fetchStats();
      toast({
        title: 'Success',
        description: 'Memo sent successfully',
      });
    } catch (err: any) {
      console.error('Failed to send memo:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to send memo',
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
      label: 'Total Memos',
      value: formatNumber(stats.total),
      color: 'bg-blue-500',
      icon: Mail,
    },
    {
      label: 'Unread',
      value: formatNumber(stats.unread),
      color: 'bg-yellow-500',
      icon: Inbox,
    },
    {
      label: 'Urgent',
      value: formatNumber(stats.urgent),
      color: 'bg-red-500',
      icon: AlertCircle,
    },
    {
      label: 'Sent',
      value: formatNumber(stats.byRecipientType.all + stats.byRecipientType.department + stats.byRecipientType.staff),
      color: 'bg-green-500',
      icon: Send,
    },
  ] : [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
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

  if (!canViewMemos) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">You don't have permission to view memos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Internal Memos</h2>
          <p className="text-muted-foreground mt-2">
            Communicate with staff across departments
          </p>
        </div>
        {canSendMemos && (
          <Button onClick={() => setActiveTab('compose')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Compose Memo
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

      {/* Memos Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'inbox' ? 'default' : 'outline'}
                onClick={() => setActiveTab('inbox')}
              >
                <Inbox className="mr-2 h-4 w-4" />
                Inbox
              </Button>
              <Button
                variant={activeTab === 'sent' ? 'default' : 'outline'}
                onClick={() => setActiveTab('sent')}
              >
                <Send className="mr-2 h-4 w-4" />
                Sent
              </Button>
              <Button
                variant={activeTab === 'compose' ? 'default' : 'outline'}
                onClick={() => setActiveTab('compose')}
              >
                <Mail className="mr-2 h-4 w-4" />
                Compose
              </Button>
            </div>
            {activeTab !== 'compose' && (
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search memos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-[250px]"
                  />
                </div>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value as any)}
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
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
              {/* Inbox/Sent View */}
              {activeTab !== 'compose' && (
                <div className="space-y-3">
                  {memos.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No memos found
                    </div>
                  ) : (
                    memos.map((memo) => (
                      <div
                        key={memo.id}
                        className={`border rounded-lg p-4 hover:bg-muted/50 cursor-pointer ${
                          !memo.isRead ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : ''
                        }`}
                        onClick={() => handleViewDetails(memo.id)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {!memo.isRead && (
                                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                              )}
                              <h3 className={`font-medium ${!memo.isRead ? 'font-bold' : ''}`}>
                                {memo.subject}
                              </h3>
                              <Badge className={getPriorityColor(memo.priority)}>
                                {memo.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {activeTab === 'inbox' ? (
                                <>From: <span className="font-medium">{memo.senderName}</span>
                                {memo.senderDepartmentName && ` (${memo.senderDepartmentName})`}</>
                              ) : (
                                <>To: <span className="font-medium">{memo.recipientName || (memo.recipientType === 'all' ? 'All Staff' : memo.recipientType)}</span></>
                              )}
                            </p>
                            <p className="text-sm line-clamp-2">{memo.body}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDate(memo.createdAt)}
                            </p>
                          </div>
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="View Details"
                              onClick={() => handleViewDetails(memo.id)}
                              disabled={isActionLoading}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {activeTab === 'inbox' && canSendMemos && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                title="Reply"
                                onClick={() => {
                                  setSelectedMemo(memo);
                                  setReplySubject(memo.subject);
                                  setIsReplyDialogOpen(true);
                                }}
                                disabled={isActionLoading}
                              >
                                <Reply className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Compose View */}
              {activeTab === 'compose' && (
                <form onSubmit={handleCompose} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Recipient Type</label>
                      <select
                        value={composeData.recipientType}
                        onChange={(e) => setComposeData({ ...composeData, recipientType: e.target.value as any, recipientId: '' })}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                        required
                      >
                        <option value="department">Department</option>
                        <option value="staff">Specific Staff</option>
                        <option value="all">All Staff</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Priority</label>
                      <select
                        value={composeData.priority}
                        onChange={(e) => setComposeData({ ...composeData, priority: e.target.value as any })}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                        required
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  {composeData.recipientType !== 'all' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        {composeData.recipientType === 'department' ? 'Select Department' : 'Select Staff'}
                      </label>
                      {isLoadingDropdowns ? (
                        <div className="text-sm text-muted-foreground">Loading...</div>
                      ) : (
                        <select
                          value={composeData.recipientId}
                          onChange={(e) => setComposeData({ ...composeData, recipientId: e.target.value })}
                          className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                          required
                        >
                          <option value="">Select...</option>
                          {composeData.recipientType === 'department' ? (
                            departments.map((dept) => (
                              <option key={dept.id} value={dept.id}>
                                {dept.name}
                              </option>
                            ))
                          ) : (
                            staffList.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.fullName} ({s.staffId})
                              </option>
                            ))
                          )}
                        </select>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subject</label>
                    <Input
                      value={composeData.subject}
                      onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                      placeholder="Enter subject..."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Message</label>
                    <Textarea
                      value={composeData.body}
                      onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                      placeholder="Type your message here..."
                      rows={8}
                      className="w-full"
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={isActionLoading}>
                      <Send className="mr-2 h-4 w-4" />
                      {isActionLoading ? 'Sending...' : 'Send Memo'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setActiveTab('inbox')}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Memo Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogClose onClose={() => setIsDetailDialogOpen(false)} />
          <DialogHeader>
            <DialogTitle>{selectedMemo?.subject || 'Memo Details'}</DialogTitle>
            <DialogDescription>
              View memo details and replies
            </DialogDescription>
          </DialogHeader>
          {selectedMemo && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">From</p>
                  <p className="text-sm">{selectedMemo.senderName}</p>
                  {selectedMemo.senderDepartmentName && (
                    <p className="text-xs text-muted-foreground">{selectedMemo.senderDepartmentName}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">To</p>
                  <p className="text-sm">{selectedMemo.recipientName || (selectedMemo.recipientType === 'all' ? 'All Staff' : selectedMemo.recipientType)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Priority</p>
                  <Badge className={getPriorityColor(selectedMemo.priority)}>
                    {selectedMemo.priority}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date</p>
                  <p className="text-sm">{formatDate(selectedMemo.createdAt)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Message</p>
                <p className="text-sm whitespace-pre-wrap">{selectedMemo.body}</p>
              </div>
              {selectedMemo.replies && selectedMemo.replies.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Replies ({selectedMemo.replies.length})</p>
                  <div className="space-y-3 border-t pt-3">
                    {selectedMemo.replies.map((reply) => (
                      <div key={reply.id} className="border-l-2 pl-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{reply.senderName}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(reply.createdAt)}</span>
                        </div>
                        <p className="text-sm">{reply.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
            {activeTab === 'inbox' && canSendMemos && selectedMemo && (
              <Button onClick={() => {
                setIsDetailDialogOpen(false);
                setReplySubject(selectedMemo.subject);
                setIsReplyDialogOpen(true);
              }}>
                <Reply className="mr-2 h-4 w-4" />
                Reply
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent>
          <DialogClose onClose={() => setIsReplyDialogOpen(false)} />
          <DialogHeader>
            <DialogTitle>Reply to Memo</DialogTitle>
            <DialogDescription>
              Send a reply to this memo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <Input
                value={replySubject}
                onChange={(e) => setReplySubject(e.target.value)}
                placeholder="Reply subject..."
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Message</label>
              <Textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply..."
                rows={6}
                className="w-full"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReplyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReply} disabled={isActionLoading || !replySubject.trim() || !replyMessage.trim()}>
              {isActionLoading ? 'Sending...' : 'Send Reply'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
