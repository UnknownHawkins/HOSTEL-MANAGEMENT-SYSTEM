'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { Bell, Megaphone, AlertTriangle, Info } from 'lucide-react';
import api from '@/lib/api';

const priorityStyles: Record<string, { icon: React.ReactNode; border: string; bg: string }> = {
  URGENT: {
    icon: <AlertTriangle className="w-4 h-4 text-red-400" />,
    border: 'border-red-500/30',
    bg: 'bg-red-500/5',
  },
  IMPORTANT: {
    icon: <Megaphone className="w-4 h-4 text-amber-400" />,
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/5',
  },
  NORMAL: {
    icon: <Info className="w-4 h-4 text-blue-400" />,
    border: 'border-border',
    bg: '',
  },
};

export default function StudentNoticesPage() {
  const { data: notices = [], isLoading } = useQuery({
    queryKey: ['notices'],
    queryFn: () => api.get('/notices').then((r) => r.data.notices),
  });

  return (
    <DashboardLayout title="Notices" subtitle="Hostel notices and announcements" requiredRoles={['STUDENT']}>
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 skeleton rounded-xl" />)}</div>
        ) : notices.length === 0 ? (
          <Card className="text-center py-16">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">No notices posted yet.</p>
          </Card>
        ) : (
          notices.map((notice: any, i: number) => {
            const style = priorityStyles[notice.priority] || priorityStyles.NORMAL;
            return (
              <motion.div
                key={notice.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={`p-5 ${style.border} ${style.bg}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">{style.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-foreground">{notice.title}</h3>
                        {notice.priority === 'URGENT' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                            Urgent
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{notice.content}</p>
                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground/60">
                        <span>By {notice.postedBy?.username || 'Admin'}</span>
                        <span>·</span>
                        <span>{formatDate(notice.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}
