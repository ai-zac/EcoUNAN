import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Recycle from '../models/recycle.model';
import User from '../models/user.model';
import { notifyUser } from '../services/notification.service';
import { signApprovalQr, verifyApprovalQr } from '../utils/qr';
import { checkAndNotifyRankUpgrade } from '../utils/ranks';
import { getCachedMaterialMap } from './material.controller';

export class RecycleController {

  public async registerRecycle(req: Request, res: Response): Promise<void> {
    // ⚠️ ERROR CONTROLADO PARA LA DEMO CON LA PROFESORA (Descomentar si se requiere simular error)
    /*
    res.status(400).json({
      success: false,
      error: 'Error de validación controlado (Código 400): El peso supera el límite permitido para esta entrega.'
    });
    return;
    */

    try {
      const uploadedFile = (req as any).file;
      console.log('[registerRecycle] Body:', req.body);
      console.log('[registerRecycle] File:', uploadedFile ? { filename: uploadedFile.filename, mimetype: uploadedFile.mimetype, size: uploadedFile.size } : 'No file');
      const { items, description, validationMode } = req.body;
      const user = (req as any).user;

      if (!user || !items) {
        console.error('[registerRecycle:400] Missing user or items:', { user: !!user, items: !!items });
        res.status(400).json({ success: false, error: 'Faltan datos de usuario o lista de materiales' });
        return;
      }

      const mode = validationMode === 'inperson' ? 'inperson' : 'photo';

      if (mode === 'photo' && !uploadedFile) {
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

      const materialMap = await getCachedMaterialMap();

      for (const item of parsedItems) {
        const matKey = String(item.materialType || '').toLowerCase().trim();
        const matDef = materialMap[matKey];
        if (!matDef || !matDef.isActive) {
          console.error('[registerRecycle:400] Invalid or inactive material:', item.materialType);
          res.status(400).json({ success: false, error: `Material no disponible o inválido: ${item.materialType}` });
          return;
        }
        const w = Number(item.weight);
        if (!Number.isFinite(w) || w <= 0 || w > 9999) {
          console.error('[registerRecycle:400] Invalid weight/quantity:', item.weight);
          res.status(400).json({ success: false, error: 'El peso debe ser un número positivo (hasta 9999)' });
          return;
        }
      }

      let totalWeight = 0;
      let totalPoints = 0;

      const processedItems = parsedItems.map((item: any) => {
        const matKey = String(item.materialType || '').toLowerCase().trim();
        const matDef = materialMap[matKey];
        const weight = Math.round(Number(item.weight) * 100) / 100;
        const pointsPerKg = matDef ? matDef.pointsPerKg : 10;
        const pointsEarned = Math.round(weight * pointsPerKg);
        totalWeight = Math.round((totalWeight + weight) * 100) / 100;
        totalPoints += pointsEarned;

        return {
          materialType: matKey,
          weight,
          pointsEarned
        };
      });

      let proofImage = undefined;
      if (uploadedFile) {
        proofImage = `/uploads/${uploadedFile.filename}`;
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
      const rawPage = Number(req.query.page);
      const rawLimit = Number(req.query.limit);
      const pageParam = req.query.page !== undefined ? (Number.isFinite(rawPage) ? Math.max(Math.floor(rawPage), 1) : 1) : null;
      const limitParam = req.query.limit !== undefined ? (Number.isFinite(rawLimit) ? Math.min(Math.max(Math.floor(rawLimit), 1), 100) : 20) : null;

      if (pageParam || limitParam) {
        const page = pageParam || 1;
        const limit = limitParam || 20;
        const skip = (page - 1) * limit;

        const [total, data] = await Promise.all([
          Recycle.countDocuments({ status: 'pending' }),
          Recycle.find({ status: 'pending' })
            .populate('user', 'name email')
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        ]);

        res.setHeader('X-Total-Count', total.toString());
        res.status(200).json({ success: true, total, page, limit, data });
        return;
      }

      const [total, pendingRecycles] = await Promise.all([
        Recycle.countDocuments({ status: 'pending' }),
        Recycle.find({ status: 'pending' })
          .populate('user', 'name email')
          .sort({ createdAt: 1 })
          .limit(100)
          .lean(),
      ]);

      res.setHeader('X-Total-Count', total.toString());
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
