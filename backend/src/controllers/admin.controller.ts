import { Request, Response } from 'express';
import User from '../models/user.model';
import Recycle from '../models/recycle.model';
import Reward from '../models/reward.model';
import Redemption from '../models/redemption.model';
import { notifyUser } from '../services/notification.service';

export class AdminController {
  public async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
const totalUsers = await User.countDocuments({ role: 'user' });
      const validatedRecycles = await Recycle.countDocuments({ status: 'validated' });
      const activeRewards = await Reward.countDocuments({ isActive: true });
      const redemptions = await Redemption.countDocuments();

      const user = (req as any).user;
      
      const recycleQuery: any = { status: 'validated' };
      const redemptionQuery: any = { status: 'completed' };
      if (user.role !== 'superadmin') {
        recycleQuery.validatedBy = user._id;
        redemptionQuery.validatedBy = user._id;
      }

      const recentRecycles = await Recycle.find(recycleQuery)
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name')
        .populate('validatedBy', 'name role');
        
      const recentRedemptions = await Redemption.find(redemptionQuery)
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name')
        .populate('reward', 'title pointsCost')
        .populate('validatedBy', 'name role');

      let mixedActivity: any[] = [];

      recentRecycles.forEach(doc => {
        const mt = doc.items?.[0]?.materialType;
        const action =
          mt === 'pet' || mt === 'plastico' ? 'Plástico'
          : mt === 'aluminio' ? 'Metal'
          : 'Papel/Cartón';
        const color =
          mt === 'pet' || mt === 'plastico' ? '#10B981'
          : mt === 'aluminio' ? '#3B82F6'
          : '#8B5CF6';
          
        mixedActivity.push({
          id: doc._id,
          action: `Reciclaje: ${action}`,
          time: doc.createdAt.toISOString(),
          points: `+${doc.totalPoints} puntos`,
          type: 'recycle',
          color,
          user: (doc.user as any)?.name || 'Usuario',
          
          details: {
            material: mt,
            weight: doc.totalWeight,
            points: doc.totalPoints,
            validationMode: doc.validationMode,
            validatedBy: (doc.validatedBy as any)?.name
          },
          timestamp: doc.createdAt.getTime()
        });
      });

      recentRedemptions.forEach(doc => {
        mixedActivity.push({
          id: doc._id,
          action: `Canje: ${(doc.reward as any)?.title || 'Recompensa'}`,
          time: doc.createdAt.toISOString(),
          points: `-${doc.pointsSpent} puntos`,
          type: 'redemption',
          color: '#F59E0B',
          user: (doc.user as any)?.name || 'Usuario',
          
          details: {
            rewardName: (doc.reward as any)?.title,
            pointsSpent: doc.pointsSpent,
            validatedBy: (doc.validatedBy as any)?.name
          },
          timestamp: doc.createdAt.getTime()
        });
      });

      
      mixedActivity.sort((a, b) => b.timestamp - a.timestamp);
      const recentActivity = mixedActivity.slice(0, 5);
      
      
      recentActivity.forEach(a => delete a.timestamp);

