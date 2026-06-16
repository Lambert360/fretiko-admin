'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useNavBadges } from '@/hooks/use-nav-badges';
import { useAdminNotifications } from '@/hooks/use-admin-notifications';
import { StaffRole } from '@/types/staff';
import { Badge } from '@/components/ui/badge';
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
  Handshake,
  Settings,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  permissions?: string[]; // Alternative: array of permissions (OR logic)
  roles?: string[];
  badgeKey?: 'disputes' | 'reports' | 'memos' | 'orders' | 'notifications';
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
    badgeKey: 'disputes',
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
    title: 'Partnerships',
    href: '/dashboard/partnerships',
    icon: Handshake,
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
    badgeKey: 'memos',
  },
  {
    title: 'Reports',
    href: '/dashboard/reports',
    icon: FileText,
    permission: 'view_reports',
    badgeKey: 'reports',
  },
  {
    title: 'Staff Management',
    href: '/dashboard/staff',
    icon: UserCog,
    permissions: ['create_staff', 'view_staff_logs'], // Can access with either permission
  },
  {
    title: 'Departments',
    href: '/dashboard/departments',
    icon: Building2,
    permission: 'manage_departments',
  },
  {
    title: 'Website Management',
    href: '/dashboard/website-management',
    icon: Settings,
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
  const { badges, refreshBadges } = useNavBadges();
  const { notifications } = useAdminNotifications();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const hasAccess = (item: NavItem) => {
    // Super admin has access to everything
    if (isSuperAdmin) return true;

    // If no permission or role specified, allow access (e.g., Dashboard)
    if (!item.permission && !item.permissions && !item.roles) return true;

    // Check single permission
    if (item.permission && hasPermission(item.permission)) {
      return true;
    }

    // Check multiple permissions (OR logic - any one grants access)
    if (item.permissions && item.permissions.some(p => hasPermission(p))) {
      return true;
    }

    // Check role-based access
    if (item.roles && staff?.role) {
      const roleString = staff.role; // StaffRole enum values are already strings
      if (item.roles.includes(roleString)) {
        return true;
      }
    }

    // No access granted
    return false;
  };

  // Real-time badge updates - refresh badges when relevant notifications arrive
  useEffect(() => {
    if (notifications.length > 0) {
      // Get the latest notification
      const latestNotification = notifications[notifications.length - 1];

      // Check if this notification should trigger a badge refresh
      const shouldRefresh = [
        'dispute_opened',
        'dispute_escalated',
        'content_flagged',
        'report_submitted',
        'system_alert', // Could be memo-related
      ].some(type => latestNotification.type.includes(type) || latestNotification.type === type);

      if (shouldRefresh) {
        console.log('🔄 Refreshing nav badges due to notification:', latestNotification.type);
        refreshBadges();
      }
    }
  }, [notifications, refreshBadges]);

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

              const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;

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
                    'group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <Icon
                      className={cn(
                        'mr-3 h-5 w-5 flex-shrink-0',
                        active
                          ? 'text-primary-foreground'
                          : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                      )}
                    />
                    <span className="truncate">{item.title}</span>
                  </div>
                  
                  {badgeCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="ml-2 h-5 min-w-[20px] px-1.5 text-[10px] font-semibold flex-shrink-0"
                    >
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
