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

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { financeAPI, type RevenueStats, type EscrowHealth, type Payout, type Deposit, type TotalPlatformFunds, type UserBalance } from '@/lib/api/finance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Clock, AlertTriangle, Wallet, CreditCard, BarChart3, Calendar, Loader2, Eye, MoreVertical, Search, ArrowDownCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
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

export default function FinancePage() {
  const { isSuperAdmin, hasPermission } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'revenue' | 'escrow' | 'payouts' | 'deposits' | 'user-balances'>('revenue');
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
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [payoutStatusFilter, setPayoutStatusFilter] = useState<'all' | Payout['status']>('all');
  const [depositStatusFilter, setDepositStatusFilter] = useState<'all' | Deposit['status']>('all');
  const [depositPaymentMethodFilter, setDepositPaymentMethodFilter] = useState<string>('all');
  const [depositSearchQuery, setDepositSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Dialog states
  const [payoutDetailsDialog, setPayoutDetailsDialog] = useState<{ open: boolean; payout: Payout | null }>({ open: false, payout: null });
  const [processPayoutDialog, setProcessPayoutDialog] = useState<{ open: boolean; payout: Payout | null }>({ open: false, payout: null });

  const canViewFinance = isSuperAdmin || hasPermission('view_revenue');
  const canProcessPayouts = isSuperAdmin || hasPermission('process_payouts');

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
      }
    }
  }, [canViewFinance, activeTab, dateRange, payoutStatusFilter, depositStatusFilter, depositPaymentMethodFilter, depositSearchQuery, userBalanceSearchQuery, page]);

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
        status: payoutStatusFilter !== 'all' ? payoutStatusFilter : undefined,
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
      setIsActionLoading(processPayoutDialog.payout.id);
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

  const getStatusBadge = (status: Payout['status']) => {
    const variants: Record<Payout['status'], { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'outline', label: 'Pending' },
      processing: { variant: 'secondary', label: 'Processing' },
      completed: { variant: 'default', label: 'Completed' },
      failed: { variant: 'destructive', label: 'Failed' },
    };
    const config = variants[status];
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Finance Management</h1>
        <p className="text-muted-foreground mt-1">Track revenue, escrow health, and payouts</p>
      </div>

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
        </nav>
      </div>

      {/* Date Range Selector for Revenue */}
      {activeTab === 'revenue' && (
        <div className="flex gap-4 items-end">
          <div>
            <label className="text-sm font-medium mb-1 block">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border rounded-md bg-background"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 border rounded-md bg-background"
            />
          </div>
          <Button onClick={fetchRevenue}>
            <Calendar className="h-4 w-4 mr-2" />
            Apply
          </Button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : activeTab === 'revenue' && revenueStats ? (
        <div className="space-y-6">
          {/* Revenue Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Platform Fees</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(revenueStats.totalPlatformFees)}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Realized Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(revenueStats.realizedRevenue)}</div>
                <p className="text-xs text-muted-foreground">Released escrows</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Revenue</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{formatCurrency(revenueStats.pendingRevenue)}</div>
                <p className="text-xs text-muted-foreground">In escrow</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lost Revenue</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(revenueStats.lostRevenue)}</div>
                <p className="text-xs text-muted-foreground">Refunded</p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue by Source */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Source</CardTitle>
              <CardDescription>Platform fees breakdown by order source</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(revenueStats.revenueBySource).map(([source, amount]) => (
                  <div key={source} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium capitalize">{source.replace('_', ' ')}</span>
                    </div>
                    <span className="font-bold">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Vendors */}
          {revenueStats.topVendors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Vendors by Fees</CardTitle>
                <CardDescription>Vendors contributing most to platform revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {revenueStats.topVendors.slice(0, 10).map((vendor, index) => (
                    <div key={vendor.vendorId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{vendor.vendorName}</p>
                          <p className="text-sm text-muted-foreground">{vendor.orderCount} orders</p>
                        </div>
                      </div>
                      <span className="font-bold">{formatCurrency(vendor.totalFees)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : activeTab === 'escrow' && escrowHealth ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total in Escrow</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(escrowHealth.totalInEscrow)}</div>
                <p className="text-xs text-muted-foreground">Currently held</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue Escrows</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{escrowHealth.overdueEscrows}</div>
                <p className="text-xs text-muted-foreground">Requires attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dispute Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{escrowHealth.disputeRate.toFixed(2)}%</div>
                <p className="text-xs text-muted-foreground">Of total escrows</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Hold Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{escrowHealth.averageHoldTime.toFixed(1)}h</div>
                <p className="text-xs text-muted-foreground">Before release</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Escrows by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{escrowHealth.escrowsByStatus.held}</div>
                  <div className="text-sm text-muted-foreground">Held</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{escrowHealth.escrowsByStatus.released}</div>
                  <div className="text-sm text-muted-foreground">Released</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{escrowHealth.escrowsByStatus.refunded}</div>
                  <div className="text-sm text-muted-foreground">Refunded</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{escrowHealth.escrowsByStatus.disputed}</div>
                  <div className="text-sm text-muted-foreground">Disputed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : activeTab === 'payouts' ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Payouts</h2>
              <p className="text-sm text-muted-foreground">Manage vendor payouts</p>
            </div>
            <select
              value={payoutStatusFilter}
              onChange={(e) => {
                setPayoutStatusFilter(e.target.value as any);
                setPage(1);
              }}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <Card>
            <CardContent className="p-0">
              {payouts.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No payouts found</p>
                </div>
              ) : (
                <div className="divide-y">
                  {payouts.map((payout) => (
                    <div key={payout.id} className="p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{payout.vendorName}</h3>
                            {getStatusBadge(payout.status)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                            <div>
                              <span className="font-medium">Amount: </span>
                              {formatCurrency(payout.amount)}
                            </div>
                            <div>
                              <span className="font-medium">Method: </span>
                              {payout.paymentMethod}
                            </div>
                            <div>
                              <span className="font-medium">Requested: </span>
                              {new Date(payout.requestedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPayoutDetailsDialog({ open: true, payout: payout })}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canProcessPayouts && payout.status === 'pending' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" disabled={isActionLoading === payout.id}>
                                  {isActionLoading === payout.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <MoreVertical className="h-4 w-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => setProcessPayoutDialog({ open: true, payout: payout })}
                                >
                                  Process Payout
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
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
        </div>
      ) : activeTab === 'deposits' ? (
        <div className="space-y-6">
          {/* Total Funds Overview */}
          {totalFunds && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Platform Funds</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalFunds.totalFunds)}</div>
                  <p className="text-xs text-muted-foreground">All funds in platform</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(totalFunds.totalAvailable)}</div>
                  <p className="text-xs text-muted-foreground">Available to users</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">In Escrow</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{formatCurrency(totalFunds.totalEscrow)}</div>
                  <p className="text-xs text-muted-foreground">Held in escrow</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Deposited</CardTitle>
                  <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalFunds.totalDeposited)}</div>
                  <p className="text-xs text-muted-foreground">{totalFunds.totalDepositsCount} transactions</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user name..."
                value={depositSearchQuery}
                onChange={(e) => {
                  setDepositSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <select
              value={depositStatusFilter}
              onChange={(e) => {
                setDepositStatusFilter(e.target.value as any);
                setPage(1);
              }}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={depositPaymentMethodFilter}
              onChange={(e) => {
                setDepositPaymentMethodFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">All Payment Methods</option>
              <option value="card">Card Deposit</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="ussd">USSD</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="paystack">Paystack</option>
              <option value="stripe">Stripe</option>
              <option value="flutterwave">Flutterwave</option>
            </select>
          </div>

          {/* Deposits List */}
          <Card>
            <CardHeader>
              <CardTitle>Deposits & Transactions</CardTitle>
              <CardDescription>All deposits and transactions into the platform</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {deposits.length === 0 ? (
                <div className="text-center py-12">
                  <ArrowDownCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No deposits found</p>
                </div>
              ) : (
                <div className="divide-y">
                  {deposits.map((deposit) => (
                    <div key={deposit.id} className="p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{deposit.userName}</h3>
                            {getDepositStatusBadge(deposit.status)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                            <div>
                              <span className="font-medium">Amount: </span>
                              {formatAmount(deposit.amount)}
                            </div>
                            <div>
                              <span className="font-medium">Method: </span>
                              {getPaymentMethodLabel(deposit.paymentMethod)}
                            </div>
                            <div>
                              <span className="font-medium">Date: </span>
                              {new Date(deposit.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
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
        </div>
      ) : activeTab === 'user-balances' ? (
        <div className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user name or username..."
              value={userBalanceSearchQuery}
              onChange={(e) => {
                setUserBalanceSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>

          {/* User Balances List */}
          <Card>
            <CardHeader>
              <CardTitle>User Balances</CardTitle>
              <CardDescription>Users sorted by available balance (highest to lowest)</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {userBalances.length === 0 ? (
                <div className="text-center py-12">
                  <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No user balances found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-semibold">Rank</th>
                        <th className="text-left p-4 font-semibold">User</th>
                        <th className="text-right p-4 font-semibold">Available</th>
                        <th className="text-right p-4 font-semibold">In Escrow</th>
                        <th className="text-right p-4 font-semibold">Pending Withdrawal</th>
                        <th className="text-right p-4 font-semibold">Total Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userBalances.map((balance, index) => (
                        <tr key={balance.userId} className="border-b hover:bg-accent/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                index === 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                index === 1 ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' :
                                index === 2 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                'bg-primary/10 text-primary'
                              }`}>
                                {(page - 1) * limit + index + 1}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{balance.userName}</p>
                              <p className="text-sm text-muted-foreground">@{balance.username}</p>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <span className="font-semibold text-green-600">{formatAmount(balance.availableBalance)}</span>
                          </td>
                          <td className="p-4 text-right">
                            <span className="text-muted-foreground">{formatAmount(balance.escrowBalance)}</span>
                          </td>
                          <td className="p-4 text-right">
                            <span className="text-muted-foreground">{formatAmount(balance.pendingWithdrawal)}</span>
                          </td>
                          <td className="p-4 text-right">
                            <span className="font-bold">{formatAmount(balance.totalBalance)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
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
        </div>
      ) : null}

      {/* Payout Details Dialog */}
      <Dialog open={payoutDetailsDialog.open} onOpenChange={(open) => setPayoutDetailsDialog({ open, payout: null })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payout Details</DialogTitle>
            <DialogDescription>View detailed information about this payout</DialogDescription>
          </DialogHeader>
          {payoutDetailsDialog.payout && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{payoutDetailsDialog.payout.vendorName}</h3>
                  {getStatusBadge(payoutDetailsDialog.payout.status)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
                  <p className="text-sm font-semibold">{formatCurrency(payoutDetailsDialog.payout.amount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                  <p className="text-sm">{payoutDetailsDialog.payout.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(payoutDetailsDialog.payout.status)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Requested Date</p>
                  <p className="text-sm">{new Date(payoutDetailsDialog.payout.requestedAt).toLocaleString()}</p>
                </div>
                {payoutDetailsDialog.payout.processedAt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Processed Date</p>
                    <p className="text-sm">{new Date(payoutDetailsDialog.payout.processedAt).toLocaleString()}</p>
                  </div>
                )}
                {payoutDetailsDialog.payout.accountDetails && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Account Details</p>
                    <p className="text-sm">{payoutDetailsDialog.payout.accountDetails}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Process Payout Dialog */}
      <Dialog open={processPayoutDialog.open} onOpenChange={(open) => setProcessPayoutDialog({ open, payout: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payout</DialogTitle>
            <DialogDescription>
              Are you sure you want to process this payout? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {processPayoutDialog.payout && (
            <div className="space-y-4">
              <div className="text-sm space-y-2">
                <p><span className="font-medium">Vendor:</span> {processPayoutDialog.payout.vendorName}</p>
                <p><span className="font-medium">Amount:</span> {formatCurrency(processPayoutDialog.payout.amount)}</p>
                <p><span className="font-medium">Method:</span> {processPayoutDialog.payout.paymentMethod}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessPayoutDialog({ open: false, payout: null })}>
              Cancel
            </Button>
            <Button
              onClick={handleProcessPayout}
              disabled={isActionLoading === processPayoutDialog.payout?.id}
            >
              {isActionLoading === processPayoutDialog.payout?.id ? 'Processing...' : 'Process Payout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

