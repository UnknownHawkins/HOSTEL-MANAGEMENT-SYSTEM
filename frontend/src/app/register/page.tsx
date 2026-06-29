'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Building2, User, Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toaster';
import api from '@/lib/api';
import Link from 'next/link';

const registerSchema = z.object({
  username: z.string().min(3, 'At least 3 characters'),
  email: z.string().email('Valid email required'),
  password: z.string().min(4, 'At least 4 characters'),
  role: z.enum(['student', 'warden']),
});
type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'student' },
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      await api.post('/auth/register', data);
      toast('success', 'Registration Successful!', 'Please log in with your new account.');
      router.push('/login');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed.';
      toast('error', 'Error', msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background via-background to-violet-900/10">
      {/* Background orbs */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 shadow-2xl shadow-violet-500/30 mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Create Account</h1>
          <p className="text-muted-foreground mt-2">Register to access the hostel portal</p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Username"
              placeholder="Choose a username"
              icon={<User className="w-4 h-4" />}
              error={errors.username?.message}
              {...register('username')}
            />

            <Input
              label="Email"
              type="email"
              placeholder="your@email.com"
              icon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Set a secure password"
              icon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/80">Account Type</label>
              <select
                className="flex h-10 w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
                {...register('role')}
              >
                <option value="student">Student</option>
                <option value="warden">Warden</option>
              </select>
            </div>

            <Button type="submit" variant="gradient" size="lg" className="w-full" isLoading={isSubmitting}>
              Create Account <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
