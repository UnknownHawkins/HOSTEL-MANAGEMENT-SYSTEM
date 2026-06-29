'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Bell, Plus, Megaphone, Trash2 } from 'lucide-react';
import api from '@/lib/api';

const noticeSchema = z.object({
  title: z.string().min(3, 'Title required'),
  content: z.string().min(10, 'Content too short'),
  priority: z.enum(['NORMAL', 'IMPORTANT', 'URGENT']),
});
type NoticeForm = z.infer<typeof noticeSchema>;

export default function WardenNoticesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notices = [], isLoading } = useQuery({
    queryKey: ['notices'],
    queryFn: () => api.get('/notices').then((r) => r.data.notices),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<NoticeForm>({
    resolver: zodResolver(noticeSchema),
    defaultValues: { priority: 'NORMAL' },
  });

  const postMutation = useMutation({
    mutationFn: (data: NoticeForm) => api.post('/notices', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
      toast('success', 'Notice posted!');
      setModalOpen(false);
      reset();
    },
    onError: (err: any) => toast('error', 'Error', err.response?.data?.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/notices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
      toast('success', 'Notice deleted.');
    },
  });

  return (
    <DashboardLayout title="Notices" subtitle="Post and manage hostel notices" requiredRoles={['WARDEN', 'ADMIN', 'SUPER_ADMIN']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{notices.length} notices posted</p>
          <Button variant="gradient" size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" /> Post Notice
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 skeleton rounded-xl" />)}</div>
        ) : notices.length === 0 ? (
          <Card className="text-center py-16">
            <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">No notices posted yet.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {notices.map((notice: any, i: number) => (
              <motion.div key={notice.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Bell className="w-4 h-4 text-primary" />
                        <p className="font-semibold text-foreground">{notice.title}</p>
                        {notice.priority !== 'NORMAL' && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            notice.priority === 'URGENT' ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}>
                            {notice.priority}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notice.content}</p>
                      <p className="text-xs text-muted-foreground/60 mt-2">{formatDate(notice.createdAt)}</p>
                    </div>
                    <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-red-400" onClick={() => deleteMutation.mutate(notice.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Post Notice Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Post a Notice" size="lg">
        <form onSubmit={handleSubmit((d) => postMutation.mutate(d))} className="space-y-4">
          <Input label="Title" placeholder="Notice title" error={errors.title?.message} {...register('title')} />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground/80">Priority</label>
            <select className="flex h-10 w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all" {...register('priority')}>
              <option value="NORMAL">Normal</option>
              <option value="IMPORTANT">Important</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground/80">Content</label>
            <textarea
              rows={5}
              placeholder="Write your notice here..."
              className="flex w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              {...register('content')}
            />
            {errors.content && <p className="text-xs text-red-400">{errors.content.message}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="gradient" className="flex-1" isLoading={postMutation.isPending}>Post Notice</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
