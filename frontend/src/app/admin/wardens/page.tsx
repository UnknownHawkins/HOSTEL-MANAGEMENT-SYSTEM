'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { formatDate } from '@/lib/utils';
import { toast } from '@/components/ui/toaster';
import { Shield, Plus, Mail, Lock, User, Building2 } from 'lucide-react';
import api from '@/lib/api';

const wardenSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  hostelId: z.string().optional(),
});
type WardenForm = z.infer<typeof wardenSchema>;

export default function AdminWardensPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: wardens = [], isLoading } = useQuery({
    queryKey: ['wardens'],
    queryFn: () => api.get('/admin/wardens').then((r) => r.data.wardens),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<WardenForm>({
    resolver: zodResolver(wardenSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: WardenForm) => api.post('/admin/wardens', {
      ...data,
      hostelId: data.hostelId ? Number(data.hostelId) : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wardens'] });
      toast('success', 'Warden Account Created!', 'The new warden user has been successfully registered.');
      setModalOpen(false);
      reset();
    },
    onError: (err: any) => {
      toast('error', 'Registration Failed', err.response?.data?.message || 'Could not register warden.');
    },
  });

  return (
    <DashboardLayout title="Warden Management" subtitle="Manage hostel warden accounts" requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{wardens.length} wardens active</p>
          <Button variant="gradient" size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" /> Add Warden
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-20 skeleton rounded-xl" />)}</div>
        ) : wardens.length === 0 ? (
          <Card className="text-center py-16">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-20 text-muted-foreground" />
            <p className="text-muted-foreground">No wardens registered in the system yet.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {wardens.map((warden: any, i: number) => (
              <motion.div
                key={warden.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-500">
                        <Shield className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-base">{warden.user?.username}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3.5 h-3.5" /> {warden.user?.email} · Joined {formatDate(warden.user?.createdAt || warden.createdAt)}
                        </p>
                      </div>
                    </div>
                    {warden.hostel && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Building2 className="w-4 h-4 text-primary" />
                        <span>{warden.hostel.name} ({warden.hostel.code})</span>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Register Warden User">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <Input
            label="Username"
            placeholder="Choose warden username"
            icon={<User className="w-4 h-4" />}
            error={errors.username?.message}
            {...register('username')}
          />
          <Input
            label="Email"
            type="email"
            placeholder="warden@email.com"
            icon={<Mail className="w-4 h-4" />}
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Set password (min 6 characters)"
            icon={<Lock className="w-4 h-4" />}
            error={errors.password?.message}
            {...register('password')}
          />
          <Input
            label="Hostel ID (Optional)"
            type="number"
            placeholder="Assign to hostel ID"
            icon={<Building2 className="w-4 h-4" />}
            error={errors.hostelId?.message}
            {...register('hostelId')}
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="gradient" className="flex-1" isLoading={mutation.isPending}>Register Warden</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
