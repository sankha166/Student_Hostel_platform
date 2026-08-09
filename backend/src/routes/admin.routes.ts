import { Router } from 'express';
import { authenticate, requireRole } from '../auth.js';
import { query } from '../db/client.js';
const router=Router();
router.use(authenticate,requireRole('admin'));
router.get('/dashboard',async(_req,res,next)=>{try{const [users,properties,bookings,payments]=await Promise.all([query('SELECT role,COUNT(*)::int count FROM users GROUP BY role'),query('SELECT status,COUNT(*)::int count FROM properties GROUP BY status'),query('SELECT status,COUNT(*)::int count FROM bookings GROUP BY status'),query('SELECT status,COALESCE(SUM(amount),0)::numeric total FROM payments GROUP BY status')]);res.json({success:true,data:{users:users.rows,properties:properties.rows,bookings:bookings.rows,payments:payments.rows}});}catch(e){next(e);}});
router.patch('/properties/:id/status',async(req,res,next)=>{try{const status=req.body?.status;if(!['approved','rejected','suspended','pending'].includes(status))return res.status(400).json({success:false,error:{code:'INVALID_STATUS',message:'Invalid property status.'}});const r=await query('UPDATE properties SET status=$1,updated_at=NOW() WHERE id=$2 RETURNING *',[status,req.params.id]);if(!r.rows[0])return res.status(404).json({success:false,error:{code:'NOT_FOUND',message:'Property not found.'}});res.json({success:true,data:r.rows[0]});}catch(e){next(e);}});
export default router;
