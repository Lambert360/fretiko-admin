export enum StaffRole {
  SUPER_ADMIN = 'super_admin',
  DEPARTMENT_HEAD = 'department_head',
  STAFF = 'staff',
}

export interface Staff {
  id: string;
  staffId: string;
  email: string;
  fullName: string;
  departmentId: string | null;
  departmentName?: string;
  departmentPermissions?: string[];
  role: StaffRole;
  isActive: boolean;
  lastLoginAt: Date | null;
  mustChangePassword: boolean;
  createdAt: Date;
  updatedAt: Date;
  isSuspended?: boolean;
  suspendedAt?: Date | null;
  suspendedBy?: string | null;
  suspensionReason?: string | null;
  deletedAt?: Date | null;
  avatarUrl?: string | null;
}

export interface LoginRequest {
  staffIdOrEmail: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  staff: Staff;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
