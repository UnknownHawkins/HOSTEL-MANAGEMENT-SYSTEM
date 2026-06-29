'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatCurrency } from '@/lib/utils';
import { toast } from '@/components/ui/toaster';
import { CreditCard, Download, Receipt, IndianRupee } from 'lucide-react';
import api from '@/lib/api';

export default function StudentPaymentsPage() {
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['student-payments'],
    queryFn: () => api.get('/payments/my-payments').then((r) => r.data.payments),
  });

  const totalPaid = payments.filter((p: any) => p.status === 'PAID').reduce((s: number, p: any) => s + p.amount, 0);
  const pending = payments.filter((p: any) => p.status === 'PENDING');

  const handlePay = async (paymentId: number) => {
    try {
      const res = await api.post(`/payments/pay/${paymentId}`, { gateway: 'MOCK' });
      toast('success', 'Payment Successful!', `Transaction ID: ${res.data.transactionId || 'MOCK'}`);
      queryClient.invalidateQueries({ queryKey: ['student-payments'] });
    } catch (err: any) {
      toast('error', 'Payment Failed', err.response?.data?.message || 'Try again later');
    }
  };

  return (
    <DashboardLayout title="Payments" subtitle="View your fee payments and history" requiredRoles={['STUDENT']}>
      <div className="space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400"><IndianRupee className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Paid</p>
              <p className="text-2xl font-bold">{formatCurrency(totalPaid)}</p>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/15 text-amber-400"><Receipt className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Pending</p>
              <p className="text-2xl font-bold">{pending.length}</p>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/15 text-blue-400"><CreditCard className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Invoices</p>
              <p className="text-2xl font-bold">{payments.length}</p>
            </div>
          </Card>
        </div>

        {/* Pending payments */}
        {pending.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-400">
                <Receipt className="w-4 h-4" /> Due Payments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pending.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <div>
                    <p className="font-semibold text-foreground">{p.description || 'Hostel Fee'}</p>
                    <p className="text-xs text-muted-foreground">Due: {formatDate(p.dueDate)} · {p.type}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-bold text-foreground">{formatCurrency(p.amount)}</p>
                    <Button variant="gradient" size="sm" onClick={() => handlePay(p.id)}>Pay Now</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Payment history */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" /> Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>
            ) : payments.filter((p: any) => p.status === 'PAID').length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>No payment history yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {payments
                  .filter((p: any) => p.status === 'PAID')
                  .map((p: any, i: number) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><IndianRupee className="w-3.5 h-3.5" /></div>
                        <div>
                          <p className="text-sm font-medium">{p.description || 'Hostel Fee'}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(p.paidAt || p.createdAt)} · {p.gateway || 'Online'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-bold text-emerald-400">{formatCurrency(p.amount)}</p>
                        <Badge status="PAID" variant="status" />
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
