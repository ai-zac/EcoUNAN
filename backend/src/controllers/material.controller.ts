import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Material, { IMaterial } from '../models/material.model';

const DEFAULT_MATERIALS = [
  {
    key: 'pet',
    name: 'Botella PET',
    pointsPerKg: 10,
    unit: 'kg',
    icon: 'GlassWater',
    color: '#10B981',
    bg: '#D1FAE5',
    description: 'Botellas de plástico transparente o de color limpias y secas',
    isActive: true,
    order: 1,
  },
  {
    key: 'aluminio',
    name: 'Lata de aluminio',
    pointsPerKg: 15,
    unit: 'kg',
    icon: 'Coffee',
    color: '#3B82F6',
    bg: '#EFF6FF',
    description: 'Latas de bebidas aplastadas o enteras',
    isActive: true,
    order: 2,
  },
  {
    key: 'papel',
    name: 'Papel',
    pointsPerKg: 5,
    unit: 'kg',
    icon: 'FileText',
    color: '#8B5CF6',
    bg: '#EDE9FE',
    description: 'Hojas, cuadernos viejos y papel bond sin grapas',
    isActive: true,
    order: 3,
  },
  {
    key: 'carton',
    name: 'Cartón',
    pointsPerKg: 8,
    unit: 'kg',
    icon: 'Package',
    color: '#F59E0B',
    bg: '#FEF3C7',
    description: 'Cajas desarmadas y empaques secos',
    isActive: true,
    order: 4,
  },
  {
    key: 'plastico',
    name: 'Plástico',
    pointsPerKg: 10,
    unit: 'kg',
    icon: 'Droplet',
    color: '#EF4444',
    bg: '#FEE2E2',
    description: 'Envases plásticos rígidos clasificados',
    isActive: true,
    order: 5,
  },
];

let cachedMaterialsMap: Record<string, { pointsPerKg: number; isActive: boolean; name: string }> | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000;

export const invalidateMaterialsCache = () => {
  cachedMaterialsMap = null;
  lastCacheTime = 0;
};

export const ensureDefaultMaterials = async (): Promise<void> => {
  try {
    const count = await Material.countDocuments();
    if (count === 0) {
      await Material.insertMany(DEFAULT_MATERIALS);
      invalidateMaterialsCache();
    }
  } catch (error) {
    console.error('[ensureDefaultMaterials error]', error);
  }
};

export const getCachedMaterialMap = async (): Promise<Record<string, { pointsPerKg: number; isActive: boolean; name: string }>> => {
  const now = Date.now();
  if (cachedMaterialsMap && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedMaterialsMap;
  }

  try {
    await ensureDefaultMaterials();
    const materials = await Material.find().lean();
    const map: Record<string, { pointsPerKg: number; isActive: boolean; name: string }> = {};

    materials.forEach((m) => {
      map[m.key.toLowerCase().trim()] = {
        pointsPerKg: m.pointsPerKg,
        isActive: m.isActive,
        name: m.name,
      };
    });

    cachedMaterialsMap = map;
    lastCacheTime = now;
    return map;
  } catch (error) {
    console.error('[getCachedMaterialMap error]', error);
    if (cachedMaterialsMap) return cachedMaterialsMap;

    const fallback: Record<string, { pointsPerKg: number; isActive: boolean; name: string }> = {};
    DEFAULT_MATERIALS.forEach((m) => {
      fallback[m.key] = {
        pointsPerKg: m.pointsPerKg,
        isActive: m.isActive,
        name: m.name,
      };
    });
    return fallback;
  }
};

export class MaterialController {
  public async getMaterials(_req: Request, res: Response): Promise<void> {
    try {
      await ensureDefaultMaterials();
      const materials = await Material.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean();
      res.status(200).json({ success: true, data: materials });
    } catch (error: any) {
      console.error('[getMaterials error]', error);
      res.status(500).json({ success: false, error: 'Error al obtener materiales' });
    }
  }

  public async getAllMaterialsAdmin(_req: Request, res: Response): Promise<void> {
    try {
      await ensureDefaultMaterials();
      const materials = await Material.find().sort({ order: 1, createdAt: 1 }).lean();
      res.status(200).json({ success: true, data: materials });
    } catch (error: any) {
      console.error('[getAllMaterialsAdmin error]', error);
      res.status(500).json({ success: false, error: 'Error al obtener lista de materiales' });
    }
  }