      res.status(200).json({
        success: true,
        data: {
          stats: {
            totalUsers,
            validatedRecycles,
            activeRewards,
            redemptions
          },
          recentActivity
        }
      });
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  
  
  
  public async getActivityLog(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { type = 'all', period = 'all' } = req.query;

      const dateFilter: any = {};
      if (period === '7d') {
        dateFilter.$gte = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      } else if (period === '30d') {
        dateFilter.$gte = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      } else if (period === 'today') {
        dateFilter.$gte = new Date(new Date().setHours(0, 0, 0, 0));
      }

      const recycleQuery: any = { status: 'validated' };
      const redemptionQuery: any = { status: 'completed' };

      if (user.role !== 'superadmin') {
        recycleQuery.validatedBy = user._id;
        redemptionQuery.validatedBy = user._id;
      }
      
      if (dateFilter.$gte) {
        recycleQuery.createdAt = dateFilter;
        redemptionQuery.createdAt = dateFilter;
      }

      let recycles: any[] = [];
      let redemptions: any[] = [];

      if (type === 'all' || type === 'recycle') {
        recycles = await Recycle.find(recycleQuery)
          .sort({ createdAt: -1 })
          .limit(100)
          .populate('user', 'name')
          .populate('validatedBy', 'name role');
      }

      if (type === 'all' || type === 'redemption') {
        redemptions = await Redemption.find(redemptionQuery)
          .sort({ createdAt: -1 })
          .limit(100)
          .populate('user', 'name')
          .populate('reward', 'title pointsCost')
          .populate('validatedBy', 'name role');
      }

      let mixedActivity: any[] = [];

      recycles.forEach(doc => {
        const mt = doc.items?.[0]?.materialType;
        const action = mt === 'pet' || mt === 'plastico' ? 'Plástico' : mt === 'aluminio' ? 'Metal' : 'Papel/Cartón';
        const color = mt === 'pet' || mt === 'plastico' ? '#10B981' : mt === 'aluminio' ? '#3B82F6' : '#8B5CF6';
          
        mixedActivity.push({
          id: doc._id,
          action: `Reciclaje: ${action}`,
          time: doc.createdAt.toISOString(),
          points: `+${doc.totalPoints} puntos`,
          type: 'recycle',
          color,
          user: (doc.user as any)?.name || 'Usuario',
          details: {
            material: mt,
            weight: doc.totalWeight,
            points: doc.totalPoints,
            validationMode: doc.validationMode,
            validatedBy: (doc.validatedBy as any)?.name
          },
          timestamp: doc.createdAt.getTime()
        });
      });

      redemptions.forEach(doc => {
        mixedActivity.push({
          id: doc._id,
          action: `Canje: ${(doc.reward as any)?.title || 'Recompensa'}`,
          time: doc.createdAt.toISOString(),
          points: `-${doc.pointsSpent} puntos`,
          type: 'redemption',
          color: '#F59E0B',
          user: (doc.user as any)?.name || 'Usuario',
          details: {
            rewardName: (doc.reward as any)?.title,
            pointsSpent: doc.pointsSpent,
            validatedBy: (doc.validatedBy as any)?.name
          },
          timestamp: doc.createdAt.getTime()
        });
      });

      mixedActivity.sort((a, b) => b.timestamp - a.timestamp);
      
      
      const finalActivity = mixedActivity.slice(0, 100);
      finalActivity.forEach(a => delete a.timestamp);

      res.status(200).json({ success: true, data: finalActivity });
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error al obtener historial de actividades' });
    }
  }
  
  
  
  public async getAllRedemptions(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const query: any = {};
      
      // Non-superadmin staff only see redemptions they've validated
      if (user.role !== 'superadmin') {
        query.$or = [
          { validatedBy: user._id },
          { status: 'pending' }, // Show pending so they can process them
        ];
      }
      
      const redemptions = await Redemption.find(query)
        .populate('user', 'name email')
        .populate('reward', 'title pointsCost')
        .populate('validatedBy', 'name email role')
        .sort({ createdAt: -1 })
        .limit(200);

      res.status(200).json({ success: true, data: redemptions });
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }


  
  
  
  public async scanRedemptionQR(req: Request, res: Response): Promise<void> {
    try {
      const { qrCodeData } = req.body;

      if (!qrCodeData || typeof qrCodeData !== 'string') {
        res.status(400).json({ success: false, error: 'qrCodeData es requerido' });
        return;
      }

      
      const redemption = await Redemption.findOneAndUpdate(
        { qrCodeData, status: 'pending' },
        { status: 'completed', validatedBy: (req as any).user._id },
        { returnDocument: 'after' }
      ).populate('reward', 'title pointsCost').populate('user', 'name email');

      if (!redemption) {
        
        const existing = await Redemption.findOne({ qrCodeData });
        if (existing) {
          res.status(409).json({
            success: false,
            error: existing.status === 'completed'
              ? 'Este QR ya fue utilizado y la recompensa fue entregada'
              : 'Este canje fue cancelado y ya no es válido'
          });
          return;
        }
        res.status(404).json({ success: false, error: 'QR de canje no encontrado o inválido' });
        return;
      }

      await notifyUser(
        String(redemption.user instanceof Object ? (redemption.user as any)._id : redemption.user),
        'Canje completado 🎁',
        '¡Tu recompensa fue entregada! Disfrútala.'
      );

      res.status(200).json({ success: true, data: redemption });
    } catch (error) {
      console.error('[scanRedemptionQR]', error);
      res.status(500).json({ success: false, error: 'Error interno al escanear el QR' });
    }
  }

  
  
  
  public async completeRedemption(req: Request, res: Response): Promise<void> {
    try {
      console.log('[completeRedemption] Attempting to complete redemption:', req.params.id);
      
      const redemption = await Redemption.findOneAndUpdate(
        { _id: req.params.id, status: 'pending' },
        { status: 'completed', validatedBy: (req as any).user._id },
        { returnDocument: 'after' }
      ).populate('validatedBy', 'name email role')
       .populate('reward', 'title pointsCost')
       .populate('user', 'name email');

      if (!redemption) {
        console.log('[completeRedemption] Not found or already processed:', req.params.id);
        res.status(404).json({ success: false, error: 'Canje no encontrado o ya procesado' });
        return;
      }

      console.log('[completeRedemption] Success! Redemption completed:', redemption._id);

      await notifyUser(
        String(redemption.user instanceof Object ? (redemption.user as any)._id : redemption.user),
        'Canje completado 🎁',
        '¡Tu recompensa fue entregada! Disfrútala.'
      );

      res.status(200).json({ success: true, data: redemption });
    } catch (error) {
      console.error('[completeRedemption] Error:', error);
      res.status(500).json({ success: false, error: 'Error interno al completar el canje' });
    }
  }

  
  
  
  public async cancelRedemption(req: Request, res: Response): Promise<void> {
    try {
      const redemption = await Redemption.findOne({ _id: req.params.id });

      if (!redemption) {
        res.status(404).json({ success: false, error: 'Canje no encontrado' });
        return;
      }
      if (redemption.status !== 'pending') {
        res.status(400).json({ success: false, error: 'Solo se pueden cancelar canjes pendientes' });
        return;
      }

      
      const cancelled = await Redemption.findOneAndUpdate(
        { _id: redemption._id, status: 'pending' },
        { status: 'cancelled' },
        { returnDocument: 'after' }
      );
      if (!cancelled) {
        res.status(409).json({ success: false, error: 'El canje acaba de ser procesado por otro operador' });
        return;
      }

      
      await User.findByIdAndUpdate(redemption.user, { $inc: { ecoPoints: redemption.pointsSpent } });

      
      const reward = await Reward.findById(redemption.reward);
      if (reward && reward.stock !== -1) {
        await Reward.findByIdAndUpdate(redemption.reward, { $inc: { stock: 1 } });
      }

      await notifyUser(
        String(redemption.user),
        'Canje cancelado',
        `Tu canje fue cancelado y recuperaste ${redemption.pointsSpent} puntos.`
      );

      res.status(200).json({ success: true, data: cancelled });
    } catch (error) {
      console.error('[cancelRedemption]', error);
      res.status(500).json({ success: false, error: 'Error interno al cancelar el canje' });
    }
  }
}

export const adminController = new AdminController();

