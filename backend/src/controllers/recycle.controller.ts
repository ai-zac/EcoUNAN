import { Request, Response } from 'express';
import Recycle from '../models/recycle.model';
import User from '../models/user.model';
import { notifyUser } from '../services/notification.service';
import { verifyBinQr, signApprovalQr, verifyApprovalQr } from '../utils/qr';

const VALID_MATERIALS = ['pet', 'aluminio', 'papel', 'carton', 'plastico'];

export class RecycleController {
  
  // User: Registers a new recycle action (pending validation)
  public async registerRecycle(req: Request, res: Response): Promise<void> {
    try {
      const { items, description, validationMode } = req.body;
      const user = (req as any).user;

      if (!user || !items) {
        res.status(400).json({ success: false, error: 'Missing user or items' });
        return;
      }

      const mode = validationMode === 'inperson' ? 'inperson' : 'photo';
      // El modo foto exige evidencia; el presencial la verificara el brigadista
      if (mode === 'photo' && !req.file) {
        res.status(400).json({ success: false, error: 'La foto de evidencia es obligatoria' });
        return;
      }

      const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
      
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
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Admin: Get all pending recycles
  public async getPendingRecycles(req: Request, res: Response): Promise<void> {
    try {
      const pendingRecycles = await Recycle.find({ status: 'pending' })
        .populate('user', 'name email')
        .sort({ createdAt: -1 });

      res.status(200).json({ success: true, data: pendingRecycles });
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  // User: Get personal recycle history
  public async getUserHistory(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Not authorized' });
        return;
      }

      const history = await Recycle.find({ user: user._id })
        .sort({ createdAt: -1 });

      res.status(200).json({ success: true, data: history });
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  // User: Scan QR to automatically validate recycling
  public async scanQR(req: Request, res: Response): Promise<void> {
    try {
      const { qrData } = req.body;
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({ success: false, error: 'Not authorized' });
        return;
      }
      if (typeof qrData !== 'string' || !qrData.trim()) {
        res.status(400).json({ success: false, error: 'qrData es obligatorio' });
        return;
      }

      // Verificacion HMAC + estructura: rechaza QR falsificados o manipulados
      const verified = verifyBinQr(qrData);
      if (!verified) {
        res.status(400).json({ success: false, error: 'QR invÃ¡lido o no autorizado' });
        return;
      }
      if (!VALID_MATERIALS.includes(verified.material)) {
        res.status(400).json({ success: false, error: 'Material del QR no reconocido' });
        return;
      }

      const weight = verified.weight;
      const pointsEarned = Math.floor(weight * 10);

      const processedItems = [{
        materialType: verified.material as 'pet' | 'aluminio' | 'papel' | 'carton' | 'plastico',
        weight,
        pointsEarned
      }];

      const recycle = await Recycle.create({
        user: user._id,
        items: processedItems,
        totalWeight: weight,
        totalPoints: pointsEarned,
        status: 'validated'
      });

      // Puntos ATOMICOS
      await User.findByIdAndUpdate(user._id, { $inc: { ecoPoints: pointsEarned } });

      res.status(200).json({ success: true, data: recycle });
    } catch (error) {
      console.error('[scanQR]', error);
      res.status(500).json({ success: false, error: 'Error interno al procesar el QR' });
    }
  }

  // Brigadista/Admin: genera QR efimero de aprobacion presencial
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

  // Estudiante: confirma su reciclaje presencial escaneando el QR del brigadista
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

      // Transicion atomica + puntos atomicos
      const validated = await Recycle.findOneAndUpdate(
        { _id: recycle._id, status: 'pending' },
        { status: 'validated' },
        { new: true }
      );
      if (!validated) {
        res.status(409).json({ success: false, error: 'Esta solicitud acaba de ser procesada' });
        return;
      }
      await User.findByIdAndUpdate(user._id, { $inc: { ecoPoints: recycle.totalPoints } });

      await notifyUser(
        String(recycle.user),
        '¡Reciclaje validado! ♻️',
        `Tu entrega presencial fue verificada. Ganaste +${recycle.totalPoints} puntos.`
      );

      // pointsEarned de primer nivel para consumo directo del frontend
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

// Admin: Validate a recycle action and award points
  public async validateRecycle(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const recycle = await Recycle.findById(id);

      if (!recycle) {
        res.status(404).json({ success: false, error: 'Recycle record not found' });
        return;
      }

      if (recycle.status !== 'pending') {
        res.status(400).json({ success: false, error: 'Recycle record is not pending' });
        return;
      }

      // Transicion atomica: solo se valida si estaba pendiente
      const validated = await Recycle.findOneAndUpdate(
        { _id: recycle._id, status: 'pending' },
        { status: 'validated' },
        { new: true }
      );
      if (!validated) {
        res.status(409).json({ success: false, error: 'Este registro acaba de ser procesado por otro operador' });
        return;
      }

      // Puntos atomicos
      await User.findByIdAndUpdate(recycle.user, { $inc: { ecoPoints: recycle.totalPoints } });

      // Notificar al usuario (in-app + push)
      await notifyUser(
        String(recycle.user),
        '¡Reciclaje aprobado! ♻️',
        `Ganaste +${recycle.totalPoints} puntos por tu reciclaje. ¡Sigue así!`
      );

      res.status(200).json({ success: true, data: validated });
    } catch (error) {
      console.error('[validateRecycle]', error);
      res.status(500).json({ success: false, error: 'Error interno al validar el reciclaje' });
    }
  }

  // Admin: Reject a recycle action
  public async rejectRecycle(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const recycle = await Recycle.findById(id);

      if (!recycle) {
        res.status(404).json({ success: false, error: 'Recycle record not found' });
        return;
      }

      if (recycle.status !== 'pending') {
        res.status(400).json({ success: false, error: 'Recycle record is not pending' });
        return;
      }

      // Transicion atomica: solo se rechaza si estaba pendiente
      const rejected = await Recycle.findOneAndUpdate(
        { _id: recycle._id, status: 'pending' },
        { status: 'rejected' },
        { new: true }
      );
      if (!rejected) {
        res.status(409).json({ success: false, error: 'Este registro acaba de ser procesado por otro operador' });
        return;
      }

      // Notificar al usuario (in-app + push)
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

