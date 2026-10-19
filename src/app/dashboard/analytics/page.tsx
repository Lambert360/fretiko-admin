'use client';

/**
 * Analytics Dashboard Page
 * 
 * Platform-wide analytics and insights
 * Features:
 * - Real-time platform statistics
 * - Growth trends and metrics
 * - Time series charts
 * - Top performers analysis
 * 
 * Requires: view_platform_stats permission
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsAPI, type PlatformStats, type AnalyticsSummary, type TimeSeriesData, type AuctionAnalyticsSummary, type ConversionMetrics, type VendorByOrders, type LiveSalesAnalytics as LiveSalesAnalyticsData, type ProductsTabAnalytics, type PlatformListingsAnalytics, type VendorsRidersAnalytics } from '@/lib/api/analytics';
import { ordersAPI, type OrderStats } from '@/lib/api/orders';
import { InfoAlert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart } from '@/components/charts/LineChart';
import { PieChart } from '@/components/charts/PieChart';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LiveSalesAnalytics from '@/components/LiveSalesAnalytics';
import { BarChart3, TrendingUp, Users, ShoppingCart, DollarSign, AlertCircle, Info, Gavel, Clock, UserCheck, Award, Video, PieChart as PieChartIcon, Package, Wrench, Layers } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils/formatting';

const ORDER_STATUS_COLORS: Record<string, string> = {
  Pending: '#f59e0b',
  Processing: '#3b82f6',
  Completed: '#10b981',
  Cancelled: '#ef4444',
};

export default function AnalyticsPage() {
  const { isSuperAdmin, hasPermission } = useAuth();
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [auctionAnalytics, setAuctionAnalytics] = useState<AuctionAnalyticsSummary | null>(null);
  const [conversionMetrics, setConversionMetrics] = useState<ConversionMetrics | null>(null);
  const [vendorsByOrders, setVendorsByOrders] = useState<VendorByOrders[] | null>(null);
  const [productsTabAnalytics, setProductsTabAnalytics] = useState<ProductsTabAnalytics | null>(null);
  const [liveSalesAnalytics, setLiveSalesAnalytics] = useState<LiveSalesAnalyticsData | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [platformListings, setPlatformListings] = useState<PlatformListingsAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [liveSalesLoading, setLiveSalesLoading] = useState(true);
  const [platformListingsLoading, setPlatformListingsLoading] = useState(true);
  const [vendorsRiders, setVendorsRiders] = useState<VendorsRidersAnalytics | null>(null);
  const [vendorsRidersLoading, setVendorsRidersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveSalesError, setLiveSalesError] = useState<string | null>(null);
  const [platformListingsError, setPlatformListingsError] = useState<string | null>(null);
  const [vendorsRidersError, setVendorsRidersError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA'),
    end: new Date().toLocaleDateString('en-CA'),
  });

  const canViewAnalytics = isSuperAdmin || hasPermission('view_platform_stats');
  const canViewRevenue = isSuperAdmin || hasPermission('view_revenue');
  const canViewOrders = isSuperAdmin || hasPermission('view_orders');

  useEffect(() => {
    if (canViewAnalytics) {
      fetchAllData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewAnalytics, dateRange.start, dateRange.end, period]);

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [stats, summary, timeSeries, auctions, conversion, vendors, productsTab, orderStatsResult] = await Promise.all([
        analyticsAPI.getPlatformStats(),
        analyticsAPI.getAnalyticsSummary(),
        analyticsAPI.getTimeSeries(dateRange.start, dateRange.end, period, new Date().getTimezoneOffset()),
        analyticsAPI.getAuctionAnalyticsSummary(dateRange.start, dateRange.end),
        analyticsAPI.getConversionMetrics(),
        analyticsAPI.getTopVendorsByOrders(),
        analyticsAPI.getProductsTabAnalytics(dateRange.start, dateRange.end),
        canViewOrders ? ordersAPI.getStats() : Promise.resolve(null),
      ]);

      setPlatformStats(stats);
      setAnalyticsSummary(summary);
      setTimeSeriesData(timeSeries);
      setAuctionAnalytics(auctions);
      setConversionMetrics(conversion);
      setVendorsByOrders(vendors);
      setProductsTabAnalytics(productsTab);
      setOrderStats(orderStatsResult);
    } catch (err: any) {
      console.error('Failed to fetch analytics:', err);
      setError(err.response?.data?.message || 'Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLiveSales = async () => {
    try {
      setLiveSalesLoading(true);
      setLiveSalesError(null);
      const data = await analyticsAPI.getLiveSalesAnalytics();
      setLiveSalesAnalytics(data);
    } catch (err: any) {
      console.error('Failed to fetch live sales analytics:', err);
      setLiveSalesError(err.response?.data?.message || 'Failed to load live sales analytics');
    } finally {
      setLiveSalesLoading(false);
    }
  };

  useEffect(() => {
    if (canViewAnalytics) {
      fetchLiveSales();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewAnalytics]);

  const fetchPlatformListings = async () => {
    try {
      setPlatformListingsLoading(true);
      setPlatformListingsError(null);
      const data = await analyticsAPI.getPlatformListings();
      setPlatformListings(data);
    } catch (err: any) {
      console.error('Failed to fetch platform listings:', err);
      setPlatformListingsError(err.response?.data?.message || 'Failed to load platform listings data');
    } finally {
      setPlatformListingsLoading(false);
    }
  };

  useEffect(() => {
    if (canViewAnalytics) {
      fetchPlatformListings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewAnalytics]);

  const fetchVendorsRiders = async () => {
    try {
      setVendorsRidersLoading(true);
      setVendorsRidersError(null);
      setVendorsRiders(await analyticsAPI.getVendorsRiders());
    } catch (err: any) {
      console.error('Failed to fetch vendors/riders analytics:', err);
      setVendorsRidersError(err.response?.data?.message || 'Failed to load vendor and rider data');
    } finally {
      setVendorsRidersLoading(false);
    }
  };

  useEffect(() => {
    if (canViewAnalytics) {
      fetchVendorsRiders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewAnalytics]);

  if (!canViewAnalytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">You don't have permission to view analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">Platform insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      {/* Date Range Selector */}
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
      </div>

      {/* Tabs */}
      <TabsList className="grid w-full max-w-lg grid-cols-3">
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="platform" className="flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Platform
        </TabsTrigger>
        <TabsTrigger value="live-sales" className="flex items-center gap-2">
          <Video className="h-4 w-4" />
          Live Sales
        </TabsTrigger>
      </TabsList>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Timing Explanation - Only show if user can see revenue */}
      {canViewRevenue && (
        <InfoAlert>
          <AlertDescription>
            <strong>Order vs Revenue Timing:</strong> Orders are counted when customers place them (business activity).
            Revenue is counted when escrows are released (profit realization), which may occur 1-3 days later due to payment processing.
          </AlertDescription>
        </InfoAlert>
      )}

      <TabsContent value="overview" className="space-y-6">
        {/* Loading State */}
        {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Platform Statistics Cards */}
          {platformStats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(platformStats.totalUsers)}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Users className="h-3 w-3" />
                    {platformStats.vendors} vendors, {platformStats.riders} riders
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(platformStats.totalOrders)}</div>
                  <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                    <TrendingUp className="h-3 w-3" />
                    {platformStats.completionRate.toFixed(1)}% completion rate
                  </div>
                </CardContent>
              </Card>

              {/* Total Revenue Card - Finance Only */}
              {canViewRevenue && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{platformStats.totalRevenue != null ? formatCurrency(platformStats.totalRevenue) : '—'}</div>
                    <p className="text-xs text-muted-foreground mt-1">Commission from released escrows (all-time)</p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Disputes</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{platformStats.activeDisputes}</div>
                  <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Charts Row */}
          <div className="grid gap-4 md:grid-cols-1">
            {/* Revenue Trend Chart - Finance Only */}
            {canViewRevenue && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Revenue Trend
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </CardTitle>
                  <CardDescription>Revenue realized when escrows are released (profit timeline)</CardDescription>
                </CardHeader>
                <CardContent>
                  {timeSeriesData.length === 0 ? (
                    <EmptyState
                      icon={BarChart3}
                      title="No revenue data"
                      description="Revenue data will appear here once escrows are released (may lag behind order completion)"
                    />
                  ) : (
                    <LineChart
                      data={timeSeriesData as Array<{ date: string; [key: string]: string | number }>}
                      dataKeys={[
                        { key: 'revenue', name: 'Revenue', color: '#3b82f6' },
                      ]}
                      formatYAxis="currency"
                      height={250}
                      showLegend={false}
                    />
                  )}
                </CardContent>
              </Card>
            )}

            {/* Orders Trend Chart - Always Visible */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Orders Trend
                  <Info className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
                <CardDescription>Orders created by customers (business activity timeline)</CardDescription>
              </CardHeader>
              <CardContent>
                {timeSeriesData.length === 0 ? (
                  <EmptyState
                    icon={ShoppingCart}
                    title="No order data"
                    description="Order data will appear here once customers place orders"
                  />
                ) : (
                  <LineChart
                    data={timeSeriesData as Array<{ date: string; [key: string]: string | number }>}
                    dataKeys={[
                      { key: 'orders', name: 'Orders', color: '#10b981' },
                    ]}
                    formatYAxis="number"
                    height={250}
                    showLegend={false}
                  />
                )}
              </CardContent>
            </Card>

            {/* New Users Trend Chart - Always Visible */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  New Users Trend
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
                <CardDescription>New signups over time (based on account creation)</CardDescription>
              </CardHeader>
              <CardContent>
                {timeSeriesData.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No signup data"
                    description="Signup data will appear here once new users join the platform"
                  />
                ) : (
                  <LineChart
                    data={timeSeriesData as Array<{ date: string; [key: string]: string | number }>}
                    dataKeys={[
                      { key: 'users', name: 'New Users', color: '#8b5cf6' },
                    ]}
                    formatYAxis="number"
                    height={250}
                    showLegend={false}
                  />
                )}
              </CardContent>
            </Card>

              {/* Order Status Breakdown */}
              {canViewOrders && orderStats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Order Status Breakdown
                      <PieChartIcon className="h-4 w-4 text-muted-foreground" />
                    </CardTitle>
                    <CardDescription>Distribution of orders by current status (all-time)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PieChart
                      data={[
                        { name: 'Pending', value: orderStats.pendingOrders, color: ORDER_STATUS_COLORS.Pending },
                        { name: 'Processing', value: orderStats.processingOrders, color: ORDER_STATUS_COLORS.Processing },
                        { name: 'Completed', value: orderStats.completedOrders, color: ORDER_STATUS_COLORS.Completed },
                        { name: 'Cancelled', value: orderStats.cancelledOrders, color: ORDER_STATUS_COLORS.Cancelled },
                      ]}
                      height={280}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Conversion Metrics (Time to First Purchase) */}
              {conversionMetrics && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Conversion Metrics
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardTitle>
                    <CardDescription>Time from signup to first purchase analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Conversion Rate</div>
                        <div className="text-2xl font-bold">{conversionMetrics.conversionRate.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {conversionMetrics.purchasers} / {conversionMetrics.totalUsers} users
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Avg Time to Purchase</div>
                        <div className="text-2xl font-bold">
                          {conversionMetrics.averageTimeToFirstPurchaseHours.toFixed(1)}h
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Median: {conversionMetrics.medianTimeToFirstPurchaseHours.toFixed(1)}h
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Within 24 Hours</div>
                        <div className="text-2xl font-bold">
                          {conversionMetrics.timeBucketsPercentage.within24Hours.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {conversionMetrics.timeBuckets.within24Hours} users
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Within 7 Days</div>
                        <div className="text-2xl font-bold">
                          {conversionMetrics.timeBucketsPercentage.within7Days.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {conversionMetrics.timeBuckets.within7Days} users
                        </div>
                      </div>
                    </div>

                    {/* Time Bucket Breakdown */}
                    <div className="mt-6">
                      <h3 className="text-sm font-semibold mb-3">Time to First Purchase Distribution</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-32 text-sm text-muted-foreground">Within 24h</div>
                          <div className="flex-1 bg-secondary rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${conversionMetrics.timeBucketsPercentage.within24Hours}%` }}
                            />
                          </div>
                          <div className="w-16 text-sm text-right">
                            {conversionMetrics.timeBucketsPercentage.within24Hours.toFixed(1)}%
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-32 text-sm text-muted-foreground">Within 7 days</div>
                          <div className="flex-1 bg-secondary rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${conversionMetrics.timeBucketsPercentage.within7Days}%` }}
                            />
                          </div>
                          <div className="w-16 text-sm text-right">
                            {conversionMetrics.timeBucketsPercentage.within7Days.toFixed(1)}%
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-32 text-sm text-muted-foreground">Within 30 days</div>
                          <div className="flex-1 bg-secondary rounded-full h-2">
                            <div 
                              className="bg-yellow-500 h-2 rounded-full" 
                              style={{ width: `${conversionMetrics.timeBucketsPercentage.within30Days}%` }}
                            />
                          </div>
                          <div className="w-16 text-sm text-right">
                            {conversionMetrics.timeBucketsPercentage.within30Days.toFixed(1)}%
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-32 text-sm text-muted-foreground">Over 30 days</div>
                          <div className="flex-1 bg-secondary rounded-full h-2">
                            <div 
                              className="bg-orange-500 h-2 rounded-full" 
                              style={{ width: `${conversionMetrics.timeBucketsPercentage.over30Days}%` }}
                            />
                          </div>
                          <div className="w-16 text-sm text-right">
                            {conversionMetrics.timeBucketsPercentage.over30Days.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Products Tab Discovery (HomeScreen tab visits) */}
              {productsTabAnalytics && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Products Tab Discovery
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardTitle>
                    <CardDescription>How users find and return to the Products tab on the home screen</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Unique Visitors</div>
                        <div className="text-2xl font-bold">{formatNumber(productsTabAnalytics.uniqueVisitors)}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatNumber(productsTabAnalytics.totalVisits)} total visits in range
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">First-Time Visitors</div>
                        <div className="text-2xl font-bold">{formatNumber(productsTabAnalytics.firstTimeVisitorsInRange)}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {productsTabAnalytics.adoptionRate.toFixed(1)}% of all users have visited
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Repeat Visit Rate</div>
                        <div className="text-2xl font-bold">{productsTabAnalytics.repeatVisitRate.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatNumber(productsTabAnalytics.repeatVisitors)} returning visitors
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Visits per Visitor</div>
                        <div className="text-2xl font-bold">{productsTabAnalytics.visitsPerVisitor.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatNumber(productsTabAnalytics.allTimeUniqueVisitors)} all-time visitors
                        </div>
                      </div>
                    </div>

                    {/* Signup -> first visit latency */}
                    <div className="mt-6">
                      <h3 className="text-sm font-semibold mb-1">Time to First Visit (after signup)</h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        Median {productsTabAnalytics.discoveryLatency.medianHours}h · Mean {productsTabAnalytics.discoveryLatency.meanHours}h · {formatNumber(productsTabAnalytics.discoveryLatency.sampleSize)} users
                      </p>
                      {(() => {
                        const b = productsTabAnalytics.discoveryLatency.buckets;
                        const total = b.within24h + b.within7d + b.within30d + b.over30d || 1;
                        const rows = [
                          { label: 'Within 24h', count: b.within24h, color: 'bg-green-500' },
                          { label: 'Within 7 days', count: b.within7d, color: 'bg-blue-500' },
                          { label: 'Within 30 days', count: b.within30d, color: 'bg-yellow-500' },
                          { label: 'Over 30 days', count: b.over30d, color: 'bg-orange-500' },
                        ];
                        return (
                          <div className="space-y-3">
                            {rows.map(row => (
                              <div key={row.label} className="flex items-center gap-3">
                                <div className="w-32 text-sm text-muted-foreground">{row.label}</div>
                                <div className="flex-1 bg-secondary rounded-full h-2">
                                  <div
                                    className={`${row.color} h-2 rounded-full`}
                                    style={{ width: `${(row.count / total) * 100}%` }}
                                  />
                                </div>
                                <div className="w-16 text-sm text-right">
                                  {((row.count / total) * 100).toFixed(1)}%
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top Vendors by Orders (Order-Count-Based Ranking) */}
              {vendorsByOrders && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Top Vendors by Orders
                      <Award className="h-4 w-4 text-muted-foreground" />
                    </CardTitle>
                    <CardDescription>Vendors ranked by completed order count (not revenue)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {vendorsByOrders.slice(0, 10).map((vendor, index) => (
                        <div key={vendor.vendorId} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-sm font-bold text-blue-600">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{vendor.vendorName}</p>
                              <p className="text-sm text-muted-foreground">{vendor.completedOrders} completed orders</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{vendor.totalRevenue != null ? formatCurrency(vendor.totalRevenue) : '—'}</div>
                            <p className="text-xs text-muted-foreground">Avg: {vendor.averageOrderValue != null ? formatCurrency(vendor.averageOrderValue) : '—'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Auction Analytics Summary */}
              {auctionAnalytics && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Auction Performance
                      <Gavel className="h-4 w-4 text-muted-foreground" />
                    </CardTitle>
                    <CardDescription>Overview of live and timed auction performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Total Auctions</div>
                        <div className="text-2xl font-bold">{formatNumber(auctionAnalytics.totalAuctions)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Sold Auctions</div>
                        <div className="text-2xl font-bold">{formatNumber(auctionAnalytics.soldAuctions)}</div>
                        <div className="text-xs text-green-600 mt-1">
                          {auctionAnalytics.sellThroughRate.toFixed(1)}% sell-through
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Avg Bids / Auction</div>
                        <div className="text-2xl font-bold">
                          {auctionAnalytics.averageBidsPerAuction.toFixed(1)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Auction Commission</div>
                        <div className="text-2xl font-bold">
                          {auctionAnalytics.totalAuctionRevenue != null ? formatCurrency(auctionAnalytics.totalAuctionRevenue) : '—'}
                        </div>
                      </div>
                    </div>

                    {/* Top Auctions Table (compact) */}
                    <div className="mt-6">
                      <h3 className="text-sm font-semibold mb-2">Top Auctions</h3>
                      {auctionAnalytics.topAuctions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No auction data for this period.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="text-left py-2 pr-4">Title</th>
                                <th className="text-right py-2 pr-4">Final Price</th>
                                <th className="text-right py-2 pr-4">Bids</th>
                                <th className="text-right py-2">Bidders</th>
                              </tr>
                            </thead>
                            <tbody>
                              {auctionAnalytics.topAuctions.slice(0, 5).map((auction) => (
                                <tr key={auction.auctionId} className="border-b border-border/50">
                                  <td className="py-2 pr-4">
                                    <div className="font-medium line-clamp-1">{auction.title}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {auction.categoryName || 'Uncategorised'}
                                    </div>
                                  </td>
                                  <td className="py-2 pr-4 text-right">
                                    {formatCurrency(auction.revenue)}
                                  </td>
                                  <td className="py-2 pr-4 text-right">
                                    {formatNumber(auction.totalBids)}
                                  </td>
                                  <td className="py-2 text-right">
                                    {formatNumber(auction.uniqueBidders)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
          </div>

          {/* Analytics Summary */}
          {analyticsSummary && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Top Categories</CardTitle>
                  <CardDescription>Best performing product categories by sales volume</CardDescription>
                </CardHeader>
                <CardContent>
                  {!analyticsSummary.topCategories || analyticsSummary.topCategories.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No category data available</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {analyticsSummary.topCategories.slice(0, 5).map((category, index) => (
                        <div key={category.category || `category-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                          <div>
                            <p className="font-medium capitalize">{category.category || 'Uncategorized'}</p>
                            <p className="text-sm text-muted-foreground">{category.orderCount || 0} orders</p>
                          </div>
                        </div>
                        {canViewRevenue && (
                          <span className="font-bold">{category.revenue != null ? formatCurrency(category.revenue) : '—'}</span>
                        )}
                      </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Vendors</CardTitle>
                  <CardDescription>Ranked by platform commission generated</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analyticsSummary.topVendors.slice(0, 5).map((vendor, index) => (
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
                        {canViewRevenue && (
                          <span className="font-bold">{vendor.revenue != null ? formatCurrency(vendor.revenue) : '—'}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Key Metrics */}
          {analyticsSummary && (
            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
                <CardDescription>Platform performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`grid gap-4 ${canViewRevenue ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2'}`}>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{formatNumber(analyticsSummary.totalOrders)}</div>
                    <div className="text-sm text-muted-foreground mt-1">Total Orders</div>
                  </div>
                  {canViewRevenue && (
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{analyticsSummary.totalRevenue != null ? formatCurrency(analyticsSummary.totalRevenue) : '—'}</div>
                      <div className="text-sm text-muted-foreground mt-1">Platform Revenue</div>
                    </div>
                  )}
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{formatNumber(analyticsSummary.totalUsers)}</div>
                    <div className="text-sm text-muted-foreground mt-1">Total Users</div>
                  </div>
                  {canViewRevenue && (
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{analyticsSummary.averageOrderValue != null ? formatCurrency(analyticsSummary.averageOrderValue) : '—'}</div>
                      <div className="text-sm text-muted-foreground mt-1">Avg Commission / Order</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
      </TabsContent>

      <TabsContent value="platform" className="space-y-6">
        {platformListingsError && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
            {platformListingsError}
          </div>
        )}

        {platformListingsLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : platformListings ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Listed Inventory & GMV
                  <Layers className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
                <CardDescription>
                  Snapshot of what's currently live on the platform — counts and the value of that inventory
                  if every listing sold at its current price (not actual sales revenue)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Package className="h-4 w-4" />
                      Products Listed
                    </div>
                    <div className="text-2xl font-bold">{formatNumber(platformListings.products.total)}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatNumber(platformListings.products.draft)} drafts · {formatNumber(platformListings.products.multiItemListings)} multi-item
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Wrench className="h-4 w-4" />
                      Services Listed
                    </div>
                    <div className="text-2xl font-bold">{formatNumber(platformListings.services.total)}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatNumber(platformListings.services.draft)} drafts
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Gavel className="h-4 w-4" />
                      Auctions Open
                    </div>
                    <div className="text-2xl font-bold">{formatNumber(platformListings.auctions.open)}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatNumber(platformListings.auctions.scheduled)} scheduled · {formatNumber(platformListings.auctions.active)} active
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg bg-primary/5">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <DollarSign className="h-4 w-4" />
                      Total Listed GMV
                    </div>
                    <div className="text-2xl font-bold">
                      {platformListings.totalListedGMV != null ? formatCurrency(platformListings.totalListedGMV) : '—'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Products + services + open auctions</div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm font-medium">Products</p>
                    <p className="text-lg font-bold mt-1">
                      {platformListings.products.listedValue != null ? formatCurrency(platformListings.products.listedValue) : '—'}
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm font-medium">Services</p>
                    <p className="text-lg font-bold mt-1">
                      {platformListings.services.listedValue != null ? formatCurrency(platformListings.services.listedValue) : '—'}
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm font-medium">Open Auctions</p>
                    <p className="text-lg font-bold mt-1">
                      {platformListings.auctions.listedValue != null ? formatCurrency(platformListings.auctions.listedValue) : '—'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <EmptyState
            icon={Layers}
            title="No listings data"
            description="Platform inventory data will appear here once products, services, or auctions are listed"
          />
        )}

        {vendorsRidersError && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
            {vendorsRidersError}
          </div>
        )}

        {vendorsRidersLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : vendorsRiders && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Vendors
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
                <CardDescription>Registered sellers and their account status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatNumber(vendorsRiders.vendors.total)}</div>
                <p className="text-xs text-muted-foreground mb-4">registered vendors</p>
                <div className="space-y-2 text-sm">
                  {[
                    { label: 'Active', value: vendorsRiders.vendors.active, color: 'text-green-600' },
                    { label: 'Suspended', value: vendorsRiders.vendors.suspended, color: 'text-red-600' },
                    { label: 'Verified (badge)', value: vendorsRiders.vendors.verified, color: 'text-blue-600' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className={`font-bold ${row.color}`}>{formatNumber(row.value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Riders
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
                <CardDescription>Registered riders and their verification status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatNumber(vendorsRiders.riders.totalRegistered)}</div>
                <p className="text-xs text-muted-foreground mb-4">registered riders</p>

                <h3 className="text-sm font-semibold mb-2">Verified riders ({formatNumber(vendorsRiders.riders.verified.total)})</h3>
                <div className="space-y-2 text-sm mb-4">
                  {[
                    { label: 'Active', value: vendorsRiders.riders.verified.active, color: 'text-green-600' },
                    { label: 'Suspended', value: vendorsRiders.riders.verified.suspended, color: 'text-yellow-600' },
                    { label: 'Terminated', value: vendorsRiders.riders.verified.terminated, color: 'text-red-600' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className={`font-bold ${row.color}`}>{formatNumber(row.value)}</span>
                    </div>
                  ))}
                </div>

                <h3 className="text-sm font-semibold mb-2">Verification applications</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: 'In progress', value: vendorsRiders.riders.applications.inProgress },
                    { label: 'Under review', value: vendorsRiders.riders.applications.underReview },
                    { label: 'Verified', value: vendorsRiders.riders.applications.verified },
                    { label: 'Rejected', value: vendorsRiders.riders.applications.rejected },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-bold">{formatNumber(row.value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </TabsContent>

      <TabsContent value="live-sales" className="space-y-6">
        <LiveSalesAnalytics
          data={liveSalesAnalytics}
          loading={liveSalesLoading}
          error={liveSalesError}
        />
      </TabsContent>
    </Tabs>
  );
}

