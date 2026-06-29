'use client';

import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { ClipboardList } from 'lucide-react';
import api from '@/lib/api';

export default function SuperAdminLogsPage() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['system-audit-logs'],
    queryFn: () => api.get('/admin/audit-logs').then((r) => r.data.logs),
  });

  return (
    <DashboardLayout title="System Audit Logs" subtitle="Security and configuration audit trails" requiredRoles={['SUPER_ADMIN']}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-sky-500" /> Security Audit trail
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-12 skeleton rounded-xl" />)}</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No audit logs captured yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                    <th className="pb-3 pr-4">User</th>
                    <th className="pb-3 pr-4">Action</th>
                    <th className="pb-3 pr-4">Details</th>
                    <th className="pb-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: any) => (
                    <tr key={log.id} className="table-row-hover border-b border-border/50 last:border-0">
                      <td className="py-3 pr-4 font-medium">{log.user?.username || `ID: ${log.userId}`}</td>
                      <td className="py-3 pr-4">
                        <span className="text-xs px-2.5 py-1 rounded bg-sky-500/10 text-sky-600 border border-sky-500/20 font-mono">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground max-w-xs truncate" title={log.details}>
                        {log.details}
                      </td>
                      <td className="py-3 text-muted-foreground whitespace-nowrap">{formatDate(log.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
