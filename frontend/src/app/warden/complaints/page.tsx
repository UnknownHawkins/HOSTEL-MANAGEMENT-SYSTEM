'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { toast } from '@/components/ui/toaster';
import { MessageSquare, CheckCircle, Wrench, Zap } from 'lucide-react';
import api from '@/lib/api';
import { useState } from 'react';
import { Modal } from '@/components/ui/modal';

export default function WardenComplaintsPage() {
  const queryClient = useQueryClient();
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [resolution, setResolution] = useState('');

  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ['all-complaints'],
    queryFn: () => api.get('/complaints/all').then((r) => r.data.complaints),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, resolution }: { id: number; status: string; resolution?: string }) =>
      api.patch(`/complaints/update/${id}`, { status, resolution }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-complaints'] });
      toast('success', 'Complaint updated successfully');
      setSelectedComplaint(null);
      setResolution('');
    },
    onError: (err: any) => toast('error', 'Error', err.response?.data?.message),
  });

  const statusActions: Record<string, { next: string; label: string }> = {
    OPEN: { next: 'IN_PROGRESS', label: 'Start Working' },
    IN_PROGRESS: { next: 'RESOLVED', label: 'Mark Resolved' },
  };

  return (
    <DashboardLayout title="Complaints Management" subtitle="Review and resolve student complaints" requiredRoles={['WARDEN', 'ADMIN', 'SUPER_ADMIN']}>
      <div className="space-y-6">
        {/* Stats bar */}
        <div className="flex gap-4 flex-wrap">
          {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((status) => {
            const count = complaints.filter((c: any) => c.status === status).length;
            return (
              <div key={status} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 border border-border text-xs">
                <Badge status={status} variant="status">{status.replace('_', ' ')}</Badge>
                <span className="font-bold">{count}</span>
              </div>
            );
          })}
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 skeleton rounded-xl" />)}</div>
        ) : complaints.length === 0 ? (
          <Card className="text-center py-16">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">No complaints filed.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {complaints.map((c: any, i: number) => {
              const actionConfig = statusActions[c.status];
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-foreground">{c.title}</p>
                          <span className="text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded">{c.category}</span>
                          {c.priority === 'HIGH' && (
                            <span className="flex items-center gap-0.5 text-xs text-rose-400">
                              <Zap className="w-3 h-3" /> High
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                        <p className="text-xs text-muted-foreground/60 mt-2">
                          By: {c.student?.user?.username} · {formatDate(c.createdAt)}
                        </p>
                        {c.resolution && (
                          <p className="text-xs text-emerald-400 mt-2 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                            ✓ {c.resolution}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <Badge status={c.status} variant="status" />
                        {actionConfig && (
                          <Button
                            size="sm"
                            variant={c.status === 'OPEN' ? 'warning' : 'success'}
                            onClick={() => {
                              if (actionConfig.next === 'RESOLVED') {
                                setSelectedComplaint(c);
                              } else {
                                updateMutation.mutate({ id: c.id, status: actionConfig.next });
                              }
                            }}
                          >
                            {c.status === 'OPEN' ? <Wrench className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            {actionConfig.label}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resolve Modal */}
      <Modal
        isOpen={!!selectedComplaint}
        onClose={() => { setSelectedComplaint(null); setResolution(''); }}
        title="Resolve Complaint"
        description={selectedComplaint?.title}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground/80">Resolution Details</label>
            <textarea
              rows={3}
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Describe how the issue was resolved..."
              className="flex w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setSelectedComplaint(null)}>Cancel</Button>
            <Button
              variant="success"
              className="flex-1"
              isLoading={updateMutation.isPending}
              onClick={() => updateMutation.mutate({ id: selectedComplaint.id, status: 'RESOLVED', resolution })}
            >
              <CheckCircle className="w-4 h-4" /> Mark Resolved
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
