import { PrismaClient, RoomType, AllocationStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data to make seed repeatable
  console.log('Cleaning database...');
  await prisma.session.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.document.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.visitor.deleteMany();
  await prisma.maintenance.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.roomAllocation.deleteMany();
  await prisma.student.deleteMany();
  await prisma.bed.deleteMany();
  await prisma.room.deleteMany();
  await prisma.floor.deleteMany();
  await prisma.building.deleteMany();
  await prisma.hostel.deleteMany();
  await prisma.warden.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.user.deleteMany();


  // Hash passwords
  const adminPasswordHash = await bcrypt.hash('Stuxnet2007@', 10);
  const wardenPasswordHash = await bcrypt.hash('12345678901234', 10);
  const studentPasswordHash = await bcrypt.hash('1111', 10);

  // 1. Create Roles
  const roles = [
    { name: 'SUPER_ADMIN', description: 'System owner with full system access' },
    { name: 'ADMIN', description: 'Institutional administrator' },
    { name: 'WARDEN', description: 'Hostel manager' },
    { name: 'STUDENT', description: 'Hostel resident student' }
  ];

  const dbRoles: Record<string, any> = {};
  for (const role of roles) {
    dbRoles[role.name] = await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role
    });
  }
  console.log('Roles seeded.');

  // 2. Create Permissions
  const permissions = [
    { name: 'MANAGE_SYSTEM', description: 'Super Admin full access' },
    { name: 'MANAGE_USERS', description: 'Create, update, delete users' },
    { name: 'MANAGE_HOSTELS', description: 'Manage hostels, buildings, floors, rooms' },
    { name: 'MANAGE_LEAVES', description: 'Approve or reject leaves' },
    { name: 'MANAGE_COMPLAINTS', description: 'Assign and resolve complaints' },
    { name: 'MANAGE_PAYMENTS', description: 'Record and verify payments' },
    { name: 'MANAGE_VISITORS', description: 'Verify and register visitors' },
    { name: 'APPLY_LEAVE', description: 'Student apply leave request' },
    { name: 'CREATE_COMPLAINT', description: 'Student file complaint' },
    { name: 'VIEW_NOTICES', description: 'View institutional notices' }
  ];

  const dbPermissions: Record<string, any> = {};
  for (const perm of permissions) {
    dbPermissions[perm.name] = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm
    });
  }
  console.log('Permissions seeded.');

  // 3. Associate Permissions to Roles
  // Super Admin gets all permissions
  await prisma.role.update({
    where: { id: dbRoles['SUPER_ADMIN'].id },
    data: {
      permissions: {
        connect: Object.values(dbPermissions).map(p => ({ id: p.id }))
      }
    }
  });

  // Admin gets all except MANAGE_SYSTEM
  await prisma.role.update({
    where: { id: dbRoles['ADMIN'].id },
    data: {
      permissions: {
        connect: Object.values(dbPermissions)
          .filter(p => p.name !== 'MANAGE_SYSTEM')
          .map(p => ({ id: p.id }))
      }
    }
  });

  // Warden gets LEAVES, COMPLAINTS, PAYMENTS, VISITORS, NOTICES
  await prisma.role.update({
    where: { id: dbRoles['WARDEN'].id },
    data: {
      permissions: {
        connect: [
          dbPermissions['MANAGE_LEAVES'],
          dbPermissions['MANAGE_COMPLAINTS'],
          dbPermissions['MANAGE_PAYMENTS'],
          dbPermissions['MANAGE_VISITORS'],
          dbPermissions['VIEW_NOTICES']
        ].map(p => ({ id: p.id }))
      }
    }
  });

  // Student gets APPLY_LEAVE, CREATE_COMPLAINT, VIEW_NOTICES
  await prisma.role.update({
    where: { id: dbRoles['STUDENT'].id },
    data: {
      permissions: {
        connect: [
          dbPermissions['APPLY_LEAVE'],
          dbPermissions['CREATE_COMPLAINT'],
          dbPermissions['VIEW_NOTICES']
        ].map(p => ({ id: p.id }))
      }
    }
  });
  console.log('Role permissions linked.');

  // 4. Create Hostels, Buildings, Floors, Rooms, Beds
  const hostel = await prisma.hostel.upsert({
    where: { code: 'MH01' },
    update: {},
    create: {
      name: 'Main Campus Hostel',
      code: 'MH01',
      address: '123 Campus Rd, Engineering College Campus'
    }
  });

  const building = await prisma.building.create({
    data: {
      name: 'A-Block',
      hostelId: hostel.id
    }
  });

  const floor1 = await prisma.floor.create({
    data: {
      number: 1,
      buildingId: building.id
    }
  });

  // Create rooms: A1, B2, C3
  const roomA1 = await prisma.room.create({
    data: {
      number: 'A1',
      type: RoomType.AC,
      capacity: 2,
      price: 5000,
      floorId: floor1.id
    }
  });

  const roomB2 = await prisma.room.create({
    data: {
      number: 'B2',
      type: RoomType.NON_AC,
      capacity: 2,
      price: 3500,
      floorId: floor1.id
    }
  });

  const roomC3 = await prisma.room.create({
    data: {
      number: 'C3',
      type: RoomType.NON_AC,
      capacity: 3,
      price: 3000,
      floorId: floor1.id
    }
  });

  // Create Beds for rooms
  const bedsA1 = [];
  for (let i = 1; i <= 2; i++) {
    bedsA1.push(await prisma.bed.create({
      data: { number: `A1-${i}`, roomId: roomA1.id }
    }));
  }

  const bedsB2 = [];
  for (let i = 1; i <= 2; i++) {
    bedsB2.push(await prisma.bed.create({
      data: { number: `B2-${i}`, roomId: roomB2.id }
    }));
  }

  const bedsC3 = [];
  for (let i = 1; i <= 3; i++) {
    bedsC3.push(await prisma.bed.create({
      data: { number: `C3-${i}`, roomId: roomC3.id }
    }));
  }
  console.log('Infrastructure assets seeded.');

  // 5. Create Default Users
  // Super Admin
  await prisma.user.upsert({
    where: { username: 'UnknownHawkins7217' },
    update: {},
    create: {
      username: 'UnknownHawkins7217',
      email: 'superadmin@hostel.edu',
      passwordHash: adminPasswordHash,
      roleId: dbRoles['SUPER_ADMIN'].id,
      isEmailVerified: true
    }
  });

  // Admin
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@hostel.edu',
      passwordHash: adminPasswordHash,
      roleId: dbRoles['ADMIN'].id,
      isEmailVerified: true
    }
  });
  await prisma.admin.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: { userId: adminUser.id }
  });

  // Warden (preserving Username Warden and Password 12345678901234)
  const wardenUser = await prisma.user.upsert({
    where: { username: 'Warden' },
    update: {},
    create: {
      username: 'Warden',
      email: 'warden@hostel.edu',
      passwordHash: wardenPasswordHash,
      roleId: dbRoles['WARDEN'].id,
      isEmailVerified: true
    }
  });
  await prisma.warden.upsert({
    where: { userId: wardenUser.id },
    update: {},
    create: {
      userId: wardenUser.id,
      hostelId: hostel.id
    }
  });

  // Student (preserving student1 / 1111)
  const student1User = await prisma.user.upsert({
    where: { username: 'student1' },
    update: {},
    create: {
      username: 'student1',
      email: 'student1@gmail.com',
      passwordHash: studentPasswordHash,
      roleId: dbRoles['STUDENT'].id,
      isEmailVerified: true
    }
  });

  // Mark room A1-1 as occupied
  await prisma.bed.update({
    where: { id: bedsA1[0].id },
    data: { isOccupied: true }
  });

  const studentProfile = await prisma.student.upsert({
    where: { rollNo: '101' },
    update: {},
    create: {
      userId: student1User.id,
      rollNo: '101',
      parentPhone: '1234567890',
      address: '123 Hostel St, City',
      isFirstLogin: false, // student1 already had profile set up in old UI
      roomId: roomA1.id,
      bedId: bedsA1[0].id
    }
  });

  // Add room allocation log for student1
  await prisma.roomAllocation.create({
    data: {
      studentId: studentProfile.id,
      roomId: roomA1.id,
      bedId: bedsA1[0].id,
      allocatedBy: adminUser.id,
      status: AllocationStatus.ALLOCATED
    }
  });

  // Sample student2 (needs setup)
  const student2User = await prisma.user.upsert({
    where: { username: 'student2' },
    update: {},
    create: {
      username: 'student2',
      email: 'jane.doe@gmail.com',
      passwordHash: studentPasswordHash,
      roleId: dbRoles['STUDENT'].id,
      isEmailVerified: true
    }
  });
  await prisma.student.upsert({
    where: { rollNo: '102' },
    update: {},
    create: {
      userId: student2User.id,
      rollNo: '102',
      parentPhone: '1234567891',
      address: '456 Dorm Ave, Town',
      isFirstLogin: false,
      roomId: roomB2.id,
      bedId: bedsB2[0].id
    }
  });
  await prisma.bed.update({
    where: { id: bedsB2[0].id },
    data: { isOccupied: true }
  });

  // Create notices
  await prisma.notice.create({
    data: {
      title: 'Hostel Registration Renewal 2026',
      content: 'All students are requested to clear their pending mess and hostel fees before July 15, 2026, to renew their hostel registration.',
      targetAudience: 'STUDENTS',
      createdBy: adminUser.id
    }
  });

  await prisma.notice.create({
    data: {
      title: 'Water Outage in B-Block',
      content: 'Please note there will be a scheduled water maintenance outage in B-block on Monday from 10:00 AM to 2:00 PM.',
      targetAudience: 'ALL',
      createdBy: wardenUser.id
    }
  });

  console.log('Default notices created.');
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
