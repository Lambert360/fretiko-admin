/** @jsxImportSource react */
'use client';

/**
 * Finance Management Page
 *
 * Revenue tracking and financial analytics
 * Features:
 * - Platform revenue overview
 * - Escrow health monitoring
 * - Payout management
 * - Revenue by source breakdown
 *
 * Requires: view_revenue permission
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { financeAPI, type RevenueStats, type EscrowHealth, type Payout, type Deposit, type TotalPlatformFunds, type UserBalance, type PlatformWallet, type BankAccount, type CreateBankAccountDto, type UpdateBankAccountDto, type WithdrawRequestDto, type PlatformWithdrawal, type GiftStats, type UserGiftHolding, type VirtualGift, type CreateGiftDto, type UpdateGiftDto, type RegionalRevenueResponse, type ProviderPerformanceResponse, type TransactionPatternsResponse, type EnhancedRevenueSummary } from '@/lib/api/finance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Clock, AlertTriangle, Wallet, CreditCard, BarChart3, Calendar, Loader2, Eye, MoreVertical, Search, ArrowDownCircle, Building2, Plus, Edit, Trash2, ArrowUpCircle, Users, MapPin, CheckCircle } from 'lucide-react';
import { LoadingPage, LoadingSpinner } from '@/components/ui/loading';
import { formatDateTime, formatCurrency } from '@/lib/utils/formatting';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const FinancePage = () => {
  const { isSuperAdmin, hasPermission } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'revenue' | 'escrow' | 'payouts' | 'deposits' | 'user-balances' | 'platform-wallet' | 'gift-wallet' | 'regional-revenue' | 'provider-performance' | 'transaction-patterns' | 'enhanced-revenue'>('revenue');
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [escrowHealth, setEscrowHealth] = useState<EscrowHealth | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [totalFunds, setTotalFunds] = useState<TotalPlatformFunds | null>(null);
  const [userBalances, setUserBalances] = useState<UserBalance[]>([]);
  const [userBalanceSearchQuery, setUserBalanceSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA'),
    end: new Date().toLocaleDateString('en-CA'),
  });
  const [payoutStatusFilter, setPayoutStatusFilter] = useState<'all' | 'requested' | 'pending' | 'processing' | 'completed' | 'paid' | 'failed'>('all');
  const [depositStatusFilter, setDepositStatusFilter] = useState<'all' | Deposit['status']>('all');
  const [depositPaymentMethodFilter, setDepositPaymentMethodFilter] = useState<string>('all');
  const [depositSearchQuery, setDepositSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Dialog states
  const [payoutDetailsDialog, setPayoutDetailsDialog] = useState<{ open: boolean; payout: Payout | null }>({ open: false, payout: null });
  const [processPayoutDialog, setProcessPayoutDialog] = useState<{ open: boolean; payout: Payout | null }>({ open: false, payout: null });

  // Platform wallet states
  const [platformWallet, setPlatformWallet] = useState<PlatformWallet | null>(null);
  const [platformBankAccounts, setPlatformBankAccounts] = useState<BankAccount[]>([]);
  const [platformWithdrawals, setPlatformWithdrawals] = useState<PlatformWithdrawal[]>([]);
  const [withdrawalPagination, setWithdrawalPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    hasMore: false,
  });
  const [loadingMoreWithdrawals, setLoadingMoreWithdrawals] = useState(false);
  const [addBankAccountDialog, setAddBankAccountDialog] = useState(false);
  const [editBankAccountDialog, setEditBankAccountDialog] = useState<{ open: boolean; account: BankAccount | null }>({ open: false, account: null });
  const [deleteBankAccountDialog, setDeleteBankAccountDialog] = useState<{ open: boolean; account: BankAccount | null }>({ open: false, account: null });
  const [withdrawDialog, setWithdrawDialog] = useState(false);
  const [bankAccountForm, setBankAccountForm] = useState<CreateBankAccountDto>({
    accountName: '',
    bankName: '',
    bankCode: '',
    accountNumber: '',
    accountType: 'checking',
    currency: 'USD',
    country: 'US',
    isDefault: false,
  });
  const [withdrawForm, setWithdrawForm] = useState<WithdrawRequestDto>({
    fretiAmount: 0,
    bankAccountId: '',
  });

  // Gift wallet states
  const [giftStats, setGiftStats] = useState<GiftStats | null>(null);
  const [userGiftHoldings, setUserGiftHoldings] = useState<UserGiftHolding[]>([]);
  const [giftHoldingsSearchQuery, setGiftHoldingsSearchQuery] = useState('');
  const [giftHoldingsPage, setGiftHoldingsPage] = useState(1);
  const [giftHoldingsTotal, setGiftHoldingsTotal] = useState(0);

  // Gift management states
  const [allGifts, setAllGifts] = useState<VirtualGift[]>([]);
  const [giftManagementDialog, setGiftManagementDialog] = useState<{ open: boolean; gift: VirtualGift | null; mode: 'create' | 'edit' }>({ open: false, gift: null, mode: 'create' });
  const [deleteGiftDialog, setDeleteGiftDialog] = useState<{ open: boolean; gift: VirtualGift | null }>({ open: false, gift: null });
  const [giftForm, setGiftForm] = useState<CreateGiftDto>({
    name: '',
    emoji: '',
    credit_value: 0,
    sort_order: 0,
    is_active: true,
  });

  // Enhanced Analytics States
  const [regionalRevenue, setRegionalRevenue] = useState<RegionalRevenueResponse | null>(null);
  const [providerPerformance, setProviderPerformance] = useState<ProviderPerformanceResponse | null>(null);
  const [transactionPatterns, setTransactionPatterns] = useState<TransactionPatternsResponse | null>(null);
  const [enhancedRevenueSummary, setEnhancedRevenueSummary] = useState<EnhancedRevenueSummary | null>(null);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  const canViewFinance = isSuperAdmin || hasPermission('view_revenue');

  useEffect(() => {
    if (canViewFinance) {
      if (activeTab === 'revenue') {
        fetchRevenue();
      } else if (activeTab === 'escrow') {
        fetchEscrowHealth();
      } else if (activeTab === 'payouts') {
        fetchPayouts();
      } else if (activeTab === 'deposits') {
        fetchTotalFunds();
        fetchDeposits();
      } else if (activeTab === 'user-balances') {
        fetchUserBalances();
      } else if (activeTab === 'platform-wallet') {
        fetchPlatformWallet();
        fetchPlatformBankAccounts();
        fetchPlatformWithdrawals();
      } else if (activeTab === 'gift-wallet') {
        fetchGiftWalletStats();
        fetchUserGiftHoldings();
        fetchAllGifts();
      } else if (activeTab === 'regional-revenue') {
        fetchRegionalRevenue();
      } else if (activeTab === 'provider-performance') {
        fetchProviderPerformance();
      } else if (activeTab === 'transaction-patterns') {
        fetchTransactionPatterns();
      } else if (activeTab === 'enhanced-revenue') {
        fetchEnhancedRevenueSummary();
      }
    }
  }, [canViewFinance, activeTab, dateRange, payoutStatusFilter, depositStatusFilter, depositPaymentMethodFilter, depositSearchQuery, userBalanceSearchQuery, giftHoldingsSearchQuery, page, giftHoldingsPage, analyticsPeriod]);

  const fetchRevenue = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const stats = await financeAPI.getRevenue(dateRange.start, dateRange.end);
      setRevenueStats(stats);
    } catch (err: any) {
      console.error('Failed to fetch revenue:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load revenue data';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEscrowHealth = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const health = await financeAPI.getEscrowHealth();
      setEscrowHealth(health);
    } catch (err: any) {
      console.error('Failed to fetch escrow health:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load escrow health';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPayouts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await financeAPI.getPayouts({
        status: payoutStatusFilter !== 'all' ? (payoutStatusFilter as any) : undefined,
        page,
        limit,
      });
      setPayouts(response.payouts);
      setTotal(response.total);
    } catch (err: any) {
      console.error('Failed to fetch payouts:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load payouts';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTotalFunds = async () => {
    try {
      const funds = await financeAPI.getTotalFunds();
      setTotalFunds(funds);
    } catch (err: any) {
      console.error('Failed to fetch total funds:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load total funds',
        variant: 'destructive',
      });
    }
  };

  const fetchDeposits = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await financeAPI.getDeposits({
        status: depositStatusFilter !== 'all' ? depositStatusFilter : undefined,
        paymentMethod: depositPaymentMethodFilter !== 'all' ? depositPaymentMethodFilter : undefined,
        search: depositSearchQuery || undefined,
        page,
        limit,
      });
      setDeposits(response.deposits);
      setTotal(response.total);
    } catch (err: any) {
      console.error('Failed to fetch deposits:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load deposits';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserBalances = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await financeAPI.getUserBalances({
        search: userBalanceSearchQuery || undefined,
        page,
        limit,
      });
      setUserBalances(response.balances);
      setTotal(response.total);
    } catch (err: any) {
      console.error('Failed to fetch user balances:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load user balances';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessPayout = async () => {
    if (!processPayoutDialog.payout) return;

    try {
      setIsActionLoading((processPayoutDialog.payout as any).id);
      await financeAPI.processPayout(processPayoutDialog.payout.id);
      setProcessPayoutDialog({ open: false, payout: null });
      await fetchPayouts();
      toast({
        title: 'Success',
        description: 'Payout processed successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to process payout',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(null);
    }
  };

  const fetchPlatformWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const wallet = await financeAPI.getPlatformWallet();
      setPlatformWallet(wallet);
    } catch (err: any) {
      console.error('Failed to fetch platform wallet:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load platform wallet';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlatformBankAccounts = async () => {
    try {
      const accounts = await financeAPI.getPlatformBankAccounts();
      setPlatformBankAccounts(accounts);
    } catch (err: any) {
      console.error('Failed to fetch platform bank accounts:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load bank accounts',
        variant: 'destructive',
      });
    }
  };

  const fetchPlatformWithdrawals = async (page: number = 1) => {
    try {
      const response = await financeAPI.getPlatformWithdrawals(page, 50);

      if (page === 1) {
        // First page - replace data
        setPlatformWithdrawals(response.data);
      } else {
        // Load more - append data
        setPlatformWithdrawals(prev => [...prev, ...response.data]);
      }

      setWithdrawalPagination({
        page: response.pagination.page,
        limit: response.pagination.limit,
        total: response.pagination.total,
        hasMore: response.pagination.hasMore,
      });
    } catch (err: any) {
      console.error('Failed to fetch platform withdrawals:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load withdrawal history',
        variant: 'destructive',
      });
    }
  };

  const handleLoadMoreWithdrawals = async () => {
    if (!withdrawalPagination.hasMore || loadingMoreWithdrawals) return;

    setLoadingMoreWithdrawals(true);
    await fetchPlatformWithdrawals(withdrawalPagination.page + 1);
    setLoadingMoreWithdrawals(false);
  };

  const handleAddBankAccount = async () => {
    try {
      setIsActionLoading('add-bank');
      await financeAPI.addPlatformBankAccount(bankAccountForm);
      setAddBankAccountDialog(false);
      setBankAccountForm({
        accountName: '',
        bankName: '',
        bankCode: '',
        accountNumber: '',
        accountType: 'checking',
        currency: 'USD',
        country: 'US',
        isDefault: false,
      });
      await fetchPlatformBankAccounts();
      toast({
        title: 'Success',
        description: 'Bank account added successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to add bank account',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleUpdateBankAccount = async () => {
    if (!editBankAccountDialog.account) return;

    try {
      setIsActionLoading(editBankAccountDialog.account.id);
      await financeAPI.updatePlatformBankAccount(editBankAccountDialog.account.id, bankAccountForm);
      setEditBankAccountDialog({ open: false, account: null });
      setBankAccountForm({
        accountName: '',
        bankName: '',
        bankCode: '',
        accountNumber: '',
        accountType: 'checking',
        currency: 'USD',
        country: 'US',
        isDefault: false,
      });
      await fetchPlatformBankAccounts();
      toast({
        title: 'Success',
        description: 'Bank account updated successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to update bank account',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleDeleteBankAccount = async () => {
    if (!deleteBankAccountDialog.account) return;

    try {
      setIsActionLoading(deleteBankAccountDialog.account.id);
      await financeAPI.deletePlatformBankAccount(deleteBankAccountDialog.account.id);
      setDeleteBankAccountDialog({ open: false, account: null });
      await fetchPlatformBankAccounts();
      toast({
        title: 'Success',
        description: 'Bank account deleted successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to delete bank account',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawForm.bankAccountId || withdrawForm.fretiAmount <= 0) {
      toast({
        title: 'Error',
        description: 'Please select a bank account and enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsActionLoading('withdraw');
      await financeAPI.createPlatformWithdrawal(withdrawForm);
      setWithdrawDialog(false);
      setWithdrawForm({
        fretiAmount: 0,
        bankAccountId: '',
      });
      await fetchPlatformWallet();
      await fetchPlatformWithdrawals();
      toast({
        title: 'Success',
        description: 'Withdrawal request created successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to create withdrawal request',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatAmount = (amount: number) => {
    // Convert any amount to USD (1 Freti = 1 USD)
    return formatCurrency(amount);
  };

  const fetchGiftWalletStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const stats = await financeAPI.getGiftWalletStats();
      setGiftStats(stats);
    } catch (err: any) {
      console.error('Failed to fetch gift wallet stats:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load gift wallet statistics';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserGiftHoldings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await financeAPI.getUserGiftHoldings({
        search: giftHoldingsSearchQuery || undefined,
        page: giftHoldingsPage,
        limit,
      });
      setUserGiftHoldings(response.users);
      setGiftHoldingsTotal(response.total);
    } catch (err: any) {
      console.error('Failed to fetch user gift holdings:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load user gift holdings';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllGifts = async () => {
    try {
      const gifts = await financeAPI.getAllGifts();
      setAllGifts(gifts);
    } catch (err: any) {
      console.error('Failed to fetch gifts:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load gifts',
        variant: 'destructive',
      });
    }
  };

  const handleCreateGift = async () => {
    try {
      setIsActionLoading('create-gift');
      await financeAPI.createGift(giftForm);
      toast({
        title: 'Success',
        description: 'Gift created successfully',
      });
      setGiftManagementDialog({ open: false, gift: null, mode: 'create' });
      setGiftForm({ name: '', emoji: '', credit_value: 0, sort_order: 0, is_active: true });
      await fetchAllGifts();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to create gift',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleUpdateGift = async () => {
    if (!giftManagementDialog.gift) return;
    try {
      setIsActionLoading(`update-gift-${giftManagementDialog.gift.id}`);
      await financeAPI.updateGift(giftManagementDialog.gift.id, giftForm);
      toast({
        title: 'Success',
        description: 'Gift updated successfully',
      });
      setGiftManagementDialog({ open: false, gift: null, mode: 'create' });
      setGiftForm({ name: '', emoji: '', credit_value: 0, sort_order: 0, is_active: true });
      await fetchAllGifts();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to update gift',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleDeleteGift = async () => {
    if (!deleteGiftDialog.gift) return;
    try {
      setIsActionLoading(`delete-gift-${deleteGiftDialog.gift.id}`);
      await financeAPI.deleteGift(deleteGiftDialog.gift.id);
      toast({
        title: 'Success',
        description: 'Gift deleted successfully',
      });
      setDeleteGiftDialog({ open: false, gift: null });
      await fetchAllGifts();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to delete gift',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(null);
    }
  };

  const openCreateGiftDialog = () => {
    setGiftForm({ name: '', emoji: '', credit_value: 0, sort_order: 0, is_active: true });
    setGiftManagementDialog({ open: true, gift: null, mode: 'create' });
  };

  const openEditGiftDialog = (gift: VirtualGift) => {
    setGiftForm({
      name: gift.name,
      emoji: gift.emoji,
      credit_value: gift.credit_value,
      sort_order: gift.sort_order,
      is_active: gift.is_active,
    });
    setGiftManagementDialog({ open: true, gift, mode: 'edit' });
  };

  const getStatusBadge = (status: Payout['status']) => {
    const variants: Record<Payout['status'], { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      requested: { variant: 'outline', label: 'Requested' },
      pending: { variant: 'outline', label: 'Pending' },
      processing: { variant: 'secondary', label: 'Processing' },
      completed: { variant: 'default', label: 'Completed' },
      paid: { variant: 'default', label: 'Paid' },
      failed: { variant: 'destructive', label: 'Failed' },
    };
    const config = variants[status] || variants['requested']; // Fallback for unknown statuses
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getDepositStatusBadge = (status: Deposit['status']) => {
    const variants: Record<Deposit['status'], { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'outline', label: 'Pending' },
      processing: { variant: 'secondary', label: 'Processing' },
      completed: { variant: 'default', label: 'Completed' },
      failed: { variant: 'destructive', label: 'Failed' },
      cancelled: { variant: 'outline', label: 'Cancelled' },
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentMethodLabel = (method: string) => {
    const methodMap: Record<string, string> = {
      card: 'Card Deposit',
      bank_transfer: 'Bank Transfer',
      ussd: 'USSD',
      mobile_money: 'Mobile Money',
      paystack: 'Paystack',
      stripe: 'Stripe',
      flutterwave: 'Flutterwave',
    };
    return methodMap[method.toLowerCase()] || method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // ✅ NEW: Enhanced Analytics Fetch Functions
  const fetchRegionalRevenue = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await financeAPI.getRegionalRevenue({
        period: analyticsPeriod,
        startDate: dateRange.start,
        endDate: dateRange.end,
      });
      setRegionalRevenue(data);
    } catch (err: any) {
      console.error('Failed to fetch regional revenue:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load regional revenue data';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProviderPerformance = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await financeAPI.getProviderPerformance({
        period: analyticsPeriod,
        startDate: dateRange.start,
        endDate: dateRange.end,
      });
      setProviderPerformance(data);
    } catch (err: any) {
      console.error('Failed to fetch provider performance:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load provider performance data';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactionPatterns = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await financeAPI.getTransactionPatterns({
        period: analyticsPeriod,
        startDate: dateRange.start,
        endDate: dateRange.end,
      });
      setTransactionPatterns(data);
    } catch (err: any) {
      console.error('Failed to fetch transaction patterns:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load transaction patterns data';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEnhancedRevenueSummary = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await financeAPI.getRevenueSummary({
        period: analyticsPeriod,
        startDate: dateRange.start,
        endDate: dateRange.end,
      });
      setEnhancedRevenueSummary(data);
    } catch (err: any) {
      console.error('Failed to fetch enhanced revenue summary:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load enhanced revenue summary data';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!canViewFinance) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">You don't have permission to view finance data.</p>
        </div>
      </div>
    );
  }

  if (isLoading && !revenueStats && !escrowHealth && !payouts.length && !deposits.length && !userBalances.length && !platformWallet) {
    return <LoadingPage />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Finance Management</h1>
          <p className="text-muted-foreground mt-1">Track revenue, escrow health, and payouts</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">to</span>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-32"
            />
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <p className="text-destructive">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('revenue')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'revenue'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Revenue
          </button>
          <button
            onClick={() => setActiveTab('escrow')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'escrow'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Escrow Health
          </button>
          <button
            onClick={() => {
              setActiveTab('payouts');
              setPage(1);
            }}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'payouts'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Payouts
          </button>
          <button
            onClick={() => {
              setActiveTab('deposits');
              setPage(1);
            }}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'deposits'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Deposits
          </button>
          <button
            onClick={() => {
              setActiveTab('user-balances');
              setPage(1);
            }}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'user-balances'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            User Balances
          </button>
          <button
            onClick={() => setActiveTab('platform-wallet')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'platform-wallet'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Platform Wallet
          </button>
          <button
            onClick={() => {
              setActiveTab('gift-wallet');
              setPage(1);
            }}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'gift-wallet'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Gift Wallet
          </button>
          {/* ✅ NEW: Enhanced Analytics Tabs */}
          <button
            onClick={() => setActiveTab('regional-revenue')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'regional-revenue'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Regional Revenue
          </button>
          <button
            onClick={() => setActiveTab('provider-performance')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'provider-performance'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Provider Performance
          </button>
          <button
            onClick={() => setActiveTab('transaction-patterns')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transaction-patterns'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Transaction Patterns
          </button>
          <button
            onClick={() => setActiveTab('enhanced-revenue')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'enhanced-revenue'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Enhanced Revenue
          </button>
        </nav>
      </div>

      {/* Analytics Period Selector */}
      {(activeTab === 'regional-revenue' || activeTab === 'provider-performance' || 
        activeTab === 'transaction-patterns' || activeTab === 'enhanced-revenue') && (
        <div className="flex items-center space-x-4">
          <Label htmlFor="period-select">Period:</Label>
          <select
            id="period-select"
            value={analyticsPeriod}
            onChange={(e) => setAnalyticsPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          {/* Revenue Stats Cards */}
          {revenueStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatAmount(
                      Object.values((revenueStats as any)?.revenueBySource || {}).reduce(
                        (sum: number, amount: any) => sum + (typeof amount === 'number' ? amount : 0),
                        0
                      )
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sum of all revenue streams
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatAmount((revenueStats as any)?.totalPlatformFees || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    Total platform fees collected
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Revenue</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatAmount((revenueStats as any)?.pendingRevenue || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    Revenue in held escrows
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lost Revenue</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatAmount((revenueStats as any)?.lostRevenue || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    Revenue from refunded/disputed escrows
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Revenue by Source */}
          {revenueStats && (
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Source</CardTitle>
                <CardDescription>Breakdown of revenue by transaction type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries((revenueStats as any)?.revenueBySource || {}).map(([source, amount]) => (
                    <div key={source} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <span className="text-sm font-medium capitalize">{source.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="text-sm font-medium">{formatAmount(amount as number)}</div>
                    </div>
                  ))}
                  {/* Total Revenue from All Sources */}
                  {Object.keys((revenueStats as any)?.revenueBySource || {}).length > 0 && (
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <span className="text-sm font-semibold">Total from All Sources</span>
                      </div>
                      <div className="text-sm font-bold">
                        {formatAmount(
                          Object.values((revenueStats as any)?.revenueBySource || {}).reduce(
                            (sum: number, amount: any) => sum + (typeof amount === 'number' ? amount : 0),
                            0
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="h-4 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-8 bg-muted animate-pulse rounded mb-2" />
                      <div className="h-3 bg-muted animate-pulse rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Regional Revenue Tab */}
      {activeTab === 'regional-revenue' && regionalRevenue && (
        <div className="space-y-6">
          {/* Regional Revenue Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatAmount(regionalRevenue.totalVolume)}</div>
                <p className="text-xs text-muted-foreground">
                  Total transaction volume
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{regionalRevenue.totalUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Active users in period
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Regions</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{regionalRevenue.regions.length}</div>
                <p className="text-xs text-muted-foreground">
                  Regions with activity
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Regional Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Regional Breakdown</CardTitle>
              <CardDescription>Revenue and transaction details by region</CardDescription>
            </CardHeader>
            <CardContent>
              {regionalRevenue.regions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No regional data available for this period</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-4">Country/Region</th>
                          <th className="text-right py-2 pr-4">Volume</th>
                          <th className="text-right py-2 pr-4">Users</th>
                          <th className="text-right py-2 pr-4">Transactions</th>
                          <th className="text-right py-2 pr-4">Growth</th>
                        </tr>
                      </thead>
                      <tbody>
                        {regionalRevenue.regions.map((region, index) => (
                          <tr key={`${region.country}-${region.region}-${index}`} className="border-b border-border/50">
                            <td className="py-2 pr-4">
                              <div className="font-medium">{region.country}</div>
                              <div className="text-xs text-muted-foreground">{region.region}</div>
                            </td>
                            <td className="py-2 pr-4 text-right">{formatAmount(region.volume)}</td>
                            <td className="py-2 pr-4 text-right">{region.users.toLocaleString()}</td>
                            <td className="py-2 pr-4 text-right">{region.transactions.toLocaleString()}</td>
                            <td className="py-2 pr-4 text-right">
                              <span className={region.growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {region.growth >= 0 ? '+' : ''}{region.growth.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Provider Performance Tab */}
      {activeTab === 'provider-performance' && providerPerformance && (
        <div className="space-y-6">
          {/* Provider Performance Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{providerPerformance.summary.totalTransactions.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Total provider transactions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatAmount(providerPerformance.summary.totalVolume)}</div>
                <p className="text-xs text-muted-foreground">
                  Total transaction volume
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Success Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {providerPerformance.providers.length > 0 
                    ? providerPerformance.summary.avgSuccessRate.toFixed(1)
                    : '0.0'}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Average success rate
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Providers</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{providerPerformance.providers.length}</div>
                <p className="text-xs text-muted-foreground">
                  Providers with activity
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Provider Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Provider Performance</CardTitle>
              <CardDescription>Detailed performance metrics by provider</CardDescription>
            </CardHeader>
            <CardContent>
              {providerPerformance.providers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No provider data available for this period</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-4">Provider</th>
                          <th className="text-right py-2 pr-4">Transactions</th>
                          <th className="text-right py-2 pr-4">Volume</th>
                          <th className="text-right py-2 pr-4">Success Rate</th>
                          <th className="text-right py-2 pr-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {providerPerformance.providers.map((provider, index) => (
                          <tr key={`${provider.name}-${index}`} className="border-b border-border/50">
                            <td className="py-2 pr-4">
                              <div className="font-medium">{provider.name}</div>
                              <div className="text-xs text-muted-foreground">Provider</div>
                            </td>
                            <td className="py-2 pr-4 text-right">{provider.totalTransactions.toLocaleString()}</td>
                            <td className="py-2 pr-4 text-right">{formatAmount(provider.totalVolume)}</td>
                            <td className="py-2 pr-4 text-right">
                              <span className={provider.successRate >= 95 ? 'text-green-600' : provider.successRate >= 85 ? 'text-yellow-600' : 'text-red-600'}>
                                {provider.successRate.toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-2 pr-4 text-right">
                              <Badge variant={provider.successRate >= 95 ? 'default' : provider.successRate >= 85 ? 'secondary' : 'destructive'}>
                                {provider.successRate >= 95 ? 'Excellent' : provider.successRate >= 85 ? 'Good' : 'Poor'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transaction Patterns Tab */}
      {activeTab === 'transaction-patterns' && transactionPatterns && (
        <div className="space-y-6">
          {/* Transaction Patterns Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{transactionPatterns.summary.totalTransactions.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Total transactions in period
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatAmount(transactionPatterns.summary.totalVolume)}</div>
                <p className="text-xs text-muted-foreground">
                  Total transaction volume
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatAmount(transactionPatterns.summary.avgTransactionSize)}</div>
                <p className="text-xs text-muted-foreground">
                  Average transaction value
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Growth</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <span className={transactionPatterns.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {transactionPatterns.monthlyGrowth >= 0 ? '+' : ''}{transactionPatterns.monthlyGrowth.toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  vs previous month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Peak Hours Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Peak Hours Analysis</CardTitle>
              <CardDescription>Transaction volume by hour of day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium mb-4">Busiest Hours</h4>
                    <div className="space-y-2">
                      {transactionPatterns.peakHours.slice(0, 5).map((hourValue, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{index}:00</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold">{formatAmount(hourValue)}</div>
                            <div className="text-xs text-muted-foreground">Volume</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-4">Peak Statistics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Peak Hour</span>
                        <span className="text-sm font-medium">
                          {transactionPatterns.peakHours.length > 0 ? `${transactionPatterns.peakHours.indexOf(Math.max(...transactionPatterns.peakHours))}:00` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Peak Volume</span>
                        <span className="text-sm font-medium">
                          {transactionPatterns.peakHours.length > 0 ? formatAmount(Math.max(...transactionPatterns.peakHours)) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Average per Hour</span>
                        <span className="text-sm font-medium">
                          {transactionPatterns.peakHours.length > 0 
                            ? formatAmount(transactionPatterns.peakHours.reduce((sum, hour) => sum + hour, 0) / transactionPatterns.peakHours.length)
                            : 'N/A'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Types */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Types Breakdown</CardTitle>
              <CardDescription>Distribution of transactions by type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(transactionPatterns.transactionTypes).map(([type, count]) => (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium capitalize">{type.replace('_', ' ')}</p>
                        <p className="text-sm text-muted-foreground">
                          {count.toLocaleString()} transactions
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{count}</div>
                        <div className="text-xs text-muted-foreground">
                          {((count / transactionPatterns.summary.totalTransactions) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Hourly Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Hourly Distribution</CardTitle>
              <CardDescription>Transaction volume throughout the day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-24 gap-1">
                  {transactionPatterns.peakHours.map((hourValue, index) => {
                    const maxVolume = Math.max(...transactionPatterns.peakHours);
                    const height = maxVolume > 0 ? (hourValue / maxVolume) * 100 : 0;
                    
                    return (
                      <div key={index} className="flex flex-col items-center">
                        <div 
                          className="w-full bg-primary rounded-t"
                          style={{ height: `${height}%`, minHeight: height > 0 ? '4px' : '0' }}
                        />
                        <span className="text-xs text-muted-foreground mt-1">{index}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Distribution</CardTitle>
              <CardDescription>Transaction patterns by day of week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-7 gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                    const dayValue = transactionPatterns.dailyDistribution[index];
                    const maxValue = Math.max(...transactionPatterns.dailyDistribution);
                    const height = maxValue > 0 ? (dayValue / maxValue) * 100 : 0;
                    
                    return (
                      <div key={day} className="flex flex-col items-center">
                        <span className="text-xs text-muted-foreground mb-2">{day}</span>
                        <div 
                          className="w-full bg-primary rounded-t"
                          style={{ height: `${height}%`, minHeight: height > 0 ? '40px' : '0' }}
                        />
                        <div className="text-xs font-medium mt-2">
                          {formatAmount(dayValue)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Volume
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'escrow' && (
        <div className="space-y-6">
          {/* Escrow Health Stats */}
          {escrowHealth && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total in Escrow</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatAmount((escrowHealth as any)?.totalInEscrow || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    Value currently held in escrow
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overdue Escrows</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{((escrowHealth as any)?.overdueEscrows || 0).toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Escrows past auto-release date
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Dispute Rate</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{((escrowHealth as any)?.disputeRate || 0) * 100}%</div>
                  <p className="text-xs text-muted-foreground">
                    Percentage of disputed escrows
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Escrow Details */}
          {escrowHealth && (
            <Card>
              <CardHeader>
                <CardTitle>Escrow Breakdown</CardTitle>
                <CardDescription>Detailed escrow status information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">By Status</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Held</span>
                          <span>{(escrowHealth as any)?.escrowsByStatus?.held || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Released</span>
                          <span>{(escrowHealth as any)?.escrowsByStatus?.released || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Disputed</span>
                          <span>{(escrowHealth as any)?.escrowsByStatus?.disputed || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Refunded</span>
                          <span>{(escrowHealth as any)?.escrowsByStatus?.refunded || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="h-4 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-8 bg-muted animate-pulse rounded mb-2" />
                      <div className="h-3 bg-muted animate-pulse rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'payouts' && (
        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Payout Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="payout-status">Status:</Label>
                  <select
                    id="payout-status"
                    value={payoutStatusFilter}
                    onChange={(e) => setPayoutStatusFilter(e.target.value as 'all' | 'requested' | 'pending' | 'processing' | 'completed' | 'paid' | 'failed')}
                    className="border border-input bg-background px-3 py-2 rounded-md text-sm"
                  >
                    <option value="all">All Statuses</option>
                    <option value="requested">Requested</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payouts Table */}
          <Card>
            <CardHeader>
              <CardTitle>Payouts ({total})</CardTitle>
              <CardDescription>Manage and process payout requests</CardDescription>
            </CardHeader>
            <CardContent>
              {payouts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No payouts found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payouts.map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium">User {(payout as any).userId || (payout as any).user_id}</p>
                          {getStatusBadge(payout.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatAmount((payout as any).amount)} • {formatDateTime((payout as any).createdAt || (payout as any).created_at)}
                        </p>
                        {(payout as any).metadata?.bankAccount && (
                          <p className="text-xs text-muted-foreground">
                            {(payout as any).metadata.bankAccount.accountName} • {(payout as any).metadata.bankAccount.accountNumber}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPayoutDetailsDialog({ open: true, payout })}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {payout.status === 'pending' && (isSuperAdmin || hasPermission('process_payouts')) && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => setProcessPayoutDialog({ open: true, payout })}
                            disabled={!!isActionLoading}
                          >
                            {isActionLoading === payout.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Process'
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {total > limit && (
                    <div className="flex justify-center pt-4">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(Math.max(1, page - 1))}
                          disabled={page === 1}
                        >
                          Previous
                        </Button>
                        <span className="px-4 py-2 text-sm text-muted-foreground">
                          Page {page} of {Math.ceil(total / limit)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page + 1)}
                          disabled={page * limit >= total}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loading State */}
          {isLoading && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-2">
                        <div className="h-4 bg-muted animate-pulse rounded w-32" />
                        <div className="h-3 bg-muted animate-pulse rounded w-48" />
                      </div>
                      <div className="h-8 bg-muted animate-pulse rounded w-20" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'deposits' && (
        <div className="space-y-6">
          {/* Deposit Stats */}
          {totalFunds && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatAmount((totalFunds as any)?.totalDeposits || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    All time deposits
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Deposits</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatAmount((totalFunds as any)?.pendingDeposits || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    Awaiting processing
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Processed Deposits</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatAmount((totalFunds as any)?.processedDeposits || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    Successfully completed
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Deposit Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Deposit Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="deposit-status">Status:</Label>
                  <select
                    id="deposit-status"
                    value={depositStatusFilter}
                    onChange={(e) => setDepositStatusFilter(e.target.value as 'all' | Deposit['status'])}
                    className="border border-input bg-background px-3 py-2 rounded-md text-sm"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="payment-method">Payment Method:</Label>
                  <select
                    id="payment-method"
                    value={depositPaymentMethodFilter}
                    onChange={(e) => setDepositPaymentMethodFilter(e.target.value)}
                    className="border border-input bg-background px-3 py-2 rounded-md text-sm"
                  >
                    <option value="all">All Methods</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="ussd">USSD</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="paystack">Paystack</option>
                    <option value="stripe">Stripe</option>
                    <option value="flutterwave">Flutterwave</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="deposit-search">Search:</Label>
                  <Input
                    id="deposit-search"
                    type="text"
                    placeholder="Search deposits..."
                    value={depositSearchQuery}
                    onChange={(e) => setDepositSearchQuery(e.target.value)}
                    className="w-48"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deposits Table */}
          <Card>
            <CardHeader>
              <CardTitle>Deposits ({total})</CardTitle>
              <CardDescription>Track deposit transactions and status</CardDescription>
            </CardHeader>
            <CardContent>
              {deposits.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No deposits found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {deposits.map((deposit) => (
                    <div key={deposit.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium">User {deposit.userId}</p>
                          {getDepositStatusBadge(deposit.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatAmount(deposit.amount)} • {getPaymentMethodLabel(deposit.paymentMethod)} • {formatDateTime(deposit.createdAt)}
                        </p>
                        {(deposit as any).metadata?.reference && (
                          <p className="text-xs text-muted-foreground">
                            Ref: {(deposit as any).metadata.reference}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {total > limit && (
                    <div className="flex justify-center pt-4">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(Math.max(1, page - 1))}
                          disabled={page === 1}
                        >
                          Previous
                        </Button>
                        <span className="px-4 py-2 text-sm text-muted-foreground">
                          Page {page} of {Math.ceil(total / limit)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page + 1)}
                          disabled={page * limit >= total}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loading State */}
          {isLoading && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-2">
                        <div className="h-4 bg-muted animate-pulse rounded w-32" />
                        <div className="h-3 bg-muted animate-pulse rounded w-48" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'user-balances' && (
        <div className="space-y-6">
          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle>User Balance Search</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Label htmlFor="balance-search">Search:</Label>
                <Input
                  id="balance-search"
                  type="text"
                  placeholder="Search by user ID, email, or name..."
                  value={userBalanceSearchQuery}
                  onChange={(e) => setUserBalanceSearchQuery(e.target.value)}
                  className="w-96"
                />
              </div>
            </CardContent>
          </Card>

          {/* User Balances Table */}
          <Card>
            <CardHeader>
              <CardTitle>User Balances ({total})</CardTitle>
              <CardDescription>Monitor user wallet balances and transaction activity</CardDescription>
            </CardHeader>
            <CardContent>
              {userBalances.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No user balances found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userBalances.map((balance) => (
                    <div key={balance.userId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">User {balance.userId}</p>
                        <p className="text-sm text-muted-foreground">
                          Available: {formatAmount((balance as any).availableBalance)} • Pending: {formatAmount((balance as any).pendingBalance)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Total: {formatAmount((balance as any).totalBalance)} • Last updated: {formatDateTime((balance as any).updatedAt)}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {total > limit && (
                    <div className="flex justify-center pt-4">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(Math.max(1, page - 1))}
                          disabled={page === 1}
                        >
                          Previous
                        </Button>
                        <span className="px-4 py-2 text-sm text-muted-foreground">
                          Page {page} of {Math.ceil(total / limit)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page + 1)}
                          disabled={page * limit >= total}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loading State */}
          {isLoading && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-2">
                        <div className="h-4 bg-muted animate-pulse rounded w-32" />
                        <div className="h-3 bg-muted animate-pulse rounded w-48" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'platform-wallet' && (isSuperAdmin || hasPermission('view_platform_wallet')) ? (
        <div className="space-y-6">
          {/* Platform Wallet Header with Super Admin Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">Platform Wallet</h2>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                {isSuperAdmin ? 'Super Admin Access' : 'Finance Staff Access'}
              </Badge>
            </div>
          </div>

          {/* Platform Wallet Overview */}
          {platformWallet && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatAmount(platformWallet?.wallet?.availableBalance || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    Ready for withdrawal
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatAmount(platformWallet?.wallet?.pendingWithdrawal || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    In escrow or processing
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatAmount((platformWallet?.wallet?.availableBalance || 0) + (platformWallet?.wallet?.escrowBalance || 0))}</div>
                  <p className="text-xs text-muted-foreground">
                    Available + pending
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bank Accounts</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{platformBankAccounts.filter(acc => acc.isActive).length}</div>
                  <p className="text-xs text-muted-foreground">
                    Active accounts
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Withdraw Funds Button - More Prominent Position */}
          {platformWallet && platformBankAccounts.some(acc => acc.isActive && acc.isVerified) && (
            <div className="flex justify-center">
              <Button
                onClick={() => setWithdrawDialog(true)}
                size="lg"
                className="bg-green-600 hover:bg-green-700"
                disabled={(platformWallet?.wallet?.availableBalance || 0) <= 0}
              >
                <ArrowUpCircle className="h-5 w-5 mr-2" />
                Withdraw Funds {(platformWallet?.wallet?.availableBalance || 0) > 0 && `(${formatAmount(platformWallet?.wallet?.availableBalance || 0)})`}
              </Button>
            </div>
          )}

          {/* Bank Accounts Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Bank Accounts</CardTitle>
                  <CardDescription>Manage platform withdrawal accounts</CardDescription>
                </div>
                <Button onClick={() => setAddBankAccountDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Account
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {platformBankAccounts.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No bank accounts configured</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {platformBankAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium">{account.accountName}</p>
                          {(account as any).isDefault && <Badge variant="secondary">Default</Badge>}
                          {!(account as any).isActive && <Badge variant="outline">Inactive</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {account.bankName} • {account.accountNumber} • {account.currency}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {account.country} • {account.accountType}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditBankAccountDialog({ open: true, account })}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() => setDeleteBankAccountDialog({ open: true, account })}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Withdrawal History */}
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal History</CardTitle>
              <CardDescription>Track platform fund withdrawals</CardDescription>
            </CardHeader>
            <CardContent>
              {platformWithdrawals.length === 0 ? (
                <div className="text-center py-8">
                  <ArrowUpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No withdrawal history</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {platformWithdrawals.map((withdrawal) => (
                    <div key={withdrawal.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium">Withdrawal #{(withdrawal as any).id}</p>
                          <Badge variant={(withdrawal as any).status === 'completed' ? 'default' : (withdrawal as any).status === 'pending' ? 'secondary' : 'destructive'}>
                            {(withdrawal as any).status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatAmount((withdrawal as any).amount)} • {formatDateTime((withdrawal as any).createdAt || (withdrawal as any).created_at)}
                        </p>
                        {withdrawal.bankAccount && (
                          <p className="text-xs text-muted-foreground">
                            {withdrawal.bankAccount.accountName} • {withdrawal.bankAccount.accountNumber}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Load More Button */}
                  {withdrawalPagination.hasMore && (
                    <div className="flex justify-center pt-4">
                      <Button
                        variant="outline"
                        onClick={handleLoadMoreWithdrawals}
                        disabled={loadingMoreWithdrawals}
                      >
                        {loadingMoreWithdrawals ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Loading...
                          </>
                        ) : (
                          'Load More'
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="h-4 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-8 bg-muted animate-pulse rounded mb-2" />
                      <div className="h-3 bg-muted animate-pulse rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null }

      {/* Platform Wallet - Access Restricted */}
      {activeTab === 'platform-wallet' && !isSuperAdmin ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
            <p className="text-muted-foreground">Platform wallet access is restricted to super administrators only.</p>
          </div>
        </div>
      ) : null}

      {/* Payout Details Dialog */}
      <Dialog open={payoutDetailsDialog.open} onOpenChange={(open) => setPayoutDetailsDialog({ open, payout: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payout Details</DialogTitle>
            <DialogDescription>Detailed information about this payout request</DialogDescription>
          </DialogHeader>
          {payoutDetailsDialog.payout && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Amount</Label>
                  <p className="text-sm font-medium">{formatAmount((payoutDetailsDialog.payout as any).amount)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(payoutDetailsDialog.payout.status)}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">User ID</Label>
                  <p className="text-sm font-medium">{(payoutDetailsDialog.payout as any).userId || (payoutDetailsDialog.payout as any).user_id}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Created</Label>
                  <p className="text-sm font-medium">{formatDateTime((payoutDetailsDialog.payout as any).createdAt || (payoutDetailsDialog.payout as any).created_at)}</p>
                </div>
              </div>
              {(payoutDetailsDialog.payout as any).metadata?.bankAccount && (
                <div>
                  <Label className="text-xs text-muted-foreground">Bank Account</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    <p className="text-sm">{(payoutDetailsDialog.payout as any).metadata.bankAccount.accountName}</p>
                    <p className="text-sm text-muted-foreground">
                      {(payoutDetailsDialog.payout as any).metadata.bankAccount.bankName} • {(payoutDetailsDialog.payout as any).metadata.bankAccount.accountNumber}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Process Payout Dialog */}
      <Dialog open={processPayoutDialog.open} onOpenChange={(open) => setProcessPayoutDialog({ open, payout: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Process Payout</DialogTitle>
            <DialogDescription>Confirm payout processing for this request</DialogDescription>
          </DialogHeader>
          {processPayoutDialog.payout && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm font-medium">Amount: {formatAmount((processPayoutDialog.payout as any).amount)}</p>
                <p className="text-sm text-muted-foreground">User: {(processPayoutDialog.payout as any).userId || (processPayoutDialog.payout as any).user_id}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                This action will mark the payout as completed and initiate the transfer to the user's bank account.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessPayoutDialog({ open: false, payout: null })}>
              Cancel
            </Button>
            <Button onClick={handleProcessPayout} disabled={!!isActionLoading}>
              {isActionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                'Process Payout'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Bank Account Dialog */}
      <Dialog open={addBankAccountDialog} onOpenChange={setAddBankAccountDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Bank Account</DialogTitle>
            <DialogDescription>Add a new bank account for platform withdrawals</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="account-name">Account Name</Label>
              <Input
                id="account-name"
                value={bankAccountForm.accountName}
                onChange={(e) => setBankAccountForm(prev => ({ ...prev, accountName: e.target.value }))}
                placeholder="Enter account name"
              />
            </div>
            <div>
              <Label htmlFor="bank-name">Bank Name</Label>
              <Input
                id="bank-name"
                value={bankAccountForm.bankName}
                onChange={(e) => setBankAccountForm(prev => ({ ...prev, bankName: e.target.value }))}
                placeholder="Enter bank name"
              />
            </div>
            <div>
              <Label htmlFor="bank-code">Bank Code</Label>
              <Input
                id="bank-code"
                value={bankAccountForm.bankCode}
                onChange={(e) => setBankAccountForm(prev => ({ ...prev, bankCode: e.target.value }))}
                placeholder="Enter bank code"
              />
            </div>
            <div>
              <Label htmlFor="account-number">Account Number</Label>
              <Input
                id="account-number"
                value={bankAccountForm.accountNumber}
                onChange={(e) => setBankAccountForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                placeholder="Enter account number"
              />
            </div>
            <div>
              <Label htmlFor="account-type">Account Type</Label>
              <select
                id="account-type"
                value={bankAccountForm.accountType}
                onChange={(e) => setBankAccountForm(prev => ({ ...prev, accountType: e.target.value as 'checking' | 'savings' }))}
                className="w-full border border-input bg-background px-3 py-2 rounded-md text-sm"
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
              </select>
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={bankAccountForm.currency}
                onChange={(e) => setBankAccountForm(prev => ({ ...prev, currency: e.target.value }))}
                placeholder="USD"
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={bankAccountForm.country}
                onChange={(e) => setBankAccountForm(prev => ({ ...prev, country: e.target.value }))}
                placeholder="US"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is-default"
                checked={!!bankAccountForm.isDefault}
                onChange={(e) => setBankAccountForm(prev => ({ ...prev, isDefault: e.target.checked }))}
              />
              <Label htmlFor="is-default">Set as default account</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddBankAccountDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddBankAccount} disabled={!!isActionLoading}>
              {isActionLoading === 'add-bank' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                'Add Account'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Bank Account Dialog */}
      <Dialog open={editBankAccountDialog.open} onOpenChange={(open) => setEditBankAccountDialog({ open, account: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Bank Account</DialogTitle>
            <DialogDescription>Update bank account information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-account-name">Account Name</Label>
              <Input
                id="edit-account-name"
                value={bankAccountForm.accountName}
                onChange={(e) => setBankAccountForm(prev => ({ ...prev, accountName: e.target.value }))}
                placeholder="Enter account name"
              />
            </div>
            <div>
              <Label htmlFor="edit-bank-name">Bank Name</Label>
              <Input
                id="edit-bank-name"
                value={bankAccountForm.bankName}
                onChange={(e) => setBankAccountForm(prev => ({ ...prev, bankName: e.target.value }))}
                placeholder="Enter bank name"
              />
            </div>
            <div>
              <Label htmlFor="edit-bank-code">Bank Code</Label>
              <Input
                id="edit-bank-code"
                value={bankAccountForm.bankCode}
                onChange={(e) => setBankAccountForm(prev => ({ ...prev, bankCode: e.target.value }))}
                placeholder="Enter bank code"
              />
            </div>
            <div>
              <Label htmlFor="edit-account-number">Account Number</Label>
              <Input
                id="edit-account-number"
                value={bankAccountForm.accountNumber}
                onChange={(e) => setBankAccountForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                placeholder="Enter account number"
              />
            </div>
            <div>
              <Label htmlFor="edit-account-type">Account Type</Label>
              <select
                id="edit-account-type"
                value={bankAccountForm.accountType}
                onChange={(e) => setBankAccountForm(prev => ({ ...prev, accountType: e.target.value as 'checking' | 'savings' }))}
                className="w-full border border-input bg-background px-3 py-2 rounded-md text-sm"
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
              </select>
            </div>
            <div>
              <Label htmlFor="edit-currency">Currency</Label>
              <Input
                id="edit-currency"
                value={bankAccountForm.currency}
                onChange={(e) => setBankAccountForm(prev => ({ ...prev, currency: e.target.value }))}
                placeholder="USD"
              />
            </div>
            <div>
              <Label htmlFor="edit-country">Country</Label>
              <Input
                id="edit-country"
                value={bankAccountForm.country}
                onChange={(e) => setBankAccountForm(prev => ({ ...prev, country: e.target.value }))}
                placeholder="US"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-is-default"
                checked={!!bankAccountForm.isDefault}
                onChange={(e) => setBankAccountForm(prev => ({ ...prev, isDefault: e.target.checked }))}
              />
              <Label htmlFor="edit-is-default">Set as default account</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBankAccountDialog({ open: false, account: null })}>
              Cancel
            </Button>
            <Button onClick={handleUpdateBankAccount} disabled={!!isActionLoading}>
              {isActionLoading && typeof isActionLoading === 'string' && isActionLoading.startsWith('edit-') ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                'Update Account'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Bank Account Dialog */}
      <Dialog open={deleteBankAccountDialog.open} onOpenChange={(open) => setDeleteBankAccountDialog({ open, account: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Bank Account</DialogTitle>
            <DialogDescription>Are you sure you want to delete this bank account?</DialogDescription>
          </DialogHeader>
          {deleteBankAccountDialog.account && (
            <div className="p-4 bg-muted rounded-md">
              <p className="text-sm font-medium">{deleteBankAccountDialog.account.accountName}</p>
              <p className="text-sm text-muted-foreground">
                {deleteBankAccountDialog.account.bankName} • {deleteBankAccountDialog.account.accountNumber}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteBankAccountDialog({ open: false, account: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteBankAccount} disabled={!!isActionLoading}>
              {isActionLoading && typeof isActionLoading === 'string' && isActionLoading.startsWith('delete-') ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Account'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw Funds Dialog */}
      <Dialog open={withdrawDialog} onOpenChange={setWithdrawDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>Create a withdrawal request from platform wallet</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="withdraw-amount">Amount (Freti)</Label>
              <Input
                id="withdraw-amount"
                type="number"
                value={withdrawForm.fretiAmount}
                onChange={(e) => setWithdrawForm(prev => ({ ...prev, fretiAmount: parseFloat(e.target.value) || 0 }))}
                placeholder="Enter amount"
                min="0"
                step="0.01"
              />
              {platformWallet && (
                <p className="text-xs text-muted-foreground mt-1">
                  Available: {formatAmount(platformWallet?.wallet?.availableBalance || 0)}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="withdraw-bank-account">Bank Account</Label>
              <select
                id="withdraw-bank-account"
                value={withdrawForm.bankAccountId}
                onChange={(e) => setWithdrawForm(prev => ({ ...prev, bankAccountId: e.target.value }))}
                className="w-full border border-input bg-background px-3 py-2 rounded-md text-sm"
              >
                <option value="">Select bank account</option>
                {platformBankAccounts.filter(acc => acc.isActive && acc.isVerified).map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.accountName} • {account.accountNumber} ({account.currency})
                  </option>
                ))}
              </select>
              {platformBankAccounts.filter(acc => acc.isActive && acc.isVerified).length === 0 && (
                <p className="text-xs text-destructive mt-1">
                  No verified bank accounts available. Please add a bank account first.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleWithdraw}
              disabled={
                isActionLoading === 'withdraw' ||
                !withdrawForm.bankAccountId ||
                withdrawForm.fretiAmount <= 0 ||
                (platformWallet && withdrawForm.fretiAmount > (platformWallet?.wallet?.availableBalance || 0)) ||
                platformBankAccounts.filter(acc => acc.isActive && acc.isVerified).length === 0
              }
            >
              {isActionLoading === 'withdraw' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Withdrawal Request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Revenue Summary Tab */}
      {activeTab === 'enhanced-revenue' && enhancedRevenueSummary && (
        <div className="space-y-6">
          {/* Enhanced Revenue Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatAmount(enhancedRevenueSummary.revenue.totalDeposits)}</div>
                <p className="text-xs text-muted-foreground">
                  Total deposits in period
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatAmount(enhancedRevenueSummary.revenue.netRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  Revenue after deductions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <span className={enhancedRevenueSummary.transactions.successRate >= 95 ? 'text-green-600' : enhancedRevenueSummary.transactions.successRate >= 85 ? 'text-yellow-600' : 'text-red-600'}>
                    {enhancedRevenueSummary.transactions.successRate.toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Transaction success rate
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{enhancedRevenueSummary.users.activeUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Users with activity
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>Detailed revenue analysis by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="text-sm font-medium mb-4">Deposits</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total</span>
                        <span className="text-sm font-medium">{formatAmount(enhancedRevenueSummary.revenue.totalDeposits)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Withdrawals</span>
                        <span className="text-sm font-medium">{formatAmount(enhancedRevenueSummary.revenue.totalWithdrawals)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Net Revenue</span>
                        <span className="text-sm font-medium text-green-600">{formatAmount(enhancedRevenueSummary.revenue.netRevenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Fees</span>
                        <span className="text-sm font-medium text-yellow-600">{formatAmount(enhancedRevenueSummary.revenue.fees)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-4">Withdrawals</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Deposits</span>
                        <span className="text-sm font-medium">{formatAmount(enhancedRevenueSummary.transactions.totalDeposits)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Withdrawals</span>
                        <span className="text-sm font-medium">{formatAmount(enhancedRevenueSummary.transactions.totalWithdrawals)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Success Rate</span>
                        <span className="text-sm font-medium text-green-600">{enhancedRevenueSummary.transactions.successRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-4">Fees</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Platform Fees</span>
                        <span className="text-sm font-medium">{formatAmount(enhancedRevenueSummary.revenue.fees)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Net Fees</span>
                        <span className="text-sm font-medium">{formatAmount(enhancedRevenueSummary.revenue.netFees)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-sm font-medium">Total Fees</span>
                        <span className="text-sm font-bold">{formatAmount(enhancedRevenueSummary.revenue.fees)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>User Metrics</CardTitle>
              <CardDescription>User activity and engagement analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-2">Active Users</h4>
                  <div className="text-2xl font-bold">{enhancedRevenueSummary.users.activeUsers.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">
                    Active users in period
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">New Users</h4>
                  <div className="text-2xl font-bold">{enhancedRevenueSummary.users.newUsers.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">
                    Joined in this period
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Retention Rate</h4>
                  <div className="text-2xl font-bold">
                    <span className={enhancedRevenueSummary.users.retentionRate >= 70 ? 'text-green-600' : enhancedRevenueSummary.users.retentionRate >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                      {enhancedRevenueSummary.users.retentionRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    User retention
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Growth Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Growth Metrics</CardTitle>
              <CardDescription>Period-over-period growth analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-2">Monthly Growth</h4>
                  <div className="text-2xl font-bold">
                    <span className={enhancedRevenueSummary.growth.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {enhancedRevenueSummary.growth.monthlyGrowth >= 0 ? '+' : ''}{enhancedRevenueSummary.growth.monthlyGrowth.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    vs previous period
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">User Growth</h4>
                  <div className="text-2xl font-bold">
                    <span className={enhancedRevenueSummary.growth.userGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {enhancedRevenueSummary.growth.userGrowth >= 0 ? '+' : ''}{enhancedRevenueSummary.growth.userGrowth.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    vs previous period
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Transaction Growth</h4>
                  <div className="text-2xl font-bold">
                    <span className={enhancedRevenueSummary.growth.transactionGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {enhancedRevenueSummary.growth.transactionGrowth >= 0 ? '+' : ''}{enhancedRevenueSummary.growth.transactionGrowth.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    vs previous period
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gift Wallet Tab */}
      {activeTab === 'gift-wallet' && (
        <div className="space-y-6">
          {/* Gift Wallet Stats */}
          {giftStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Platform Gift Wallet</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatAmount(giftStats.platformGiftWalletBalance)}</div>
                  <p className="text-xs text-muted-foreground">Available balance</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Gift Value</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatAmount(giftStats.totalGiftValue)}</div>
                  <p className="text-xs text-muted-foreground">In circulation</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Gifts</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{giftStats.totalGiftsInCirculation.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Gifts in circulation</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Users with Gifts</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{giftStats.totalUsersWithGifts.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Active gift holders</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Top Gifts */}
          {giftStats && giftStats.topGifts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Gifts by Quantity</CardTitle>
                <CardDescription>Most popular gifts in circulation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {giftStats.topGifts.map((gift, index) => (
                    <div key={gift.gift_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{gift.emoji}</span>
                        <div>
                          <p className="font-medium">{gift.gift_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {gift.total_quantity.toLocaleString()} gifts • {formatAmount(gift.total_value)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">#{index + 1}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* User Gift Holdings */}
          <Card>
            <CardHeader>
              <CardTitle>User Gift Holdings</CardTitle>
              <CardDescription>View gift collections by user</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by user ID..."
                    value={giftHoldingsSearchQuery}
                    onChange={(e) => {
                      setGiftHoldingsSearchQuery(e.target.value);
                      setGiftHoldingsPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Holdings Table */}
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : userGiftHoldings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No gift holdings found
                </div>
              ) : (
                <div className="space-y-4">
                  {userGiftHoldings.map((holding) => (
                    <Card key={holding.user_id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium">User ID: {holding.user_id}</p>
                            <p className="text-sm text-muted-foreground">
                              {holding.total_gifts.toLocaleString()} gifts • {formatAmount(holding.total_value)} total value
                            </p>
                          </div>
                          <Badge variant="secondary">{formatAmount(holding.total_value)}</Badge>
                        </div>
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium mb-2">Gift Breakdown:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {holding.gift_breakdown.map((gift) => (
                              <div key={gift.gift_id} className="flex items-center gap-2 p-2 bg-muted rounded">
                                <span className="text-lg">{gift.emoji}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{gift.gift_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {gift.quantity}x • {formatAmount(gift.value)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {giftHoldingsTotal > limit && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {((giftHoldingsPage - 1) * limit) + 1} to {Math.min(giftHoldingsPage * limit, giftHoldingsTotal)} of {giftHoldingsTotal} users
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setGiftHoldingsPage(prev => Math.max(1, prev - 1))}
                      disabled={giftHoldingsPage === 1 || isLoading}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setGiftHoldingsPage(prev => prev + 1)}
                      disabled={giftHoldingsPage * limit >= giftHoldingsTotal || isLoading}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gift Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gift Catalogue Management</CardTitle>
                  <CardDescription>Create, edit, and manage virtual gifts</CardDescription>
                </div>
                <Button onClick={openCreateGiftDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Gift
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {allGifts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No gifts found. Create your first gift!
                </div>
              ) : (
                <div className="space-y-2">
                  {allGifts.map((gift) => (
                    <div key={gift.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{gift.emoji}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{gift.name}</p>
                            {!gift.is_active && (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Credit Value: {formatAmount(gift.credit_value)} • Sort Order: {gift.sort_order}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditGiftDialog(gift)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteGiftDialog({ open: true, gift })}
                          disabled={isActionLoading === `delete-gift-${gift.id}`}
                        >
                          {isActionLoading === `delete-gift-${gift.id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gift Management Dialog */}
      <Dialog open={giftManagementDialog.open} onOpenChange={(open) => setGiftManagementDialog({ ...giftManagementDialog, open })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{giftManagementDialog.mode === 'create' ? 'Create New Gift' : 'Edit Gift'}</DialogTitle>
            <DialogDescription>
              {giftManagementDialog.mode === 'create' 
                ? 'Add a new virtual gift to the marketplace'
                : 'Update gift details'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="gift-name">Name</Label>
              <Input
                id="gift-name"
                value={giftForm.name}
                onChange={(e) => setGiftForm({ ...giftForm, name: e.target.value })}
                placeholder="e.g., Heart, Fire, Applause"
              />
            </div>
            <div>
              <Label htmlFor="gift-emoji">Emoji</Label>
              <Input
                id="gift-emoji"
                value={giftForm.emoji}
                onChange={(e) => setGiftForm({ ...giftForm, emoji: e.target.value })}
                placeholder="e.g., ❤️, 🔥, 👏"
                maxLength={10}
              />
            </div>
            <div>
              <Label htmlFor="gift-credit-value">Credit Value</Label>
              <Input
                id="gift-credit-value"
                type="number"
                min="1"
                value={giftForm.credit_value}
                onChange={(e) => setGiftForm({ ...giftForm, credit_value: parseInt(e.target.value) || 0 })}
                placeholder="e.g., 10"
              />
            </div>
            <div>
              <Label htmlFor="gift-sort-order">Sort Order</Label>
              <Input
                id="gift-sort-order"
                type="number"
                value={giftForm.sort_order}
                onChange={(e) => setGiftForm({ ...giftForm, sort_order: parseInt(e.target.value) || 0 })}
                placeholder="e.g., 0"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="gift-active"
                checked={giftForm.is_active}
                onChange={(e) => setGiftForm({ ...giftForm, is_active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="gift-active">Active (visible in marketplace)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGiftManagementDialog({ open: false, gift: null, mode: 'create' })}
            >
              Cancel
            </Button>
            <Button
              onClick={giftManagementDialog.mode === 'create' ? handleCreateGift : handleUpdateGift}
              disabled={!giftForm.name || !giftForm.emoji || giftForm.credit_value <= 0 || isActionLoading !== null}
            >
              {isActionLoading && (isActionLoading === 'create-gift' || isActionLoading.startsWith('update-gift-')) ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {giftManagementDialog.mode === 'create' ? 'Create Gift' : 'Update Gift'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Gift Confirmation Dialog */}
      <Dialog open={deleteGiftDialog.open} onOpenChange={(open) => setDeleteGiftDialog({ ...deleteGiftDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Gift</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteGiftDialog.gift?.name}"? This action cannot be undone.
              {deleteGiftDialog.gift && (
                <span className="block mt-2 text-sm text-muted-foreground">
                  Note: If users still own this gift, deletion will fail. Consider deactivating it instead.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteGiftDialog({ open: false, gift: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteGift}
              disabled={isActionLoading !== null && isActionLoading.startsWith('delete-gift-')}
            >
              {isActionLoading && isActionLoading.startsWith('delete-gift-') ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinancePage;