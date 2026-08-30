/** @jsxImportSource react */
'use client';

/**
 * Gift Cards Management Page
 *
 * Gift card system management
 * Features:
 * - Gift cards overview and statistics
 * - Gift card list with filtering
 * - Gift card blocking/unblocking
 * - Design management
 * - Settings configuration
 *
 * Requires: view_revenue permission
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, TrendingUp, Clock, AlertTriangle, Wallet, CreditCard, Calendar, Loader2, Search, Eye, MoreVertical, Plus, Edit, Trash2, CheckCircle, XCircle, Shield, Palette, Settings, Upload } from 'lucide-react';
import { LoadingPage, LoadingSpinner } from '@/components/ui/loading';
import { formatDateTime, formatCurrency } from '@/lib/utils/formatting';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api/client';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface GiftCard {
  id: string;
  card_number: string;
  pin: string;
  claim_code: string | null;
  initial_balance: number;
  current_balance: number;
  status: 'active' | 'claimed' | 'redeemed' | 'expired' | 'blocked';
  design: GiftCardDesign;
  delivery_method: 'none' | 'email' | 'chat' | 'both';
  purchased_at: string;
  expires_at: string;
  claimed_at?: string;
  last_used_at?: string;
  recipient_username?: string;
  recipient_email?: string;
  email_sent_at?: string;
  chat_sent_at?: string;
  // Admin creation tracking
  created_by?: string;
  source: 'user_purchase' | 'admin_created';
  creation_reason?: string;
  is_commercial: boolean;
}

interface GiftCardDesign {
  id: string;
  name: string;
  design_url: string;
  preview_url: string;
  is_active: boolean;
  sort_order: number;
}

interface GiftCardStats {
  total_issued: number;
  total_redeemed: number;
  total_active: number;
  total_expired: number;
  total_blocked: number;
  total_value_issued: number;
  total_value_redeemed: number;
  total_value_active: number;
  redemption_rate: number;
  breakage_rate: number;
  period_revenue: number;
}

const GiftCardsPage = () => {
  const { hasPermission, isSuperAdmin, isDepartmentHead } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'cards' | 'designs' | 'settings' | 'marketing-wallet'>('overview');
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [designs, setDesigns] = useState<GiftCardDesign[]>([]);
  const [stats, setStats] = useState<GiftCardStats | null>(null);
  const [marketingWallet, setMarketingWallet] = useState<{ userId: string; availableBalance: number; escrowBalance: number; pendingWithdrawal: number; totalValue: number } | null>(null);
  const [marketingTransactions, setMarketingTransactions] = useState<any[]>([]);
  const [marketingTransactionsTotal, setMarketingTransactionsTotal] = useState(0);
  const [marketingPage, setMarketingPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | GiftCard['status']>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Dialog states
  const [cardDetailsDialog, setCardDetailsDialog] = useState<{ open: boolean; card: GiftCard | null }>({ open: false, card: null });
  const [showCardSecrets, setShowCardSecrets] = useState(false);
  const [blockCardDialog, setBlockCardDialog] = useState<{ open: boolean; card: GiftCard | null; reason: string }>({ open: false, card: null, reason: '' });
  const [designDialog, setDesignDialog] = useState<{ open: boolean; design: GiftCardDesign | null; mode: 'create' | 'edit' }>({ open: false, design: null, mode: 'create' });
  const [createGiftCardDialog, setCreateGiftCardDialog] = useState<{ open: boolean }>({ open: false });
  const [createFormData, setCreateFormData] = useState({
    amount: '',
    designId: '',
    quantity: '1',
    creationReason: '',
    isCommercial: false,
    expiryDays: '365',
    notes: ''
  });
  const [designFormData, setDesignFormData] = useState({
    name: '',
    designUrl: '',
    previewUrl: '',
    isActive: true,
    sortOrder: '0'
  });
  const [uploadingDesignImage, setUploadingDesignImage] = useState(false);
  const [uploadingPreviewImage, setUploadingPreviewImage] = useState(false);

  useEffect(() => {
    if (hasPermission('view_revenue')) {
      loadData();
    }
  }, [activeTab, page, statusFilter, searchQuery, hasPermission]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === 'overview') {
        await loadStats();
      } else if (activeTab === 'cards') {
        await loadGiftCards();
      } else if (activeTab === 'designs') {
        await loadDesigns();
      } else if (activeTab === 'marketing-wallet') {
        await loadMarketingWallet();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to load data',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await apiClient.get<GiftCardStats>('/admin/gift-cards/stats');
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load stats:', err);
      setStats({
        total_issued: 0,
        total_redeemed: 0,
        total_active: 0,
        total_expired: 0,
        total_blocked: 0,
        total_value_issued: 0,
        total_value_redeemed: 0,
        total_value_active: 0,
        redemption_rate: 0,
        breakage_rate: 0,
        period_revenue: 0,
      });
    }
  };

  const loadGiftCards = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      const data = await apiClient.get<{ data: GiftCard[]; total: number }>(`/admin/gift-cards?${params}`);
      setGiftCards(data.data || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      console.error('Failed to load gift cards:', err);
      setGiftCards([]);
      setTotal(0);
    }
  };

  const loadDesigns = async () => {
    try {
      const data = await apiClient.get<GiftCardDesign[]>('/admin/gift-cards/designs');
      setDesigns(data || []);
    } catch (err: any) {
      console.error('Failed to load designs:', err);
      setDesigns([]);
    }
  };

  const loadMarketingWallet = async () => {
    try {
      const [wallet, transactions] = await Promise.all([
        apiClient.get<{ userId: string; availableBalance: number; escrowBalance: number; pendingWithdrawal: number; totalValue: number }>('/admin/gift-cards/marketing-wallet'),
        apiClient.get<{ data: any[]; total: number }>(`/admin/gift-cards/marketing-wallet/transactions?page=${marketingPage}&limit=20`)
      ]);
      setMarketingWallet(wallet);
      setMarketingTransactions(transactions.data || []);
      setMarketingTransactionsTotal(transactions.total || 0);
    } catch (err: any) {
      console.error('Failed to load marketing wallet:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load marketing wallet'
      });
      setMarketingWallet(null);
      setMarketingTransactions([]);
      setMarketingTransactionsTotal(0);
    }
  };

  const handleMarketingPageChange = async (newPage: number) => {
    setMarketingPage(newPage);
    setIsLoading(true);
    try {
      const transactions = await apiClient.get<{ data: any[]; total: number }>(`/admin/gift-cards/marketing-wallet/transactions?page=${newPage}&limit=20`);
      setMarketingTransactions(transactions.data || []);
      setMarketingTransactionsTotal(transactions.total || 0);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load transactions'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlockCard = async () => {
    if (!blockCardDialog.card || !blockCardDialog.reason) return;
    
    setIsLoading(true);
    try {
      await apiClient.post(`/admin/gift-cards/${blockCardDialog.card.id}/block`, { reason: blockCardDialog.reason });
      
      toast({
        title: 'Success',
        description: 'Gift card blocked successfully',
      });
      
      setBlockCardDialog({ open: false, card: null, reason: '' });
      loadData();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to block gift card',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGiftCard = async () => {
    if (!createFormData.amount || !createFormData.designId || !createFormData.creationReason) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all required fields',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiClient.post<{ message: string }>('/admin/gift-cards/create', {
        amount: parseFloat(createFormData.amount),
        design_id: createFormData.designId,
        quantity: parseInt(createFormData.quantity),
        creation_reason: createFormData.creationReason,
        is_commercial: createFormData.isCommercial,
        expiry_days: parseInt(createFormData.expiryDays),
        notes: createFormData.notes,
      });
      
      toast({
        title: 'Success',
        description: result.message || `Successfully created ${createFormData.quantity} gift card(s)`,
      });
      
      setCreateGiftCardDialog({ open: false });
      setCreateFormData({
        amount: '',
        designId: '',
        quantity: '1',
        creationReason: '',
        isCommercial: false,
        expiryDays: '365',
        notes: ''
      });
      loadData();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to create gift cards',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnblockCard = async (card: GiftCard) => {
    setIsLoading(true);
    try {
      await apiClient.post(`/admin/gift-cards/${card.id}/unblock`);
      
      toast({
        title: 'Success',
        description: 'Gift card unblocked successfully',
      });
      
      loadData();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to unblock gift card',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadDesignImage = async (event: React.ChangeEvent<HTMLInputElement>, type: 'design' | 'preview') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (type === 'design') {
      setUploadingDesignImage(true);
    } else {
      setUploadingPreviewImage(true);
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const data = await apiClient.post<{ url: string }>('/admin/gift-cards/designs/upload', formData);

      setDesignFormData(prev => ({
        ...prev,
        [type === 'design' ? 'designUrl' : 'previewUrl']: data.url,
      }));

      toast({
        title: 'Success',
        description: `${type === 'design' ? 'Design' : 'Preview'} image uploaded successfully`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: err.message || `Failed to upload ${type} image`,
      });
    } finally {
      if (type === 'design') {
        setUploadingDesignImage(false);
      } else {
        setUploadingPreviewImage(false);
      }
    }
  };

  const handleCreateDesign = async () => {
    if (!designFormData.name || !designFormData.designUrl || !designFormData.previewUrl) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all required fields',
      });
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post('/admin/gift-cards/designs', {
        name: designFormData.name,
        design_url: designFormData.designUrl,
        preview_url: designFormData.previewUrl,
        is_active: designFormData.isActive,
        sort_order: parseInt(designFormData.sortOrder),
      });
      
      toast({
        title: 'Success',
        description: 'Design created successfully',
      });
      
      setDesignDialog({ open: false, design: null, mode: 'create' });
      setDesignFormData({
        name: '',
        designUrl: '',
        previewUrl: '',
        isActive: true,
        sortOrder: '0'
      });
      setUploadingDesignImage(false);
      setUploadingPreviewImage(false);
      loadData();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to create design',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDesign = async () => {
    if (!designDialog.design) return;
    
    setIsLoading(true);
    try {
      await apiClient.put(`/admin/gift-cards/designs/${designDialog.design.id}`, {
        name: designFormData.name,
        design_url: designFormData.designUrl,
        preview_url: designFormData.previewUrl,
        is_active: designFormData.isActive,
        sort_order: parseInt(designFormData.sortOrder),
      });
      
      toast({
        title: 'Success',
        description: 'Design updated successfully',
      });
      
      setDesignDialog({ open: false, design: null, mode: 'create' });
      setDesignFormData({
        name: '',
        designUrl: '',
        previewUrl: '',
        isActive: true,
        sortOrder: '0'
      });
      setUploadingDesignImage(false);
      setUploadingPreviewImage(false);
      loadData();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to update design',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDesign = async (designId: string) => {
    if (!confirm('Are you sure you want to delete this design?')) return;
    
    setIsLoading(true);
    try {
      await apiClient.delete(`/admin/gift-cards/designs/${designId}`);
      
      toast({
        title: 'Success',
        description: 'Design deleted successfully',
      });
      
      loadData();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to delete design',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      const minAmount = (document.querySelector('input[placeholder="1"]') as HTMLInputElement)?.value;
      const maxAmount = (document.querySelector('input[placeholder="10000"]') as HTMLInputElement)?.value;
      const defaultExpiry = (document.querySelector('input[placeholder="365"]') as HTMLInputElement)?.value;
      
      await apiClient.put('/admin/gift-cards/settings', {
        min_amount: minAmount ? parseFloat(minAmount) : undefined,
        max_amount: maxAmount ? parseFloat(maxAmount) : undefined,
        default_expiry_days: defaultExpiry ? parseInt(defaultExpiry) : undefined,
      });
      
      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to save settings',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: GiftCard['status']) => {
    switch (status) {
      case 'active': return 'bg-yellow-500';
      case 'claimed': return 'bg-green-500';
      case 'redeemed': return 'bg-gray-500';
      case 'expired': return 'bg-red-500';
      case 'blocked': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: GiftCard['status']) => {
    switch (status) {
      case 'active': return 'Pending Claim';
      case 'claimed': return 'Available';
      case 'redeemed': return 'Used';
      case 'expired': return 'Expired';
      case 'blocked': return 'Blocked';
      default: return status;
    }
  };

  if (!hasPermission('view_revenue')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to view gift card management</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Gift Cards Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage gift cards, designs, and settings</p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cards">Gift Cards</TabsTrigger>
          <TabsTrigger value="designs">Designs</TabsTrigger>
          <TabsTrigger value="marketing-wallet">Marketing Wallet</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {isLoading ? (
            <LoadingSpinner />
          ) : stats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Issued</CardTitle>
                    <Gift className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total_issued}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(stats.total_value_issued)} value
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Redeemed</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total_redeemed}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.redemption_rate}% redemption rate
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total_active}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(stats.total_value_active)} available
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Period Revenue</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.period_revenue)}</div>
                    <p className="text-xs text-muted-foreground">
                      Last 30 days
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Gift Card Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Active</span>
                        <span className="font-semibold">{stats.total_active}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Redeemed</span>
                        <span className="font-semibold">{stats.total_redeemed}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Expired</span>
                        <span className="font-semibold">{stats.total_expired}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Blocked</span>
                        <span className="font-semibold">{stats.total_blocked}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Key Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Redemption Rate</span>
                        <span className="font-semibold">{stats.redemption_rate}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Breakage Rate</span>
                        <span className="font-semibold">{stats.breakage_rate}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Total Value Redeemed</span>
                        <span className="font-semibold">{formatCurrency(stats.total_value_redeemed)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Total Value Active</span>
                        <span className="font-semibold">{formatCurrency(stats.total_value_active)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Failed to load statistics</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Gift Cards Tab */}
        <TabsContent value="cards" className="space-y-6">
          <div className="flex justify-between items-center gap-4">
            <div className="flex gap-4 flex-1">
              <Input
                placeholder="Search by card number, recipient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="claimed">Claimed</option>
                <option value="redeemed">Redeemed</option>
                <option value="expired">Expired</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <Button onClick={() => setCreateGiftCardDialog({ open: true })}>
              <Plus className="h-4 w-4 mr-2" />
              Create Gift Card
            </Button>
          </div>

          {isLoading ? (
            <LoadingSpinner />
          ) : giftCards.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No gift cards found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {giftCards.map((card) => (
                <Card key={card.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm">{card.card_number}</span>
                          <Badge className={getStatusColor(card.status)}>
                            {getStatusText(card.status)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Balance:</span>
                            <span className="ml-2 font-semibold">{formatCurrency(card.current_balance)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Design:</span>
                            <span className="ml-2">{card.design.name}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Purchased:</span>
                            <span className="ml-2">{formatDateTime(card.purchased_at)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Expires:</span>
                            <span className="ml-2">{formatDateTime(card.expires_at)}</span>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setShowCardSecrets(false); setCardDetailsDialog({ open: true, card }); }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {card.status === 'active' || card.status === 'claimed' ? (
                            <DropdownMenuItem onClick={() => setBlockCardDialog({ open: true, card, reason: '' })}>
                              <Shield className="h-4 w-4 mr-2" />
                              Block Card
                            </DropdownMenuItem>
                          ) : null}
                          {card.status === 'blocked' ? (
                            <DropdownMenuItem onClick={() => handleUnblockCard(card)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Unblock Card
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Designs Tab */}
        <TabsContent value="designs" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => {
              setDesignFormData({
                name: '',
                designUrl: '',
                previewUrl: '',
                isActive: true,
                sortOrder: '0'
              });
              setDesignDialog({ open: true, design: null, mode: 'create' });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Design
            </Button>
          </div>

          {isLoading ? (
            <LoadingSpinner />
          ) : designs.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No designs found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {designs.map((design) => (
                <Card key={design.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{design.name}</CardTitle>
                      <Badge variant={design.is_active ? 'default' : 'secondary'}>
                        {design.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Sort Order:</span>
                        <span>{design.sort_order}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setDesignFormData({
                              name: design.name,
                              designUrl: design.design_url,
                              previewUrl: design.preview_url,
                              isActive: design.is_active,
                              sortOrder: design.sort_order.toString()
                            });
                            setDesignDialog({ open: true, design, mode: 'edit' });
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleDeleteDesign(design.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Marketing Wallet Tab */}
        <TabsContent value="marketing-wallet" className="space-y-6">
          {isLoading ? (
            <LoadingSpinner />
          ) : marketingWallet ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(marketingWallet.availableBalance)}</div>
                    <p className="text-xs text-muted-foreground">Ready for admin-created cards</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Escrow Balance</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(marketingWallet.escrowBalance)}</div>
                    <p className="text-xs text-muted-foreground">Held in escrow</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Withdrawal</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(marketingWallet.pendingWithdrawal)}</div>
                    <p className="text-xs text-muted-foreground">Processing withdrawals</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(marketingWallet.totalValue)}</div>
                    <p className="text-xs text-muted-foreground">Across all balances</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Marketing Wallet Transactions</CardTitle>
                  <CardDescription>
                    {marketingTransactionsTotal} total transaction(s) — page {marketingPage}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {marketingTransactions.length > 0 ? (
                    <div className="space-y-3">
                      {marketingTransactions.map((tx: any, index: number) => (
                        <div key={tx.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium capitalize">{tx.transaction_type?.replace(/_/g, ' ')}</p>
                            <p className="text-sm text-muted-foreground">{formatDateTime(tx.created_at)}</p>
                            {tx.description && (
                              <p className="text-xs text-muted-foreground mt-1">{tx.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">{tx.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No transactions found</p>
                  )}

                  {marketingTransactionsTotal > 20 && (
                    <div className="flex items-center justify-between mt-4">
                      <Button
                        variant="outline"
                        onClick={() => handleMarketingPageChange(marketingPage - 1)}
                        disabled={marketingPage <= 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {marketingPage} of {Math.ceil(marketingTransactionsTotal / 20)}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => handleMarketingPageChange(marketingPage + 1)}
                        disabled={marketingPage * 20 >= marketingTransactionsTotal}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Marketing Wallet</CardTitle>
                <CardDescription>Failed to load marketing wallet information</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Could not retrieve the marketing wallet balance. Please try again.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gift Card Settings</CardTitle>
              <CardDescription>Configure gift card system settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Minimum Amount (FRETI)</Label>
                <Input type="number" defaultValue="1" />
              </div>
              <div className="space-y-2">
                <Label>Maximum Amount (FRETI)</Label>
                <Input type="number" defaultValue="10000" />
              </div>
              <div className="space-y-2">
                <Label>Default Expiry (Days)</Label>
                <Input type="number" defaultValue="365" />
              </div>
              <Button onClick={handleSaveSettings} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Card Details Dialog */}
      <Dialog open={cardDetailsDialog.open} onOpenChange={(open) => { if (!open) setShowCardSecrets(false); setCardDetailsDialog({ open, card: open ? cardDetailsDialog.card : null }); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gift Card Details</DialogTitle>
          </DialogHeader>
          {cardDetailsDialog.card && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Card Number</Label>
                  <p className="font-mono">{cardDetailsDialog.card.card_number}</p>
                </div>
                <div>
                  <Label>PIN</Label>
                  {showCardSecrets ? (
                    <p className="font-mono">{cardDetailsDialog.card.pin}</p>
                  ) : (
                    <p className="font-mono text-muted-foreground">****</p>
                  )}
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(cardDetailsDialog.card.status)}>
                    {getStatusText(cardDetailsDialog.card.status)}
                  </Badge>
                </div>
                <div>
                  <Label>Claim Code</Label>
                  {showCardSecrets ? (
                    <p className="font-mono">{cardDetailsDialog.card.claim_code || 'N/A'}</p>
                  ) : (
                    <p className="font-mono text-muted-foreground">********</p>
                  )}
                </div>
                <div>
                  <Label>Initial Balance</Label>
                  <p>{formatCurrency(cardDetailsDialog.card.initial_balance)}</p>
                </div>
                <div>
                  <Label>Current Balance</Label>
                  <p>{formatCurrency(cardDetailsDialog.card.current_balance)}</p>
                </div>
                <div>
                  <Label>Design</Label>
                  <p>{cardDetailsDialog.card.design.name}</p>
                </div>
                <div>
                  <Label>Delivery Method</Label>
                  <p>{cardDetailsDialog.card.delivery_method}</p>
                </div>
                <div>
                  <Label>Purchased</Label>
                  <p>{formatDateTime(cardDetailsDialog.card.purchased_at)}</p>
                </div>
                <div>
                  <Label>Expires</Label>
                  <p>{formatDateTime(cardDetailsDialog.card.expires_at)}</p>
                </div>
              </div>
              {cardDetailsDialog.card.recipient_email && (
                <div>
                  <Label>Recipient Email</Label>
                  <p>{cardDetailsDialog.card.recipient_email}</p>
                </div>
              )}
              {cardDetailsDialog.card.recipient_username && (
                <div>
                  <Label>Recipient Username</Label>
                  <p>{cardDetailsDialog.card.recipient_username}</p>
                </div>
              )}

              {(isSuperAdmin || isDepartmentHead) && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCardSecrets(!showCardSecrets)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {showCardSecrets ? 'Hide PIN & Claim Code' : 'View PIN & Claim Code'}
                  </Button>
                </div>
              )}
              {!isSuperAdmin && !isDepartmentHead && (
                <p className="text-sm text-muted-foreground">
                  PIN and claim code are restricted to super admins and department heads.
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => { setShowCardSecrets(false); setCardDetailsDialog({ open: false, card: null }); }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block Card Dialog */}
      <Dialog open={blockCardDialog.open} onOpenChange={(open) => setBlockCardDialog({ open, card: null, reason: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block Gift Card</DialogTitle>
            <DialogDescription>
              Enter a reason for blocking this gift card. This action can be reversed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input
                value={blockCardDialog.reason}
                onChange={(e) => setBlockCardDialog({ ...blockCardDialog, reason: e.target.value })}
                placeholder="Enter reason for blocking..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockCardDialog({ open: false, card: null, reason: '' })}>
              Cancel
            </Button>
            <Button onClick={handleBlockCard} disabled={!blockCardDialog.reason || isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Block Card'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Gift Card Dialog */}
      <Dialog open={createGiftCardDialog.open} onOpenChange={(open) => setCreateGiftCardDialog({ open })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Gift Card(s)</DialogTitle>
            <DialogDescription>
              Create gift cards for competitions, promotions, or customer service. These cards are created from the platform budget.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (FRETI) *</Label>
                <Input
                  type="number"
                  value={createFormData.amount}
                  onChange={(e) => setCreateFormData({ ...createFormData, amount: e.target.value })}
                  placeholder="Enter amount"
                  min="1"
                  max="10000"
                />
              </div>
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  value={createFormData.quantity}
                  onChange={(e) => setCreateFormData({ ...createFormData, quantity: e.target.value })}
                  placeholder="Number of cards"
                  min="1"
                  max="100"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Design *</Label>
              <select
                value={createFormData.designId}
                onChange={(e) => setCreateFormData({ ...createFormData, designId: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select a design</option>
                {designs.map((design) => (
                  <option key={design.id} value={design.id}>
                    {design.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Creation Reason *</Label>
              <select
                value={createFormData.creationReason}
                onChange={(e) => setCreateFormData({ ...createFormData, creationReason: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select reason</option>
                <option value="competition">Competition/Contest</option>
                <option value="promotion">Marketing Campaign</option>
                <option value="compensation">Customer Service Compensation</option>
                <option value="loyalty">Loyalty Program Reward</option>
                <option value="event">Special Event</option>
                <option value="testing">Internal Testing</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Expiry (Days)</Label>
                <Input
                  type="number"
                  value={createFormData.expiryDays}
                  onChange={(e) => setCreateFormData({ ...createFormData, expiryDays: e.target.value })}
                  placeholder="365"
                  min="1"
                  max="365"
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="isCommercial"
                  checked={createFormData.isCommercial}
                  onChange={(e) => setCreateFormData({ ...createFormData, isCommercial: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="isCommercial" className="cursor-pointer">
                  Commercial Use
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <textarea
                value={createFormData.notes}
                onChange={(e) => setCreateFormData({ ...createFormData, notes: e.target.value })}
                placeholder="Additional notes..."
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateGiftCardDialog({ open: false })}>
              Cancel
            </Button>
            <Button onClick={handleCreateGiftCard} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Gift Card(s)'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Design Dialog */}
      <Dialog open={designDialog.open} onOpenChange={(open) => {
        setDesignDialog({ open, design: null, mode: 'create' });
        if (!open) {
          setDesignFormData({
            name: '',
            designUrl: '',
            previewUrl: '',
            isActive: true,
            sortOrder: '0'
          });
          setUploadingDesignImage(false);
          setUploadingPreviewImage(false);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{designDialog.mode === 'create' ? 'Add Gift Card Design' : 'Edit Gift Card Design'}</DialogTitle>
            <DialogDescription>
              {designDialog.mode === 'create' 
                ? 'Create a new gift card design for users to choose from.' 
                : 'Update the gift card design details.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Design Name *</Label>
              <Input
                value={designFormData.name}
                onChange={(e) => setDesignFormData({ ...designFormData, name: e.target.value })}
                placeholder="e.g., Birthday, Holiday, Thank You"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Design URL *</Label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    value={designFormData.designUrl}
                    onChange={(e) => setDesignFormData({ ...designFormData, designUrl: e.target.value })}
                    placeholder="https://example.com/designs/birthday.png"
                  />
                </div>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadDesignImage(e, 'design')}
                    disabled={uploadingDesignImage}
                    className="hidden"
                    id="design-image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('design-image-upload')?.click()}
                    disabled={uploadingDesignImage}
                  >
                    {uploadingDesignImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    {uploadingDesignImage ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Full-size image URL for the gift card design or upload a new image</p>
            </div>

            <div className="space-y-2">
              <Label>Preview URL *</Label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    value={designFormData.previewUrl}
                    onChange={(e) => setDesignFormData({ ...designFormData, previewUrl: e.target.value })}
                    placeholder="https://example.com/designs/birthday-preview.png"
                  />
                </div>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadDesignImage(e, 'preview')}
                    disabled={uploadingPreviewImage}
                    className="hidden"
                    id="preview-image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('preview-image-upload')?.click()}
                    disabled={uploadingPreviewImage}
                  >
                    {uploadingPreviewImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    {uploadingPreviewImage ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Thumbnail image URL for the design preview or upload a new image</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={designFormData.sortOrder}
                  onChange={(e) => setDesignFormData({ ...designFormData, sortOrder: e.target.value })}
                  placeholder="0"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={designFormData.isActive}
                  onChange={(e) => setDesignFormData({ ...designFormData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Active
                </Label>
              </div>
            </div>

            {designFormData.designUrl && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="border rounded-md p-4">
                  <img 
                    src={designFormData.designUrl} 
                    alt="Design preview" 
                    className="max-w-full h-auto rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDesignDialog({ open: false, design: null, mode: 'create' });
              setDesignFormData({
                name: '',
                designUrl: '',
                previewUrl: '',
                isActive: true,
                sortOrder: '0'
              });
              setUploadingDesignImage(false);
              setUploadingPreviewImage(false);
            }}>
              Cancel
            </Button>
            <Button onClick={designDialog.mode === 'create' ? handleCreateDesign : handleUpdateDesign} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (designDialog.mode === 'create' ? 'Create Design' : 'Update Design')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GiftCardsPage;
