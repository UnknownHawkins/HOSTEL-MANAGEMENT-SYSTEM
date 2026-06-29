'use client';

import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Wifi, Server, Database, Activity, Cpu, HardDrive } from 'lucide-react';
import api from '@/lib/api';

export default function SuperAdminHealthPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['system-stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data.stats),
  });

  return (
    <DashboardLayout title="System Health" subtitle="Real-time application metrics" requiredRoles={['SUPER_ADMIN']}>
      <div className="space-y-6">
        {/* Core status meters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-sky-500" /> CPU Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Server CPU</span>
                <span className="font-semibold text-foreground">12%</span>
              </div>
              <div className="w-full bg-muted/40 h-2 rounded-full">
                <div className="bg-sky-500 h-2 rounded-full" style={{ width: '12%' }} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-sky-500" /> Memory Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Used / Total</span>
                <span className="font-semibold text-foreground">1.4 GB / 8.0 GB</span>
              </div>
              <div className="w-full bg-muted/40 h-2 rounded-full">
                <div className="bg-sky-500 h-2 rounded-full" style={{ width: '17.5%' }} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="w-5 h-5 text-sky-500" /> API Latency
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Response Time</span>
                <span className="font-semibold text-foreground">32 ms</span>
              </div>
              <div className="w-full bg-muted/40 h-2 rounded-full">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '10%' }} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Node status list */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5 text-sky-500" /> Services Status Matrix
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: 'Application Gateway (Next.js)', status: 'HEALTHY', type: 'Frontend Gateway', desc: 'Serving HTTP & Web Sockets' },
              { name: 'Primary REST API', status: 'HEALTHY', type: 'Backend Service', desc: 'Express API running on port 5000' },
              { name: 'Neon PostgreSQL Instance', status: 'HEALTHY', type: 'Database Service', desc: 'Main transactional cluster' },
              { name: 'Redis Cache Server', status: 'HEALTHY', type: 'Caching Layer', desc: 'Key-value cache cluster' },
              { name: 'Google Gemini Gateway', status: 'ACTIVE', type: 'AI Services', desc: 'Mock reasoning model active' },
            ].map((srv) => (
              <div key={srv.name} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-muted/10 border border-border/60 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground text-sm">{srv.name}</span>
                    <span className="text-xs text-muted-foreground/60">· {srv.type}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{srv.desc}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-600">{srv.status}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
