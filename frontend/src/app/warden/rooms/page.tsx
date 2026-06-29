'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { toast } from '@/components/ui/toaster';
import { BedDouble, Plus, User, Hash } from 'lucide-react';
import api from '@/lib/api';

const allocateSchema = z.object({
  studentId: z.string().min(1, 'Select a student'),
  roomId: z.string().min(1, 'Select a room'),
  bedNumber: z.string().min(1, 'Bed number required'),
});
type AllocateForm = z.infer<typeof allocateSchema>;

export default function WardenRoomsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => api.get('/rooms').then((r) => r.data.rooms),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AllocateForm>({
    resolver: zodResolver(allocateSchema),
  });

  const allocateMutation = useMutation({
    mutationFn: (data: AllocateForm) => api.post('/rooms/allocate', { ...data, studentId: Number(data.studentId), roomId: Number(data.roomId) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast('success', 'Room allocated successfully!');
      setModalOpen(false);
      reset();
    },
    onError: (err: any) => toast('error', 'Error', err.response?.data?.message),
  });

  return (
    <DashboardLayout title="Room Allocation" subtitle="Manage rooms and bed assignments" requiredRoles={['WARDEN', 'ADMIN', 'SUPER_ADMIN']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{rooms.length} rooms total</p>
          <Button variant="gradient" size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" /> Allocate Bed
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-40 skeleton rounded-xl" />)}
          </div>
        ) : rooms.length === 0 ? (
          <Card className="text-center py-16">
            <BedDouble className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">No rooms configured. Contact admin to set up rooms.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room: any) => {
              const totalBeds = room.beds?.length || 0;
              const occupied = room.beds?.filter((b: any) => b.isOccupied).length || 0;
              const occupancyPct = totalBeds > 0 ? Math.round((occupied / totalBeds) * 100) : 0;
              return (
                <Card key={room.id} className="p-5 hover:border-primary/30 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/15 text-primary"><Hash className="w-4 h-4" /></div>
                      <div>
                        <p className="font-bold text-foreground">Room {room.number}</p>
                        <p className="text-xs text-muted-foreground">Floor {room.floor?.number !== undefined ? room.floor.number : '—'} · {room.type || 'Standard'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{occupied}/{totalBeds}</p>
                      <p className="text-xs text-muted-foreground">beds</p>
                    </div>
                  </div>

                  {/* Occupancy bar */}
                  <div className="w-full bg-muted/30 rounded-full h-2 mb-3">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-500"
                      style={{ width: `${occupancyPct}%` }}
                    />
                  </div>

                  {/* Bed list */}
                  <div className="space-y-1.5">
                    {room.beds?.map((bed: any) => (
                      <div key={bed.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-muted/20">
                        <span className="text-muted-foreground">Bed {bed.number}</span>
                        {bed.isOccupied ? (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <User className="w-3 h-3" />
                            {bed.students?.[0]?.user?.username || 'Occupied'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">Vacant</span>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Allocate Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Allocate Bed to Student">
        <form onSubmit={handleSubmit((d) => allocateMutation.mutate(d))} className="space-y-4">
          <Input label="Student ID" type="number" placeholder="Enter student profile ID" error={errors.studentId?.message} {...register('studentId')} />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground/80">Room</label>
            <select className="flex h-10 w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all" {...register('roomId')}>
              <option value="">Select a room</option>
              {rooms.map((r: any) => <option key={r.id} value={r.id}>Room {r.number}</option>)}
            </select>
            {errors.roomId && <p className="text-xs text-red-400">{errors.roomId.message}</p>}
          </div>
          <Input label="Bed Number" placeholder="e.g. A, B, 1, 2" error={errors.bedNumber?.message} {...register('bedNumber')} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="gradient" className="flex-1" isLoading={allocateMutation.isPending}>Allocate</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
