'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function SkipLink({ href, children, className }: SkipLinkProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip link is activated with Enter key
      if (e.key === 'Enter' && document.activeElement === e.target) {
        const target = document.querySelector(href);
        if (target) {
          (target as HTMLElement).focus();
          e.preventDefault();
        }
      }
    };

    const link = document.querySelector<HTMLElement>(`a[href="${href}"]`);
    if (link) {
      link.addEventListener('keydown', handleKeyDown);
      return () => {
        link.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [href]);

  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className
      )}
    >
      {children}
    </a>
  );
}

