import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../auth.js';
import { query } from '../db/client.js';
const router=Router();
router.post('/initialize',authenticate,requireRole('student'),async(req,res,next)=>{try{const x=z.object({amount:z.number().positive(),description:z.string().max(300).optional(),propertyId:z.string().uuid().optional(),bookingId:z.string().uuid().optional()}).parse(req.body);const r=await query(`INSERT INTO payments(student_id,property_id,booking_id,amount,description,status) VALUES($1,$2,$3,$4,$5,'pending') RETURNING id,amount,currency,status,description,created_at`,[req.user!.sub,x.propertyId??null,x.bookingId??null,x.amount,x.description??null]);res.status(201).json({success:true,data:r.rows[0]});}catch(e){next(e);}});
router.get('/mine',authenticate,requireRole('student'),async(req,res,next)=>{try{const r=await query('SELECT * FROM payments WHERE student_id=$1 ORDER BY created_at DESC',[req.user!.sub]);res.json({success:true,data:r.rows});}catch(e){next(e);}});
router.post('/:id/mark-paid',authenticate,requireRole('admin'),async(req,res,next)=>{try{const providerId=typeof req.body?.providerPaymentId==='string'?req.body.providerPaymentId:null;const r=await query(`UPDATE payments SET status='paid',provider_payment_id=COALESCE($1,provider_payment_id),paid_at=NOW() WHERE id=$2 RETURNING *`,[providerId,req.params.id]);if(!r.rows[0])return res.status(404).json({success:false,error:{code:'NOT_FOUND',message:'Payment not found.'}});res.json({success:true,data:r.rows[0]});}catch(e){next(e);}});
export default router;
