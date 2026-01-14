'use client';

import { useState, useEffect } from 'react';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  X, 
  ShoppingCart, 
  AlertCircle, 
  AlertTriangle,
  Flag,
  DollarSign,
  UserX,
  TrendingUp,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAdminNotifications, type AdminNotification } from '@/hooks/use-admin-notifications';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

// Icon mapping
const iconMap: Record<string, any> = {
  ShoppingCart,
  AlertCircle,
  AlertTriangle,
  Flag,
  DollarSign,
  UserX,
  TrendingUp,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  Bell,
};

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    requestNotificationPermission,
  } = useAdminNotifications();
  
  const [isOpen, setIsOpen] = useState(false);
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);

  // Request browser notification permission on first interaction
  useEffect(() => {
    if (isOpen && !hasRequestedPermission) {
      requestNotificationPermission();
      setHasRequestedPermission(true);
    }
  }, [isOpen, hasRequestedPermission, requestNotificationPermission]);

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || Bell;
    return <IconComponent className="h-4 w-4" />;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'alert':
        return 'text-red-600 bg-red-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'success':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive" className="text-xs">Urgent</Badge>;
      case 'high':
        return <Badge variant="destructive" className="text-xs bg-orange-500">High</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="text-xs">Medium</Badge>;
      default:
        return null;
    }
  };

  const handleNotificationClick = (notification: AdminNotification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-semibold"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          {/* Connection status indicator */}
          {!isConnected && (
            <span 
              className="absolute bottom-0 right-0 h-2 w-2 bg-yellow-500 rounded-full border border-white"
              title="Reconnecting..."
            />
          )}
          {isConnected && Array.isArray(notifications) && notifications.length > 0 && (
            <span 
              className="absolute bottom-0 right-0 h-2 w-2 bg-green-500 rounded-full border border-white"
              title="Connected"
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div>
            <h3 className="font-semibold">Notifications</h3>
            <p className="text-xs text-muted-foreground">
              {isConnected ? 'Live updates active' : 'Reconnecting...'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {(!Array.isArray(notifications) || notifications.length === 0) ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No notifications yet</p>
              <p className="text-xs mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y">
              {(Array.isArray(notifications) ? notifications.slice(0, 50) : []).map((notification) => {
                const NotificationContent = (
                  <div
                    className={`block p-4 hover:bg-accent transition-colors cursor-pointer ${
                      !notification.is_read ? 'bg-blue-50/50 border-l-2 border-l-blue-500' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div className={`flex-shrink-0 mt-1 p-2 rounded-full ${getCategoryColor(notification.category)}`}>
                        {getIcon(notification.icon)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-medium text-sm leading-tight">
                            {notification.title}
                          </p>
                          {getPriorityBadge(notification.priority)}
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {notification.message}
                        </p>

                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                          
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs px-2"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Mark read
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Unread indicator */}
                      {!notification.is_read && (
                        <div className="flex-shrink-0">
                          <span className="h-2 w-2 bg-blue-500 rounded-full block" />
                        </div>
                      )}
                    </div>
                  </div>
                );

                // Wrap in Link if notification has a link
                if (notification.link) {
                  return (
                    <Link key={notification.id} href={notification.link}>
                      {NotificationContent}
                    </Link>
                  );
                }

                return (
                  <div key={notification.id}>
                    {NotificationContent}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {Array.isArray(notifications) && notifications.length > 0 && (
          <div className="p-3 border-t bg-muted/30 text-center">
            <Link href="/dashboard/notifications">
              <Button variant="ghost" size="sm" className="text-xs w-full">
                View all notifications
              </Button>
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

