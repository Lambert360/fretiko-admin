'use client';

/**
 * Staff Profile Page
 * 
 * View and manage staff profile
 * Features:
 * - View profile information
 * - Edit profile details
 * - Change password
 * - View account activity
 * - View permissions
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { staffAPI } from '@/lib/api/staff';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Shield, 
  Building2, 
  Calendar, 
  Clock, 
  Lock, 
  Edit, 
  Save, 
  X, 
  CheckCircle,
  AlertCircle,
  Key,
  Upload,
  Camera,
  Loader2
} from 'lucide-react';

export default function ProfilePage() {
  const { staff, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    fullName: staff?.fullName || '',
    email: staff?.email || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (staff) {
      setFormData({
        fullName: staff.fullName,
        email: staff.email,
      });
    }
  }, [staff]);

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (staff) {
      setFormData({
        fullName: staff.fullName,
        email: staff.email,
      });
    }
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      await staffAPI.updateProfile({
        fullName: formData.fullName,
        email: formData.email,
      });
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      await refreshProfile();
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      await staffAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setSuccess('Password changed successfully!');
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      console.error('Failed to change password:', err);
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }

    try {
      setIsUploadingAvatar(true);
      setError(null);
      setSuccess(null);

      await staffAPI.uploadAvatar(file);
      
      setSuccess('Profile picture uploaded successfully!');
      await refreshProfile();
    } catch (err: any) {
      console.error('Failed to upload avatar:', err);
      setError(err.response?.data?.message || 'Failed to upload profile picture');
    } finally {
      setIsUploadingAvatar(false);
      // Reset input
      event.target.value = '';
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'outline'; label: string }> = {
      super_admin: { variant: 'default', label: 'Super Admin' },
      department_head: { variant: 'secondary', label: 'Department Head' },
      staff: { variant: 'outline', label: 'Staff' },
    };
    const config = variants[role] || { variant: 'outline' as const, label: role };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (!staff) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-md flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {success}
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Your account details and information</CardDescription>
              </div>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCancel} disabled={isLoading}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4 pb-4 border-b">
              <div className="relative">
                {staff.avatarUrl ? (
                  <>
                    <img
                      src={staff.avatarUrl}
                      alt={staff.fullName}
                      className="h-20 w-20 rounded-full object-cover border-2 border-primary/20"
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
                    <div 
                      className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center hidden"
                    >
                      <User className="h-10 w-10 text-primary" />
                    </div>
                  </>
                ) : (
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-10 w-10 text-primary" />
                  </div>
                )}
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow-lg"
                  title="Upload profile picture"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={isUploadingAvatar}
                  />
                </label>
              </div>
              <div>
                <h2 className="text-xl font-semibold">{staff.fullName}</h2>
                <p className="text-sm text-muted-foreground">{staff.email}</p>
                {getRoleBadge(staff.role)}
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              {isEditing ? (
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  disabled={isLoading}
                />
              ) : (
                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{staff.fullName}</span>
                </div>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isLoading}
                />
              ) : (
                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{staff.email}</span>
                </div>
              )}
            </div>

            {/* Staff ID */}
            <div className="space-y-2">
              <Label>Staff ID</Label>
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono">{staff.staffId}</span>
              </div>
            </div>

            {/* Department */}
            {staff.departmentName && (
              <div className="space-y-2">
                <Label>Department</Label>
                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{staff.departmentName}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Activity & Security */}
        <div className="space-y-6">
          {/* Account Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Account Activity</CardTitle>
              <CardDescription>Recent account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Account Created</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(staff.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {staff.lastLoginAt && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Last Login</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(staff.lastLoginAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Account Status</p>
                    <p className="text-xs text-muted-foreground">
                      {staff.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
                <Badge variant={staff.isActive ? 'default' : 'secondary'}>
                  {staff.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {staff.mustChangePassword && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-md flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm">You must change your password</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your account password</CardDescription>
                </div>
                {!isChangingPassword ? (
                  <Button variant="outline" size="sm" onClick={() => setIsChangingPassword(true)}>
                    <Key className="h-4 w-4 mr-2" />
                    Change
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setError(null);
                  }}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                )}
              </div>
            </CardHeader>
            {isChangingPassword && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    disabled={isLoading}
                    placeholder="Enter current password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    disabled={isLoading}
                    placeholder="Enter new password (min. 8 characters)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    disabled={isLoading}
                    placeholder="Confirm new password"
                  />
                </div>

                <Button 
                  onClick={handleChangePassword} 
                  disabled={isLoading}
                  className="w-full"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  {isLoading ? 'Changing Password...' : 'Change Password'}
                </Button>
              </CardContent>
            )}
            {!isChangingPassword && (
              <CardContent>
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click "Change" to update your password</span>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

