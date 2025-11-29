'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { staffAPI, type CreateStaffRequest } from '@/lib/api/staff';
import { departmentsAPI, type Department } from '@/lib/api/departments';
import { createStaffSchema } from '@/lib/validations/staff';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner, SkeletonTable } from '@/components/ui/loading';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { UserPlus, Search, Shield, Users as UsersIcon, UserCog, AlertCircle, CheckCircle, Eye, Ban, Trash2, UserCheck, MoreVertical, RefreshCw } from 'lucide-react';
import { ExportButton } from '@/components/ui/export-button';
import { formatDateForExport } from '@/lib/utils/export';
import { Textarea } from '@/components/ui/textarea';
import type { Staff } from '@/types/staff';
import { StaffRole } from '@/types/staff';

export default function StaffManagementPage() {
  const { isSuperAdmin, isDepartmentHead } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);
  const [departmentsError, setDepartmentsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Moderation states
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isUnsuspendOpen, setIsUnsuspendOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [deletionReason, setDeletionReason] = useState('');
  const [isModerationLoading, setIsModerationLoading] = useState(false);
  
  const { handleError, handleSuccess } = useErrorHandler();
  
  // Form with react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: isFormSubmitting },
    reset,
  } = useForm<CreateStaffRequest>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
      departmentId: '',
      role: StaffRole.STAFF,
    },
  });

  useEffect(() => {
    fetchStaff();
    fetchDepartments();
  }, []);

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      const data = await staffAPI.getAllStaff();
      setStaff(data);
    } catch (error: any) {
      console.error('Failed to fetch staff:', error);
      handleError(error, 'Failed to load staff members');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      setIsLoadingDepartments(true);
      setDepartmentsError(null);
      const data = await departmentsAPI.getAllDepartments();
      console.log('Departments fetched:', data);
      setDepartments(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to fetch departments:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load departments';
      setDepartmentsError(errorMessage);
      setDepartments([]); // Ensure it's always an array
    } finally {
      setIsLoadingDepartments(false);
    }
  };

  const handleOpenAddStaff = () => {
    setIsAddStaffOpen(true);
    reset();
    setError(null);
    setSuccess(null);
  };

  const handleCloseAddStaff = () => {
    setIsAddStaffOpen(false);
    reset();
    setError(null);
    setSuccess(null);
  };

  const onSubmit = async (data: CreateStaffRequest) => {
    try {
      const newStaff = await staffAPI.createStaff({
        ...data,
        departmentId: data.departmentId || undefined,
      });
      
      handleSuccess(`Staff member ${newStaff.fullName} created successfully!`);
      await fetchStaff();
      
      // Close modal after a short delay
      setTimeout(() => {
        setIsAddStaffOpen(false);
        reset();
      }, 1500);
    } catch (err: any) {
      handleError(err, 'Failed to create staff member');
    }
  };

  const filteredStaff = staff.filter(member =>
    member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.staffId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewDetails = (member: Staff) => {
    setSelectedStaff(member);
    setIsViewDetailsOpen(true);
  };

  const handleSuspend = (member: Staff) => {
    setSelectedStaff(member);
    setSuspensionReason('');
    setIsSuspendOpen(true);
  };

  const handleUnsuspend = (member: Staff) => {
    setSelectedStaff(member);
    setIsUnsuspendOpen(true);
  };

  const handleUnsuspendSubmit = async () => {
    if (!selectedStaff) return;

    try {
      setIsModerationLoading(true);
      await staffAPI.unsuspendStaff(selectedStaff.id);
      setSuccess(`${selectedStaff.fullName} has been unsuspended successfully`);
      setIsUnsuspendOpen(false);
      setSelectedStaff(null);
      await fetchStaff();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to unsuspend staff');
    } finally {
      setIsModerationLoading(false);
    }
  };

  const handleDelete = (member: Staff) => {
    setSelectedStaff(member);
    setDeletionReason('');
    setIsDeleteOpen(true);
  };

  const handleSuspendSubmit = async () => {
    if (!selectedStaff) return;

    try {
      setIsModerationLoading(true);
      await staffAPI.suspendStaff(selectedStaff.id, suspensionReason || undefined);
      setSuccess(`${selectedStaff.fullName} has been suspended successfully`);
      setIsSuspendOpen(false);
      setSuspensionReason('');
      setSelectedStaff(null);
      await fetchStaff();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to suspend staff');
    } finally {
      setIsModerationLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedStaff) return;

    try {
      setIsModerationLoading(true);
      await staffAPI.deleteStaff(selectedStaff.id, deletionReason || undefined);
      setSuccess(`${selectedStaff.fullName} has been deleted successfully`);
      setIsDeleteOpen(false);
      setDeletionReason('');
      setSelectedStaff(null);
      await fetchStaff();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete staff');
    } finally {
      setIsModerationLoading(false);
    }
  };

  const getRoleBadgeColor = (role: StaffRole) => {
    switch (role) {
      case StaffRole.SUPER_ADMIN:
        return 'bg-purple-100 text-purple-800';
      case StaffRole.DEPARTMENT_HEAD:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const stats = [
    {
      label: 'Total Staff',
      value: staff.length,
      icon: UsersIcon,
      color: 'bg-blue-500',
    },
    {
      label: 'Super Admins',
      value: staff.filter(s => s.role === StaffRole.SUPER_ADMIN).length,
      icon: Shield,
      color: 'bg-purple-500',
    },
    {
      label: 'Department Heads',
      value: staff.filter(s => s.role === StaffRole.DEPARTMENT_HEAD).length,
      icon: UserCog,
      color: 'bg-green-500',
    },
    {
      label: 'Regular Staff',
      value: staff.filter(s => s.role === StaffRole.STAFF).length,
      icon: UsersIcon,
      color: 'bg-orange-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading staff...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Staff Management</h2>
          <p className="text-muted-foreground mt-2">
            Manage internal staff accounts and permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              setIsLoading(true);
              await fetchStaff();
              setIsLoading(false);
            }}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <ExportButton
            data={staff.map(member => ({
              'Full Name': member.fullName,
              'Staff ID': member.staffId,
              'Email': member.email,
              'Department': member.departmentName || 'No Department',
              'Role': member.role.replace('_', ' '),
              'Status': member.isActive ? 'Active' : 'Inactive',
              'Suspended': member.isSuspended ? 'Yes' : 'No',
              'Last Login': member.lastLoginAt ? formatDateForExport(member.lastLoginAt) : 'Never',
              'Created': formatDateForExport(member.createdAt),
            }))}
            filename="staff"
            headers={['Full Name', 'Staff ID', 'Email', 'Department', 'Role', 'Status', 'Suspended', 'Last Login', 'Created']}
            disabled={isLoading || staff.length === 0}
          />
          {(isSuperAdmin || isDepartmentHead) && (
            <Button onClick={handleOpenAddStaff}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Staff
            </Button>
          )}
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setError(null)}>
            ×
          </Button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-md flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <span>{success}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSuccess(null)}>
            ×
          </Button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => {
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

      {/* Staff List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle>All Staff Members</CardTitle>
              <CardDescription>View and manage staff accounts</CardDescription>
            </div>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-[300px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="pb-3 font-medium text-sm text-muted-foreground">Staff</th>
                  <th className="pb-3 font-medium text-sm text-muted-foreground">Staff ID</th>
                  <th className="pb-3 font-medium text-sm text-muted-foreground">Email</th>
                  <th className="pb-3 font-medium text-sm text-muted-foreground">Department</th>
                  <th className="pb-3 font-medium text-sm text-muted-foreground">Role</th>
                  <th className="pb-3 font-medium text-sm text-muted-foreground">Status</th>
                  <th className="pb-3 font-medium text-sm text-muted-foreground">Last Login</th>
                  <th className="pb-3 font-medium text-sm text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((member) => (
                    <tr key={member.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          {member.avatarUrl ? (
                            <img
                              src={member.avatarUrl}
                              alt={member.fullName}
                              className="h-10 w-10 rounded-full object-cover border-2 border-primary/20"
                              onError={(e) => {
                                // Fallback to initials if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) {
                                  fallback.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div 
                            className={`h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center ${member.avatarUrl ? 'hidden' : ''}`}
                          >
                            <span className="text-sm font-medium text-primary">
                              {member.fullName.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{member.fullName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="font-mono text-sm">{member.staffId}</span>
                      </td>
                      <td className="py-4 text-sm">{member.email}</td>
                      <td className="py-4 text-sm">
                        {member.departmentName || (
                          <span className="text-muted-foreground italic">No Department</span>
                        )}
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(member.role)}`}>
                          {member.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${member.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {member.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {member.isSuspended && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Suspended
                            </span>
                          )}
                          {member.deletedAt && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Deleted
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 text-sm text-muted-foreground">
                        {member.lastLoginAt
                          ? new Date(member.lastLoginAt).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDetails(member)}
                                  aria-label="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View Details</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          {!member.deletedAt && (
                            <>
                              {member.isSuspended ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleUnsuspend(member)}
                                        disabled={isModerationLoading}
                                        aria-label="Unsuspend"
                                        className="text-green-600 hover:text-green-700"
                                      >
                                        <UserCheck className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Unsuspend</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleSuspend(member)}
                                        disabled={isModerationLoading || !isSuperAdmin}
                                        aria-label="Suspend"
                                        className="text-yellow-600 hover:text-yellow-700"
                                      >
                                        <Ban className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Suspend</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDelete(member)}
                                      disabled={isModerationLoading || !isSuperAdmin}
                                      aria-label="Delete"
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Delete</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {filteredStaff.length} of {staff.length} staff members
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Staff Dialog */}
      <Dialog open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen}>
        <DialogContent>
          <DialogClose onClose={handleCloseAddStaff} />
          <DialogHeader>
            <DialogTitle>Add New Staff Member</DialogTitle>
            <DialogDescription>
              Create a new staff account. The staff member will be required to change their password on first login.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Error/Success Messages */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-md flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                {success}
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                {...register('fullName')}
                placeholder="John Doe"
                disabled={isFormSubmitting}
              />
              {errors.fullName && (
                <p className="text-xs text-destructive">{errors.fullName.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="john.doe@fretiko.com"
                disabled={isFormSubmitting}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                placeholder="Minimum 8 characters"
                disabled={isFormSubmitting}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Password must be at least 8 characters with uppercase, lowercase, and number
              </p>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <select
                id="role"
                {...register('role')}
                className="w-full px-3 py-2 border rounded-md bg-background"
                disabled={isFormSubmitting || !isSuperAdmin}
              >
                <option value={StaffRole.STAFF}>Staff</option>
                <option value={StaffRole.DEPARTMENT_HEAD}>Department Head</option>
                {isSuperAdmin && <option value={StaffRole.SUPER_ADMIN}>Super Admin</option>}
              </select>
              {errors.role && (
                <p className="text-xs text-destructive">{errors.role.message}</p>
              )}
              {!isSuperAdmin && (
                <p className="text-xs text-muted-foreground">
                  Only super admins can create department heads and super admins
                </p>
              )}
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="departmentId">Department *</Label>
              <select
                id="departmentId"
                {...register('departmentId')}
                className="w-full px-3 py-2 border rounded-md bg-background"
                disabled={isFormSubmitting || isLoadingDepartments}
              >
                <option value="">No Department</option>
                {isLoadingDepartments ? (
                  <option value="" disabled>Loading departments...</option>
                ) : departmentsError ? (
                  <option value="" disabled>Error loading departments</option>
                ) : Array.isArray(departments) && departments.length > 0 ? (
                  departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No departments available</option>
                )}
              </select>
              {errors.departmentId && (
                <p className="text-xs text-destructive">{errors.departmentId.message}</p>
              )}
              {departmentsError && (
                <p className="text-xs text-destructive">{departmentsError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Assign staff to a department to grant department-specific permissions
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseAddStaff}
                disabled={isFormSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isFormSubmitting}>
                {isFormSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Staff'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Staff Details</DialogTitle>
            <DialogDescription>
              Complete information about {selectedStaff?.fullName}
            </DialogDescription>
          </DialogHeader>
          {selectedStaff && (
            <div className="space-y-4">
              {/* Avatar */}
              <div className="flex items-center gap-4 pb-4 border-b">
                {selectedStaff.avatarUrl ? (
                  <img
                    src={selectedStaff.avatarUrl}
                    alt={selectedStaff.fullName}
                    className="h-16 w-16 rounded-full object-cover border-2 border-primary/20"
                    onError={(e) => {
                      // Fallback to icon if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) {
                        fallback.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div 
                  className={`h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center ${selectedStaff.avatarUrl ? 'hidden' : ''}`}
                >
                  <span className="text-lg font-medium text-primary">
                    {selectedStaff.fullName.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedStaff.fullName}</h3>
                  <p className="text-sm text-muted-foreground">{selectedStaff.staffId}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Full Name</Label>
                  <p className="font-medium">{selectedStaff.fullName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Staff ID</Label>
                  <p className="font-mono text-sm">{selectedStaff.staffId}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p>{selectedStaff.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Department</Label>
                  <p>{selectedStaff.departmentName || 'No Department'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Role</Label>
                  <p className="capitalize">{selectedStaff.role.replace('_', ' ')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="flex flex-col gap-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${selectedStaff.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {selectedStaff.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {selectedStaff.isSuspended && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit bg-yellow-100 text-yellow-800">
                        Suspended
                      </span>
                    )}
                    {selectedStaff.deletedAt && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit bg-gray-100 text-gray-800">
                        Deleted
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Last Login</Label>
                  <p>{selectedStaff.lastLoginAt ? new Date(selectedStaff.lastLoginAt).toLocaleString() : 'Never'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Account Created</Label>
                  <p>{new Date(selectedStaff.createdAt).toLocaleString()}</p>
                </div>
                {selectedStaff.isSuspended && selectedStaff.suspendedAt && (
                  <>
                    <div>
                      <Label className="text-muted-foreground">Suspended At</Label>
                      <p>{new Date(selectedStaff.suspendedAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Suspension Reason</Label>
                      <p>{selectedStaff.suspensionReason || 'No reason provided'}</p>
                    </div>
                  </>
                )}
                {selectedStaff.deletedAt && (
                  <div>
                    <Label className="text-muted-foreground">Deleted At</Label>
                    <p>{new Date(selectedStaff.deletedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={isSuspendOpen} onOpenChange={setIsSuspendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Staff Member</DialogTitle>
            <DialogDescription>
              Suspend {selectedStaff?.fullName}. They will not be able to access the system until unsuspended.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="suspensionReason">Reason for Suspension (Optional)</Label>
              <Textarea
                id="suspensionReason"
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="Enter reason for suspension..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSuspendOpen(false)} disabled={isModerationLoading}>
              Cancel
            </Button>
            <Button onClick={handleSuspendSubmit} disabled={isModerationLoading} className="bg-yellow-600 hover:bg-yellow-700">
              {isModerationLoading ? 'Suspending...' : 'Suspend Staff'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsuspend Dialog */}
      <Dialog open={isUnsuspendOpen} onOpenChange={setIsUnsuspendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsuspend Staff Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to unsuspend {selectedStaff?.fullName}? They will regain access to the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUnsuspendOpen(false)} disabled={isModerationLoading}>
              Cancel
            </Button>
            <Button onClick={handleUnsuspendSubmit} disabled={isModerationLoading} className="bg-green-600 hover:bg-green-700">
              {isModerationLoading ? 'Unsuspending...' : 'Unsuspend Staff'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Staff Member</DialogTitle>
            <DialogDescription>
              Permanently delete {selectedStaff?.fullName}. This action cannot be undone. Use this when a staff member is sacked or terminated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Warning: This action is permanent and cannot be undone.</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deletionReason">Reason for Deletion (Optional)</Label>
              <Textarea
                id="deletionReason"
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                placeholder="Enter reason for deletion (e.g., Staff termination, sacked, etc.)..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isModerationLoading}>
              Cancel
            </Button>
            <Button onClick={handleDeleteSubmit} disabled={isModerationLoading} className="bg-red-600 hover:bg-red-700">
              {isModerationLoading ? 'Deleting...' : 'Delete Staff'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
