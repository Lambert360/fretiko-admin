'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { StaffRole } from '@/types/staff';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  MessageSquare,
  Package,
  Truck,
  DollarSign,
  BarChart3,
  Mail,
  FileText,
  UserCog,
  Shield,
  ClipboardList,
  Building2,
  Scale,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  roles?: string[];
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'User Management',
    href: '/dashboard/users',
    icon: Users,
    permission: 'view_users',
  },
  {
    title: 'Orders',
    href: '/dashboard/orders',
    icon: ShoppingCart,
    permission: 'view_orders',
  },
  {
    title: 'Disputes',
    href: '/dashboard/disputes',
    icon: MessageSquare,
    permission: 'view_disputes',
  },
  {
    title: 'Suspension Appeals',
    href: '/dashboard/appeals',
    icon: Scale,
    permission: 'suspend_users',
  },
  {
    title: 'Content Moderation',
    href: '/dashboard/content',
    icon: Package,
    permission: 'view_products',
  },
  {
    title: 'Logistics',
    href: '/dashboard/logistics',
    icon: Truck,
    permission: 'view_riders',
  },
  {
    title: 'Finance',
    href: '/dashboard/finance',
    icon: DollarSign,
    permission: 'view_revenue',
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    permission: 'view_platform_stats',
  },
  {
    title: 'Memos',
    href: '/dashboard/memos',
    icon: Mail,
    permission: 'view_memos',
  },
  {
    title: 'Reports',
    href: '/dashboard/reports',
    icon: FileText,
    permission: 'view_reports',
  },
  {
    title: 'Staff Management',
    href: '/dashboard/staff',
    icon: UserCog,
    permission: 'create_staff',
    roles: ['super_admin', 'department_head'],
  },
  {
    title: 'Departments',
    href: '/dashboard/departments',
    icon: Building2,
    permission: 'manage_departments',
  },
  {
    title: 'Audit Logs',
    href: '/dashboard/audit',
    icon: ClipboardList,
    permission: 'view_staff_logs',
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { staff, isSuperAdmin, hasPermission } = useAuth();
  const { isOpen, close } = useSidebar();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const hasAccess = (item: NavItem) => {
    // Super admin has access to everything
    if (isSuperAdmin) return true;

    // Check role-based access
    if (item.roles && staff?.role) {
      const roleString = staff.role; // StaffRole enum values are already strings
      if (!item.roles.includes(roleString)) return false;
    }

    // Check permission-based access
    if (item.permission) {
      if (!hasPermission(item.permission)) return false;
    }

    return true;
  };

  return (
    <>
      {/* Overlay - shows when sidebar is open on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700',
          'transform transition-transform duration-300 ease-in-out',
          'flex flex-col overflow-y-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col flex-grow">
          {/* Logo */}
          <div className="flex items-center justify-between flex-shrink-0 px-4 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                Fretiko Admin
              </span>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={close}
              className="md:hidden p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Staff Info */}
          {staff && (
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {staff.fullName}
              </p>
              <p className="text-xs text-muted-foreground">{staff.staffId}</p>
              <p className="text-xs text-primary font-medium capitalize mt-1">
                {staff.role.replace('_', ' ')}
              </p>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navItems.map((item) => {
              if (!hasAccess(item)) return null;

              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    // Close sidebar on mobile when navigating
                    if (typeof window !== 'undefined' && window.innerWidth < 768) {
                      close();
                    }
                  }}
                  className={cn(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  <Icon
                    className={cn(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      active
                        ? 'text-primary-foreground'
                        : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                    )}
                  />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
