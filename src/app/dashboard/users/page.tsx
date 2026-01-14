'use client';

/**
 * Users Management Page
 * 
 * Displays and manages all platform users (citizens, vendors, riders)
 * Features:
 * - View all users with search and filtering
 * - User statistics dashboard
 * - Suspend/activate user accounts
 * - View user details
 * 
 * Requires: view_users permission
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usersAPI, type User, type UserStats } from '@/lib/api/users';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, UserPlus, MoreVertical, Ban, Trash2, Eye, AlertCircle, Users as UsersIcon, RefreshCw, CheckCircle2, AlertTriangle, History } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner, SkeletonTable } from '@/components/ui/loading';
import { ExportButton } from '@/components/ui/export-button';
import { BulkActions } from '@/components/ui/bulk-actions';
import { Checkbox } from '@/components/ui/checkbox';
import { formatNumber } from '@/lib/utils/formatting';
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
import { useToast } from '@/hooks/use-toast';

export default function UsersPage() {
  const { isSuperAdmin, hasPermission } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'citizen' | 'vendor' | 'rider' | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'suspended' | 'deleted' | 'all'>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const limit = 20;

  // Dialog states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isWarnDialogOpen, setIsWarnDialogOpen] = useState(false);
  const [isWarningsHistoryOpen, setIsWarningsHistoryOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [warnSeverity, setWarnSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [warnReason, setWarnReason] = useState('');
  const [userWarnings, setUserWarnings] = useState<any[]>([]);
  const [isLoadingWarnings, setIsLoadingWarnings] = useState(false);
  const [userWarningCounts, setUserWarningCounts] = useState<Record<string, number>>({});

  // Check if user has permission to view users
  const canViewUsers = isSuperAdmin || hasPermission('view_users');
  const canWarnUsers = isSuperAdmin || hasPermission('suspend_users');

  // Validate and correct page number
  useEffect(() => {
    if (total > 0 && page > Math.ceil(total / limit)) {
      setPage(Math.max(1, Math.ceil(total / limit)));
    }
  }, [total, page, limit]);

  const fetchStats = async () => {
    try {
      const statsData = await usersAPI.getUserStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch user stats:', err);
      // Don't show error for stats, just log it
    }
  };

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const filters = {
        role: selectedRole !== 'all' ? selectedRole : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        search: searchQuery || undefined,
        page,
        limit,
      };

      const response = await usersAPI.getAllUsers(filters);
      setUsers(response.users);
      setTotal(response.total);
      
      // Fetch warning counts for all users
      const warningCounts: Record<string, number> = {};
      await Promise.all(
        response.users.map(async (user) => {
          try {
            const warnings = await usersAPI.getUserWarnings(user.id);
            warningCounts[user.id] = warnings.length;
          } catch (err) {
            // Silently fail for individual warning fetches
            warningCounts[user.id] = 0;
          }
        })
      );
      setUserWarningCounts(warningCounts);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      
      // Handle 401 errors specifically
      if (err.response?.status === 401) {
        const errorMessage = err.response?.data?.message || 'Authentication failed. Please log in again.';
        setError(errorMessage);
        // Don't automatically redirect - let user see the error
        // The API client will handle redirect if needed
      } else {
        setError(err.response?.data?.message || 'Failed to load users. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (canViewUsers) {
      fetchStats();
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewUsers, page, selectedRole, selectedStatus, searchQuery]);

  const handleSuspendClick = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setIsSuspendDialogOpen(true);
    }
  };

  const handleSuspendUser = async () => {
    if (!selectedUser) return;

    try {
      setIsActionLoading(selectedUser.id);
      await usersAPI.suspendUser(selectedUser.id, suspendReason || 'Suspended by admin');
      await fetchUsers();
      await fetchStats();
      setIsSuspendDialogOpen(false);
      setSuspendReason('');
      setSelectedUser(null);
      toast({
        title: 'Success',
        description: `${selectedUser.fullName || selectedUser.username} has been suspended successfully`,
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to suspend user',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      setIsActionLoading(userId);
      await usersAPI.activateUser(userId);
      await fetchUsers();
      await fetchStats();
      const user = users.find(u => u.id === userId);
      toast({
        title: 'Success',
        description: `${user?.fullName || user?.username || 'User'} has been activated successfully`,
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to activate user',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleDeleteClick = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setIsDeleteDialogOpen(true);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setIsActionLoading(selectedUser.id);
      await usersAPI.deleteUser(selectedUser.id);
      await fetchUsers();
      await fetchStats();
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: 'Success',
        description: `${selectedUser.fullName || selectedUser.username} has been deleted successfully`,
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to delete user',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleViewDetails = async (userId: string) => {
    try {
      setIsActionLoading(userId);
      const user = await usersAPI.getUserById(userId);
      setSelectedUser(user);
      setIsDetailsDialogOpen(true);
      // Fetch warnings for this user
      await fetchUserWarnings(userId);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load user details',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(null);
    }
  };

  const fetchUserWarnings = async (userId: string) => {
    try {
      setIsLoadingWarnings(true);
      const warnings = await usersAPI.getUserWarnings(userId);
      setUserWarnings(warnings);
      // Count warnings for badge
      setUserWarningCounts(prev => ({ ...prev, [userId]: warnings.length }));
    } catch (err: any) {
      console.error('Failed to fetch warnings:', err);
      // Don't show error toast, just log it
    } finally {
      setIsLoadingWarnings(false);
    }
  };

  const handleWarnClick = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setIsWarnDialogOpen(true);
    }
  };

  const handleWarnUser = async () => {
    if (!selectedUser || !warnReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for the warning',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsActionLoading(selectedUser.id);
      await usersAPI.warnUser(selectedUser.id, warnSeverity, warnReason);
      await fetchUserWarnings(selectedUser.id);
      setIsWarnDialogOpen(false);
      setWarnReason('');
      setWarnSeverity('medium');
      toast({
        title: 'Success',
        description: `Warning issued to ${selectedUser.fullName || selectedUser.username}`,
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to warn user',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleViewWarningsHistory = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setIsWarningsHistoryOpen(true);
      await fetchUserWarnings(userId);
    }
  };

  // Filter users client-side for immediate feedback (backend also filters)
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      !searchQuery ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.fullName && user.fullName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = selectedRole === 'all' || user.userRole === selectedRole;
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'active' && user.isActive && !user.isDeleted) ||
      (selectedStatus === 'suspended' && !user.isActive && !user.isDeleted) ||
      (selectedStatus === 'deleted' && user.isDeleted);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Permission check
  if (!canViewUsers) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">You don't have permission to view users. Please contact your administrator.</p>
        </div>
      </div>
    );
  }

  // Display stats from API or fallback
  const displayStats = React.useMemo(() => {
    if (stats) {
      return [
        { label: 'Total Users', value: formatNumber(stats.totalUsers), color: 'bg-blue-500' },
        { label: 'Vendors', value: formatNumber(stats.vendors), color: 'bg-green-500' },
        { label: 'Riders', value: formatNumber(stats.riders), color: 'bg-purple-500' },
        { label: 'Suspended', value: formatNumber(stats.suspended), color: 'bg-red-500' },
      ];
    }
    return [
      { label: 'Total Users', value: '...', color: 'bg-blue-500' },
      { label: 'Vendors', value: '...', color: 'bg-green-500' },
      { label: 'Riders', value: '...', color: 'bg-purple-500' },
      { label: 'Suspended', value: '...', color: 'bg-red-500' },
    ];
  }, [stats]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground mt-2">
            Manage platform users, vendors, and riders
          </p>
        </div>
        {isSuperAdmin && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                setIsLoading(true);
                await fetchUsers();
                await fetchStats();
                setIsLoading(false);
              }}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <ExportButton
              data={users.map(user => ({
                'Full Name': user.fullName || user.username,
                'Username': user.username,
                'Email': user.email,
                'Role': user.userRole,
                'Status': user.isDeleted ? 'Deleted' : (user.isActive ? 'Active' : 'Suspended'),
                'Total Orders': user.ordersCount || 0,
                'Joined': formatDateForExport(user.createdAt),
              }))}
              filename="users"
              headers={['Full Name', 'Username', 'Email', 'Role', 'Status', 'Total Orders', 'Joined']}
              disabled={isLoading || users.length === 0}
            />
            <Button disabled>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
              <span className="ml-2 text-xs opacity-70">(Coming soon)</span>
            </Button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {displayStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-lg ${stat.color} bg-opacity-10 flex items-center justify-center`}>
                  <div className={`h-6 w-6 rounded ${stat.color}`}></div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <BulkActions
          selectedItems={users.filter(u => selectedUsers.includes(u.id))}
          onSelectAll={(selected) => {
            if (selected) {
              setSelectedUsers(users.map(u => u.id));
            } else {
              setSelectedUsers([]);
            }
          }}
          onClearSelection={() => setSelectedUsers([])}
          totalItems={users.length}
          actions={[
            {
              label: 'Activate',
              icon: <CheckCircle2 className="h-4 w-4 mr-2" />,
              onClick: async (items) => {
                try {
                  setIsActionLoading('bulk');
                  // Filter out deleted users from bulk actions
                  const activeUsers = items.filter(user => !user.isDeleted);
                  for (const user of activeUsers) {
                    if (!user.isActive) {
                      await usersAPI.activateUser(user.id);
                    }
                  }
                  toast({
                    title: 'Success',
                    description: `${activeUsers.length} user(s) activated successfully`,
                  });
                  setSelectedUsers([]);
                  await fetchUsers();
                  await fetchStats();
                } catch (err: any) {
                  toast({
                    title: 'Error',
                    description: err.response?.data?.message || 'Failed to activate users',
                    variant: 'destructive',
                  });
                } finally {
                  setIsActionLoading(null);
                }
              },
              variant: 'default',
              disabled: !hasPermission('manage_users') || selectedUsers.some(id => {
                const user = users.find(u => u.id === id);
                return user?.isDeleted;
              }),
            },
            {
              label: 'Suspend',
              icon: <Ban className="h-4 w-4 mr-2" />,
              onClick: async (items) => {
                // For bulk actions, we'll suspend without reason (can be enhanced later)
                try {
                  setIsActionLoading('bulk');
                  // Filter out deleted users from bulk actions
                  const activeUsers = items.filter(user => !user.isDeleted);
                  for (const user of activeUsers) {
                    if (user.isActive) {
                      await usersAPI.suspendUser(user.id, 'Bulk suspended by admin');
                    }
                  }
                  toast({
                    title: 'Success',
                    description: `${activeUsers.length} user(s) suspended successfully`,
                  });
                  setSelectedUsers([]);
                  await fetchUsers();
                  await fetchStats();
                } catch (err: any) {
                  toast({
                    title: 'Error',
                    description: err.response?.data?.message || 'Failed to suspend users',
                    variant: 'destructive',
                  });
                } finally {
                  setIsActionLoading(null);
                }
              },
              variant: 'default',
              disabled: !hasPermission('manage_users') || selectedUsers.some(id => {
                const user = users.find(u => u.id === id);
                return user?.isDeleted;
              }),
            },
          ]}
        />
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>View and manage all platform users</CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1); // Reset to first page on search
                  }}
                  className="pl-10 w-full sm:w-[300px]"
                  aria-label="Search users"
                />
              </div>
              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value as typeof selectedRole);
                  setPage(1);
                }}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Roles</option>
                <option value="citizen">Citizens</option>
                <option value="vendor">Vendors</option>
                <option value="rider">Riders</option>
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value as typeof selectedStatus);
                  setPage(1);
                }}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="deleted">Deleted</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Loading State */}
          {isLoading ? (
            <SkeletonTable rows={5} />
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              icon={UsersIcon}
              title="No users found"
              description={
                searchQuery || selectedRole !== 'all' || selectedStatus !== 'all'
                  ? "No users match your current filters. Try adjusting your search or filters."
                  : "There are no users in the system yet."
              }
            />
          ) : (
            <>
              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="pb-3 font-medium text-sm text-muted-foreground w-12">
                        <Checkbox
                          checked={selectedUsers.length === filteredUsers.filter(u => !u.isDeleted).length && filteredUsers.filter(u => !u.isDeleted).length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              // Only select non-deleted users
                              setSelectedUsers(filteredUsers.filter(u => !u.isDeleted).map(u => u.id));
                            } else {
                              setSelectedUsers([]);
                            }
                          }}
                          aria-label="Select all users"
                        />
                      </th>
                      <th className="pb-3 font-medium text-sm text-muted-foreground">User</th>
                      <th className="pb-3 font-medium text-sm text-muted-foreground">Email</th>
                      <th className="pb-3 font-medium text-sm text-muted-foreground">Role</th>
                      <th className="pb-3 font-medium text-sm text-muted-foreground">Status</th>
                      <th className="pb-3 font-medium text-sm text-muted-foreground">Orders</th>
                      <th className="pb-3 font-medium text-sm text-muted-foreground">Joined</th>
                      <th className="pb-3 font-medium text-sm text-muted-foreground text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const isSelected = selectedUsers.includes(user.id);
                      const initials = user.fullName
                        ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                        : user.username.slice(0, 2).toUpperCase();
                      
                      const isActionLoadingForUser = isActionLoading === user.id;

                      return (
                        <tr key={user.id} className={`border-b last:border-0 hover:bg-muted/50 ${isSelected ? 'bg-muted/30' : ''}`}>
                          <td className="py-4">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedUsers([...selectedUsers, user.id]);
                                } else {
                                  setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                                }
                              }}
                              disabled={user.isDeleted}
                              aria-label={`Select ${user.fullName || user.username}`}
                            />
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              {user.avatarUrl ? (
                                <img
                                  src={user.avatarUrl}
                                  alt={user.fullName || user.username}
                                  className="h-10 w-10 rounded-full"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-sm font-medium text-primary">{initials}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <div>
                                  <p className="font-medium">{user.fullName || user.username}</p>
                                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                                </div>
                                {userWarningCounts[user.id] > 0 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                    {userWarningCounts[user.id]} {userWarningCounts[user.id] === 1 ? 'warning' : 'warnings'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 text-sm">{user.email}</td>
                          <td className="py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                              ${user.userRole === 'vendor' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : ''}
                              ${user.userRole === 'rider' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' : ''}
                              ${user.userRole === 'citizen' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                            `}>
                              {user.userRole}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                              ${user.isDeleted 
                                ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' 
                                : user.isActive 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}
                            `}>
                              {user.isDeleted ? 'Deleted' : (user.isActive ? 'Active' : 'Suspended')}
                            </span>
                          </td>
                          <td className="py-4 text-sm">{user.ordersCount || 0}</td>
                          <td className="py-4 text-sm text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`View details for ${user.fullName || user.username}`}
                                onClick={() => handleViewDetails(user.id)}
                                disabled={isActionLoadingForUser}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canWarnUsers && !user.isDeleted && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Warn ${user.fullName || user.username}`}
                                  onClick={() => handleWarnClick(user.id)}
                                  disabled={isActionLoadingForUser}
                                >
                                  {isActionLoadingForUser ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600" aria-hidden="true"></div>
                                  ) : (
                                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                  )}
                                </Button>
                              )}
                              {!user.isDeleted && (
                                <>
                                  {user.isActive ? (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      aria-label={`Suspend ${user.fullName || user.username}`}
                                      onClick={() => handleSuspendClick(user.id)}
                                      disabled={isActionLoadingForUser || !isSuperAdmin}
                                    >
                                      {isActionLoadingForUser ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600" aria-hidden="true"></div>
                                      ) : (
                                        <Ban className="h-4 w-4 text-yellow-600" />
                                      )}
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      aria-label={`Activate ${user.fullName || user.username}`}
                                      onClick={() => handleActivateUser(user.id)}
                                      disabled={isActionLoadingForUser || !isSuperAdmin}
                                    >
                                      {isActionLoadingForUser ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600" aria-hidden="true"></div>
                                      ) : (
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                      )}
                                    </Button>
                                  )}
                                </>
                              )}
                              {isSuperAdmin && !user.isDeleted && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Delete ${user.fullName || user.username}`}
                                  onClick={() => handleDeleteClick(user.id)}
                                  disabled={isActionLoadingForUser}
                                >
                                  {isActionLoadingForUser ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" aria-hidden="true"></div>
                                  ) : (
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredUsers.length} of {total} users
                  {total > limit && ` (Page ${page} of ${Math.ceil(total / limit)})`}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= Math.ceil(total / limit) || isLoading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogClose onClose={() => setIsDetailsDialogOpen(false)} />
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View detailed information about this user
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b">
                {selectedUser.avatarUrl ? (
                  <img
                    src={selectedUser.avatarUrl}
                    alt={selectedUser.fullName || selectedUser.username}
                    className="h-16 w-16 rounded-full"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-medium text-primary">
                      {(selectedUser.fullName || selectedUser.username)
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-semibold">{selectedUser.fullName || selectedUser.username}</h3>
                  <p className="text-sm text-muted-foreground">@{selectedUser.username}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
                  <p className="text-sm">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Role</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                    ${selectedUser.userRole === 'vendor' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : ''}
                    ${selectedUser.userRole === 'rider' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' : ''}
                    ${selectedUser.userRole === 'citizen' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                  `}>
                    {selectedUser.userRole}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${selectedUser.isDeleted 
                      ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' 
                      : selectedUser.isActive 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}
                  `}>
                    {selectedUser.isDeleted ? 'Deleted' : (selectedUser.isActive ? 'Active' : 'Suspended')}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Orders</p>
                  <p className="text-sm">{selectedUser.ordersCount || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Joined</p>
                  <p className="text-sm">{new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}</p>
                </div>
              </div>
              {/* Warnings Section */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium">Warnings</p>
                    <p className="text-xs text-muted-foreground">
                      {userWarnings.length} {userWarnings.length === 1 ? 'warning' : 'warnings'} issued
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {canWarnUsers && !selectedUser.isDeleted && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsDetailsDialogOpen(false);
                          setIsWarnDialogOpen(true);
                        }}
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Issue Warning
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsDetailsDialogOpen(false);
                        handleViewWarningsHistory(selectedUser.id);
                      }}
                    >
                      <History className="h-4 w-4 mr-2" />
                      View History
                    </Button>
                  </div>
                </div>
                {isLoadingWarnings ? (
                  <div className="text-sm text-muted-foreground">Loading warnings...</div>
                ) : userWarnings.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No warnings issued</div>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {userWarnings.slice(0, 3).map((warning: any) => (
                      <div key={warning.id} className="flex items-start gap-2 p-2 rounded-md bg-muted/50">
                        <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                          warning.severity === 'high' ? 'text-red-600' :
                          warning.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                              warning.severity === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                              warning.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                              {warning.severity}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(warning.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{warning.reason}</p>
                        </div>
                      </div>
                    ))}
                    {userWarnings.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center pt-1">
                        +{userWarnings.length - 3} more warnings
                      </p>
                    )}
                  </div>
                )}
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

      {/* Suspend User Confirmation Dialog */}
      <Dialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
        <DialogContent>
          <DialogClose onClose={() => {
            setIsSuspendDialogOpen(false);
            setSuspendReason('');
            setSelectedUser(null);
          }} />
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Are you sure you want to suspend {selectedUser?.fullName || selectedUser?.username}? They will not be able to access their account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Reason (Optional)</label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Enter reason for suspension..."
                className="w-full px-3 py-2 border rounded-md bg-background min-h-[80px]"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsSuspendDialogOpen(false);
                setSuspendReason('');
                setSelectedUser(null);
              }}
              disabled={isActionLoading !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSuspendUser}
              disabled={isActionLoading !== null}
              variant="destructive"
            >
              {isActionLoading ? 'Suspending...' : 'Suspend User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warn User Dialog */}
      <Dialog open={isWarnDialogOpen} onOpenChange={setIsWarnDialogOpen}>
        <DialogContent>
          <DialogClose onClose={() => {
            setIsWarnDialogOpen(false);
            setWarnReason('');
            setWarnSeverity('medium');
            setSelectedUser(null);
          }} />
          <DialogHeader>
            <DialogTitle>Issue Warning</DialogTitle>
            <DialogDescription>
              Issue a warning to {selectedUser?.fullName || selectedUser?.username}. The user will be notified and this will be recorded in their warning history.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Severity</label>
              <select
                value={warnSeverity}
                onChange={(e) => setWarnSeverity(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                {warnSeverity === 'high' && 'High severity warnings may lead to automatic suspension after 3 warnings.'}
                {warnSeverity === 'medium' && 'Medium severity warnings may lead to automatic suspension after 5 warnings.'}
                {warnSeverity === 'low' && 'Low severity warnings may lead to automatic suspension after 10 warnings.'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Reason <span className="text-destructive">*</span></label>
              <textarea
                value={warnReason}
                onChange={(e) => setWarnReason(e.target.value)}
                placeholder="Enter reason for warning..."
                className="w-full px-3 py-2 border rounded-md bg-background min-h-[100px]"
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsWarnDialogOpen(false);
                setWarnReason('');
                setWarnSeverity('medium');
                setSelectedUser(null);
              }}
              disabled={isActionLoading !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={handleWarnUser}
              disabled={isActionLoading !== null || !warnReason.trim()}
              variant="default"
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {isActionLoading ? 'Issuing...' : 'Issue Warning'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warnings History Dialog */}
      <Dialog open={isWarningsHistoryOpen} onOpenChange={setIsWarningsHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogClose onClose={() => {
            setIsWarningsHistoryOpen(false);
            setSelectedUser(null);
          }} />
          <DialogHeader>
            <DialogTitle>Warning History</DialogTitle>
            <DialogDescription>
              All warnings issued to {selectedUser?.fullName || selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          {isLoadingWarnings ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : userWarnings.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No warnings have been issued to this user.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {userWarnings.map((warning: any) => (
                <div key={warning.id} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`h-5 w-5 ${
                        warning.severity === 'high' ? 'text-red-600' :
                        warning.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                      }`} />
                      <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${
                        warning.severity === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        warning.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {warning.severity.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(warning.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground mb-2">{warning.reason}</p>
                  {warning.warned_by_name && (
                    <p className="text-xs text-muted-foreground">
                      Issued by: {warning.warned_by_name}
                    </p>
                  )}
                  {warning.related_content_type && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Related to: {warning.related_content_type}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWarningsHistoryOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogClose onClose={() => {
            setIsDeleteDialogOpen(false);
            setSelectedUser(null);
          }} />
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.fullName || selectedUser?.username}? This action cannot be undone and will permanently remove all user data.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="text-sm text-destructive">
                <p className="font-medium mb-1">Warning: This is a permanent action</p>
                <p>All user data, orders, and history will be permanently deleted.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedUser(null);
              }}
              disabled={isActionLoading !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteUser}
              disabled={isActionLoading !== null}
              variant="destructive"
            >
              {isActionLoading ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
