'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { formatDate } from '@/lib/utils';
import { toast } from '@/components/ui/toaster';
import { MessageSquare, Plus, Zap } from 'lucide-react';
import api from '@/lib/api';

const complaintSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 chars'),
  description: z.string().min(10, 'Please describe the issue in detail'),
  category: z.enum(['MAINTENANCE', 'FOOD', 'HYGIENE', 'SAFETY', 'INTERNET', 'ELECTRICITY', 'OTHER']),
});
type ComplaintForm = z.infer<typeof complaintSchema>;

const CATEGORIES = ['MAINTENANCE', 'FOOD', 'HYGIENE', 'SAFETY', 'INTERNET', 'ELECTRICITY', 'OTHER'];

export default function StudentComplaintsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ['student-complaints'],
    queryFn: () => api.get('/complaints/my-complaints').then((r) => r.data.complaints),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ComplaintForm>({
    resolver: zodResolver(complaintSchema),
    defaultValues: { category: 'MAINTENANCE' },
  });

  const mutation = useMutation({
    mutationFn: (data: ComplaintForm) => api.post('/complaints/file', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['student-complaints'] });
      const ai = res.data.aiAnalysis;
      toast('success', 'Complaint Filed!', ai ? `AI Category: ${ai.suggestedCategory} · Priority: ${ai.priority}` : 'Your complaint has been recorded.');
      setModalOpen(false);
      reset();
    },
    onError: (err: any) => toast('error', 'Failed', err.response?.data?.message),
  });

  const categoryColors: Record<string, string> = {
    MAINTENANCE: 'text-amber-400',
    FOOD: 'text-emerald-400',
    HYGIENE: 'text-cyan-400',
    SAFETY: 'text-red-400',
    INTERNET: 'text-blue-400',
    ELECTRICITY: 'text-violet-400',
    OTHER: 'text-slate-400',
  };

  return (
    <DashboardLayout title="Complaints" subtitle="File and track your complaints" requiredRoles={['STUDENT']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">AI-powered classification · {complaints.length} total</p>
          <Button variant="gradient" size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" /> File Complaint
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 skeleton rounded-xl" />)}</div>
        ) : complaints.length === 0 ? (
          <Card className="text-center py-16">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">No complaints filed yet.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {complaints.map((c: any, i: number) => (
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
                        <span className={`text-xs font-medium ${categoryColors[c.category]}`}>{c.category}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                      <p className="text-xs text-muted-foreground/60 mt-2">{formatDate(c.createdAt)}</p>
                      {c.resolution && (
                        <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <p className="text-xs text-emerald-400">Resolution: {c.resolution}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge status={c.status} variant="status" />
                      {c.priority === 'HIGH' && (
                        <span className="flex items-center gap-1 text-xs text-rose-400">
                          <Zap className="w-3 h-3" /> High Priority
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="File a Complaint" description="AI will automatically classify your complaint" size="lg">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <Input label="Title" placeholder="Brief title of the issue" error={errors.title?.message} {...register('title')} />

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground/80">Category</label>
            <select
              className="flex h-10 w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
              {...register('category')}
            >
              {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground/80">Description</label>
            <textarea
              rows={4}
              placeholder="Describe the issue in detail..."
              className="flex w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              {...register('description')}
            />
            {errors.description && <p className="text-xs text-red-400">{errors.description.message}</p>}
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="gradient" className="flex-1" isLoading={mutation.isPending}>
              <Zap className="w-4 h-4" /> Submit with AI Analysis
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
