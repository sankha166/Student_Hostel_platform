import { prisma } from "./lib/prisma.js";
import bcrypt from "bcryptjs";

const IMAGE = "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&h=400&fit=crop";

async function main() {
  console.log("🌱 Seeding database...");

  // --- Account + Users ---
  const account = await prisma.account.upsert({
    where: { slug: "nexus-demo" },
    update: {},
    create: { name: "Nexus Demo Properties", slug: "nexus-demo", email: "owner@nexus.demo", phone: "+91 98765 43210", plan: "growth", status: "active" },
  });

  const ownerHash = await bcrypt.hash("demo123456", 12);
  const owner = await prisma.user.upsert({
    where: { accountId_email: { accountId: account.id, email: "owner@nexus.demo" } },
    update: {},
    create: { accountId: account.id, email: "owner@nexus.demo", passwordHash: ownerHash, firstName: "Rajesh", lastName: "Kumar", role: "owner", phone: "+91 98765 43210" },
  });

  const residentHash = await bcrypt.hash("demo123456", 12);
  const residentUser = await prisma.user.upsert({
    where: { accountId_email: { accountId: account.id, email: "student@nexus.demo" } },
    update: {},
    create: { accountId: account.id, email: "student@nexus.demo", passwordHash: residentHash, firstName: "Arjun", lastName: "Sharma", role: "resident", phone: "+91 99887 76655" },
  });

  // --- Properties with full hierarchy ---
  const prop1 = await prisma.property.upsert({
    where: { id: "prop-sunrise" },
    update: {},
    create: {
      id: "prop-sunrise", accountId: account.id,
      name: "Sunrise Student Haven", type: "hostel",
      address: "42, 5th Block, Koramangala, Bangalore - 560034",
      city: "Bangalore", state: "Karnataka", pincode: "560034",
      latitude: 12.9352, longitude: 77.6245,
      contactPhone: "+91 98765 43210", contactEmail: "sunrise@nexus.demo",
      amenities: ["Wi-Fi", "AC", "Laundry", "Study Room", "Gym", "Power Backup"],
      imageUrl: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&h=400&fit=crop",
      rules: { gateClosing: "11:00 PM", visitors: "10 AM - 8 PM", noticePeriod: "1 month" },
    },
  });

  const prop2 = await prisma.property.upsert({
    where: { id: "prop-urbannest" },
    update: {},
    create: {
      id: "prop-urbannest", accountId: account.id,
      name: "Urban Nest Co-Living", type: "pg",
      address: "15, Sector 2, HSR Layout, Bangalore - 560102",
      city: "Bangalore", state: "Karnataka", pincode: "560102",
      latitude: 12.9121, longitude: 77.6446,
      contactPhone: "+91 98765 43211", contactEmail: "urbannest@nexus.demo",
      amenities: ["Wi-Fi", "AC", "Gaming Room", "Rooftop", "Laundry", "Parking"],
      imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop",
    },
  });

  // Building → Floor → Room → Bed for prop1
  const b1 = await prisma.building.upsert({ where: { id: "bld-a" }, update: {}, create: { id: "bld-a", propertyId: prop1.id, name: "Block A", floorsCount: 3 } });
  const f1a = await prisma.floor.upsert({ where: { id: "flr-1a" }, update: {}, create: { id: "flr-1a", buildingId: b1.id, floorNumber: 1, name: "Ground Floor" } });
  const f2a = await prisma.floor.upsert({ where: { id: "flr-2a" }, update: {}, create: { id: "flr-2a", buildingId: b1.id, floorNumber: 2, name: "First Floor" } });

  // Rooms on floor 1
  const roomTypes = [
    { num: "101", type: "single", rent: 5500, deposit: 11000, beds: 1 },
    { num: "102", type: "double", rent: 3500, deposit: 7000, beds: 2 },
    { num: "103", type: "single", rent: 4500, deposit: 9000, beds: 1 },
    { num: "104", type: "triple", rent: 3000, deposit: 6000, beds: 3 },
  ];
  const rooms: { id: string; rent: number; deposit: number }[] = [];
  for (const rt of roomTypes) {
    const roomId = `rm-${rt.num}`;
    await prisma.room.upsert({
      where: { id: roomId },
      update: {},
      create: { id: roomId, floorId: f1a.id, roomNumber: rt.num, roomType: rt.type, rentAmount: rt.rent, depositAmount: rt.deposit, amenities: ["Wi-Fi", "AC"], status: "active" },
    });
    rooms.push({ id: roomId, rent: rt.rent, deposit: rt.deposit });
    for (let i = 1; i <= rt.beds; i++) {
      await prisma.bed.upsert({
        where: { id: `bed-${rt.num}-${i}` },
        update: {},
        create: { id: `bed-${rt.num}-${i}`, roomId, bedNumber: `${rt.num}-${String.fromCharCode(64 + i)}`, bedType: "standard", status: "available" },
      });
    }
  }
  // Rooms on floor 2
  for (const rt of [{ num: "201", type: "single", rent: 5500, deposit: 11000, beds: 1 }, { num: "202", type: "double", rent: 4000, deposit: 8000, beds: 2 }]) {
    const roomId = `rm-${rt.num}`;
    await prisma.room.upsert({
      where: { id: roomId },
      update: {},
      create: { id: roomId, floorId: f2a.id, roomNumber: rt.num, roomType: rt.type, rentAmount: rt.rent, depositAmount: rt.deposit, amenities: ["Wi-Fi", "AC", "Balcony"], status: "active" },
    });
    rooms.push({ id: roomId, rent: rt.rent, deposit: rt.deposit });
    for (let i = 1; i <= rt.beds; i++) {
      await prisma.bed.upsert({
        where: { id: `bed-${rt.num}-${i}` },
        update: {},
        create: { id: `bed-${rt.num}-${i}`, roomId, bedNumber: `${rt.num}-${String.fromCharCode(64 + i)}`, bedType: "standard", status: "available" },
      });
    }
  }

  // Building for prop2
  const b2 = await prisma.building.upsert({ where: { id: "bld-b" }, update: {}, create: { id: "bld-b", propertyId: prop2.id, name: "Main Building", floorsCount: 2 } });
  const f1b = await prisma.floor.upsert({ where: { id: "flr-1b" }, update: {}, create: { id: "flr-1b", buildingId: b2.id, floorNumber: 1 } });
  for (const rt of [{ num: "101", type: "single", rent: 7000, deposit: 14000, beds: 1 }, { num: "102", type: "double", rent: 5500, deposit: 11000, beds: 2 }]) {
    const roomId = `rm2-${rt.num}`;
    await prisma.room.upsert({
      where: { id: roomId },
      update: {},
      create: { id: roomId, floorId: f1b.id, roomNumber: rt.num, roomType: rt.type, rentAmount: rt.rent, depositAmount: rt.deposit, amenities: ["Wi-Fi", "AC"], status: "active" },
    });
    for (let i = 1; i <= rt.beds; i++) {
      await prisma.bed.upsert({
        where: { id: `bed2-${rt.num}-${i}` },
        update: {},
        create: { id: `bed2-${rt.num}-${i}`, roomId, bedNumber: `${rt.num}-${String.fromCharCode(64 + i)}`, bedType: "standard", status: "available" },
      });
    }
  }

  // --- Residents ---
  const residentData = [
    { id: "res-1", firstName: "Arjun", lastName: "Sharma", email: "student@nexus.demo", phone: "+91 99887 76655", occupation: "student", institution: "Christ University", bedId: "bed-101-1", propertyId: prop1.id, userId: residentUser.id },
    { id: "res-2", firstName: "Priya", lastName: "Menon", email: "priya@nexus.demo", phone: "+91 87654 32109", occupation: "student", institution: "Jain University", bedId: "bed-102-1", propertyId: prop1.id },
    { id: "res-3", firstName: "Rahul", lastName: "Kumar", email: "rahul@nexus.demo", phone: "+91 76543 21098", occupation: "working_professional", institution: "Infosys", bedId: "bed-102-2", propertyId: prop1.id },
    { id: "res-4", firstName: "Sneha", lastName: "Reddy", email: "sneha@nexus.demo", phone: "+91 65432 10987", occupation: "student", institution: "BMS College", bedId: "bed-103-1", propertyId: prop1.id },
    { id: "res-5", firstName: "Vikram", lastName: "Patel", email: "vikram@nexus.demo", phone: "+91 99887 12345", occupation: "working_professional", institution: "Wipro", bedId: "bed2-101-1", propertyId: prop2.id },
  ];

  for (const r of residentData) {
    await prisma.resident.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id, accountId: account.id, propertyId: r.propertyId, userId: r.userId || null,
        firstName: r.firstName, lastName: r.lastName, email: r.email, phone: r.phone,
        occupation: r.occupation, institution: r.institution,
        gender: r.firstName === "Priya" || r.firstName === "Sneha" ? "female" : "male",
        emergencyName: "Parent", emergencyPhone: "+91 90000 00000", emergencyRelation: "parent",
        idType: "aadhaar", idNumber: "XXXX XXXX 1234",
        status: "active",
      },
    });
    // Allocate bed + create stay
    const bed = await prisma.bed.findUnique({ where: { id: r.bedId } });
    if (bed && bed.status === "available") {
      await prisma.stay.create({
        data: {
          residentId: r.id, bedId: r.bedId, checkInDate: "2026-01-15",
          expectedCheckOut: "2026-12-31", rentAmount: bed.bedType === "premium" ? 6000 : 4500,
          depositAmount: 9000, depositStatus: "held", status: "active", createdById: owner.id,
        },
      }).catch(() => {});
      await prisma.bed.update({ where: { id: r.bedId }, data: { status: "occupied" } });
      await prisma.resident.update({ where: { id: r.id }, data: { bedId: r.bedId } });
    }
  }

  // --- Payments (rent for Jan, Feb, Mar 2026) ---
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  for (const r of residentData) {
    for (let mi = 0; mi < 4; mi++) {
      const month = mi + 1;
      const year = 2026;
      const dueDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const existing = await prisma.payment.findFirst({ where: { residentId: r.id, type: "rent", rentMonth: month, rentYear: year } });
      if (existing) continue;
      const isPaid = mi < 2;
      await prisma.payment.create({
        data: {
          accountId: account.id, residentId: r.id, type: "rent",
          amount: 4500, dueDate,
          status: isPaid ? "paid" : (mi === 3 ? "overdue" : "pending"),
          paidDate: isPaid ? dueDate : null,
          paidAmount: isPaid ? 4500 : 0,
          paymentMethod: isPaid ? "upi" : null,
          transactionId: isPaid ? `UPI${year}${String(month).padStart(2, "0")}${Math.floor(Math.random() * 90000 + 10000)}` : null,
          rentMonth: month, rentYear: year,
          notes: `Rent for ${monthNames[mi]} ${year}`,
        },
      });
    }
  }

  // --- Complaints ---
  const complaintData = [
    { residentId: "res-1", category: "electrical", title: "Light not working in room", description: "The tube light in my room is flickering and needs replacement.", priority: "medium" },
    { residentId: "res-2", category: "cleaning", title: "Common bathroom not cleaned", description: "The shared bathroom on our floor hasn't been cleaned in 2 days.", priority: "high" },
    { residentId: "res-3", category: "wifi", title: "Slow internet speed", description: "WiFi is very slow in the evenings, unable to attend online classes.", priority: "medium" },
    { residentId: "res-1", category: "plumbing", title: "Tap leakage", description: "The bathroom tap is leaking continuously.", priority: "low" },
  ];
  const slaMap: Record<string, number> = { low: 168, medium: 48, high: 24, critical: 4 };
  const existingComplaints = await prisma.complaint.count({ where: { accountId: account.id } });
  if (existingComplaints === 0) for (const c of complaintData) {
    const slaHours = slaMap[c.priority] || 48;
    await prisma.complaint.create({
      data: {
        accountId: account.id, propertyId: prop1.id, residentId: c.residentId,
        category: c.category, title: c.title, description: c.description, priority: c.priority,
        status: c.priority === "high" ? "in_progress" : "open",
        slaHours, slaDeadline: new Date(Date.now() + slaHours * 3600 * 1000),
      },
    }).catch(() => {});
  }

  console.log("✅ Seed complete!");
  console.log("   Owner login:  owner@nexus.demo / demo123456");
  console.log("   Resident login: student@nexus.demo / demo123456");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
