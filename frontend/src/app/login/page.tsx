'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Building2, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth.store';
import { toast } from '@/components/ui/toaster';
import api from '@/lib/api';
import Link from 'next/link';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});
type LoginForm = z.infer<typeof loginSchema>;

const roleRoutes: Record<string, string> = {
  STUDENT: '/student',
  WARDEN: '/warden',
  ADMIN: '/admin',
  SUPER_ADMIN: '/super-admin',
};

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await api.post('/auth/login', data);
      const { user, token, isFirstLogin } = res.data;
      setAuth(user, token, isFirstLogin);

      if (isFirstLogin && user.role === 'STUDENT') {
        toast('info', 'Welcome!', 'Please complete your profile setup.');
        router.push('/student/setup');
      } else {
        toast('success', `Welcome back, ${user.username}!`);
        router.push(roleRoutes[user.role] || '/student');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      toast('error', 'Login Failed', msg);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-sky-100/40 via-white to-sky-200/20">
        {/* Blurred orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-sky-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-sky-200/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center p-16">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-2xl shadow-sky-500/30">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">Hostel Management System</h1>
                <p className="text-xs text-muted-foreground">Enterprise Edition</p>
              </div>
            </div>

            <h2 className="text-4xl font-bold text-foreground leading-tight mb-4">
              Hostel Management<br />
              <span className="gradient-text">Reimagined.</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-10">
              A comprehensive platform for managing hostel operations — rooms, leaves, 
              complaints, payments, and more — in one place.
            </p>

            {/* Feature bullets */}
            {[
              'AI-powered complaint classification',
              'Real-time notifications via Socket.IO',
              'Stripe & Razorpay payment integration',
              'Role-based access for Students, Wardens & Admins',
            ].map((f, i) => (
              <motion.div
                key={f}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3 mb-3"
              >
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{f}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold gradient-text">Hostel Management System</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground">Sign in</h2>
            <p className="text-muted-foreground mt-2">Enter your credentials to access the portal</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Username"
              placeholder="Enter your username"
              icon={<User className="w-4 h-4" />}
              error={errors.username?.message}
              {...register('username')}
            />

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/80">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="flex h-10 w-full rounded-xl border border-border bg-muted/30 pl-10 pr-10 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <Button type="submit" variant="gradient" size="lg" className="w-full" isLoading={isSubmitting}>
              Sign In <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-primary hover:underline font-medium">
                Register here
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
