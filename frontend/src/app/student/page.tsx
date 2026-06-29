'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { BedDouble, FileText, MessageSquare, CreditCard, Bell, Wifi } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';

export default function StudentDashboard() {
  const { user } = useAuthStore();

  const { data: leaves } = useQuery({
    queryKey: ['student-leaves'],
    queryFn: () => api.get('/leaves/my-leaves').then((r) => r.data.leaves),
  });

  const { data: complaints } = useQuery({
    queryKey: ['student-complaints'],
    queryFn: () => api.get('/complaints/my-complaints').then((r) => r.data.complaints),
  });

  const { data: payments } = useQuery({
    queryKey: ['student-payments'],
    queryFn: () => api.get('/payments/my-payments').then((r) => r.data.payments),
  });

  const { data: notices } = useQuery({
    queryKey: ['notices'],
    queryFn: () => api.get('/notices').then((r) => r.data.notices),
  });

  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').then((r) => r.data.user),
  });

  const pendingLeaves = leaves?.filter((l: any) => l.status === 'PENDING').length || 0;
  const openComplaints = complaints?.filter((c: any) => c.status === 'OPEN').length || 0;
  const totalPaid = payments?.filter((p: any) => p.status === 'PAID').reduce((s: number, p: any) => s + p.amount, 0) || 0;

  return (
    <DashboardLayout title="Student Dashboard" subtitle={`Welcome back, ${user?.username}`} requiredRoles={['STUDENT']}>
      <div className="space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="My Room" value={meData?.profile?.room?.number || 'Unassigned'} icon={<BedDouble className="w-5 h-5" />} color="blue" />
          <StatCard title="Pending Leaves" value={pendingLeaves} icon={<FileText className="w-5 h-5" />} color="amber" />
          <StatCard title="Open Complaints" value={openComplaints} icon={<MessageSquare className="w-5 h-5" />} color="rose" />
          <StatCard title="Total Paid" value={`₹${totalPaid.toLocaleString()}`} icon={<CreditCard className="w-5 h-5" />} color="emerald" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Leaves */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Recent Leave Requests
                </CardTitle>
                <Link href="/student/leaves">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {leaves?.length ? (
                <div className="space-y-3">
                  {leaves.slice(0, 4).map((leave: any) => (
                    <motion.div
                      key={leave.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{leave.reason}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {leave.days} days · {formatDate(leave.startDate)}
                        </p>
                      </div>
                      <Badge status={leave.status} variant="status" />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No leave requests yet.</p>
                  <Link href="/student/leaves">
                    <Button variant="outline" size="sm" className="mt-3">Apply for Leave</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notices */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" /> Latest Notices
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notices?.length ? (
                <div className="space-y-3">
                  {notices.slice(0, 4).map((notice: any) => (
                    <div key={notice.id} className="p-3 rounded-xl bg-muted/30">
                      <p className="text-sm font-medium text-foreground line-clamp-1">{notice.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notice.content}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">{formatDate(notice.createdAt)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Bell className="w-7 h-7 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No notices yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Apply Leave', href: '/student/leaves', icon: <FileText className="w-5 h-5" />, color: 'text-amber-400' },
                { label: 'File Complaint', href: '/student/complaints', icon: <MessageSquare className="w-5 h-5" />, color: 'text-rose-400' },
                { label: 'Pay Fees', href: '/student/payments', icon: <CreditCard className="w-5 h-5" />, color: 'text-emerald-400' },
                { label: 'AI Assistant', href: '/student/ai-assistant', icon: <Wifi className="w-5 h-5" />, color: 'text-violet-400' },
              ].map((action) => (
                <Link key={action.href} href={action.href}>
                  <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/30 hover:bg-muted/60 border border-border hover:border-primary/30 transition-all duration-200 cursor-pointer group">
                    <span className={`${action.color} group-hover:scale-110 transition-transform`}>{action.icon}</span>
                    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground text-center">{action.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
