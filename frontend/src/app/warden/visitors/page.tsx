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
import { UserCheck, Plus, Clock, LogOut as LogOutIcon } from 'lucide-react';
import api from '@/lib/api';

const visitorSchema = z.object({
  studentId: z.string().min(1, 'Student ID required'),
  visitorName: z.string().min(2, 'Visitor name required'),
  relation: z.string().min(2, 'Relation required'),
  contactNumber: z.string().min(10, 'Valid phone number'),
  purpose: z.string().min(3, 'Purpose required'),
});
type VisitorForm = z.infer<typeof visitorSchema>;

export default function WardenVisitorsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: visitors = [], isLoading } = useQuery({
    queryKey: ['visitors'],
    queryFn: () => api.get('/visitors').then((r) => r.data.visitors),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<VisitorForm>({
    resolver: zodResolver(visitorSchema),
  });

  const checkInMutation = useMutation({
    mutationFn: (data: VisitorForm) => api.post('/visitors/check-in', { ...data, studentId: Number(data.studentId) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      toast('success', 'Visitor checked in!');
      setModalOpen(false);
      reset();
    },
    onError: (err: any) => toast('error', 'Error', err.response?.data?.message),
  });

  const checkOutMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/visitors/check-out/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      toast('success', 'Visitor checked out.');
    },
    onError: (err: any) => toast('error', 'Error', err.response?.data?.message),
  });

  const activeVisitors = visitors.filter((v: any) => !v.checkOutTime);
  const pastVisitors = visitors.filter((v: any) => v.checkOutTime);

  return (
    <DashboardLayout title="Visitor Management" subtitle="Track hostel visitors" requiredRoles={['WARDEN', 'ADMIN', 'SUPER_ADMIN']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Active: {activeVisitors.length} · Total: {visitors.length}</p>
          <Button variant="gradient" size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" /> Check-in Visitor
          </Button>
        </div>

        {/* Active Visitors */}
        {activeVisitors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" /> Currently Visiting
                <span className="ml-1 w-2 h-2 rounded-full bg-emerald-400 pulse-live" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeVisitors.map((v: any) => (
                <div key={v.id} className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <div>
                    <p className="font-semibold text-foreground">{v.visitorName}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.relation} of {v.student?.user?.username} · {v.purpose}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">In: {formatDate(v.checkInTime)} · ☎ {v.contactNumber}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => checkOutMutation.mutate(v.id)}
                    isLoading={checkOutMutation.isPending}
                  >
                    <LogOutIcon className="w-3.5 h-3.5" /> Check Out
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Past Visitors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary" /> Visitor Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-14 skeleton rounded-xl" />)}</div>
            ) : pastVisitors.length === 0 && activeVisitors.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <UserCheck className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>No visitor records yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pastVisitors.slice(0, 15).map((v: any, i: number) => (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/20"
                  >
                    <div>
                      <p className="text-sm font-medium">{v.visitorName} ({v.relation})</p>
                      <p className="text-xs text-muted-foreground">
                        Visited {v.student?.user?.username} · {v.purpose}
                      </p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{formatDate(v.checkInTime)}</p>
                      <p>→ {formatDate(v.checkOutTime)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Check-in Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Check-in Visitor" size="lg">
        <form onSubmit={handleSubmit((d) => checkInMutation.mutate(d))} className="space-y-4">
          <Input label="Student ID" type="number" placeholder="Student being visited" error={errors.studentId?.message} {...register('studentId')} />
          <Input label="Visitor Name" placeholder="Full name of visitor" error={errors.visitorName?.message} {...register('visitorName')} />
          <Input label="Relation" placeholder="e.g. Parent, Guardian, Friend" error={errors.relation?.message} {...register('relation')} />
          <Input label="Contact Number" placeholder="10-digit phone number" error={errors.contactNumber?.message} {...register('contactNumber')} />
          <Input label="Purpose" placeholder="Reason for visit" error={errors.purpose?.message} {...register('purpose')} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="gradient" className="flex-1" isLoading={checkInMutation.isPending}>Check In</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
