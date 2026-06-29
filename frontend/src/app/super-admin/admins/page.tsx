'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
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
import { Shield, Plus, Mail, Lock, User } from 'lucide-react';
import api from '@/lib/api';

const adminSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});
type AdminForm = z.infer<typeof adminSchema>;

export default function SuperAdminAdminsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: admins = [], isLoading } = useQuery({
    queryKey: ['system-admins'],
    queryFn: () => api.get('/admin/admins').then((r) => r.data.admins),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AdminForm>({
    resolver: zodResolver(adminSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: AdminForm) => api.post('/auth/register', { ...data, role: 'admin' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-admins'] });
      toast('success', 'Admin Created!', 'A new administrative account has been registered.');
      setModalOpen(false);
      reset();
    },
    onError: (err: any) => {
      toast('error', 'Registration Failed', err.response?.data?.message || 'Could not register admin.');
    },
  });

  return (
    <DashboardLayout title="Admin Management" subtitle="Manage system administrators" requiredRoles={['SUPER_ADMIN']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{admins.length} administrators active</p>
          <Button variant="gradient" size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" /> Add Admin
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-20 skeleton rounded-xl" />)}</div>
        ) : (
          <div className="space-y-3">
            {admins.map((admin: any, i: number) => (
              <motion.div
                key={admin.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-500"><Shield className="w-5 h-5" /></div>
                      <div>
                        <p className="font-semibold text-foreground">{admin.username}</p>
                        <p className="text-xs text-muted-foreground">{admin.email} · Registered {formatDate(admin.createdAt)}</p>
                      </div>
                    </div>
                    <Badge status={admin.role} className="bg-sky-500/10 text-sky-600 border-sky-500/20">{admin.role}</Badge>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Register Administrative User">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <Input
            label="Username"
            placeholder="Choose admin username"
            icon={<User className="w-4 h-4" />}
            error={errors.username?.message}
            {...register('username')}
          />
          <Input
            label="Email"
            type="email"
            placeholder="admin@email.com"
            icon={<Mail className="w-4 h-4" />}
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Set admin password"
            icon={<Lock className="w-4 h-4" />}
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="gradient" className="flex-1" isLoading={mutation.isPending}>Register Admin</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
