'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toaster';
import { formatDate } from '@/lib/utils';
import { ClipboardList, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '@/lib/api';

export default function WardenAttendancePage() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['attendance', selectedDate],
    queryFn: () => api.get(`/attendance?date=${selectedDate}`).then((r) => r.data.records),
  });

  const markMutation = useMutation({
    mutationFn: ({ studentId, status }: { studentId: number; status: string }) =>
      api.post('/attendance/mark', { studentId, status, date: selectedDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', selectedDate] });
      toast('success', 'Attendance marked!');
    },
    onError: (err: any) => toast('error', 'Error', err.response?.data?.message),
  });

  const present = records.filter((r: any) => r.status === 'PRESENT').length;
  const absent = records.filter((r: any) => r.status === 'ABSENT').length;
  const onLeave = records.filter((r: any) => r.status === 'LEAVE').length;

  return (
    <DashboardLayout title="Attendance" subtitle="Mark and track daily attendance" requiredRoles={['WARDEN', 'ADMIN', 'SUPER_ADMIN']}>
      <div className="space-y-6">
        {/* Date selector & summary */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-10 px-3 rounded-xl border border-border bg-muted/30 text-sm text-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CheckCircle className="w-3 h-3" /> {present} present
              </span>
              <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                <XCircle className="w-3 h-3" /> {absent} absent
              </span>
              <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Clock className="w-3 h-3" /> {onLeave} leave
              </span>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" /> Attendance for {formatDate(selectedDate)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-12 skeleton rounded-xl" />)}</div>
            ) : records.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>No attendance records for this date.</p>
                <p className="text-xs mt-1">Students will appear here once the system is populated.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {records.map((record: any) => (
                  <div key={record.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/30 to-blue-500/30 flex items-center justify-center text-xs font-bold text-foreground">
                        {record.student?.user?.username?.slice(0, 2).toUpperCase() || '??'}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{record.student?.user?.username}</p>
                        <p className="text-xs text-muted-foreground">Room {record.student?.room?.number || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge status={record.status} variant="status" />
                      {record.status !== 'PRESENT' && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => markMutation.mutate({ studentId: record.studentId, status: 'PRESENT' })}
                        >
                          Mark Present
                        </Button>
                      )}
                      {record.status !== 'ABSENT' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => markMutation.mutate({ studentId: record.studentId, status: 'ABSENT' })}
                        >
                          Mark Absent
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
