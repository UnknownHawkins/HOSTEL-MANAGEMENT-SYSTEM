'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth.store';
import { toast } from '@/components/ui/toaster';
import { Settings, Lock, User } from 'lucide-react';
import api from '@/lib/api';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(4, 'At least 4 characters'),
  confirmPassword: z.string().min(4, 'At least 4 characters'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
type PasswordForm = z.infer<typeof passwordSchema>;

export default function StudentSettingsPage() {
  const { user } = useAuthStore();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data: PasswordForm) => {
    try {
      await api.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast('success', 'Password Changed!', 'Your password has been updated.');
      reset();
    } catch (err: any) {
      toast('error', 'Failed', err.response?.data?.message || 'Could not update password.');
    }
  };

  return (
    <DashboardLayout title="Settings" subtitle="Manage your account preferences" requiredRoles={['STUDENT']}>
      <div className="max-w-2xl space-y-6">
        {/* Profile info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-violet-500/25">
                {user?.username?.slice(0, 2).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-lg font-semibold">{user?.username}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-primary mt-0.5">{user?.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" /> Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                placeholder="Enter current password"
                icon={<Lock className="w-4 h-4" />}
                error={errors.currentPassword?.message}
                {...register('currentPassword')}
              />
              <Input
                label="New Password"
                type="password"
                placeholder="Enter new password"
                icon={<Lock className="w-4 h-4" />}
                error={errors.newPassword?.message}
                {...register('newPassword')}
              />
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Re-enter new password"
                icon={<Lock className="w-4 h-4" />}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
              <Button type="submit" variant="gradient" isLoading={isSubmitting}>
                <Settings className="w-4 h-4" /> Update Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
