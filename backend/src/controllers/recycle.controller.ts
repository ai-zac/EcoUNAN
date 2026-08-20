import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Recycle from '../models/recycle.model';
import User from '../models/user.model';
import { notifyUser } from '../services/notification.service';
import { signApprovalQr, verifyApprovalQr } from '../utils/qr';
import { checkAndNotifyRankUpgrade } from '../utils/ranks';

const VALID_MATERIALS = ['pet', 'aluminio', 'papel', 'carton', 'plastico'];

export class RecycleController {

  public async registerRecycle(req: Request, res: Response): Promise<void> {
    try {
      console.log('[registerRecycle] Body:', req.body);
      console.log('[registerRecycle] File:', req.file ? { filename: req.file.filename, mimetype: req.file.mimetype, size: req.file.size } : 'No file');
      const { items, description, validationMode } = req.body;
      const user = (req as any).user;

      if (!user || !items) {
        console.error('[registerRecycle:400] Missing user or items:', { user: !!user, items: !!items });
        res.status(400).json({ success: false, error: 'Faltan datos de usuario o lista de materiales' });
        return;
      }

      const mode = validationMode === 'inperson' ? 'inperson' : 'photo';

      if (mode === 'photo' && !req.file) {
        console.error('[registerRecycle:400] Missing proofImage file');
        res.status(400).json({ success: false, error: 'La foto de evidencia es obligatoria' });
        return;
      }

      const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;

      if (!Array.isArray(parsedItems) || parsedItems.length === 0 || parsedItems.length > 20) {
        console.error('[registerRecycle:400] Invalid items array:', parsedItems);
        res.status(400).json({ success: false, error: 'items debe ser un array de 1 a 20 elementos' });
        return;
      }
      for (const item of parsedItems) {
        if (!VALID_MATERIALS.includes(item.materialType)) {
          console.error('[registerRecycle:400] Invalid material:', item.materialType);
          res.status(400).json({ success: false, error: `Material inválido: ${item.materialType}. Válidos: ${VALID_MATERIALS.join(', ')}` });
          return;
        }
        const w = Number(item.weight);
        if (!Number.isFinite(w) || w <= 0 || w > 9999) {
          console.error('[registerRecycle:400] Invalid weight/quantity:', item.weight);
          res.status(400).json({ success: false, error: 'La cantidad debe ser un número positivo' });
          return;
        }
      }

      let totalWeight = 0;
      let totalPoints = 0;

      const processedItems = parsedItems.map((item: any) => {
        const weight = Number(item.weight);
        const pointsEarned = Math.floor(weight * 10);
        totalWeight += weight;
        totalPoints += pointsEarned;

        return {
          materialType: item.materialType,
          weight,
          pointsEarned
        };
      });

      let proofImage = undefined;
      if (req.file) {
        proofImage = `/uploads/${req.file.filename}`;
      }

      const recycle = await Recycle.create({
        user: user._id,
        items: processedItems,
        totalWeight,
        totalPoints,
        status: 'pending',
        validationMode: mode,
        proofImage,
        description
      });

      res.status(201).json({ success: true, data: recycle });
    } catch (error: any) {
      console.error('[registerRecycle:catch 400]', error);
      res.status(400).json({ success: false, error: error.message || 'Error al procesar el registro' });
    }
  }

  public async getPendingRecycles(req: Request, res: Response): Promise<void> {
    try {
      const pendingRecycles = await Recycle.find({ status: 'pending' })
        .populate('user', 'name email')
        .sort({ createdAt: 1 });

      res.status(200).json({ success: true, data: pendingRecycles });
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  public async getUserHistory(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Not authorized' });
        return;
      }

      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 30));
      const skip = (page - 1) * limit;

      const history = await Recycle.find({ user: user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      res.status(200).json({
        success: true,
        data: history,
        pagination: {
          page,
          limit
        }
      });
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  public async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, error: 'ID de usuario inválido' });
        return;
      }

      const stats = await Recycle.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(id),
            status: 'validated'
          }
        },
        {
          $group: {
            _id: null,
            recycleCount: { $sum: 1 },
            totalWeight: { $sum: '$totalWeight' }
          }
        }
      ]);

      const data = stats[0] || { recycleCount: 0, totalWeight: 0 };

      res.status(200).json({
        success: true,
        data: {
          recycleCount: data.recycleCount,
          totalWeight: Math.round(data.totalWeight * 100) / 100
        }
      });
    } catch (error: any) {
      console.error('[getUserStats]', error);
      res.status(500).json({ success: false, error: 'Error obteniendo estadisticas' });
    }
  }

  public async getApprovalQr(req: Request, res: Response): Promise<void> {
    try {
      const recycle = await Recycle.findById(req.params.id);
      if (!recycle) {
        res.status(404).json({ success: false, error: 'Registro no encontrado' });
        return;
      }
      if (recycle.status !== 'pending') {
        res.status(400).json({ success: false, error: 'El registro ya fue procesado' });
        return;
      }
      if (recycle.validationMode !== 'inperson') {
        res.status(400).json({ success: false, error: 'Este registro es remoto (foto): usa Aprobar/Rechazar' });
        return;
      }

      res.status(200).json({ success: true, data: { qrData: signApprovalQr(String(recycle._id)) } });
    } catch (error) {
      console.error('[getApprovalQr]', error);
      res.status(500).json({ success: false, error: 'Error interno generando el QR' });
    }
  }

  public async confirmPresential(req: Request, res: Response): Promise<void> {
    try {
      const { qrData } = req.body;
      const user = (req as any).user;

      if (typeof qrData !== 'string' || !qrData.trim()) {
        res.status(400).json({ success: false, error: 'qrData es obligatorio' });
        return;
      }

      const verified = verifyApprovalQr(qrData);
      if (!verified) {
        res.status(400).json({ success: false, error: 'QR inválido o expirado. Pide al brigadista que lo genere de nuevo.' });
        return;
      }

      const recycle = await Recycle.findById(verified.recycleId);
      if (!recycle) {
        res.status(404).json({ success: false, error: 'Registro no encontrado' });
        return;
      }
      if (String(recycle.user) !== String(user._id)) {
        res.status(403).json({ success: false, error: 'Este QR corresponde a la solicitud de otro estudiante' });
        return;
      }
      if (recycle.status !== 'pending') {
        res.status(400).json({ success: false, error: 'Esta solicitud ya fue procesada' });
        return;
      }

      const validated = await Recycle.findOneAndUpdate(
        { _id: recycle._id, status: 'pending' },
        { status: 'validated', validatedBy: user._id },
        { returnDocument: 'after' }
      );
      if (!validated) {
        res.status(409).json({ success: false, error: 'Esta solicitud acaba de ser procesada' });
        return;
      }
      const targetUser = await User.findById(user._id);
      const prevLifetimePoints = targetUser?.lifetimePoints || 0;
      const newLifetimePoints = prevLifetimePoints + recycle.totalPoints;

      await User.findByIdAndUpdate(user._id, { $inc: { ecoPoints: recycle.totalPoints, lifetimePoints: recycle.totalPoints } });

      await notifyUser(
        String(recycle.user),
        '¡Reciclaje validado! ♻️',
        `Tu entrega presencial fue verificada. Ganaste +${recycle.totalPoints} puntos.`
      );

      await checkAndNotifyRankUpgrade(String(user._id), prevLifetimePoints, newLifetimePoints);

      res.status(200).json({
        success: true,
        pointsEarned: recycle.totalPoints,
        data: validated
      });
    } catch (error) {
      console.error('[confirmPresential]', error);
      res.status(500).json({ success: false, error: 'Error interno confirmando el reciclaje' });
    }
  }

  public async validateRecycle(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const recycle = await Recycle.findById(id);

      if (!recycle) {
        res.status(404).json({ success: false, error: 'Registro de reciclaje no encontrado' });
        return;
      }

      if (recycle.status !== 'pending') {
        res.status(400).json({ success: false, error: 'El registro de reciclaje ya no está pendiente' });
        return;
      }

      const validated = await Recycle.findOneAndUpdate(
        { _id: recycle._id, status: 'pending' },
        { status: 'validated', validatedBy: (req as any).user._id },
        { returnDocument: 'after' }
      );
      if (!validated) {
        res.status(409).json({ success: false, error: 'Este registro acaba de ser procesado por otro operador' });
        return;
      }

      const targetUser = await User.findById(recycle.user);
      const prevLifetimePoints = targetUser?.lifetimePoints || 0;
      const newLifetimePoints = prevLifetimePoints + recycle.totalPoints;

      await User.findByIdAndUpdate(recycle.user, { $inc: { ecoPoints: recycle.totalPoints, lifetimePoints: recycle.totalPoints } });

      await notifyUser(
        String(recycle.user),
        '¡Reciclaje aprobado! ♻️',
        `Ganaste +${recycle.totalPoints} puntos por tu reciclaje. ¡Sigue así!`
      );

      await checkAndNotifyRankUpgrade(String(recycle.user), prevLifetimePoints, newLifetimePoints);

      res.status(200).json({ success: true, data: validated });
    } catch (error) {
      console.error('[validateRecycle]', error);
      res.status(500).json({ success: false, error: 'Error interno al validar el reciclaje' });
    }
  }

  public async rejectRecycle(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const recycle = await Recycle.findById(id);

      if (!recycle) {
        res.status(404).json({ success: false, error: 'Registro de reciclaje no encontrado' });
        return;
      }

      if (recycle.status !== 'pending') {
        res.status(400).json({ success: false, error: 'El registro de reciclaje ya no está pendiente' });
        return;
      }

      const rejected = await Recycle.findOneAndUpdate(
        { _id: recycle._id, status: 'pending' },
        { status: 'rejected' },
        { returnDocument: 'after' }
      );
      if (!rejected) {
        res.status(409).json({ success: false, error: 'Este registro acaba de ser procesado por otro operador' });
        return;
      }

      await notifyUser(
        String(recycle.user),
        'Reciclaje rechazado',
        'Tu registro de reciclaje no fue aprobado. Verifica la evidencia e inténtalo de nuevo.'
      );

      res.status(200).json({ success: true, data: rejected });
    } catch (error) {
      console.error('[rejectRecycle]', error);
      res.status(500).json({ success: false, error: 'Error interno al rechazar el reciclaje' });
    }
  }
}

export const recycleController = new RecycleController();
