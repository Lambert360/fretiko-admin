'use client';

/**
 * Departments Management Page
 * 
 * Manage departments and their permissions
 * Features:
 * - View all departments
 * - Create new departments
 * - Edit department details and permissions
 * - View staff count per department
 * 
 * Requires: manage_departments permission (super_admin only)
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { departmentsAPI, type Department } from '@/lib/api/departments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Building2, Plus, Edit, Users, Shield, AlertCircle, CheckCircle } from 'lucide-react';

// All available permissions
const ALL_PERMISSIONS = [
  // User Management
  'view_users', 'suspend_users', 'delete_users', 'edit_users',
  // Orders & Transactions
  'view_orders', 'view_transactions', 'manage_refunds',
  // Content Moderation
  'view_products', 'approve_products', 'remove_products',
  'view_services', 'approve_services', 'remove_services',
  'view_stories', 'remove_stories',
  'view_live_streams', 'end_live_streams',
  // Disputes
  'view_disputes', 'resolve_disputes',
  // Logistics
  'view_riders', 'manage_riders',
  'view_deliveries', 'assign_deliveries',
  // Finance
  'view_revenue', 'view_wallet_transactions',
  'process_payouts', 'manage_escrow',
  // Staff Management
  'create_staff', 'edit_staff', 'delete_staff', 'assign_permissions',
  'view_staff_logs',
  // Departments
  'manage_departments',
  // Analytics
  'view_platform_stats', 'export_data',
  // Communication
  'send_memos', 'view_memos',
  // Reports
  'create_reports', 'view_reports',
];

export default function DepartmentsPage() {
  const { isSuperAdmin, hasPermission } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    permissions: [] as string[],
  });

  const canManageDepartments = isSuperAdmin || hasPermission('manage_departments');

  useEffect(() => {
    if (canManageDepartments) {
      fetchDepartments();
    }
  }, [canManageDepartments]);

  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      const data = await departmentsAPI.getAllDepartments();
      setDepartments(data);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setIsAddDialogOpen(true);
    setFormData({
      name: '',
      slug: '',
      description: '',
      permissions: [],
    });
    setError(null);
    setSuccess(null);
  };

  const handleOpenEdit = (dept: Department) => {
    setEditingDepartment(dept);
    setIsEditDialogOpen(true);
    setFormData({
      name: dept.name,
      slug: dept.slug,
      description: dept.description || '',
      permissions: dept.permissions || [],
    });
    setError(null);
    setSuccess(null);
  };

  const handleCloseDialogs = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setEditingDepartment(null);
    setError(null);
    setSuccess(null);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  };

  const togglePermission = (permission: string) => {
    setFormData({
      ...formData,
      permissions: formData.permissions.includes(permission)
        ? formData.permissions.filter(p => p !== permission)
        : [...formData.permissions, permission],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.name || !formData.slug) {
      setError('Name and slug are required');
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (editingDepartment) {
        await departmentsAPI.updateDepartment(editingDepartment.id, {
          name: formData.name,
          description: formData.description || undefined,
          permissions: formData.permissions,
        });
        setSuccess(`Department "${formData.name}" updated successfully!`);
      } else {
        await departmentsAPI.createDepartment({
          name: formData.name,
          slug: formData.slug,
          description: formData.description || undefined,
          permissions: formData.permissions,
        });
        setSuccess(`Department "${formData.name}" created successfully!`);
      }
      
      await fetchDepartments();
      
      setTimeout(() => {
        handleCloseDialogs();
        setSuccess(null);
      }, 1500);
    } catch (err: any) {
      console.error('Failed to save department:', err);
      setError(err.response?.data?.message || 'Failed to save department');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canManageDepartments) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">You don't have permission to manage departments.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading departments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Departments</h1>
          <p className="text-muted-foreground mt-1">Manage departments and their permissions</p>
        </div>
        <Button onClick={handleOpenAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Department
        </Button>
      </div>

      {/* Departments Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept) => (
          <Card key={dept.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{dept.name}</CardTitle>
                    <p className="text-xs text-muted-foreground font-mono mt-1">{dept.slug}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenEdit(dept)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {dept.description && (
                <p className="text-sm text-muted-foreground">{dept.description}</p>
              )}

              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {dept.staffCount || 0} staff member{dept.staffCount !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {dept.permissions?.length || 0} permission{dept.permissions?.length !== 1 ? 's' : ''}
                </span>
              </div>

              {dept.permissions && dept.permissions.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2 border-t">
                  {dept.permissions.slice(0, 3).map((perm) => (
                    <Badge key={perm} variant="outline" className="text-xs">
                      {perm.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                  {dept.permissions.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{dept.permissions.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Department Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogClose onClose={handleCloseDialogs} />
          <DialogHeader>
            <DialogTitle>Add New Department</DialogTitle>
            <DialogDescription>
              Create a new department and assign permissions to it
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="name">Department Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Marketing"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g., marketing"
                required
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                URL-friendly identifier (auto-generated from name)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the department's responsibilities"
                className="w-full px-3 py-2 border rounded-md bg-background min-h-[80px]"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="border rounded-md p-4 max-h-[300px] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {ALL_PERMISSIONS.map((perm) => (
                    <label
                      key={perm}
                      className="flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(perm)}
                        onChange={() => togglePermission(perm)}
                        disabled={isSubmitting}
                        className="rounded"
                      />
                      <span className="text-sm">{perm.replace(/_/g, ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Select permissions for this department. Staff assigned to this department will have these permissions.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialogs}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Department'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogClose onClose={handleCloseDialogs} />
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>
              Update department details and permissions
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="edit-name">Department Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-slug">Slug *</Label>
              <Input
                id="edit-slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background min-h-[80px]"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="border rounded-md p-4 max-h-[300px] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {ALL_PERMISSIONS.map((perm) => (
                    <label
                      key={perm}
                      className="flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(perm)}
                        onChange={() => togglePermission(perm)}
                        disabled={isSubmitting}
                        className="rounded"
                      />
                      <span className="text-sm">{perm.replace(/_/g, ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialogs}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Department'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

