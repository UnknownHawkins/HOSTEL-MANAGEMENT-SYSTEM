'use client';

import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BedDouble, Users, Hash, MapPin } from 'lucide-react';
import api from '@/lib/api';

export default function StudentRoomPage() {
  const { data: meData, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').then((r) => r.data.user),
  });

  const room = meData?.profile?.room;
  const bed = meData?.profile?.bed;
  const roommates = room?.beds?.filter((b: any) => b.isOccupied && b.student?.userId !== meData?.id).map((b: any) => b.student) || [];

  return (
    <DashboardLayout title="My Room" subtitle="Your room allocation details" requiredRoles={['STUDENT']}>
      <div className="space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 skeleton rounded-xl" />
            <div className="h-48 skeleton rounded-xl" />
          </div>
        ) : !room ? (
          <Card className="text-center py-16">
            <BedDouble className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium text-foreground mb-2">No Room Assigned</p>
            <p className="text-muted-foreground">You haven&apos;t been allocated a room yet. Please contact the hostel warden.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Room details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BedDouble className="w-5 h-5 text-primary" /> Room Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Room Number', value: room.number, icon: <Hash className="w-4 h-4 text-violet-400" /> },
                    { label: 'Floor', value: room.floor?.number !== undefined ? room.floor.number : '—', icon: <MapPin className="w-4 h-4 text-blue-400" /> },
                    { label: 'Room Type', value: room.type || 'Standard', icon: <BedDouble className="w-4 h-4 text-cyan-400" /> },
                    { label: 'My Bed', value: bed?.number || '—', icon: <BedDouble className="w-4 h-4 text-emerald-400" /> },
                  ].map((item) => (
                    <div key={item.label} className="p-3 rounded-xl bg-muted/30">
                      <div className="flex items-center gap-2 mb-1">
                        {item.icon}
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                      </div>
                      <p className="text-lg font-bold text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Roommates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" /> Roommates
                </CardTitle>
              </CardHeader>
              <CardContent>
                {roommates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No roommates assigned.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {roommates.map((mate: any) => (
                      <div key={mate.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
                          {mate.user?.username?.slice(0, 2).toUpperCase() || '??'}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{mate.user?.username}</p>
                          <p className="text-xs text-muted-foreground">{mate.user?.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
