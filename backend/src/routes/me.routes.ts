import { Router } from 'express';
import { authenticate } from '../auth.js';
import { query } from '../db/client.js';
const router=Router();
router.get('/',authenticate,async(req,res,next)=>{try{const r=await query('SELECT id,email,name,role,phone,address,avatar_url,created_at FROM users WHERE id=$1',[req.user!.sub]);if(!r.rows[0])return res.status(404).json({success:false,error:{code:'NOT_FOUND',message:'User not found.'}});res.json({success:true,data:r.rows[0]});}catch(e){next(e);}});
router.patch('/',authenticate,async(req,res,next)=>{try{const allowed=['name','phone','address','avatar_url'];const entries=Object.entries(req.body).filter(([k,v])=>allowed.includes(k)&&typeof v==='string');if(!entries.length)return res.status(400).json({success:false,error:{code:'NO_CHANGES',message:'No valid profile fields were supplied.'}});const sets=entries.map(([k],i)=>`${k}=$${i+2}`).join(', ');const values=entries.map(([,v])=>v);const r=await query(`UPDATE users SET ${sets},updated_at=NOW() WHERE id=$1 RETURNING id,email,name,role,phone,address,avatar_url`,[req.user!.sub,...values]);res.json({success:true,data:r.rows[0]});}catch(e){next(e);}});
export default router;
