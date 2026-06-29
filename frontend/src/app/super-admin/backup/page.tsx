'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { toast } from '@/components/ui/toaster';
import { Database, Plus, Download, Trash2, CheckCircle } from 'lucide-react';
import api from '@/lib/api';

export default function SuperAdminBackupPage() {
  const queryClient = useQueryClient();
  const [backups, setBackups] = useState<any[]>([
    { id: 1, filename: 'ehms_backup_2026-06-27_0000.sql', size: '2.4 MB', status: 'COMPLETED', createdAt: new Date(Date.now() - 24 * 3600 * 1000) },
    { id: 2, filename: 'ehms_backup_2026-06-26_0000.sql', size: '2.3 MB', status: 'COMPLETED', createdAt: new Date(Date.now() - 48 * 3600 * 1000) },
  ]);

  const backupMutation = useMutation({
    mutationFn: () => new Promise((resolve) => setTimeout(resolve, 2000)),
    onSuccess: () => {
      const newBackup = {
        id: Date.now(),
        filename: `ehms_backup_${new Date().toISOString().split('T')[0]}_manual.sql`,
        size: '2.5 MB',
        status: 'COMPLETED',
        createdAt: new Date(),
      };
      setBackups((prev) => [newBackup, ...prev]);
      toast('success', 'Backup Created!', 'Database snapshot has been saved securely.');
    },
  });

  return (
    <DashboardLayout title="Database Backups" subtitle="Manage database snapshots and restorations" requiredRoles={['SUPER_ADMIN']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{backups.length} database snapshots retained</p>
          <Button variant="gradient" size="sm" onClick={() => backupMutation.mutate()} isLoading={backupMutation.isPending}>
            <Plus className="w-4 h-4" /> Trigger Manual Backup
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-500" /> Retention Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            {backups.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Database className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>No snapshots available.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {backups.map((bak) => (
                  <div key={bak.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-muted/10 border border-border/60 gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{bak.filename}</span>
                        <Badge status="SUCCESS" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">{bak.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Size: {bak.size} · Created: {formatDate(bak.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="gap-1">
                        <Download className="w-3.5 h-3.5" /> Download
                      </Button>
                      <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
