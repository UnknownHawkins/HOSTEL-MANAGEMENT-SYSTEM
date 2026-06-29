'use client';

import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, BedDouble, FileText, MessageSquare, CreditCard, TrendingUp } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

const CHART_COLORS = ['#7c3aed', '#2563eb', '#06b6d4', '#10b981', '#f59e0b'];

// Mock trend data (replace with real data from backend analytics endpoint)
const monthlyData = [
  { month: 'Jan', students: 80, payments: 40000, leaves: 12 },
  { month: 'Feb', students: 85, payments: 52000, leaves: 15 },
  { month: 'Mar', students: 92, payments: 61000, leaves: 8 },
  { month: 'Apr', students: 88, payments: 58000, leaves: 20 },
  { month: 'May', students: 95, payments: 72000, leaves: 11 },
  { month: 'Jun', students: 100, payments: 80000, leaves: 18 },
];

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data.stats),
  });

  const occupancyData = stats ? [
    { name: 'Occupied', value: stats.occupiedBeds },
    { name: 'Vacant', value: stats.totalBeds - stats.occupiedBeds },
  ] : [];

  return (
    <DashboardLayout title="Admin Dashboard" subtitle="System-wide overview and analytics" requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Students" value={stats?.studentCount || 0} icon={<Users className="w-5 h-5" />} color="purple" trend={{ value: 8, label: 'this month' }} />
          <StatCard title="Bed Occupancy" value={`${stats?.occupancyRate || 0}%`} icon={<BedDouble className="w-5 h-5" />} color="blue" />
          <StatCard title="Pending Leaves" value={stats?.pendingLeaves || 0} icon={<FileText className="w-5 h-5" />} color="amber" />
          <StatCard title="Total Revenue" value={formatCurrency(stats?.totalRevenue || 0)} icon={<CreditCard className="w-5 h-5" />} color="emerald" trend={{ value: 12, label: 'vs last month' }} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Trend Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Revenue & Student Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={monthlyData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="colorPayments" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 40% 18%)" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(215 20% 55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(222 47% 10%)', border: '1px solid hsl(222 40% 18%)', borderRadius: '12px' }}
                    labelStyle={{ color: 'hsl(213 31% 91%)' }}
                  />
                  <Area type="monotone" dataKey="payments" stroke="#7c3aed" strokeWidth={2} fill="url(#colorPayments)" name="Revenue (₹)" />
                  <Area type="monotone" dataKey="students" stroke="#2563eb" strokeWidth={2} fill="url(#colorStudents)" name="Students" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Occupancy Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BedDouble className="w-4 h-4 text-blue-400" /> Bed Occupancy
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={occupancyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {occupancyData.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index]} />
                    ))}
                  </Pie>
                  <Legend
                    formatter={(value) => <span style={{ color: 'hsl(215 20% 55%)', fontSize: 12 }}>{value}</span>}
                  />
                  <Tooltip
                    contentStyle={{ background: 'hsl(222 47% 10%)', border: '1px solid hsl(222 40% 18%)', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center mt-2">
                <p className="text-3xl font-bold gradient-text">{stats?.occupancyRate || 0}%</p>
                <p className="text-xs text-muted-foreground">Occupancy Rate</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-violet-500/15 text-violet-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Wardens</p>
              <p className="text-2xl font-bold">{stats?.wardenCount || 0}</p>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-rose-500/15 text-rose-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Open Complaints</p>
              <p className="text-2xl font-bold">{stats?.openComplaints || 0}</p>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/15 text-cyan-400">
              <BedDouble className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Rooms</p>
              <p className="text-2xl font-bold">{stats?.roomCount || 0}</p>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
