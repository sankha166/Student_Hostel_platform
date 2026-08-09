import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../auth.js';
import { query } from '../db/client.js';

const router=Router();
const createSchema=z.object({propertyId:z.string().uuid(),roomId:z.string().uuid().optional(),visitDate:z.string().datetime().optional(),message:z.string().max(2000).optional()});

router.post('/',authenticate,requireRole('student'),async(req,res,next)=>{try{const x=createSchema.parse(req.body);const r=await query(`INSERT INTO bookings(student_id,property_id,room_id,visit_date,message) SELECT $1,$2,$3,$4,$5 WHERE EXISTS(SELECT 1 FROM properties WHERE id=$2 AND status='approved') RETURNING *`,[req.user!.sub,x.propertyId,x.roomId??null,x.visitDate??null,x.message??null]);if(!r.rows[0])return res.status(400).json({success:false,error:{code:'INVALID_PROPERTY',message:'Property is not available for booking.'}});res.status(201).json({success:true,data:r.rows[0]});}catch(e){next(e);}});

router.get('/mine',authenticate,requireRole('student'),async(req,res,next)=>{try{const r=await query(`SELECT b.*,p.name property_name,p.address,r.room_number FROM bookings b JOIN properties p ON p.id=b.property_id LEFT JOIN rooms r ON r.id=b.room_id WHERE b.student_id=$1 ORDER BY b.created_at DESC`,[req.user!.sub]);res.json({success:true,data:r.rows});}catch(e){next(e);}});

router.get('/owner',authenticate,requireRole('owner','admin'),async(req,res,next)=>{try{const r=await query(`SELECT b.*,p.name property_name,u.name student_name,u.email student_email,r.room_number FROM bookings b JOIN properties p ON p.id=b.property_id JOIN users u ON u.id=b.student_id LEFT JOIN rooms r ON r.id=b.room_id WHERE ($1='admin' OR p.owner_id=$2) ORDER BY b.created_at DESC`,[req.user!.role,req.user!.sub]);res.json({success:true,data:r.rows});}catch(e){next(e);}});

router.patch('/:id/status',authenticate,requireRole('owner','admin'),async(req,res,next)=>{try{const x=z.object({status:z.enum(['approved','rejected','cancelled','completed']),roomId:z.string().uuid().optional()}).parse(req.body);const r=await query(`UPDATE bookings b SET status=$1,room_id=COALESCE($2,b.room_id),updated_at=NOW() FROM properties p WHERE b.id=$3 AND p.id=b.property_id AND ($4='admin' OR p.owner_id=$5) RETURNING b.*`,[x.status,x.roomId??null,req.params.id,req.user!.role,req.user!.sub]);if(!r.rows[0])return res.status(404).json({success:false,error:{code:'NOT_FOUND',message:'Booking not found or access denied.'}});res.json({success:true,data:r.rows[0]});}catch(e){next(e);}});

export default router;
