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
import { financeAPI, type RevenueStats, type EscrowHealth, type Payout, type Deposit, type TotalPlatformFunds, type UserBalance, type PlatformWallet, type BankAccount, type CreateBankAccountDto, type UpdateBankAccountDto, type WithdrawRequestDto, type PlatformWithdrawal, type GiftStats, type UserGiftHolding, type VirtualGift, type CreateGiftDto, type UpdateGiftDto, type Sound, type RegionalRevenueResponse, type ProviderPerformanceResponse, type TransactionPatternsResponse, type EnhancedRevenueSummary, type Bank, type AccountPreview, type FeeRate, type FeeRateHistoryEntry, PERCENTAGE_FEE_TYPES } from '@/lib/api/finance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Clock, AlertTriangle, Wallet, CreditCard, BarChart3, Calendar, Loader2, Eye, MoreVertical, Search, ArrowDownCircle, Building2, Plus, Edit, Trash2, ArrowUpCircle, Users, MapPin, CheckCircle, Upload, Volume2 } from 'lucide-react';
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

const SUPPORTED_BANK_COUNTRIES = [
  { code: 'NG', name: 'Nigeria', currency: 'NGN' },
  { code: 'GH', name: 'Ghana', currency: 'GHS' },
  { code: 'KE', name: 'Kenya', currency: 'KES' },
  { code: 'UG', name: 'Uganda', currency: 'UGX' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR' },
  { code: 'RW', name: 'Rwanda', currency: 'RWF' },
  { code: 'ZM', name: 'Zambia', currency: 'ZMW' },
  { code: 'MW', name: 'Malawi', currency: 'MWK' },
  { code: 'BW', name: 'Botswana', currency: 'BWP' },
  { code: 'MZ', name: 'Mozambique', currency: 'MZN' },
] as const;

const getDefaultAddBankAccountForm = (): CreateBankAccountDto => ({
  accountName: '',
  bankName: '',
  bankCode: '',
  accountNumber: '',
  accountType: 'savings',
  currency: 'NGN',
  country: 'NG',
  isDefault: false,
});

const FinancePage = () => {
  const { isSuperAdmin, hasPermission } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'revenue' | 'escrow' | 'payouts' | 'deposits' | 'user-balances' | 'platform-wallet' | 'gift-wallet' | 'regional-revenue' | 'provider-performance' | 'transaction-patterns' | 'enhanced-revenue' | 'fee-rates'>('revenue');
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
  const [addBankAccountForm, setAddBankAccountForm] = useState<CreateBankAccountDto>(getDefaultAddBankAccountForm());
  const [platformBanks, setPlatformBanks] = useState<Bank[]>([]);
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [verifiedPlatformAccount, setVerifiedPlatformAccount] = useState<AccountPreview | null>(null);
  const [bankVerificationError, setBankVerificationError] = useState('');
  const [isBankLookupLoading, setIsBankLookupLoading] = useState(false);
  const [isBankVerificationLoading, setIsBankVerificationLoading] = useState(false);
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
  const [allSounds, setAllSounds] = useState<Sound[]>([]);
  const [soundsLoading, setSoundsLoading] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState<'lottie' | 'sound' | null>(null);
  const [effectUploading, setEffectUploading] = useState<'single' | number | null>(null);
  const [giftManagementDialog, setGiftManagementDialog] = useState<{ open: boolean; gift: VirtualGift | null; mode: 'create' | 'edit' }>({ open: false, gift: null, mode: 'create' });
  const [deleteGiftDialog, setDeleteGiftDialog] = useState<{ open: boolean; gift: VirtualGift | null }>({ open: false, gift: null });
  const [giftForm, setGiftForm] = useState<CreateGiftDto>({
    name: '',
    emoji: '',
    credit_value: 0,
    sort_order: 0,
    is_active: true,
    display_lottie_url: '',
    lottie_config: '',
    sound_id: '',
    animation_type: 'lottie_single',
  });

  // Enhanced Analytics States
  const [regionalRevenue, setRegionalRevenue] = useState<RegionalRevenueResponse | null>(null);
  const [providerPerformance, setProviderPerformance] = useState<ProviderPerformanceResponse | null>(null);
  const [transactionPatterns, setTransactionPatterns] = useState<TransactionPatternsResponse | null>(null);
  const [enhancedRevenueSummary, setEnhancedRevenueSummary] = useState<EnhancedRevenueSummary | null>(null);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  // Platform fee rate states
  const [feeRates, setFeeRates] = useState<FeeRate[]>([]);
  const [feeRateHistory, setFeeRateHistory] = useState<FeeRateHistoryEntry[]>([]);
  const [feeRatesLoading, setFeeRatesLoading] = useState(false);
  const [feeRateDialog, setFeeRateDialog] = useState<{ open: boolean; rate: FeeRate | null; newValue: string; reason: string; effectiveAt: string }>({ open: false, rate: null, newValue: '', reason: '', effectiveAt: '' });
  const [cancelRateDialog, setCancelRateDialog] = useState<{ open: boolean; rate: FeeRate | null; reason: string }>({ open: false, rate: null, reason: '' });
  const [feeRateSaving, setFeeRateSaving] = useState(false);

  const canViewFinance = isSuperAdmin || hasPermission('view_revenue');
  const canManageFees = isSuperAdmin || hasPermission('manage_platform_fees');
  const filteredPlatformBanks = platformBanks.filter((bank) => bank.name.toLowerCase().includes(bankSearchQuery.toLowerCase()));

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
        fetchSounds();
      } else if (activeTab === 'regional-revenue') {
        fetchRegionalRevenue();
      } else if (activeTab === 'provider-performance') {
        fetchProviderPerformance();
      } else if (activeTab === 'transaction-patterns') {
        fetchTransactionPatterns();
      } else if (activeTab === 'enhanced-revenue') {
        fetchEnhancedRevenueSummary();
      } else if (activeTab === 'fee-rates') {
        fetchFeeRates();
        fetchFeeRateHistory();
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

  const resetAddBankAccountState = () => {
    setAddBankAccountForm(getDefaultAddBankAccountForm());
    setPlatformBanks([]);
    setBankSearchQuery('');
    setVerifiedPlatformAccount(null);
    setBankVerificationError('');
    setIsBankLookupLoading(false);
    setIsBankVerificationLoading(false);
  };

  const fetchPlatformBanks = async (countryCode: string) => {
    try {
      setIsBankLookupLoading(true);
      const banks = await financeAPI.getPlatformBanks(countryCode);
      setPlatformBanks(banks);
    } catch (err: any) {
      setPlatformBanks([]);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load banks for the selected country',
        variant: 'destructive',
      });
    } finally {
      setIsBankLookupLoading(false);
    }
  };

  const handleAddBankAccountDialogChange = (open: boolean) => {
    setAddBankAccountDialog(open);

    if (open) {
      void fetchPlatformBanks(addBankAccountForm.country || 'NG');
      return;
    }

    resetAddBankAccountState();
  };

  const handleAddBankCountryChange = (countryCode: string) => {
    const selectedCountry = SUPPORTED_BANK_COUNTRIES.find((country) => country.code === countryCode);

    setAddBankAccountForm((prev) => ({
      ...prev,
      country: countryCode,
      currency: selectedCountry?.currency || prev.currency,
      bankName: '',
      bankCode: '',
      accountName: '',
    }));
    setBankSearchQuery('');
    setVerifiedPlatformAccount(null);
    setBankVerificationError('');
    void fetchPlatformBanks(countryCode);
  };

  const handleAddBankSelection = (bankCode: string) => {
    const selectedBank = platformBanks.find((bank) => bank.code === bankCode);

    setAddBankAccountForm((prev) => ({
      ...prev,
      bankCode,
      bankName: selectedBank?.name || '',
      accountName: '',
    }));
    setVerifiedPlatformAccount(null);
    setBankVerificationError('');
  };

  const handleAddBankAccountNumberChange = (value: string) => {
    const accountNumber = value.replace(/\D/g, '').slice(0, 20);

    setAddBankAccountForm((prev) => ({
      ...prev,
      accountNumber,
      accountName: '',
    }));
    setVerifiedPlatformAccount(null);
    setBankVerificationError('');
  };

  const handleVerifyPlatformBankAccount = async () => {
    if (!addBankAccountForm.accountNumber?.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an account number',
        variant: 'destructive',
      });
      return;
    }

    if (!addBankAccountForm.bankCode) {
      toast({
        title: 'Error',
        description: 'Please select a bank',
        variant: 'destructive',
      });
      return;
    }

    if (addBankAccountForm.accountNumber.trim().length < 10) {
      toast({
        title: 'Error',
        description: 'Account number must be at least 10 digits',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsBankVerificationLoading(true);
      setBankVerificationError('');
      setVerifiedPlatformAccount(null);
      const preview = await financeAPI.previewPlatformBankAccount({
        accountNumber: addBankAccountForm.accountNumber.trim(),
        bankCode: addBankAccountForm.bankCode,
      });

      setVerifiedPlatformAccount(preview);
      setAddBankAccountForm((prev) => ({
        ...prev,
        accountName: preview.accountName,
      }));
    } catch (err: any) {
      const message = err.response?.data?.message || 'Could not verify account. Please check your details.';
      setBankVerificationError(message);
      toast({
        title: 'Verification Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsBankVerificationLoading(false);
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
    if (!addBankAccountForm.accountName?.trim()) {
      toast({
        title: 'Error',
        description: 'Please verify the account or enter an account name manually',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsActionLoading('add-bank');
      await financeAPI.addPlatformBankAccount({
        ...addBankAccountForm,
        accountName: addBankAccountForm.accountName.trim(),
        accountNumber: addBankAccountForm.accountNumber.trim(),
      });
      setAddBankAccountDialog(false);
      resetAddBankAccountState();
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

  const fetchSounds = async () => {
    try {
      setSoundsLoading(true);
      const sounds = await financeAPI.getSounds('gift');
      setAllSounds(sounds);
    } catch (err: any) {
      console.error('Failed to fetch sounds:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load sounds',
        variant: 'destructive',
      });
    } finally {
      setSoundsLoading(false);
    }
  };

  const handleUploadLottie = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingAsset('lottie');
      const { url } = await financeAPI.uploadGiftAsset(file, 'lottie');
      setGiftForm((prev) => ({ ...prev, display_lottie_url: url }));
      toast({ title: 'Success', description: 'Lottie uploaded successfully' });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to upload lottie',
        variant: 'destructive',
      });
    } finally {
      setUploadingAsset(null);
    }
  };

  const getLottieConfigObject = (): { lottieUrl?: string; steps?: { lottieUrl: string; delayMs: number }[] } | null => {
    if (!giftForm.lottie_config) return null;
    try {
      return JSON.parse(giftForm.lottie_config as any);
    } catch {
      return null;
    }
  };

  const setLottieConfigObject = (obj: { lottieUrl?: string; steps?: { lottieUrl: string; delayMs: number }[] } | null) => {
    if (!obj || (!obj.lottieUrl && (!obj.steps || obj.steps.length === 0))) {
      setGiftForm((prev) => ({ ...prev, lottie_config: '' as any }));
      return;
    }
    const isSingle = giftForm.animation_type === 'lottie_single';
    if (isSingle && obj.steps && obj.steps.length === 1) {
      const lottieUrl = obj.steps[0].lottieUrl;
      setGiftForm((prev) => ({ ...prev, lottie_config: JSON.stringify({ lottieUrl }, null, 2) as any }));
    } else if (obj.lottieUrl && (!obj.steps || obj.steps.length === 0)) {
      setGiftForm((prev) => ({ ...prev, lottie_config: JSON.stringify({ lottieUrl: obj.lottieUrl }, null, 2) as any }));
    } else {
      setGiftForm((prev) => ({ ...prev, lottie_config: JSON.stringify({ steps: obj.steps }, null, 2) as any }));
    }
  };

  const getEffectSteps = () => {
    const obj = getLottieConfigObject();
    if (obj?.lottieUrl) return [{ lottieUrl: obj.lottieUrl, delayMs: 0 }];
    if (obj?.steps) return obj.steps;
    return [];
  };

  const handleUploadEffectSingle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setEffectUploading('single');
      const { url } = await financeAPI.uploadGiftAsset(file, 'lottie');
      setLottieConfigObject({ lottieUrl: url });
      toast({ title: 'Success', description: 'Effect lottie uploaded' });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to upload lottie',
        variant: 'destructive',
      });
    } finally {
      setEffectUploading(null);
      e.target.value = '';
    }
  };

  const handleUploadEffectStep = (index: number) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setEffectUploading(index);
      const { url } = await financeAPI.uploadGiftAsset(file, 'lottie');
      const steps = getEffectSteps().length ? getEffectSteps() : [];
      steps[index] = { ...steps[index], lottieUrl: url };
      setLottieConfigObject({ steps });
      toast({ title: 'Success', description: `Step ${index + 1} lottie uploaded` });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to upload lottie',
        variant: 'destructive',
      });
    } finally {
      setEffectUploading(null);
      e.target.value = '';
    }
  };

  const updateStep = (index: number, field: 'lottieUrl' | 'delayMs', value: string) => {
    const steps = [...getEffectSteps()];
    if (!steps[index]) steps[index] = { lottieUrl: '', delayMs: 0 };
    steps[index] = { ...steps[index], [field]: field === 'delayMs' ? parseInt(value) || 0 : value };
    setLottieConfigObject({ steps });
  };

  const addStep = () => {
    const steps = [...getEffectSteps()];
    const defaultDelay = giftForm.animation_type === 'lottie_overlap' ? 0 : 0;
    steps.push({ lottieUrl: '', delayMs: defaultDelay });
    setLottieConfigObject({ steps });
  };

  const removeStep = (index: number) => {
    const steps = getEffectSteps().filter((_, i) => i !== index);
    setLottieConfigObject({ steps });
  };

  const handleUploadLottieConfigJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        JSON.parse(text);
        setGiftForm((prev) => ({ ...prev, lottie_config: text as any }));
        toast({ title: 'Success', description: 'Lottie config JSON loaded' });
      } catch {
        toast({ title: 'Error', description: 'Invalid JSON file', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDownloadLottieConfig = () => {
    const text = (giftForm.lottie_config as any) || '{}';
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gift-lottie-config-${giftForm.name || 'untitled'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadSound = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingAsset('sound');
      const { url } = await financeAPI.uploadGiftAsset(file, 'sound');
      await financeAPI.createSound({
        name: file.name.replace(/\.[^/.]+$/, ''),
        sound_url: url,
      });
      toast({ title: 'Success', description: 'Sound uploaded and saved' });
      await fetchSounds();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to upload sound',
        variant: 'destructive',
      });
    } finally {
      setUploadingAsset(null);
    }
  };

  const buildGiftPayload = (): CreateGiftDto | null => {
    let lottieConfig: any = undefined;
    if (giftForm.lottie_config && (giftForm.lottie_config as any).trim?.()) {
      try {
        lottieConfig = JSON.parse(giftForm.lottie_config as any);
      } catch {
        toast({
          title: 'Error',
          description: 'Lottie config is not valid JSON',
          variant: 'destructive',
        });
        return null;
      }
    }
    const payload: any = { ...giftForm, lottie_config: lottieConfig };
    if (!payload.sound_id) delete payload.sound_id;
    if (!payload.display_lottie_url) delete payload.display_lottie_url;
    if (lottieConfig === undefined) delete payload.lottie_config;
    return payload as CreateGiftDto;
  };

  const handleCreateGift = async () => {
    const payload = buildGiftPayload();
    if (!payload) return;
    try {
      setIsActionLoading('create-gift');
      await financeAPI.createGift(payload);
      toast({
        title: 'Success',
        description: 'Gift created successfully',
      });
      setGiftManagementDialog({ open: false, gift: null, mode: 'create' });
      setGiftForm({
        name: '',
        emoji: '',
        credit_value: 0,
        sort_order: 0,
        is_active: true,
        display_lottie_url: '',
        lottie_config: '',
        sound_id: '',
        animation_type: 'lottie_single',
      });
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
    const payload = buildGiftPayload();
    if (!payload) return;
    try {
      setIsActionLoading(`update-gift-${giftManagementDialog.gift.id}`);
      await financeAPI.updateGift(giftManagementDialog.gift.id, payload as any);
      toast({
        title: 'Success',
        description: 'Gift updated successfully',
      });
      setGiftManagementDialog({ open: false, gift: null, mode: 'create' });
      setGiftForm({
        name: '',
        emoji: '',
        credit_value: 0,
        sort_order: 0,
        is_active: true,
        display_lottie_url: '',
        lottie_config: '',
        sound_id: '',
        animation_type: 'lottie_single',
      });
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
    setGiftForm({
      name: '',
      emoji: '',
      credit_value: 0,
      sort_order: 0,
      is_active: true,
      display_lottie_url: '',
      lottie_config: '',
      sound_id: '',
      animation_type: 'lottie_single',
    });
    setGiftManagementDialog({ open: true, gift: null, mode: 'create' });
  };

  const openEditGiftDialog = (gift: VirtualGift) => {
    setGiftForm({
      name: gift.name,
      emoji: gift.emoji,
      credit_value: gift.credit_value,
      sort_order: gift.sort_order,
      is_active: gift.is_active,
      display_lottie_url: gift.display_lottie_url || '',
      lottie_config: gift.lottie_config ? JSON.stringify(gift.lottie_config, null, 2) : '',
      sound_id: gift.sound_id || '',
      animation_type: gift.animation_type || 'lottie_single',
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

  const fetchFeeRates = async () => {
    try {
      setFeeRatesLoading(true);
      setError(null);
      const data = await financeAPI.getFeeRates();
      setFeeRates(data);
    } catch (err: any) {
      console.error('Failed to fetch fee rates:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load platform fee rates';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setFeeRatesLoading(false);
    }
  };

  const fetchFeeRateHistory = async () => {
    try {
      const data = await financeAPI.getFeeRateHistory();
      setFeeRateHistory(data);
    } catch (err: any) {
      console.error('Failed to fetch fee rate history:', err);
    }
  };

  const formatFeeRateValue = (rate: FeeRate | { rate_type: string; rate: number | null }) => {
    if (rate.rate === null) return '—';
    return PERCENTAGE_FEE_TYPES.has(rate.rate_type)
      ? `${(rate.rate * 100).toFixed(2)}%`
      : `${rate.rate} Freti`;
  };

  const saveFeeRate = async () => {
    const { rate, newValue, reason, effectiveAt } = feeRateDialog;
    if (!rate) return;
    const parsed = parseFloat(newValue);
    if (isNaN(parsed) || parsed < 0) {
      toast({ title: 'Invalid value', description: 'Enter a valid non-negative number.', variant: 'destructive' });
      return;
    }
    if (!reason.trim()) {
      toast({ title: 'Reason required', description: 'Every rate change is audited — enter a reason.', variant: 'destructive' });
      return;
    }
    const effectiveDate = effectiveAt ? new Date(effectiveAt) : null;
    const isScheduled = !!effectiveDate && effectiveDate.getTime() > Date.now();
    // Percentage types are entered as e.g. "10" for 10%; flat fees are Freti amounts
    const apiRate = PERCENTAGE_FEE_TYPES.has(rate.rate_type) ? parsed / 100 : parsed;
    try {
      setFeeRateSaving(true);
      await financeAPI.updateFeeRate(rate.rate_type, {
        rate: apiRate,
        reason: reason.trim(),
        ...(effectiveDate ? { effective_at: effectiveDate.toISOString() } : {}),
      });
      const display = PERCENTAGE_FEE_TYPES.has(rate.rate_type) ? parsed + '%' : parsed + ' Freti';
      toast({
        title: isScheduled ? 'Rate change scheduled' : 'Rate updated',
        description: isScheduled
          ? `${rate.label} will become ${display} on ${formatDateTime(effectiveDate!.toISOString())}.`
          : `${rate.label} is now ${display}. New orders use this rate.`,
      });
      setFeeRateDialog({ open: false, rate: null, newValue: '', reason: '', effectiveAt: '' });
      fetchFeeRates();
      fetchFeeRateHistory();
    } catch (err: any) {
      toast({ title: 'Update failed', description: err.response?.data?.message || 'Could not update the rate.', variant: 'destructive' });
    } finally {
      setFeeRateSaving(false);
    }
  };

  const cancelPendingRate = async () => {
    const { rate, reason } = cancelRateDialog;
    if (!rate) return;
    if (!reason.trim()) {
      toast({ title: 'Reason required', description: 'Cancellations are audited — enter a reason.', variant: 'destructive' });
      return;
    }
    try {
      setFeeRateSaving(true);
      await financeAPI.cancelPendingFeeRate(rate.rate_type, { reason: reason.trim() });
      toast({
        title: 'Scheduled change cancelled',
        description: `${rate.label} stays at ${formatFeeRateValue(rate)}.`,
      });
      setCancelRateDialog({ open: false, rate: null, reason: '' });
      fetchFeeRates();
      fetchFeeRateHistory();
    } catch (err: any) {
      toast({ title: 'Cancel failed', description: err.response?.data?.message || 'Could not cancel the scheduled change.', variant: 'destructive' });
    } finally {
      setFeeRateSaving(false);
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
          <button
            onClick={() => setActiveTab('fee-rates')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'fee-rates'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Platform Fees
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
                          {formatAmount(Number(payout.freti_amount) || 0)} • {formatDateTime((payout as any).created_at || (payout as any).createdAt)}
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
                  <div className="text-2xl font-bold">{formatAmount(Number(totalFunds?.totalDeposited) || 0)}</div>
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
                  <div className="text-2xl font-bold">{formatAmount(Number((totalFunds as any)?.pendingDeposits) || 0)}</div>
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
                  <div className="text-2xl font-bold">{formatAmount(Number(totalFunds?.totalDeposited) || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    {totalFunds?.totalDepositsCount || 0} transactions completed
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
                          {formatAmount(Number(deposit.amount) || 0)} • {getPaymentMethodLabel(deposit.paymentMethod)} • {formatDateTime(deposit.createdAt)}
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
                          Available: {formatAmount(Number(balance.availableBalance) || 0)} • Pending: {formatAmount(Number(balance.pendingWithdrawal) || 0)}
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

      {activeTab === 'platform-wallet' && (canViewFinance || hasPermission('view_wallet_transactions')) ? (
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
                <Button onClick={() => handleAddBankAccountDialogChange(true)}>
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
                          {formatAmount(Number(withdrawal.freti_amount) || 0)} • {formatDateTime(withdrawal.created_at)}
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
      {activeTab === 'platform-wallet' && !(canViewFinance || hasPermission('view_wallet_transactions')) ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
            <p className="text-muted-foreground">Platform wallet access requires finance clearance.</p>
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
                  <p className="text-sm font-medium">{formatAmount(Number(payoutDetailsDialog.payout?.freti_amount) || 0)}</p>
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
                <p className="text-sm font-medium">Amount: {formatAmount(Number(processPayoutDialog.payout?.freti_amount) || 0)}</p>
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
      <Dialog open={addBankAccountDialog} onOpenChange={handleAddBankAccountDialogChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Bank Account</DialogTitle>
            <DialogDescription>Add a new bank account for platform withdrawals</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md border border-blue-200/60 bg-blue-50/60 p-3 text-sm text-muted-foreground">
              Select a country, choose a bank, and verify the account details before saving the withdrawal account.
            </div>
            <div>
              <Label htmlFor="platform-country">Country</Label>
              <select
                id="platform-country"
                value={addBankAccountForm.country}
                onChange={(e) => handleAddBankCountryChange(e.target.value)}
                className="w-full border border-input bg-background px-3 py-2 rounded-md text-sm"
              >
                {SUPPORTED_BANK_COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name} ({country.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="platform-bank-search">Search Bank</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="platform-bank-search"
                  value={bankSearchQuery}
                  onChange={(e) => setBankSearchQuery(e.target.value)}
                  placeholder={isBankLookupLoading ? 'Loading banks...' : 'Search bank name'}
                  className="pl-9"
                  disabled={isBankLookupLoading || platformBanks.length === 0}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="platform-bank">Bank</Label>
              <select
                id="platform-bank"
                value={addBankAccountForm.bankCode}
                onChange={(e) => handleAddBankSelection(e.target.value)}
                className="w-full border border-input bg-background px-3 py-2 rounded-md text-sm"
                disabled={isBankLookupLoading || platformBanks.length === 0}
              >
                <option value="">
                  {isBankLookupLoading
                    ? 'Loading banks...'
                    : filteredPlatformBanks.length > 0
                    ? 'Select a bank'
                    : platformBanks.length > 0
                    ? 'No banks match your search'
                    : 'No banks available'}
                </option>
                {filteredPlatformBanks.map((bank) => (
                  <option key={bank.id} value={bank.code}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="platform-account-number">Account Number</Label>
              <Input
                id="platform-account-number"
                value={addBankAccountForm.accountNumber}
                onChange={(e) => handleAddBankAccountNumberChange(e.target.value)}
                placeholder="0123456789"
                inputMode="numeric"
                maxLength={20}
              />
            </div>
            <div>
              <Label htmlFor="platform-account-type">Account Type</Label>
              <select
                id="platform-account-type"
                value={addBankAccountForm.accountType}
                onChange={(e) => setAddBankAccountForm((prev) => ({ ...prev, accountType: e.target.value as 'checking' | 'savings' | 'current' }))}
                className="w-full border border-input bg-background px-3 py-2 rounded-md text-sm"
              >
                <option value="savings">Savings</option>
                <option value="checking">Checking</option>
                <option value="current">Current</option>
              </select>
            </div>
            <div>
              <Label htmlFor="platform-currency">Currency</Label>
              <Input
                id="platform-currency"
                value={addBankAccountForm.currency}
                readOnly
                disabled
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is-default"
                checked={!!addBankAccountForm.isDefault}
                onChange={(e) => setAddBankAccountForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
              />
              <Label htmlFor="is-default">Set as default account</Label>
            </div>
            <Button
              type="button"
              onClick={handleVerifyPlatformBankAccount}
              disabled={!addBankAccountForm.bankCode || !addBankAccountForm.accountNumber || isBankLookupLoading || isBankVerificationLoading}
              className="w-full"
            >
              {isBankVerificationLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Verifying...
                </>
              ) : verifiedPlatformAccount ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verified
                </>
              ) : (
                'Verify Account'
              )}
            </Button>
            {verifiedPlatformAccount ? (
              <div className="rounded-md border border-green-200 bg-green-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-green-700">Verified Account Name</p>
                <p className="mt-1 text-sm font-semibold text-green-900">{verifiedPlatformAccount.accountName}</p>
              </div>
            ) : null}
            {bankVerificationError && !verifiedPlatformAccount ? (
              <div className="space-y-2">
                <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                  {bankVerificationError}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="manual-account-name">Account Name (manual entry)</Label>
                  <Input
                    id="manual-account-name"
                    value={addBankAccountForm.accountName}
                    onChange={(e) => setAddBankAccountForm((prev) => ({ ...prev, accountName: e.target.value }))}
                    placeholder="e.g. JOHN DOE"
                  />
                  <p className="text-xs text-muted-foreground">Verification is unavailable. Enter the account name exactly as it appears on the account.</p>
                </div>
              </div>
            ) : null}
            {!bankVerificationError && !verifiedPlatformAccount && (
              <div className="rounded-md border border-green-200/60 bg-green-50/60 p-3 text-sm text-green-700">
                Verify the account above to confirm the account name before saving.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleAddBankAccountDialogChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddBankAccount} disabled={!!isActionLoading || !addBankAccountForm.accountName?.trim()}>
              {isActionLoading === 'add-bank' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                addBankAccountForm.accountName?.trim() ? 'Add Account' : 'Verify Account to Continue'
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

      {/* Platform Fees Tab */}
      {activeTab === 'fee-rates' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Fee & Commission Rates</CardTitle>
              <CardDescription>
                Rates are snapshotted onto orders and escrows at creation — changes only affect future orders, auctions, or conversions. Every change is recorded in the audit history below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {feeRatesLoading ? (
                <div className="flex justify-center py-8"><LoadingSpinner /></div>
              ) : feeRates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No fee rates found. Run migration 251_platform_fee_rates.sql, then reload.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-3 pr-4 font-medium">Fee</th>
                        <th className="py-3 pr-4 font-medium">Current rate</th>
                        <th className="py-3 pr-4 font-medium">Applies to</th>
                        <th className="py-3 pr-4 font-medium">Last updated</th>
                        {canManageFees && <th className="py-3 font-medium text-right">Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {feeRates.map((rate) => (
                        <tr key={rate.rate_type} className="border-b last:border-0">
                          <td className="py-3 pr-4">
                            <div className="font-medium">{rate.label}</div>
                            {rate.description && (
                              <div className="text-xs text-muted-foreground max-w-md">{rate.description}</div>
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            <div className="font-semibold">{formatFeeRateValue(rate)}</div>
                            {rate.pending_rate != null && rate.pending_effective_at && (
                              <div className="text-xs text-amber-600 dark:text-amber-500 whitespace-nowrap">
                                → {formatFeeRateValue({ rate_type: rate.rate_type, rate: rate.pending_rate })}{' '}
                                from {formatDateTime(rate.pending_effective_at)}
                                {canManageFees && (
                                  <button
                                    className="ml-2 underline hover:no-underline"
                                    onClick={() => setCancelRateDialog({ open: true, rate, reason: '' })}
                                  >
                                    cancel
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            <Badge variant="outline">{rate.applies_to.replace(/_/g, ' ')}</Badge>
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                            {rate.updated_at ? formatDateTime(rate.updated_at) : '—'}
                          </td>
                          {canManageFees && (
                            <td className="py-3 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFeeRateDialog({
                                  open: true,
                                  rate,
                                  newValue: PERCENTAGE_FEE_TYPES.has(rate.rate_type)
                                    ? (rate.rate * 100).toString()
                                    : rate.rate.toString(),
                                  reason: '',
                                  effectiveAt: '',
                                })}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {!canManageFees && (
                <p className="text-xs text-muted-foreground mt-4">
                  You need the <code>manage_platform_fees</code> permission to change rates.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change History</CardTitle>
              <CardDescription>Audit log of every rate change.</CardDescription>
            </CardHeader>
            <CardContent>
              {feeRateHistory.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">No rate changes recorded yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2 pr-4 font-medium">Fee</th>
                        <th className="py-2 pr-4 font-medium">Change</th>
                        <th className="py-2 pr-4 font-medium">Effective</th>
                        <th className="py-2 pr-4 font-medium">Reason</th>
                        <th className="py-2 pr-4 font-medium">Changed by</th>
                        <th className="py-2 font-medium">When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feeRateHistory.map((entry) => {
                        const rateMeta = feeRates.find(r => r.rate_type === entry.rate_type);
                        return (
                          <tr key={entry.id} className="border-b last:border-0">
                            <td className="py-2 pr-4 font-medium">{rateMeta?.label || entry.rate_type}</td>
                            <td className="py-2 pr-4 whitespace-nowrap">
                              {formatFeeRateValue({ rate_type: entry.rate_type, rate: entry.old_rate })}
                              {' → '}
                              <span className="font-semibold">{formatFeeRateValue({ rate_type: entry.rate_type, rate: entry.new_rate })}</span>
                            </td>
                            <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground">
                              {entry.effective_at ? formatDateTime(entry.effective_at) : '—'}
                            </td>
                            <td className="py-2 pr-4 text-muted-foreground max-w-xs truncate" title={entry.reason || ''}>
                              {entry.reason || '—'}
                            </td>
                            <td className="py-2 pr-4 whitespace-nowrap">
                              {entry.staff?.full_name || entry.staff?.staff_id || '—'}
                            </td>
                            <td className="py-2 text-muted-foreground whitespace-nowrap">
                              {formatDateTime(entry.changed_at)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
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
                            Credit Value: {formatAmount(gift.credit_value)} • Sort Order: {gift.sort_order} • {gift.animation_type || 'single'}
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

          {/* Sound Library */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sound Library</CardTitle>
                  <CardDescription>Reusable sound effects for gifts</CardDescription>
                </div>
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  id="sound-upload"
                  onChange={handleUploadSound}
                  disabled={uploadingAsset === 'sound'}
                />
                <Button
                  onClick={() => document.getElementById('sound-upload')?.click()}
                  disabled={uploadingAsset === 'sound'}
                >
                  {uploadingAsset === 'sound' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Upload Sound
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {soundsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : allSounds.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No sounds yet. Upload a sound to get started.
                </div>
              ) : (
                <div className="space-y-2">
                  {allSounds.map((sound) => (
                    <div key={sound.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <Volume2 className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{sound.name}</p>
                          <audio src={sound.sound_url} controls className="h-8 w-48" />
                        </div>
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

            <div>
              <Label htmlFor="gift-animation-type">Animation Type</Label>
              <select
                id="gift-animation-type"
                value={giftForm.animation_type}
                onChange={(e) => setGiftForm({ ...giftForm, animation_type: e.target.value as any })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="lottie_single">Single Lottie</option>
                <option value="lottie_combo">Combo Lottie</option>
                <option value="lottie_overlap">Overlapping Lottie</option>
              </select>
            </div>

            <div>
              <Label htmlFor="gift-display-lottie">Display Lottie (selector preview)</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="gift-display-lottie"
                  value={giftForm.display_lottie_url || ''}
                  onChange={(e) => setGiftForm({ ...giftForm, display_lottie_url: e.target.value })}
                  placeholder="https://... or upload"
                />
                <input
                  type="file"
                  accept=".lottie,.json"
                  className="hidden"
                  id="display-lottie-upload"
                  onChange={handleUploadLottie}
                  disabled={uploadingAsset === 'lottie'}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('display-lottie-upload')?.click()}
                  disabled={uploadingAsset === 'lottie'}
                >
                  {uploadingAsset === 'lottie' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-1" />
                  )}
                  Upload
                </Button>
              </div>
            </div>

            <div className="space-y-3 border rounded-md p-4 border-input bg-background">
              <div className="flex items-center justify-between">
                <Label htmlFor="gift-lottie-config">Lottie Effect Config</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    id="lottie-config-json-upload"
                    onChange={handleUploadLottieConfigJson}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('lottie-config-json-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Import JSON
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadLottieConfig}
                    disabled={!giftForm.lottie_config}
                  >
                    Export JSON
                  </Button>
                </div>
              </div>

              {giftForm.animation_type === 'lottie_single' ? (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Upload one Lottie file to use as the full-screen effect. Leave empty to reuse the display Lottie.
                  </p>
                  <div className="flex gap-2 items-center">
                    <Input
                      value={getEffectSteps()[0]?.lottieUrl || ''}
                      onChange={(e) => updateStep(0, 'lottieUrl', e.target.value)}
                      placeholder="https://... or upload"
                    />
                    <input
                      type="file"
                      accept=".lottie,.json"
                      className="hidden"
                      id="lottie-effect-single-upload"
                      onChange={handleUploadEffectSingle}
                      disabled={effectUploading === 'single'}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('lottie-effect-single-upload')?.click()}
                      disabled={effectUploading === 'single'}
                    >
                      {effectUploading === 'single' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-1" />
                      )}
                      Upload
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    {giftForm.animation_type === 'lottie_combo'
                      ? 'Add Lottie steps played one after another. Each step starts when the previous one finishes.'
                      : 'Add Lottie steps that play together/overlapping. Use Delay to stagger the start times.'}
                  </p>
                  {getEffectSteps().length === 0 && (
                    <p className="text-sm text-muted-foreground">No effect steps yet.</p>
                  )}
                  {getEffectSteps().map((step, index) => (
                    <div key={index} className="flex gap-2 items-start border rounded-md p-2 bg-background">
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2 items-center">
                          <span className="text-xs font-medium min-w-[50px]">Step {index + 1}</span>
                          <Input
                            value={step.lottieUrl || ''}
                            onChange={(e) => updateStep(index, 'lottieUrl', e.target.value)}
                            placeholder="https://... or upload"
                          />
                          <input
                            type="file"
                            accept=".lottie,.json"
                            className="hidden"
                            id={`lottie-effect-step-upload-${index}`}
                            onChange={handleUploadEffectStep(index)}
                            disabled={effectUploading === index}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById(`lottie-effect-step-upload-${index}`)?.click()}
                            disabled={effectUploading === index}
                          >
                            {effectUploading === index ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4 mr-1" />
                            )}
                            Upload
                          </Button>
                        </div>
                        {giftForm.animation_type === 'lottie_overlap' && (
                          <div className="flex gap-2 items-center pl-[50px]">
                            <Label className="text-xs text-muted-foreground">Delay (ms)</Label>
                            <Input
                              type="number"
                              value={step.delayMs || 0}
                              onChange={(e) => updateStep(index, 'delayMs', e.target.value)}
                              className="w-24"
                            />
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStep(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addStep}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Step
                  </Button>
                </div>
              )}

              <div>
                <Label htmlFor="gift-lottie-config" className="text-xs text-muted-foreground">
                  Raw JSON (copy/paste or edit directly)
                </Label>
                <textarea
                  id="gift-lottie-config"
                  value={(giftForm.lottie_config as any) || ''}
                  onChange={(e) => setGiftForm({ ...giftForm, lottie_config: e.target.value })}
                  placeholder={'{ "lottieUrl": "..." } or { "steps": [{ "lottieUrl": "...", "delayMs": 0 }] }'}
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to use the display Lottie as the effect.
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="gift-sound">Sound Effect</Label>
              <select
                id="gift-sound"
                value={giftForm.sound_id || ''}
                onChange={(e) => setGiftForm({ ...giftForm, sound_id: e.target.value || undefined })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">No sound</option>
                {allSounds.map((sound) => (
                  <option key={sound.id} value={sound.id}>
                    {sound.name}
                  </option>
                ))}
              </select>
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

      {/* Edit Fee Rate Dialog */}
      <Dialog
        open={feeRateDialog.open}
        onOpenChange={(open) => setFeeRateDialog({ open, rate: null, newValue: '', reason: '', effectiveAt: '' })}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit {feeRateDialog.rate?.label}</DialogTitle>
            <DialogDescription>
              {PERCENTAGE_FEE_TYPES.has(feeRateDialog.rate?.rate_type || '')
                ? 'Enter the new rate as a percentage.'
                : 'Enter the new flat fee in Freti.'}
            </DialogDescription>
          </DialogHeader>
          {feeRateDialog.rate && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Current: <span className="font-semibold text-foreground">{formatFeeRateValue(feeRateDialog.rate)}</span>
                {' · '}Applies to {feeRateDialog.rate.applies_to.replace(/_/g, ' ')}
              </div>
              <div className="space-y-2">
                <Label htmlFor="fee-rate-value">
                  New value ({PERCENTAGE_FEE_TYPES.has(feeRateDialog.rate.rate_type) ? '%' : 'Freti'})
                </Label>
                <Input
                  id="fee-rate-value"
                  type="number"
                  min="0"
                  step="any"
                  value={feeRateDialog.newValue}
                  onChange={(e) => setFeeRateDialog(prev => ({ ...prev, newValue: e.target.value }))}
                  placeholder={PERCENTAGE_FEE_TYPES.has(feeRateDialog.rate.rate_type) ? 'e.g. 10 for 10%' : 'e.g. 5'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fee-rate-effective">Effective from (optional)</Label>
                <Input
                  id="fee-rate-effective"
                  type="datetime-local"
                  min={new Date().toISOString().slice(0, 16)}
                  value={feeRateDialog.effectiveAt}
                  onChange={(e) => setFeeRateDialog(prev => ({ ...prev, effectiveAt: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to apply immediately. A future date schedules the change — the new rate starts applying automatically when it arrives, and a scheduled change is replaced if you save another one.
                </p>
              </div>
              {feeRateDialog.rate.pending_rate != null && feeRateDialog.rate.pending_effective_at && (
                <p className="text-xs text-amber-600 dark:text-amber-500">
                  A change to {formatFeeRateValue({ rate_type: feeRateDialog.rate.rate_type, rate: feeRateDialog.rate.pending_rate })} is already scheduled for {formatDateTime(feeRateDialog.rate.pending_effective_at)} — saving will replace it.
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="fee-rate-reason">Reason (required, shown in audit history)</Label>
                <Input
                  id="fee-rate-reason"
                  value={feeRateDialog.reason}
                  onChange={(e) => setFeeRateDialog(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="e.g. Q3 pricing review"
                />
              </div>
              {feeRateDialog.rate.rate_type === 'auction_listing_fee' && parseFloat(feeRateDialog.newValue || '0') > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-500">
                  Listing fees are not yet shown on the auction creation screen — sellers won't see this charge until the app is updated.
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFeeRateDialog({ open: false, rate: null, newValue: '', reason: '', effectiveAt: '' })}
            >
              Cancel
            </Button>
            <Button onClick={saveFeeRate} disabled={feeRateSaving}>
              {feeRateSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Scheduled Fee Rate Change Dialog */}
      <Dialog
        open={cancelRateDialog.open}
        onOpenChange={(open) => setCancelRateDialog({ open, rate: null, reason: '' })}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel scheduled change</DialogTitle>
            <DialogDescription>
              {cancelRateDialog.rate && (
                <>
                  {cancelRateDialog.rate.label} will stay at{' '}
                  <span className="font-semibold">{formatFeeRateValue(cancelRateDialog.rate)}</span>.
                  The scheduled change to{' '}
                  <span className="font-semibold">
                    {formatFeeRateValue({ rate_type: cancelRateDialog.rate.rate_type, rate: cancelRateDialog.rate.pending_rate })}
                  </span>
                  {cancelRateDialog.rate.pending_effective_at && (
                    <> on {formatDateTime(cancelRateDialog.rate.pending_effective_at)}</>
                  )}{' '}
                  will be discarded.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancel-rate-reason">Reason (required, shown in audit history)</Label>
            <Input
              id="cancel-rate-reason"
              value={cancelRateDialog.reason}
              onChange={(e) => setCancelRateDialog(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="e.g. Change no longer needed"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelRateDialog({ open: false, rate: null, reason: '' })}
            >
              Keep scheduled change
            </Button>
            <Button variant="destructive" onClick={cancelPendingRate} disabled={feeRateSaving}>
              {feeRateSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Cancel scheduled change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinancePage;