import { Request, Response } from 'express';
import User from '../models/user.model';
import Recycle from '../models/recycle.model';
import Reward from '../models/reward.model';
import Redemption from '../models/redemption.model';
import { signBinQr } from '../utils/qr';
import { notifyUser } from '../services/notification.service';

export class AdminController {
  public async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
const totalUsers = await User.countDocuments({ role: 'user' });
      const validatedRecycles = await Recycle.countDocuments({ status: 'validated' });
      const activeRewards = await Reward.countDocuments({ isActive: true });
      const redemptions = await Redemption.countDocuments();

      const recentActivityDocs = await Recycle.find({ status: 'validated' })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name');

      const recentActivity = recentActivityDocs.map(doc => {
        const mt = doc.items?.[0]?.materialType;
        const action =
          mt === 'pet' || mt === 'plastico' ? 'Plástico'
          : mt === 'aluminio' ? 'Metal'
          : 'Papel/Cartón';
        const color =
          mt === 'pet' || mt === 'plastico' ? '#10B981'
          : mt === 'aluminio' ? '#3B82F6'
          : '#8B5CF6';
        return {
          id: doc._id,
          action,
          time: doc.createdAt.toISOString(),
          points: `+${doc.totalPoints} puntos`,
          type: mt ?? 'papel',
          color,
          user: (doc.user as any)?.name || 'Usuario'
        };
      });

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
  // @desc    Historial de TODOS los canjes de la plataforma
  // @route   GET /api/admin/redemptions
  // @access  Private/Admin
  public async getAllRedemptions(req: Request, res: Response): Promise<void> {
    try {
      const redemptions = await Redemption.find()
        .populate('user', 'name email')
        .populate('reward', 'title pointsCost')
        .sort({ createdAt: -1 })
        .limit(200);

      res.status(200).json({ success: true, data: redemptions });
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }
  // @desc    Generar contenido de QR firmado para un basurero
  // @route   GET /api/admin/signed-qr?material=pet&weight=2
  // @access  Private/Admin
  public async getSignedQr(req: Request, res: Response): Promise<void> {
    try {
      const { material, weight } = req.query;
      const validMaterials = ['pet', 'aluminio', 'papel', 'carton', 'plastico'];

      if (!material || !validMaterials.includes(String(material))) {
        res.status(400).json({ success: false, error: `material debe ser uno de: ${validMaterials.join(', ')}` });
        return;
      }
      const w = Number(weight);
      if (!Number.isFinite(w) || w <= 0 || w > 1000) {
        res.status(400).json({ success: false, error: 'weight debe ser un número mayor a 0' });
        return;
      }

      res.status(200).json({ success: true, data: { qrData: signBinQr(String(material), w), material, weight: w } });
    } catch (error) {
      console.error('[getSignedQr]', error);
      res.status(500).json({ success: false, error: 'Error interno generando el QR' });
    }
  }

  // @desc    Escanear QR de redemption y marcar como completado (uso unico)
  // @route   POST /api/admin/redemptions/scan
  // @access  Private/Admin
  public async scanRedemptionQR(req: Request, res: Response): Promise<void> {
    try {
      const { qrCodeData } = req.body;

      if (!qrCodeData || typeof qrCodeData !== 'string') {
        res.status(400).json({ success: false, error: 'qrCodeData es requerido' });
        return;
      }

      // Transicion atomica pending -> completed: garantiza uso unico
      const redemption = await Redemption.findOneAndUpdate(
        { qrCodeData, status: 'pending' },
        { status: 'completed' },
        { new: true }
      ).populate('reward', 'title pointsCost').populate('user', 'name email');

      if (!redemption) {
        // Verificar si existe pero ya fue procesado
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

  // @desc    Marcar canje como COMPLETADO (entregado al usuario)
  // @route   PUT /api/admin/redemptions/:id/complete
  // @access  Private/Admin
  public async completeRedemption(req: Request, res: Response): Promise<void> {
    try {
      const redemption = await Redemption.findOneAndUpdate(
        { _id: req.params.id, status: 'pending' },
        { status: 'completed' },
        { new: true }
      );

      if (!redemption) {
        res.status(404).json({ success: false, error: 'Canje no encontrado o ya procesado' });
        return;
      }

      await notifyUser(
        String(redemption.user),
        'Canje completado 🎁',
        '¡Tu recompensa fue entregada! Disfrútala.'
      );

      res.status(200).json({ success: true, data: redemption });
    } catch (error) {
      console.error('[completeRedemption]', error);
      res.status(500).json({ success: false, error: 'Error interno al completar el canje' });
    }
  }

  // @desc    Cancelar canje PENDIENTE con devolucion atomica de puntos
  // @route   PUT /api/admin/redemptions/:id/cancel
  // @access  Private/Admin
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

      // Transicion atomica a cancelled: dos admins no cancelan dos veces
      const cancelled = await Redemption.findOneAndUpdate(
        { _id: redemption._id, status: 'pending' },
        { status: 'cancelled' },
        { new: true }
      );
      if (!cancelled) {
        res.status(409).json({ success: false, error: 'El canje acaba de ser procesado por otro operador' });
        return;
      }

      // Devolucion ATOMICA de puntos
      await User.findByIdAndUpdate(redemption.user, { $inc: { ecoPoints: redemption.pointsSpent } });

      // Devolver stock (solo si no es ilimitado)
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

