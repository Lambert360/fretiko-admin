'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { Button } from '@/components/ui/button';
import { NotificationBell } from './NotificationBell';
import { cn } from '@/lib/utils';
import { LogOut, User, Menu } from 'lucide-react';

export function Header() {
  const { staff, logout } = useAuth();
  const { toggle, isOpen } = useSidebar();

  return (
    <header className={cn(
      "bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-all duration-300",
      isOpen ? "md:ml-64" : "md:ml-0"
    )}>
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Left side - Hamburger menu and title */}
        <div className="flex items-center gap-4 flex-1">
          {/* Hamburger Menu Button - Show on all screen sizes */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Welcome back, {staff?.fullName?.split(' ')[0] || 'Admin'}
            </h1>
            {staff?.departmentName && (
              <p className="text-sm text-muted-foreground mt-1">
                {staff.departmentName}
              </p>
            )}
          </div>
        </div>

        {/* Right side - Notifications and Profile */}
        <div className="flex items-center gap-4">
          {/* Real-time Notifications */}
          <NotificationBell />

          {/* Profile Dropdown */}
          <div className="flex items-center gap-3 border-l pl-4 border-gray-200 dark:border-gray-700">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {staff?.fullName}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {staff?.role.replace('_', ' ')}
              </p>
            </div>

            <Link href="/dashboard/profile">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full p-0 h-10 w-10"
                aria-label="View profile"
              >
                {staff?.avatarUrl ? (
                  <img
                    src={staff.avatarUrl}
                    alt={staff.fullName}
                    className="h-10 w-10 rounded-full object-cover"
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
                  className={`h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center ${staff?.avatarUrl ? 'hidden' : ''}`}
                >
                  <User className="h-5 w-5 text-primary" />
                </div>
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5 text-destructive" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
