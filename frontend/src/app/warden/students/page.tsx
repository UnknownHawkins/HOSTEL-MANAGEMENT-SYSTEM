'use client';

import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Search, BedDouble, Mail } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

export default function WardenStudentsPage() {
  const [search, setSearch] = useState('');

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['warden-students'],
    queryFn: () => api.get('/admin/students').then((r) => r.data.students),
  });

  const filtered = students.filter((s: any) =>
    s.user?.username?.toLowerCase().includes(search.toLowerCase()) ||
    s.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="Students" subtitle="View and manage hostel students" requiredRoles={['WARDEN', 'ADMIN', 'SUPER_ADMIN']}>
      <div className="space-y-6">
        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students..."
            className={cn(
              'h-10 pl-10 pr-4 w-full rounded-xl text-sm',
              'bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all'
            )}
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-32 skeleton rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="text-center py-16">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">{search ? 'No students match your search.' : 'No students registered.'}</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((student: any) => (
              <Card key={student.id} className="p-5 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-sm font-bold text-white">
                    {student.user?.username?.slice(0, 2).toUpperCase() || '??'}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{student.user?.username}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {student.user?.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <BedDouble className="w-3.5 h-3.5" />
                  <span>Room: {student.room?.number || 'Unassigned'}</span>
                  {student.bed && <span>· Bed {student.bed.number}</span>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
