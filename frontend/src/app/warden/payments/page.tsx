'use client';

import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency } from '@/lib/utils';
import { CreditCard, IndianRupee } from 'lucide-react';
import api from '@/lib/api';

export default function WardenPaymentsPage() {
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['all-payments'],
    queryFn: () => api.get('/payments/all').then((r) => r.data.payments),
  });

  const totalCollected = payments.filter((p: any) => p.status === 'PAID').reduce((s: number, p: any) => s + p.amount, 0);
  const pending = payments.filter((p: any) => p.status === 'PENDING');

  return (
    <DashboardLayout title="Mess & Fee Payments" subtitle="View all student payment records" requiredRoles={['WARDEN', 'ADMIN', 'SUPER_ADMIN']}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400"><IndianRupee className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Collected</p>
              <p className="text-2xl font-bold">{formatCurrency(totalCollected)}</p>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/15 text-amber-400"><CreditCard className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Pending</p>
              <p className="text-2xl font-bold">{pending.length}</p>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/15 text-blue-400"><CreditCard className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Records</p>
              <p className="text-2xl font-bold">{payments.length}</p>
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" /> All Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 skeleton rounded-xl" />)}</div>
            ) : payments.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>No payment records yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                      <th className="pb-3 pr-4">Student</th>
                      <th className="pb-3 pr-4">Type</th>
                      <th className="pb-3 pr-4">Amount</th>
                      <th className="pb-3 pr-4">Date</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p: any) => (
                      <tr key={p.id} className="table-row-hover border-b border-border/50 last:border-0">
                        <td className="py-3 pr-4 font-medium">{p.student?.user?.username || '—'}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{p.type || p.description || 'Fee'}</td>
                        <td className="py-3 pr-4 font-semibold">{formatCurrency(p.amount)}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{formatDate(p.createdAt)}</td>
                        <td className="py-3"><Badge status={p.status} variant="status" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
