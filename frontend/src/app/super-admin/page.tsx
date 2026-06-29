'use client';

import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Users, Server, Database, Activity } from 'lucide-react';
import api from '@/lib/api';

export default function SuperAdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data.stats),
  });

  return (
    <DashboardLayout title="Super Admin" subtitle="Full system control panel" requiredRoles={['SUPER_ADMIN']}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Users" value={stats ? (stats.studentCount + stats.wardenCount + 1) : 0} icon={<Users className="w-5 h-5" />} color="purple" />
          <StatCard title="Total Rooms" value={stats?.roomCount || 0} icon={<Database className="w-5 h-5" />} color="blue" />
          <StatCard title="System Health" value="Online" icon={<Activity className="w-5 h-5" />} color="emerald" />
          <StatCard title="Admins" value={1} icon={<Shield className="w-5 h-5" />} color="amber" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" /> System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'API Server', status: 'Running', color: 'bg-emerald-400' },
                { label: 'Database (PostgreSQL)', status: 'Connected', color: 'bg-emerald-400' },
                { label: 'Cache (Redis)', status: 'Connected', color: 'bg-emerald-400' },
                { label: 'Socket.IO', status: 'Active', color: 'bg-emerald-400' },
                { label: 'Gemini AI', status: 'Available', color: 'bg-blue-400' },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
                  <span className="text-sm font-medium">{s.label}</span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={`w-2 h-2 rounded-full ${s.color}`} />
                    {s.status}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" /> Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Database className="w-4 h-4" /> Run Database Backup
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Users className="w-4 h-4" /> Export User Data
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Activity className="w-4 h-4" /> View System Logs
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2 text-red-400 hover:text-red-300">
                <Server className="w-4 h-4" /> Flush Redis Cache
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
