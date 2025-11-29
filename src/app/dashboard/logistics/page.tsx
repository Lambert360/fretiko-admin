'use client';

/**
 * Logistics Management Page
 * 
 * Manages riders and deliveries
 * Features:
 * - View all riders with performance metrics
 * - Track deliveries in real-time
 * - Assign riders to deliveries
 * - Monitor delivery statistics
 * 
 * Requires: view_riders permission
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logisticsAPI, type Rider, type Delivery, type LogisticsStats } from '@/lib/api/logistics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Truck, Package, Clock, CheckCircle, AlertCircle, MapPin, User, Star, Eye, Loader2, MoreVertical } from 'lucide-react';
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

export default function LogisticsPage() {
  const { isSuperAdmin, hasPermission } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'riders' | 'deliveries'>('riders');
  const [stats, setStats] = useState<LogisticsStats | null>(null);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [dialogRiders, setDialogRiders] = useState<Rider[]>([]); // Separate list for dialog dropdown
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [riderStatusFilter, setRiderStatusFilter] = useState<'active' | 'inactive' | 'all'>('all');
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState<'all' | Delivery['status']>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Dialog states
  const [riderDetailsDialog, setRiderDetailsDialog] = useState<{ open: boolean; rider: Rider | null }>({ open: false, rider: null });
  const [deliveryDetailsDialog, setDeliveryDetailsDialog] = useState<{ open: boolean; delivery: Delivery | null }>({ open: false, delivery: null });
  const [assignRiderDialog, setAssignRiderDialog] = useState<{ open: boolean; delivery: Delivery | null }>({ open: false, delivery: null });
  const [selectedRiderId, setSelectedRiderId] = useState<string>('');
  const [statusUpdateDialog, setStatusUpdateDialog] = useState<{ open: boolean; delivery: Delivery | null; newStatus: Delivery['status'] | null }>({ open: false, delivery: null, newStatus: null });
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [isLoadingRiders, setIsLoadingRiders] = useState(false);

  const canViewLogistics = isSuperAdmin || hasPermission('view_riders');
  const canAssignRider = isSuperAdmin || hasPermission('assign_riders');
  const canUpdateDeliveryStatus = isSuperAdmin || hasPermission('update_delivery_status');

  const handleImageError = (riderId: string) => {
    setImageErrors(prev => new Set(prev).add(riderId));
  };

  useEffect(() => {
    if (canViewLogistics) {
      fetchStats();
      if (activeTab === 'riders') {
        fetchRiders();
      } else {
        fetchDeliveries();
      }
    }
  }, [canViewLogistics, activeTab, page, riderStatusFilter, deliveryStatusFilter, searchQuery]);

  // Fetch riders when assign rider dialog opens (if not already loaded)
  useEffect(() => {
    if (assignRiderDialog.open && dialogRiders.length === 0 && !isLoadingRiders && canViewLogistics) {
      fetchDialogRiders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignRiderDialog.open, canViewLogistics]);

  const fetchStats = async () => {
    try {
      const statsData = await logisticsAPI.getLogisticsStats();
      setStats(statsData);
    } catch (err: any) {
      console.error('Failed to fetch logistics stats:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load statistics',
        variant: 'destructive',
      });
    }
  };

  const fetchRiders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await logisticsAPI.getRiders({
        status: riderStatusFilter,
        search: searchQuery || undefined,
        page,
        limit,
      });
      setRiders(response.riders);
      setTotal(response.total);
    } catch (err: any) {
      console.error('Failed to fetch riders:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load riders';
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

  const fetchDialogRiders = async () => {
    try {
      setIsLoadingRiders(true);
      const response = await logisticsAPI.getRiders({
        status: 'active', // Always fetch active riders for dialog
        search: undefined,
        page: 1,
        limit: 100, // Get more riders for the dropdown
      });
      setDialogRiders(response.riders);
    } catch (err: any) {
      console.error('Failed to fetch riders for dialog:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load riders',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingRiders(false);
    }
  };

  const fetchDeliveries = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await logisticsAPI.getDeliveries({
        status: deliveryStatusFilter !== 'all' ? deliveryStatusFilter : undefined,
        search: searchQuery || undefined,
        page,
        limit,
      });
      setDeliveries(response.deliveries);
      setTotal(response.total);
    } catch (err: any) {
      console.error('Failed to fetch deliveries:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load deliveries';
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

  const getStatusBadge = (status: Delivery['status']) => {
    const variants: Record<Delivery['status'], { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'outline', label: 'Pending' },
      assigned: { variant: 'secondary', label: 'Assigned' },
      picked_up: { variant: 'default', label: 'Picked Up' },
      in_transit: { variant: 'default', label: 'In Transit' },
      delivered: { variant: 'default', label: 'Delivered' },
      cancelled: { variant: 'destructive', label: 'Cancelled' },
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleAssignRider = async () => {
    if (!assignRiderDialog.delivery || !selectedRiderId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a rider',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsActionLoading(assignRiderDialog.delivery.id);
      await logisticsAPI.assignRider(assignRiderDialog.delivery.id, selectedRiderId);
      setAssignRiderDialog({ open: false, delivery: null });
      setSelectedRiderId('');
      await fetchDeliveries();
      await fetchStats();
      toast({
        title: 'Success',
        description: 'Rider assigned successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to assign rider',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleUpdateStatus = async () => {
    if (!statusUpdateDialog.delivery || !statusUpdateDialog.newStatus) {
      return;
    }

    try {
      setIsActionLoading(statusUpdateDialog.delivery.id);
      await logisticsAPI.updateDeliveryStatus(statusUpdateDialog.delivery.id, statusUpdateDialog.newStatus);
      setStatusUpdateDialog({ open: false, delivery: null, newStatus: null });
      await fetchDeliveries();
      await fetchStats();
      toast({
        title: 'Success',
        description: 'Delivery status updated successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(null);
    }
  };

  const getNextStatus = (currentStatus: Delivery['status']): Delivery['status'][] => {
    const statusFlow: Record<Delivery['status'], Delivery['status'][]> = {
      pending: ['assigned', 'cancelled'],
      assigned: ['picked_up', 'cancelled'],
      picked_up: ['in_transit', 'cancelled'],
      in_transit: ['delivered', 'cancelled'],
      delivered: [],
      cancelled: [],
    };
    return statusFlow[currentStatus] || [];
  };

  if (!canViewLogistics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">You don't have permission to view logistics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Logistics Management</h1>
        <p className="text-muted-foreground mt-1">Manage riders and track deliveries</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Riders</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRiders}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeRiders} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDeliveries}</div>
              <p className="text-xs text-muted-foreground">
                {stats.completedDeliveries} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.onTimeDeliveryRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Avg {stats.averageDeliveryTime} min
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingDeliveries}</div>
              <p className="text-xs text-muted-foreground">
                {stats.inTransitDeliveries} in transit
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          <button
            onClick={() => {
              setActiveTab('riders');
              setPage(1);
            }}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'riders'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Riders ({stats?.totalRiders || 0})
          </button>
          <button
            onClick={() => {
              setActiveTab('deliveries');
              setPage(1);
            }}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'deliveries'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Deliveries ({stats?.totalDeliveries || 0})
          </button>
        </nav>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        {activeTab === 'riders' ? (
          <select
            value={riderStatusFilter}
            onChange={(e) => {
              setRiderStatusFilter(e.target.value as any);
              setPage(1);
            }}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        ) : (
          <select
            value={deliveryStatusFilter}
            onChange={(e) => {
              setDeliveryStatusFilter(e.target.value as any);
              setPage(1);
            }}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="picked_up">Picked Up</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        )}
      </div>

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
      ) : activeTab === 'riders' ? (
        <Card>
          <CardHeader>
            <CardTitle>Riders</CardTitle>
            <CardDescription>Manage delivery riders and their performance</CardDescription>
          </CardHeader>
          <CardContent>
            {riders.length === 0 ? (
              <div className="text-center py-12">
                <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No riders found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {riders.map((rider) => (
                  <div
                    key={rider.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        {rider.avatarUrl && !imageErrors.has(rider.id) ? (
                          <img
                            src={rider.avatarUrl}
                            alt={rider.fullName || rider.username}
                            className="h-full w-full object-cover"
                            onError={() => handleImageError(rider.id)}
                          />
                        ) : (
                          <User className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{rider.fullName || rider.username}</h3>
                          {rider.rating && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {rider.rating.toFixed(1)}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{rider.email}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>{rider.totalDeliveries} total</span>
                          <span>{rider.completedDeliveries} completed</span>
                          {rider.averageDeliveryTime && (
                            <span>Avg {rider.averageDeliveryTime} min</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={rider.isActive ? 'default' : 'secondary'}>
                        {rider.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRiderDetailsDialog({ open: true, rider: rider })}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Deliveries</CardTitle>
            <CardDescription>Track and manage all deliveries</CardDescription>
          </CardHeader>
          <CardContent>
            {deliveries.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No deliveries found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {deliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">Order #{delivery.orderNumber}</h3>
                          {getStatusBadge(delivery.status)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{delivery.deliveryAddress}</span>
                          </div>
                          {delivery.deliveryType === 'pickup' ? (
                            <div className="flex items-center gap-2">
                              <Truck className="h-4 w-4" />
                              <span>Pick up</span>
                            </div>
                          ) : delivery.riderName ? (
                            <div className="flex items-center gap-2">
                              <Truck className="h-4 w-4" />
                              <span>{delivery.riderName}</span>
                            </div>
                          ) : null}
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{delivery.customerName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">${delivery.amount.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Created: {new Date(delivery.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeliveryDetailsDialog({ open: true, delivery: delivery })}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(canAssignRider || canUpdateDeliveryStatus) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" disabled={isActionLoading === delivery.id}>
                                {isActionLoading === delivery.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreVertical className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canAssignRider && delivery.status === 'pending' && delivery.deliveryType !== 'pickup' && (
                                <DropdownMenuItem
                                  onClick={() => setAssignRiderDialog({ open: true, delivery: delivery })}
                                >
                                  Assign Rider
                                </DropdownMenuItem>
                              )}
                              {canUpdateDeliveryStatus && getNextStatus(delivery.status).length > 0 && (
                                <>
                                  {getNextStatus(delivery.status).map((status) => (
                                    <DropdownMenuItem
                                      key={status}
                                      onClick={() => setStatusUpdateDialog({ open: true, delivery: delivery, newStatus: status })}
                                    >
                                      Mark as {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </DropdownMenuItem>
                                  ))}
                                </>
                              )}
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
      )}

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

      {/* Rider Details Dialog */}
      <Dialog open={riderDetailsDialog.open} onOpenChange={(open) => setRiderDetailsDialog({ open, rider: null })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Rider Details</DialogTitle>
            <DialogDescription>View detailed information about this rider</DialogDescription>
          </DialogHeader>
          {riderDetailsDialog.rider && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {riderDetailsDialog.rider.avatarUrl && !imageErrors.has(riderDetailsDialog.rider.id) ? (
                    <img
                      src={riderDetailsDialog.rider.avatarUrl}
                      alt={riderDetailsDialog.rider.fullName || riderDetailsDialog.rider.username}
                      className="h-full w-full object-cover"
                      onError={() => {
                        if (riderDetailsDialog.rider) {
                          handleImageError(riderDetailsDialog.rider.id);
                        }
                      }}
                    />
                  ) : (
                    <User className="h-8 w-8 text-primary" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{riderDetailsDialog.rider.fullName || riderDetailsDialog.rider.username}</h3>
                  <p className="text-sm text-muted-foreground">{riderDetailsDialog.rider.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-sm">{riderDetailsDialog.rider.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={riderDetailsDialog.rider.isActive ? 'default' : 'secondary'}>
                    {riderDetailsDialog.rider.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {riderDetailsDialog.rider.rating && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Rating</p>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{riderDetailsDialog.rider.rating.toFixed(1)}</span>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Deliveries</p>
                  <p className="text-sm">{riderDetailsDialog.rider.totalDeliveries}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-sm">{riderDetailsDialog.rider.completedDeliveries}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">On-Time Deliveries</p>
                  <p className="text-sm">{riderDetailsDialog.rider.onTimeDeliveries}</p>
                </div>
                {riderDetailsDialog.rider.averageDeliveryTime && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Delivery Time</p>
                    <p className="text-sm">{riderDetailsDialog.rider.averageDeliveryTime} minutes</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Joined</p>
                  <p className="text-sm">{new Date(riderDetailsDialog.rider.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delivery Details Dialog */}
      <Dialog open={deliveryDetailsDialog.open} onOpenChange={(open) => setDeliveryDetailsDialog({ open, delivery: null })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Delivery Details</DialogTitle>
            <DialogDescription>View detailed information about this delivery</DialogDescription>
          </DialogHeader>
          {deliveryDetailsDialog.delivery && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Order #{deliveryDetailsDialog.delivery.orderNumber}</h3>
                  {getStatusBadge(deliveryDetailsDialog.delivery.status)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer</p>
                  <p className="text-sm">{deliveryDetailsDialog.delivery.customerName}</p>
                  {deliveryDetailsDialog.delivery.customerPhone && (
                    <p className="text-xs text-muted-foreground">{deliveryDetailsDialog.delivery.customerPhone}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
                  <p className="text-sm font-semibold">${deliveryDetailsDialog.delivery.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pickup Address</p>
                  <p className="text-sm">{deliveryDetailsDialog.delivery.pickupAddress}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Delivery Address</p>
                  <p className="text-sm">{deliveryDetailsDialog.delivery.deliveryAddress}</p>
                </div>
                {deliveryDetailsDialog.delivery.deliveryType === 'pickup' ? (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Delivery Type</p>
                    <p className="text-sm">Pick up</p>
                  </div>
                ) : deliveryDetailsDialog.delivery.riderName ? (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Assigned Rider</p>
                    <p className="text-sm">{deliveryDetailsDialog.delivery.riderName}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Assigned Rider</p>
                    <p className="text-sm text-muted-foreground">Not assigned</p>
                  </div>
                )}
                {deliveryDetailsDialog.delivery.estimatedDeliveryTime && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Estimated Delivery</p>
                    <p className="text-sm">{new Date(deliveryDetailsDialog.delivery.estimatedDeliveryTime).toLocaleString()}</p>
                  </div>
                )}
                {deliveryDetailsDialog.delivery.actualDeliveryTime && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Actual Delivery</p>
                    <p className="text-sm">{new Date(deliveryDetailsDialog.delivery.actualDeliveryTime).toLocaleString()}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="text-sm">{new Date(deliveryDetailsDialog.delivery.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                  <p className="text-sm">{new Date(deliveryDetailsDialog.delivery.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Rider Dialog */}
      <Dialog open={assignRiderDialog.open} onOpenChange={(open) => {
        setAssignRiderDialog({ open, delivery: null });
        setSelectedRiderId('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Rider</DialogTitle>
            <DialogDescription>Select a rider to assign to this delivery</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rider</label>
              {isLoadingRiders ? (
                <div className="w-full px-3 py-2 border rounded-md bg-background flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Loading riders...</span>
                </div>
              ) : (
                <select
                  value={selectedRiderId}
                  onChange={(e) => setSelectedRiderId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="">Select a rider</option>
                  {isLoadingRiders ? (
                    <option value="" disabled>Loading riders...</option>
                  ) : dialogRiders.length === 0 ? (
                    <option value="" disabled>No active riders available</option>
                  ) : (
                    dialogRiders.map((rider) => (
                      <option key={rider.id} value={rider.id}>
                        {rider.fullName || rider.username} {rider.rating && `(${rider.rating.toFixed(1)}⭐)`}
                      </option>
                    ))
                  )}
                </select>
              )}
            </div>
            {assignRiderDialog.delivery && (
              <div className="text-sm text-muted-foreground">
                <p>Order: #{assignRiderDialog.delivery.orderNumber}</p>
                <p>Delivery Address: {assignRiderDialog.delivery.deliveryAddress}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAssignRiderDialog({ open: false, delivery: null });
              setSelectedRiderId('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleAssignRider} disabled={!selectedRiderId || isActionLoading === assignRiderDialog.delivery?.id}>
              {isActionLoading === assignRiderDialog.delivery?.id ? 'Assigning...' : 'Assign Rider'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={statusUpdateDialog.open} onOpenChange={(open) => setStatusUpdateDialog({ open, delivery: null, newStatus: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Delivery Status</DialogTitle>
            <DialogDescription>
              Are you sure you want to update the delivery status to "{statusUpdateDialog.newStatus?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}"?
            </DialogDescription>
          </DialogHeader>
          {statusUpdateDialog.delivery && (
            <div className="text-sm text-muted-foreground">
              <p>Order: #{statusUpdateDialog.delivery.orderNumber}</p>
              <p>Current Status: {statusUpdateDialog.delivery.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusUpdateDialog({ open: false, delivery: null, newStatus: null })}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={isActionLoading === statusUpdateDialog.delivery?.id}>
              {isActionLoading === statusUpdateDialog.delivery?.id ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

