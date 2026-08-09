import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../auth.js';
import { query } from '../db/client.js';
const router=Router();
router.get('/:propertyId',async(req,res,next)=>{try{const r=await query(`SELECT r.*,u.name student_name FROM reviews r JOIN users u ON u.id=r.student_id WHERE r.property_id=$1 ORDER BY r.created_at DESC`,[req.params.propertyId]);res.json({success:true,data:r.rows});}catch(e){next(e);}});
router.post('/:propertyId',authenticate,requireRole('student'),async(req,res,next)=>{try{const x=z.object({rating:z.number().int().min(1).max(5),comment:z.string().max(2000).optional()}).parse(req.body);const eligible=await query(`SELECT 1 FROM bookings WHERE student_id=$1 AND property_id=$2 AND status IN ('approved','completed') LIMIT 1`,[req.user!.sub,req.params.propertyId]);if(!eligible.rows[0])return res.status(403).json({success:false,error:{code:'NOT_ELIGIBLE',message:'Only students with an approved booking can review this property.'}});const r=await query(`INSERT INTO reviews(student_id,property_id,rating,comment) VALUES($1,$2,$3,$4) ON CONFLICT(student_id,property_id) DO UPDATE SET rating=EXCLUDED.rating,comment=EXCLUDED.comment RETURNING *`,[req.user!.sub,req.params.propertyId,x.rating,x.comment??null]);res.status(201).json({success:true,data:r.rows[0]});}catch(e){next(e);}});
export default router;
