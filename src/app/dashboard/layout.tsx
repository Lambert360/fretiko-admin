'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Toaster } from '@/components/ui/toaster';
import { SkipLink } from '@/components/ui/skip-link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, staff } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }

    // Redirect to change password if required
    if (!isLoading && isAuthenticated && staff?.mustChangePassword) {
      router.push('/change-password');
    }
  }, [isAuthenticated, isLoading, staff, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <SkipLink href="#navigation">Skip to navigation</SkipLink>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content - Adjusts based on sidebar state */}
        <MainContent>
          {/* Header */}
          <Header />

          {/* Page Content */}
          <main id="main-content" className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6" tabIndex={-1}>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </MainContent>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}

// Separate component to use sidebar context
function MainContent({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSidebar();
  
  return (
    <div className={cn(
      "flex flex-1 flex-col overflow-hidden transition-all duration-300",
      isOpen ? "md:ml-64" : "md:ml-0"
    )}>
      {children}
    </div>
  );
}
