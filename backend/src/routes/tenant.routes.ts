import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../auth.js';
import { query } from '../db/client.js';

const router=Router();
router.use(authenticate,requireRole('owner','admin'));
const input=z.object({studentId:z.string().uuid(),propertyId:z.string().uuid(),roomId:z.string().uuid().optional(),moveInDate:z.string(),moveOutDate:z.string().optional(),monthlyRent:z.number().nonnegative()});

router.get('/mine',async(req,res,next)=>{try{const r=await query(`SELECT t.*,p.name property_name,r.room_number,u.name student_name,u.email student_email FROM tenants t JOIN properties p ON p.id=t.property_id JOIN users u ON u.id=t.student_id LEFT JOIN rooms r ON r.id=t.room_id WHERE ($1='admin' OR p.owner_id=$2) ORDER BY t.created_at DESC`,[req.user!.role,req.user!.sub]);res.json({success:true,data:r.rows});}catch(e){next(e);}});
router.post('/',async(req,res,next)=>{try{const x=input.parse(req.body);const r=await query(`INSERT INTO tenants(student_id,property_id,room_id,move_in_date,move_out_date,monthly_rent) SELECT $1,$2,$3,$4,$5,$6 WHERE $7='admin' OR EXISTS(SELECT 1 FROM properties WHERE id=$2 AND owner_id=$8) RETURNING *`,[x.studentId,x.propertyId,x.roomId??null,x.moveInDate,x.moveOutDate??null,x.monthlyRent,req.user!.role,req.user!.sub]);if(!r.rows[0])return res.status(403).json({success:false,error:{code:'FORBIDDEN',message:'Property access denied.'}});if(x.roomId)await query(`UPDATE rooms SET occupied_count=LEAST(capacity,occupied_count+1),status=CASE WHEN occupied_count+1>=capacity THEN 'occupied'::room_status ELSE status END WHERE id=$1`,[x.roomId]);res.status(201).json({success:true,data:r.rows[0]});}catch(e){next(e);}});
router.patch('/:id/end',async(req,res,next)=>{try{const r=await query(`UPDATE tenants t SET active=FALSE,move_out_date=COALESCE($2::date,CURRENT_DATE) FROM properties p WHERE t.id=$1 AND p.id=t.property_id AND ($3='admin' OR p.owner_id=$4) RETURNING t.*`,[req.params.id,req.body?.moveOutDate??null,req.user!.role,req.user!.sub]);if(!r.rows[0])return res.status(404).json({success:false,error:{code:'NOT_FOUND',message:'Tenant not found or access denied.'}});res.json({success:true,data:r.rows[0]});}catch(e){next(e);}});
export default router;