  public async createMaterial(req: Request, res: Response): Promise<void> {
    try {
      const { name, key, pointsPerKg, unit, icon, color, bg, description, order } = req.body;

      if (!name || typeof name !== 'string' || !name.trim()) {
        res.status(400).json({ success: false, error: 'El nombre del material es obligatorio' });
        return;
      }

      const parsedPoints = Number(pointsPerKg);
      if (!Number.isFinite(parsedPoints) || parsedPoints <= 0) {
        res.status(400).json({ success: false, error: 'Los puntos por kg deben ser un número positivo' });
        return;
      }

      const generatedKey = (key && typeof key === 'string' && key.trim())
        ? key.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
        : name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');

      if (!generatedKey) {
        res.status(400).json({ success: false, error: 'La clave identificadora no es válida' });
        return;
      }

      const existing = await Material.findOne({ key: generatedKey });
      if (existing) {
        res.status(400).json({ success: false, error: `Ya existe un material con la clave "${generatedKey}"` });
        return;
      }

      const material = await Material.create({
        name: name.trim(),
        key: generatedKey,
        pointsPerKg: Math.round(parsedPoints * 100) / 100,
        unit: unit ? String(unit).trim() : 'kg',
        icon: icon ? String(icon).trim() : 'Recycle',
        color: color ? String(color).trim() : '#10B981',
        bg: bg ? String(bg).trim() : '#D1FAE5',
        description: description ? String(description).trim() : undefined,
        order: Number.isFinite(Number(order)) ? Number(order) : 0,
        isActive: true,
      });

      invalidateMaterialsCache();
      res.status(201).json({ success: true, data: material });
    } catch (error: any) {
      console.error('[createMaterial error]', error);
      res.status(500).json({ success: false, error: error.message || 'Error al crear material' });
    }
  }

  public async updateMaterial(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, error: 'ID de material inválido' });
        return;
      }

      const updates: Partial<IMaterial> = {};
      const { name, pointsPerKg, unit, icon, color, bg, description, isActive, order } = req.body;

      if (name !== undefined) {
        if (typeof name !== 'string' || !name.trim()) {
          res.status(400).json({ success: false, error: 'El nombre no puede estar vacío' });
          return;
        }
        updates.name = name.trim();
      }

      if (pointsPerKg !== undefined) {
        const parsed = Number(pointsPerKg);
        if (!Number.isFinite(parsed) || parsed <= 0) {
          res.status(400).json({ success: false, error: 'Los puntos deben ser un número positivo' });
          return;
        }
        updates.pointsPerKg = Math.round(parsed * 100) / 100;
      }

      if (unit !== undefined) updates.unit = String(unit).trim();
      if (icon !== undefined) updates.icon = String(icon).trim();
      if (color !== undefined) updates.color = String(color).trim();
      if (bg !== undefined) updates.bg = String(bg).trim();
      if (description !== undefined) updates.description = String(description).trim();
      if (isActive !== undefined) updates.isActive = Boolean(isActive);
      if (order !== undefined && Number.isFinite(Number(order))) updates.order = Number(order);

      const updated = await Material.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });
      if (!updated) {
        res.status(404).json({ success: false, error: 'Material no encontrado' });
        return;
      }

      invalidateMaterialsCache();
      res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      console.error('[updateMaterial error]', error);
      res.status(500).json({ success: false, error: error.message || 'Error al actualizar material' });
    }
  }

  public async toggleMaterialStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, error: 'ID de material inválido' });
        return;
      }

      const material = await Material.findById(id);
      if (!material) {
        res.status(404).json({ success: false, error: 'Material no encontrado' });
        return;
      }

      material.isActive = !material.isActive;
      await material.save();

      invalidateMaterialsCache();
      res.status(200).json({ success: true, data: material });
    } catch (error: any) {
      console.error('[toggleMaterialStatus error]', error);
      res.status(500).json({ success: false, error: 'Error al cambiar estado del material' });
    }
  }

  public async deleteMaterial(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, error: 'ID de material inválido' });
        return;
      }

      const deleted = await Material.findByIdAndDelete(id);
      if (!deleted) {
        res.status(404).json({ success: false, error: 'Material no encontrado' });
        return;
      }

      invalidateMaterialsCache();
      res.status(200).json({ success: true, message: 'Material eliminado exitosamente' });
    } catch (error: any) {
      console.error('[deleteMaterial error]', error);
      res.status(500).json({ success: false, error: 'Error al eliminar material' });
    }
  }
}

export const materialController = new MaterialController();
