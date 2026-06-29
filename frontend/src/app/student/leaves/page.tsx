'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { formatDate } from '@/lib/utils';
import { toast } from '@/components/ui/toaster';
import { FileText, Plus, Calendar } from 'lucide-react';
import api from '@/lib/api';

const leaveSchema = z.object({
  days: z.string().min(1, 'Number of days required'),
  reason: z.string().min(5, 'Reason too short'),
  startDate: z.string().min(1, 'Start date required'),
  endDate: z.string().min(1, 'End date required'),
});
type LeaveForm = z.infer<typeof leaveSchema>;

export default function StudentLeavesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: leaves = [], isLoading } = useQuery({
    queryKey: ['student-leaves'],
    queryFn: () => api.get('/leaves/my-leaves').then((r) => r.data.leaves),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LeaveForm>({
    resolver: zodResolver(leaveSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: LeaveForm) => api.post('/leaves/apply', { ...data, days: Number(data.days) }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['student-leaves'] });
      const ai = res.data.aiAssessment;
      toast('success', 'Leave Submitted!', ai ? `AI Risk: ${ai.risk} — ${ai.recommendation}` : 'Your leave is pending approval.');
      setModalOpen(false);
      reset();
    },
    onError: (err: any) => toast('error', 'Failed', err.response?.data?.message),
  });

  return (
    <DashboardLayout title="Leave Requests" subtitle="Apply and track your leave applications" requiredRoles={['STUDENT']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">Total: {leaves.length} | Pending: {leaves.filter((l: any) => l.status === 'PENDING').length}</p>
          </div>
          <Button variant="gradient" size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" /> Apply Leave
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 skeleton rounded-xl" />
            ))}
          </div>
        ) : leaves.length === 0 ? (
          <Card className="text-center py-16">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">No leave requests yet.</p>
            <Button variant="outline" className="mt-4" onClick={() => setModalOpen(true)}>
              Apply for Leave
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {leaves.map((leave: any, i: number) => (
              <motion.div
                key={leave.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-primary" />
                        <p className="font-medium text-foreground">{leave.reason}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {leave.days} days · {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                      </p>
                      {leave.wardenComment && (
                        <p className="text-xs text-amber-400 mt-2 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                          Warden: {leave.wardenComment}
                        </p>
                      )}
                    </div>
                    <Badge status={leave.status} variant="status" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Apply for Leave" description="Fill in the details for your leave request">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <Input label="Number of Days" type="number" min={1} placeholder="e.g. 3" error={errors.days?.message} {...register('days')} />
          <Input label="Start Date" type="date" error={errors.startDate?.message} {...register('startDate')} />
          <Input label="End Date" type="date" error={errors.endDate?.message} {...register('endDate')} />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground/80">Reason</label>
            <textarea
              rows={3}
              placeholder="Explain your reason..."
              className="flex w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              {...register('reason')}
            />
            {errors.reason && <p className="text-xs text-red-400">{errors.reason.message}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="gradient" className="flex-1" isLoading={mutation.isPending}>Submit Application</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
