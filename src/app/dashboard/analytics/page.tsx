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
import { analyticsAPI, type PlatformStats, type AnalyticsSummary, type TimeSeriesData, type AuctionAnalyticsSummary, type ConversionMetrics, type VendorByOrders, type LiveSalesAnalytics as LiveSalesAnalyticsData } from '@/lib/api/analytics';
import { InfoAlert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart } from '@/components/charts/LineChart';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LiveSalesAnalytics from '@/components/LiveSalesAnalytics';
import { BarChart3, TrendingUp, Users, ShoppingCart, DollarSign, AlertCircle, Calendar, Info, Gavel, Clock, UserCheck, Award, Video } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils/formatting';

export default function AnalyticsPage() {
  const { isSuperAdmin, hasPermission } = useAuth();
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [auctionAnalytics, setAuctionAnalytics] = useState<AuctionAnalyticsSummary | null>(null);
  const [conversionMetrics, setConversionMetrics] = useState<ConversionMetrics | null>(null);
  const [vendorsByOrders, setVendorsByOrders] = useState<VendorByOrders[] | null>(null);
  const [liveSalesAnalytics, setLiveSalesAnalytics] = useState<LiveSalesAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [liveSalesLoading, setLiveSalesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveSalesError, setLiveSalesError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA'),
    end: new Date().toLocaleDateString('en-CA'),
  });

  const canViewAnalytics = isSuperAdmin || hasPermission('view_platform_stats');
  const canViewRevenue = isSuperAdmin || hasPermission('view_revenue');

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
      
      const [stats, summary, timeSeries, auctions, conversion, vendors] = await Promise.all([
        analyticsAPI.getPlatformStats(),
        analyticsAPI.getAnalyticsSummary(),
        analyticsAPI.getTimeSeries(dateRange.start, dateRange.end, period, new Date().getTimezoneOffset()),
        analyticsAPI.getAuctionAnalyticsSummary(dateRange.start, dateRange.end),
        analyticsAPI.getConversionMetrics(),
        analyticsAPI.getTopVendorsByOrders(),
      ]);

      setPlatformStats(stats);
      setAnalyticsSummary(summary);
      setTimeSeriesData(timeSeries);
      setAuctionAnalytics(auctions);
      setConversionMetrics(conversion);
      setVendorsByOrders(vendors);
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
        <Button onClick={fetchAllData}>
          <Calendar className="h-4 w-4 mr-2" />
          Apply
        </Button>
      </div>

      {/* Tabs */}
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Overview
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
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(platformStats.totalRevenue)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Platform revenue</p>
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
                            <div className="font-bold">{formatCurrency(vendor.totalRevenue)}</div>
                            <p className="text-xs text-muted-foreground">Avg: {formatCurrency(vendor.averageOrderValue)}</p>
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
                        <div className="text-sm text-muted-foreground">Auction Revenue</div>
                        <div className="text-2xl font-bold">
                          {formatCurrency(auctionAnalytics.totalAuctionRevenue)}
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
                                <th className="text-right py-2 pr-4">Revenue</th>
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
                  <CardDescription>Best performing product categories</CardDescription>
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
                          <span className="font-bold">{formatCurrency(category.revenue || 0)}</span>
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
                  <CardDescription>Highest performing vendors</CardDescription>
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
                          <span className="font-bold">{formatCurrency(vendor.revenue)}</span>
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
                      <div className="text-2xl font-bold">{formatCurrency(analyticsSummary.totalRevenue)}</div>
                      <div className="text-sm text-muted-foreground mt-1">Total Revenue</div>
                    </div>
                  )}
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{formatNumber(analyticsSummary.totalUsers)}</div>
                    <div className="text-sm text-muted-foreground mt-1">Total Users</div>
                  </div>
                  {canViewRevenue && (
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{formatCurrency(analyticsSummary.averageOrderValue)}</div>
                      <div className="text-sm text-muted-foreground mt-1">Avg Order Value</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
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

