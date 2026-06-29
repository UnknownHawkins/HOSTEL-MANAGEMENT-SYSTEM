'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard, Users, BedDouble, FileText, MessageSquare,
  CreditCard, Bell, LogOut, Settings, Building2, Shield,
  ClipboardList, UserCheck, ChevronRight, Wifi,
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from '@/components/ui/toaster';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
}

const navItemsByRole: Record<string, NavItem[]> = {
  STUDENT: [
    { label: 'Dashboard', href: '/student', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'My Room', href: '/student/room', icon: <BedDouble className="w-4 h-4" /> },
    { label: 'Leave Requests', href: '/student/leaves', icon: <FileText className="w-4 h-4" /> },
    { label: 'Complaints', href: '/student/complaints', icon: <MessageSquare className="w-4 h-4" /> },
    { label: 'Payments', href: '/student/payments', icon: <CreditCard className="w-4 h-4" /> },
    { label: 'Notices', href: '/student/notices', icon: <Bell className="w-4 h-4" /> },
    { label: 'AI Assistant', href: '/student/ai-assistant', icon: <Wifi className="w-4 h-4" /> },
    { label: 'Settings', href: '/student/settings', icon: <Settings className="w-4 h-4" /> },
  ],
  WARDEN: [
    { label: 'Dashboard', href: '/warden', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Students', href: '/warden/students', icon: <Users className="w-4 h-4" /> },
    { label: 'Room Allocation', href: '/warden/rooms', icon: <BedDouble className="w-4 h-4" /> },
    { label: 'Leave Approvals', href: '/warden/leaves', icon: <FileText className="w-4 h-4" /> },
    { label: 'Complaints', href: '/warden/complaints', icon: <MessageSquare className="w-4 h-4" /> },
    { label: 'Visitors', href: '/warden/visitors', icon: <UserCheck className="w-4 h-4" /> },
    { label: 'Attendance', href: '/warden/attendance', icon: <ClipboardList className="w-4 h-4" /> },
    { label: 'Mess Payments', href: '/warden/payments', icon: <CreditCard className="w-4 h-4" /> },
    { label: 'Notices', href: '/warden/notices', icon: <Bell className="w-4 h-4" /> },
  ],
  ADMIN: [
    { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Students', href: '/warden/students', icon: <Users className="w-4 h-4" /> },
    { label: 'Wardens', href: '/admin/wardens', icon: <Shield className="w-4 h-4" /> },
    { label: 'Hostels & Rooms', href: '/warden/rooms', icon: <Building2 className="w-4 h-4" /> },
    { label: 'Leave Management', href: '/warden/leaves', icon: <FileText className="w-4 h-4" /> },
    { label: 'Complaints', href: '/warden/complaints', icon: <MessageSquare className="w-4 h-4" /> },
    { label: 'Payments', href: '/warden/payments', icon: <CreditCard className="w-4 h-4" /> },
    { label: 'Audit Logs', href: '/admin/logs', icon: <ClipboardList className="w-4 h-4" /> },
    { label: 'AI Risk Analysis', href: '/admin/ai', icon: <Wifi className="w-4 h-4" /> },
  ],
  SUPER_ADMIN: [
    { label: 'Dashboard', href: '/super-admin', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Admin Management', href: '/super-admin/admins', icon: <Users className="w-4 h-4" /> },
    { label: 'System Health', href: '/super-admin/health', icon: <Wifi className="w-4 h-4" /> },
    { label: 'Database Backup', href: '/super-admin/backup', icon: <Shield className="w-4 h-4" /> },
    { label: 'Audit Logs', href: '/super-admin/logs', icon: <ClipboardList className="w-4 h-4" /> },
  ],
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const role = user?.role || 'STUDENT';
  const navItems = navItemsByRole[role] || navItemsByRole.STUDENT;

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    clearAuth();
    router.push('/login');
    toast('success', 'Logged out successfully');
  };

  return (
    <aside className="sidebar-bg w-64 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-500/25">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground leading-tight">Hostel</p>
            <p className="text-xs text-muted-foreground">Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/20"
                    transition={{ type: 'spring', duration: 0.4 }}
                  />
                )}
                <span className="relative z-10">{item.icon}</span>
                <span className="relative z-10 flex-1">{item.label}</span>
                {isActive && <ChevronRight className="relative z-10 w-3.5 h-3.5 opacity-60" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User info & logout */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/30 transition-colors mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
            {user?.username?.slice(0, 2).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-foreground">{user?.username}</p>
            <p className="text-xs text-muted-foreground truncate">{role}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start gap-2 text-muted-foreground">
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
