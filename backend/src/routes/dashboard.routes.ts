import { Router } from 'express';
import { authenticate, requireRole } from '../auth.js';
import { query } from '../db/client.js';

const router = Router();
router.use(authenticate);

router.get('/student', requireRole('student'), async (req,res,next) => {
  try {
    const [bookings, payments, tenant, reviews] = await Promise.all([
      query(`SELECT b.*,p.name property_name,p.address FROM bookings b JOIN properties p ON p.id=b.property_id WHERE b.student_id=$1 ORDER BY b.created_at DESC`, [req.user!.sub]),
      query(`SELECT * FROM payments WHERE student_id=$1 ORDER BY created_at DESC LIMIT 12`, [req.user!.sub]),
      query(`SELECT t.*,p.name property_name,r.room_number FROM tenants t JOIN properties p ON p.id=t.property_id LEFT JOIN rooms r ON r.id=t.room_id WHERE t.student_id=$1 AND t.active=TRUE LIMIT 1`, [req.user!.sub]),
      query(`SELECT r.*,p.name property_name FROM reviews r JOIN properties p ON p.id=r.property_id WHERE r.student_id=$1 ORDER BY r.created_at DESC`, [req.user!.sub])
    ]);
    res.json({success:true,data:{bookings:bookings.rows,payments:payments.rows,currentTenant:tenant.rows[0] ?? null,reviews:reviews.rows}});
  } catch(e){next(e);}
});

router.get('/owner', requireRole('owner'), async (req,res,next) => {
  try {
    const [properties, bookings, tenants, payments] = await Promise.all([
      query(`SELECT p.*,COUNT(DISTINCT r.id)::int room_count,COALESCE(SUM(r.capacity),0)::int total_beds,COALESCE(SUM(r.occupied_count),0)::int occupied_beds FROM properties p LEFT JOIN rooms r ON r.property_id=p.id WHERE p.owner_id=$1 GROUP BY p.id ORDER BY p.created_at DESC`, [req.user!.sub]),
      query(`SELECT b.*,p.name property_name,u.name student_name,u.email student_email,r.room_number FROM bookings b JOIN properties p ON p.id=b.property_id JOIN users u ON u.id=b.student_id LEFT JOIN rooms r ON r.id=b.room_id WHERE p.owner_id=$1 ORDER BY b.created_at DESC`, [req.user!.sub]),
      query(`SELECT t.*,p.name property_name,r.room_number,u.name student_name,u.email student_email FROM tenants t JOIN properties p ON p.id=t.property_id JOIN users u ON u.id=t.student_id LEFT JOIN rooms r ON r.id=t.room_id WHERE p.owner_id=$1 AND t.active=TRUE ORDER BY t.created_at DESC`, [req.user!.sub]),
      query(`SELECT pay.*,p.name property_name,u.name student_name FROM payments pay LEFT JOIN properties p ON p.id=pay.property_id LEFT JOIN users u ON u.id=pay.student_id WHERE p.owner_id=$1 ORDER BY pay.created_at DESC LIMIT 50`, [req.user!.sub])
    ]);
    const totalBeds = properties.rows.reduce((n:any,p:any)=>n+Number(p.total_beds||0),0);
    const occupiedBeds = properties.rows.reduce((n:any,p:any)=>n+Number(p.occupied_beds||0),0);
    const paidRevenue = payments.rows.filter((p:any)=>p.status==='paid').reduce((n:number,p:any)=>n+Number(p.amount),0);
    res.json({success:true,data:{properties:properties.rows,bookings:bookings.rows,tenants:tenants.rows,payments:payments.rows,summary:{totalProperties:properties.rows.length,totalTenants:tenants.rows.length,totalBeds,occupiedBeds,occupancyRate:totalBeds?Math.round(occupiedBeds/totalBeds*100):0,paidRevenue}}});
  } catch(e){next(e);}
});

export default router;
