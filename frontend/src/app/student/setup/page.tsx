'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Building2, User, Phone, MapPin, Hash, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toaster';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

const setupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  rollNo: z.string().min(1, 'Roll number is required'),
  parentPhone: z.string().min(10, 'Enter a valid parent phone number'),
  address: z.string().min(5, 'Enter a detailed address'),
});
type SetupForm = z.infer<typeof setupSchema>;

export default function StudentSetupPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  const { register, handleSubmit, formState: { errors } } = useForm<SetupForm>({
    resolver: zodResolver(setupSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: SetupForm) => api.post('/auth/setup-profile', data),
    onSuccess: (res) => {
      toast('success', 'Profile Completed!', 'Welcome to your student portal.');
      if (user) {
        setUser({ ...user, profile: res.data.profile });
      }
      router.push('/student');
    },
    onError: (err: any) => {
      toast('error', 'Setup Failed', err.response?.data?.message || 'Could not complete profile setup.');
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-sky-50 via-white to-sky-100/50">
      {/* Background orbs */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-sky-300/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-sky-200/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 shadow-2xl shadow-sky-500/20 mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Complete Profile</h1>
          <p className="text-muted-foreground mt-2">Just a few more details to set up your hostel account</p>
        </div>

        <div className="glass-card rounded-2xl p-8 border border-border">
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              icon={<User className="w-4 h-4" />}
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="Roll Number"
              placeholder="e.g. 2026CS101"
              icon={<Hash className="w-4 h-4" />}
              error={errors.rollNo?.message}
              {...register('rollNo')}
            />

            <Input
              label="Parent / Guardian Contact"
              placeholder="10-digit mobile number"
              icon={<Phone className="w-4 h-4" />}
              error={errors.parentPhone?.message}
              {...register('parentPhone')}
            />

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/80">Permanent Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <textarea
                  rows={3}
                  placeholder="Enter your home address..."
                  className="flex w-full rounded-xl border border-border bg-muted/30 pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  {...register('address')}
                />
              </div>
              {errors.address && <p className="text-xs text-red-400">{errors.address.message}</p>}
            </div>

            <Button type="submit" variant="gradient" size="lg" className="w-full mt-2" isLoading={mutation.isPending}>
              Finish Setup <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
