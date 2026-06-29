'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { useAuthStore } from '@/store/auth.store';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  requiredRoles?: string[];
}

export function DashboardLayout({ children, title, subtitle, requiredRoles }: DashboardLayoutProps) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (requiredRoles && user && !requiredRoles.includes(user.role)) {
      // Redirect to the appropriate dashboard for the user's role
      const roleRoutes: Record<string, string> = {
        STUDENT: '/student',
        WARDEN: '/warden',
        ADMIN: '/admin',
        SUPER_ADMIN: '/super-admin',
      };
      router.push(roleRoutes[user.role] || '/login');
    }
  }, [isAuthenticated, user, requiredRoles, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={title} subtitle={subtitle} />
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 px-6 py-6 md:px-8 md:py-7 lg:px-10 lg:py-8 overflow-auto"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
