'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ordersAPI, type Order, type OrderStats } from '@/lib/api/orders';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Search, Package, Clock, CheckCircle, XCircle, Eye, MoreVertical, ShoppingCart, RefreshCw, AlertCircle } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner, SkeletonTable } from '@/components/ui/loading';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ExportButton } from '@/components/ui/export-button';
import { formatCurrency, formatDate } from '@/lib/utils/formatting';
import { formatDateForExport, formatCurrencyForExport } from '@/lib/utils/export';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

export default function OrdersPage() {
  const { isSuperAdmin, hasPermission } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'processing' | 'completed' | 'cancelled'>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Dialog states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<'pending' | 'processing' | 'completed' | 'cancelled'>('processing');
  const [cancelReason, setCancelReason] = useState('');

  const canViewOrders = isSuperAdmin || hasPermission('view_orders');

  // Validate and correct page number
  useEffect(() => {
    if (total > 0 && page > Math.ceil(total / limit)) {
      setPage(Math.max(1, Math.ceil(total / limit)));
    }
  }, [total, page, limit]);

  useEffect(() => {
    if (canViewOrders) {
      fetchStats();
      fetchOrders();
    }
  }, [canViewOrders, page, selectedStatus, searchQuery]);

  const fetchStats = async () => {
    try {
      const statsData = await ordersAPI.getStats();
      setStats(statsData);
    } catch (err: any) {
      console.error('Failed to fetch order stats:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load order statistics',
        variant: 'destructive',
      });
    }
  };

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await ordersAPI.getOrders({
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        search: searchQuery || undefined,
        page,
        limit,
      });
      setOrders(response.orders);
      setTotal(response.total);
    } catch (err: any) {
      console.error('Failed to fetch orders:', err);
      setError(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const handleViewDetails = async (orderId: string) => {
    try {
      setIsActionLoading(orderId);
      const order = await ordersAPI.getOrderById(orderId);
      setSelectedOrder(order);
      setIsDetailsDialogOpen(true);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load order details',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleUpdateStatusClick = (orderId: string, status: 'pending' | 'processing' | 'completed' | 'cancelled') => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setSelectedOrder(order);
      setNewStatus(status);
      setIsStatusDialogOpen(true);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;

    try {
      setIsActionLoading(selectedOrder.id);
      await ordersAPI.updateOrderStatus(selectedOrder.id, newStatus);
      await fetchOrders();
      await fetchStats();
      setIsStatusDialogOpen(false);
      setSelectedOrder(null);
      toast({
        title: 'Success',
        description: `Order ${selectedOrder.orderNumber} status updated to ${newStatus}`,
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to update order status',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleCancelClick = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setSelectedOrder(order);
      setIsCancelDialogOpen(true);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;

    try {
      setIsActionLoading(selectedOrder.id);
      await ordersAPI.cancelOrder(selectedOrder.id, cancelReason || undefined);
      await fetchOrders();
      await fetchStats();
      setIsCancelDialogOpen(false);
      setCancelReason('');
      setSelectedOrder(null);
      toast({
        title: 'Success',
        description: `Order ${selectedOrder.orderNumber} has been cancelled`,
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to cancel order',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(null);
    }
  };

  const statsCards = stats ? [
    {
      label: 'Total Orders',
      value: formatNumber(stats.totalOrders),
      color: 'bg-blue-500',
      icon: Package,
    },
    {
      label: 'Pending',
      value: formatNumber(stats.pendingOrders),
      color: 'bg-yellow-500',
      icon: Clock,
    },
    {
      label: 'Completed',
      value: formatNumber(stats.completedOrders),
      color: 'bg-green-500',
      icon: CheckCircle,
    },
    {
      label: 'Cancelled',
      value: formatNumber(stats.cancelledOrders),
      color: 'bg-red-500',
      icon: XCircle,
    },
  ] : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  if (!canViewOrders) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">You don't have permission to view orders.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Order Management</h2>
          <p className="text-muted-foreground mt-2">
            Monitor and manage all platform orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              setIsLoading(true);
              await fetchOrders();
              await fetchStats();
              setIsLoading(false);
            }}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <ExportButton
            data={orders.map(order => ({
              'Order Number': order.orderNumber,
              'Customer': order.customer,
              'Customer Email': order.customerEmail || '',
              'Vendor': order.vendor,
              'Amount': formatCurrencyForExport(order.amount),
              'Type': order.type,
              'Status': order.status,
              'Date': formatDateForExport(order.createdAt),
            }))}
            filename="orders"
            headers={['Order Number', 'Customer', 'Customer Email', 'Vendor', 'Amount', 'Type', 'Status', 'Date']}
            disabled={isLoading || orders.length === 0}
          />
        </div>
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

      {/* Orders List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle>All Orders</CardTitle>
              <CardDescription>View and manage all platform orders</CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10 w-full sm:w-[300px]"
                />
              </div>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value as any);
                  setPage(1);
                }}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Loading State */}
          {isLoading ? (
            <SkeletonTable rows={5} />
          ) : orders.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="No orders found"
              description={
                searchQuery || selectedStatus !== 'all'
                  ? "No orders match your current filters. Try adjusting your search or status filter."
                  : "There are no orders in the system yet."
              }
            />
          ) : (
            <>
              {/* Orders Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="pb-3 font-medium text-sm text-muted-foreground">Order #</th>
                      <th className="pb-3 font-medium text-sm text-muted-foreground">Customer</th>
                      <th className="pb-3 font-medium text-sm text-muted-foreground">Vendor</th>
                      <th className="pb-3 font-medium text-sm text-muted-foreground">Amount</th>
                      <th className="pb-3 font-medium text-sm text-muted-foreground">Type</th>
                      <th className="pb-3 font-medium text-sm text-muted-foreground">Status</th>
                      <th className="pb-3 font-medium text-sm text-muted-foreground">Date</th>
                      <th className="pb-3 font-medium text-sm text-muted-foreground text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? null : (
                      orders.map((order) => (
                        <tr key={order.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-4">
                            <span className="font-mono text-sm font-medium">{order.orderNumber}</span>
                          </td>
                          <td className="py-4">
                            <div>
                              <p className="font-medium">{order.customer}</p>
                              {order.customerEmail && (
                                <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 text-sm">{order.vendor}</td>
                          <td className="py-4 font-medium">{formatCurrency(order.amount)}</td>
                          <td className="py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-purple-100 text-purple-800">
                              {order.type}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="py-4 text-sm text-muted-foreground">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      aria-label="View Details"
                                      onClick={() => handleViewDetails(order.id)}
                                      disabled={isActionLoading === order.id}
                                    >
                                      {isActionLoading === order.id ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                                      ) : (
                                        <Eye className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>View Details</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="More Options"
                                    disabled={isActionLoading === order.id}
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {order.status !== 'completed' && order.status !== 'cancelled' && (
                                    <>
                                  {order.status === 'pending' && (
                                    <DropdownMenuItem
                                      onClick={() => handleUpdateStatusClick(order.id, 'processing')}
                                    >
                                      <Clock className="mr-2 h-4 w-4" />
                                      Mark as Processing
                                    </DropdownMenuItem>
                                  )}
                                  {order.status === 'processing' && (
                                    <DropdownMenuItem
                                      onClick={() => handleUpdateStatusClick(order.id, 'completed')}
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Mark as Completed
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => handleCancelClick(order.id)}
                                    className="text-destructive"
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Cancel Order
                                  </DropdownMenuItem>
                                    </>
                                  )}
                                  {order.status === 'cancelled' && (
                                    <DropdownMenuItem disabled>
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Order Cancelled
                                    </DropdownMenuItem>
                                  )}
                                  {order.status === 'completed' && (
                                    <DropdownMenuItem disabled>
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Order Completed
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {total > limit && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} orders
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogClose onClose={() => setIsDetailsDialogOpen(false)} />
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              View detailed information about this order
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedOrder.orderNumber}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(selectedOrder.createdAt)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Customer</p>
                  <p className="text-sm font-medium">{selectedOrder.customer}</p>
                  {selectedOrder.customerEmail && (
                    <p className="text-sm text-muted-foreground">{selectedOrder.customerEmail}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Vendor</p>
                  <p className="text-sm font-medium">{selectedOrder.vendor}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Amount</p>
                  <p className="text-lg font-bold">{formatCurrency(selectedOrder.amount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Type</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                    {selectedOrder.type}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Order Date</p>
                  <p className="text-sm">{formatDate(selectedOrder.createdAt)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Confirmation Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogClose onClose={() => {
            setIsStatusDialogOpen(false);
            setSelectedOrder(null);
          }} />
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Are you sure you want to update the status of order {selectedOrder?.orderNumber}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">New Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-md bg-background"
                disabled={isActionLoading !== null}
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm text-muted-foreground">
                Current status: <span className="font-medium capitalize">{selectedOrder?.status}</span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsStatusDialogOpen(false);
                setSelectedOrder(null);
              }}
              disabled={isActionLoading !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={isActionLoading !== null}
            >
              {isActionLoading ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Order Confirmation Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogClose onClose={() => {
            setIsCancelDialogOpen(false);
            setCancelReason('');
            setSelectedOrder(null);
          }} />
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel order {selectedOrder?.orderNumber}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Cancellation Reason (Optional)</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter reason for cancellation..."
                rows={3}
                className="w-full px-3 py-2 border rounded-md bg-background"
                disabled={isActionLoading !== null}
              />
            </div>
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="text-sm text-destructive">
                  <p className="font-medium mb-1">Warning: This action cannot be undone</p>
                  <p>The order will be marked as cancelled and refunds may be processed.</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCancelDialogOpen(false);
                setCancelReason('');
                setSelectedOrder(null);
              }}
              disabled={isActionLoading !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCancelOrder}
              disabled={isActionLoading !== null}
              variant="destructive"
            >
              {isActionLoading ? 'Cancelling...' : 'Cancel Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
