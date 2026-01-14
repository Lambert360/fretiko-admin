'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardAPI, type DashboardOverview } from '@/lib/api/dashboard';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  ShoppingCart,
  MessageSquare,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Package,
  Truck,
  BarChart3,
  UserPlus,
  FileText,
  Mail,
  ClipboardList
} from 'lucide-react';
import { LoadingPage } from '@/components/ui/loading';

export default function DashboardPage() {
  const router = useRouter();
  const { staff, isSuperAdmin, hasPermission } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await dashboardAPI.getOverview();
      setDashboardData(data);
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  const stats = dashboardData ? [
    {
      title: 'Total Users',
      value: formatNumber(dashboardData.stats.totalUsers),
      change: formatChange(dashboardData.stats.userChange),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      isPositive: dashboardData.stats.userChange >= 0,
    },
    {
      title: 'Total Orders',
      value: formatNumber(dashboardData.stats.totalOrders),
      change: formatChange(dashboardData.stats.orderChange),
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      isPositive: dashboardData.stats.orderChange >= 0,
    },
    {
      title: 'Active Disputes',
      value: dashboardData.stats.activeDisputes.toString(),
      change: formatChange(dashboardData.stats.disputeChange),
      icon: MessageSquare,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      isPositive: dashboardData.stats.disputeChange <= 0, // Negative change is good for disputes
    },
    // Only show revenue to users with view_revenue permission or super admins
    ...(isSuperAdmin || hasPermission('view_revenue') ? [{
      title: 'Revenue',
      value: formatCurrency(dashboardData.stats.revenue),
      change: formatChange(dashboardData.stats.revenueChange),
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      isPositive: dashboardData.stats.revenueChange >= 0,
    }] : []),
  ] : [];

  const recentActivities = dashboardData?.recentActivities || [];

  // Quick Actions based on permissions
  const quickActions = [
    {
      title: 'View All Users',
      description: 'Manage user accounts',
      icon: Users,
      href: '/dashboard/users',
      permission: 'view_users',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Pending Disputes',
      description: 'Resolve customer issues',
      icon: MessageSquare,
      href: '/dashboard/disputes',
      permission: 'view_disputes',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      badge: dashboardData?.stats.activeDisputes,
    },
    {
      title: 'Financial Reports',
      description: 'View revenue analytics',
      icon: DollarSign,
      href: '/dashboard/finance',
      permission: 'view_revenue',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Content Moderation',
      description: 'Approve products & services',
      icon: Package,
      href: '/dashboard/content',
      permission: 'view_products',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Orders Management',
      description: 'Track and manage orders',
      icon: ShoppingCart,
      href: '/dashboard/orders',
      permission: 'view_orders',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    },
    {
      title: 'Logistics',
      description: 'Manage riders & deliveries',
      icon: Truck,
      href: '/dashboard/logistics',
      permission: 'view_riders',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      title: 'Analytics',
      description: 'Platform statistics',
      icon: BarChart3,
      href: '/dashboard/analytics',
      permission: 'view_platform_stats',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
    },
    {
      title: 'Add Staff',
      description: 'Create new staff account',
      icon: UserPlus,
      href: '/dashboard/staff',
      permission: 'create_staff',
      roles: ['super_admin', 'department_head'],
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 dark:bg-pink-900/20',
    },
    {
      title: 'Memos',
      description: 'Internal communications',
      icon: Mail,
      href: '/dashboard/memos',
      permission: 'view_memos',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50 dark:bg-teal-900/20',
    },
    {
      title: 'Reports',
      description: 'View internal reports',
      icon: FileText,
      href: '/dashboard/reports',
      permission: 'view_reports',
      color: 'text-slate-600',
      bgColor: 'bg-slate-50 dark:bg-slate-900/20',
    },
    {
      title: 'Audit Logs',
      description: 'View staff activity logs',
      icon: ClipboardList,
      href: '/dashboard/audit',
      permission: 'view_staff_logs',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    },
  ].filter(action => {
    // Super admins see all actions
    if (isSuperAdmin) {
      return true;
    }
    
    // Filter by permission
    if (action.permission && !hasPermission(action.permission)) {
      return false;
    }
    
    // Filter by role if specified (in addition to permission check)
    if (action.roles && staff) {
      return action.roles.includes(staff.role);
    }
    
    return true;
  });

  return (
    <ErrorBoundary>
      <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Dashboard Overview
        </h2>
        <p className="text-muted-foreground mt-2">
          Welcome to the Fretiko Internal Tool, {staff?.fullName}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <LoadingPage message="Loading dashboard data..." />
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <div className={`rounded-full p-2 ${stat.bgColor}`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className={stat.isPositive ? 'text-green-600' : 'text-red-600'}>
                        {stat.change}
                      </span>{' '}
                      from last month
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest platform activities</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent activities
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-4">
                        <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-2">
                          <TrendingUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            {quickActions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No quick actions available</p>
                <p className="text-xs mt-1">You don't have permission to access any quick actions</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.href}
                      variant="outline"
                      className="w-full justify-start h-auto p-4 hover:bg-accent transition-colors"
                      onClick={() => router.push(action.href)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className={`rounded-lg p-2 ${action.bgColor}`}>
                          <Icon className={`h-5 w-5 ${action.color}`} />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{action.title}</p>
                            {action.badge !== undefined && action.badge > 0 && (
                              <span className="px-1.5 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                {action.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
          </div>

          {/* Role-based message */}
          {isSuperAdmin && (
            <Card className="border-primary bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <AlertCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Super Admin Access</p>
                    <p className="text-sm text-muted-foreground">
                      You have full access to all features and settings.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
      </div>
    </ErrorBoundary>
  );
}
