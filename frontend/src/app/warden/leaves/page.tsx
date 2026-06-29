'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { formatDate } from '@/lib/utils';
import { toast } from '@/components/ui/toaster';
import { FileText, CheckCircle, XCircle, Calendar } from 'lucide-react';
import api from '@/lib/api';

export default function WardenLeavesPage() {
  const queryClient = useQueryClient();
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [action, setAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [comment, setComment] = useState('');

  const { data: leaves = [], isLoading } = useQuery({
    queryKey: ['all-leaves'],
    queryFn: () => api.get('/leaves/all').then((r) => r.data.leaves),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, comment }: { id: number; status: string; comment: string }) =>
      api.patch(`/leaves/review/${id}`, { status, comment }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['all-leaves'] });
      toast('success', `Leave ${vars.status.toLowerCase()} successfully.`);
      setSelectedLeave(null);
      setComment('');
    },
    onError: (err: any) => toast('error', 'Error', err.response?.data?.message),
  });

  const pendingLeaves = leaves.filter((l: any) => l.status === 'PENDING');
  const reviewedLeaves = leaves.filter((l: any) => l.status !== 'PENDING');

  return (
    <DashboardLayout title="Leave Approvals" subtitle="Review and manage student leave applications" requiredRoles={['WARDEN', 'ADMIN', 'SUPER_ADMIN']}>
      <div className="space-y-6">
        {/* Pending */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              Pending Requests
              <span className="ml-1 px-2 py-0.5 bg-amber-500/15 text-amber-400 text-xs rounded-full border border-amber-500/30">{pendingLeaves.length}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 skeleton rounded-xl" />)}</div>
            ) : pendingLeaves.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <CheckCircle className="w-10 h-10 mx-auto mb-3 text-emerald-500/40" />
                <p>All leave requests have been reviewed!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingLeaves.map((leave: any, i: number) => (
                  <motion.div
                    key={leave.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 rounded-xl bg-muted/30 border border-border hover:border-primary/20 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-foreground">{leave.student?.user?.username}</p>
                          <Badge status="PENDING" variant="status" />
                        </div>
                        <p className="text-sm text-muted-foreground">{leave.reason}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{leave.days} days</span>
                          <span>{formatDate(leave.startDate)} → {formatDate(leave.endDate)}</span>
                          <span>Applied: {formatDate(leave.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => { setSelectedLeave(leave); setAction('APPROVED'); }}
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => { setSelectedLeave(leave); setAction('REJECTED'); }}
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leave History */}
        <Card>
          <CardHeader>
            <CardTitle>Leave History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reviewedLeaves.slice(0, 8).map((leave: any) => (
                <div key={leave.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
                  <div>
                    <p className="text-sm font-medium">{leave.student?.user?.username} · {leave.days}d</p>
                    <p className="text-xs text-muted-foreground">{leave.reason?.slice(0, 50)}... · {formatDate(leave.createdAt)}</p>
                  </div>
                  <Badge status={leave.status} variant="status" />
                </div>
              ))}
              {reviewedLeaves.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-6">No review history.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={!!selectedLeave}
        onClose={() => { setSelectedLeave(null); setComment(''); }}
        title={action === 'APPROVED' ? 'Approve Leave Request' : 'Reject Leave Request'}
        description={selectedLeave ? `${selectedLeave.student?.user?.username} — ${selectedLeave.days} days: ${selectedLeave.reason}` : ''}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground/80">Comment (Optional)</label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={action === 'APPROVED' ? 'e.g. Approved. Please return on time.' : 'e.g. Insufficient documentation.'}
              className="flex w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => { setSelectedLeave(null); setComment(''); }}>Cancel</Button>
            <Button
              variant={action === 'APPROVED' ? 'success' : 'destructive'}
              className="flex-1"
              isLoading={reviewMutation.isPending}
              onClick={() => reviewMutation.mutate({ id: selectedLeave.id, status: action, comment })}
            >
              Confirm {action === 'APPROVED' ? 'Approval' : 'Rejection'}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
