import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../auth.js';
import { query } from '../db/client.js';

const router = Router();
const propertyInput = z.object({
  name: z.string().trim().min(2).max(150), description: z.string().max(5000).optional(), address: z.string().min(3).max(300), city: z.string().min(2).max(100), state: z.string().min(2).max(100), postalCode: z.string().max(20).optional(), latitude: z.number().min(-90).max(90).optional(), longitude: z.number().min(-180).max(180).optional(), monthlyPriceMin: z.number().nonnegative().optional(), monthlyPriceMax: z.number().nonnegative().optional(), amenities: z.array(z.string()).default([]), images: z.array(z.string().url()).default([]), rules: z.array(z.string()).default([])
});

router.get('/', async (req,res,next) => {
  try {
    const city = typeof req.query.city === 'string' ? req.query.city : null;
    const q = typeof req.query.q === 'string' ? `%${req.query.q}%` : null;
    const result = await query(`SELECT p.*, u.name AS owner_name,
      COALESCE(ROUND(AVG(r.rating),1),0) AS rating,
      COUNT(DISTINCT r.id)::int AS review_count
      FROM properties p JOIN users u ON u.id=p.owner_id LEFT JOIN reviews r ON r.property_id=p.id
      WHERE p.status='approved' AND ($1::text IS NULL OR p.city ILIKE $1) AND ($2::text IS NULL OR p.name ILIKE $2 OR p.address ILIKE $2 OR p.city ILIKE $2)
      GROUP BY p.id,u.name ORDER BY p.created_at DESC`, [city,q]);
    res.json({success:true,data:result.rows});
  } catch(e){next(e);}
});

router.get('/:id', async (req,res,next)=>{ try { const result=await query('SELECT p.*,u.name AS owner_name FROM properties p JOIN users u ON u.id=p.owner_id WHERE p.id=$1',[req.params.id]); if(!result.rows[0]) return res.status(404).json({success:false,error:{code:'NOT_FOUND',message:'Property not found.'}}); res.json({success:true,data:result.rows[0]}); } catch(e){next(e);} });

router.post('/', authenticate, requireRole('owner'), async(req,res,next)=>{ try { const x=propertyInput.parse(req.body); const r=await query(`INSERT INTO properties(owner_id,name,description,address,city,state,postal_code,latitude,longitude,monthly_price_min,monthly_price_max,amenities,images,rules) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,[req.user!.sub,x.name,x.description??null,x.address,x.city,x.state,x.postalCode??null,x.latitude??null,x.longitude??null,x.monthlyPriceMin??null,x.monthlyPriceMax??null,JSON.stringify(x.amenities),JSON.stringify(x.images),JSON.stringify(x.rules)]); res.status(201).json({success:true,data:r.rows[0]}); }catch(e){next(e);} });

router.patch('/:id', authenticate, requireRole('owner','admin'), async(req,res,next)=>{ try { const x=propertyInput.partial().parse(req.body); const r=await query(`UPDATE properties SET name=COALESCE($2,name),description=COALESCE($3,description),address=COALESCE($4,address),city=COALESCE($5,city),state=COALESCE($6,state),postal_code=COALESCE($7,postal_code),monthly_price_min=COALESCE($8,monthly_price_min),monthly_price_max=COALESCE($9,monthly_price_max),amenities=COALESCE($10,amenities),images=COALESCE($11,images),rules=COALESCE($12,rules),updated_at=NOW() WHERE id=$1 AND ($13='admin' OR owner_id=$14) RETURNING *`,[req.params.id,x.name??null,x.description??null,x.address??null,x.city??null,x.state??null,x.postalCode??null,x.monthlyPriceMin??null,x.monthlyPriceMax??null,x.amenities?JSON.stringify(x.amenities):null,x.images?JSON.stringify(x.images):null,x.rules?JSON.stringify(x.rules):null,req.user!.role,req.user!.sub]); if(!r.rows[0]) return res.status(404).json({success:false,error:{code:'NOT_FOUND',message:'Property not found or access denied.'}}); res.json({success:true,data:r.rows[0]}); }catch(e){next(e);} });

router.post('/:id/rooms', authenticate, requireRole('owner','admin'), async(req,res,next)=>{ try { const x=z.object({roomNumber:z.string().min(1).max(30),roomType:z.string().min(1).max(50),capacity:z.number().int().positive(),monthlyRent:z.number().nonnegative()}).parse(req.body); const r=await query(`INSERT INTO rooms(property_id,room_number,room_type,capacity,monthly_rent) SELECT $1,$2,$3,$4,$5 WHERE EXISTS(SELECT 1 FROM properties WHERE id=$1 AND ($6='admin' OR owner_id=$7)) RETURNING *`,[req.params.id,x.roomNumber,x.roomType,x.capacity,x.monthlyRent,req.user!.role,req.user!.sub]); if(!r.rows[0]) return res.status(403).json({success:false,error:{code:'FORBIDDEN',message:'Property access denied.'}}); res.status(201).json({success:true,data:r.rows[0]}); }catch(e){next(e);} });

router.get('/:id/rooms', async(req,res,next)=>{try{const r=await query('SELECT * FROM rooms WHERE property_id=$1 ORDER BY room_number',[req.params.id]);res.json({success:true,data:r.rows});}catch(e){next(e);}});

export default router;
