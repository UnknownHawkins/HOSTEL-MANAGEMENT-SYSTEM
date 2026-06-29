'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { Users, FileText, MessageSquare, BedDouble, Bell } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';

export default function WardenDashboard() {
  const { user } = useAuthStore();

  const { data: leaves = [] } = useQuery({
    queryKey: ['all-leaves'],
    queryFn: () => api.get('/leaves/all').then((r) => r.data.leaves),
  });

  const { data: complaints = [] } = useQuery({
    queryKey: ['all-complaints'],
    queryFn: () => api.get('/complaints/all').then((r) => r.data.complaints),
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => api.get('/rooms').then((r) => r.data.rooms),
  });

  const { data: notices = [] } = useQuery({
    queryKey: ['notices'],
    queryFn: () => api.get('/notices').then((r) => r.data.notices),
  });

  const pendingLeaves = leaves.filter((l: any) => l.status === 'PENDING').length;
  const openComplaints = complaints.filter((c: any) => c.status === 'OPEN').length;
  const totalBeds = rooms.reduce((s: number, r: any) => s + (r.beds?.length || 0), 0);
  const occupiedBeds = rooms.reduce((s: number, r: any) => s + (r.beds?.filter((b: any) => b.isOccupied).length || 0), 0);

  return (
    <DashboardLayout title="Warden Dashboard" subtitle={`Managing hostel as ${user?.username}`} requiredRoles={['WARDEN', 'ADMIN', 'SUPER_ADMIN']}>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Pending Leaves" value={pendingLeaves} icon={<FileText className="w-5 h-5" />} color="amber" />
          <StatCard title="Open Complaints" value={openComplaints} icon={<MessageSquare className="w-5 h-5" />} color="rose" />
          <StatCard title="Bed Occupancy" value={`${occupiedBeds}/${totalBeds}`} icon={<BedDouble className="w-5 h-5" />} color="blue" />
          <StatCard title="Active Notices" value={notices.length} icon={<Bell className="w-5 h-5" />} color="purple" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Leaves */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" /> Pending Leaves
                </CardTitle>
                <Link href="/warden/leaves">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {leaves.filter((l: any) => l.status === 'PENDING').length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <FileText className="w-7 h-7 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No pending leave requests.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaves
                    .filter((l: any) => l.status === 'PENDING')
                    .slice(0, 4)
                    .map((leave: any, i: number) => (
                      <motion.div
                        key={leave.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-muted/30"
                      >
                        <div>
                          <p className="text-sm font-medium">{leave.student?.user?.username}</p>
                          <p className="text-xs text-muted-foreground">{leave.days}d · {leave.reason?.slice(0, 35)}...</p>
                        </div>
                        <Link href="/warden/leaves">
                          <Button variant="outline" size="sm">Review</Button>
                        </Link>
                      </motion.div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Open Complaints */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-rose-400" /> Recent Complaints
                </CardTitle>
                <Link href="/warden/complaints">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {complaints.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <MessageSquare className="w-7 h-7 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No complaints filed.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {complaints.slice(0, 4).map((complaint: any, i: number) => (
                    <motion.div
                      key={complaint.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/30"
                    >
                      <div>
                        <p className="text-sm font-medium line-clamp-1">{complaint.title}</p>
                        <p className="text-xs text-muted-foreground">{complaint.category} · {formatDate(complaint.createdAt)}</p>
                      </div>
                      <Badge status={complaint.status} variant="status" />
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
