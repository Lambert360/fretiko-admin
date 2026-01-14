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
import { analyticsAPI, type PlatformStats, type AnalyticsSummary, type TimeSeriesData } from '@/lib/api/analytics';
import { InfoAlert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart } from '@/components/charts/LineChart';
import { EmptyState } from '@/components/ui/empty-state';
import { BarChart3, TrendingUp, Users, ShoppingCart, DollarSign, AlertCircle, Calendar, Info } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils/formatting';

export default function AnalyticsPage() {
  const { isSuperAdmin, hasPermission } = useAuth();
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      
      const [stats, summary, timeSeries] = await Promise.all([
        analyticsAPI.getPlatformStats(),
        analyticsAPI.getAnalyticsSummary(),
        analyticsAPI.getTimeSeries(dateRange.start, dateRange.end, period, new Date().getTimezoneOffset()),
      ]);

      setPlatformStats(stats);
      setAnalyticsSummary(summary);
      setTimeSeriesData(timeSeries);
    } catch (err: any) {
      console.error('Failed to fetch analytics:', err);
      setError(err.response?.data?.message || 'Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

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
    <div className="space-y-6">
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
    </div>
  );
}

