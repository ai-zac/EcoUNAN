import { notifyUser } from '../services/notification.service';

export interface RankTier {
  id: number;
  name: string;
  minPoints: number;
  maxPoints: number;
  icon: string;
  level: number;
  subtitle: string;
}

export const RANKS: RankTier[] = [
  { id: 1, name: 'Semilla', minPoints: 0, maxPoints: 499, icon: '🌱', level: 1, subtitle: 'Iniciador Verde' },
  { id: 2, name: 'Brote', minPoints: 500, maxPoints: 1499, icon: '🌿', level: 2, subtitle: 'Reciclador Activo' },
  { id: 3, name: 'Planta', minPoints: 1500, maxPoints: 3499, icon: '🪴', level: 3, subtitle: 'Líder Verde' },
  { id: 4, name: 'Árbol', minPoints: 3500, maxPoints: 6999, icon: '🌳', level: 4, subtitle: 'Guardián Ambiental' },
  { id: 5, name: 'Bosque', minPoints: 7000, maxPoints: Infinity, icon: '🌲', level: 5, subtitle: 'Leyenda Ecológica' },
];

export function getRankByPoints(points: number): RankTier {
  const currentPoints = points || 0;
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (currentPoints >= r.minPoints) {
      rank = r;
    }
  }
  return rank;
}

export async function checkAndNotifyRankUpgrade(
  userId: string,
  previousLifetimePoints: number,
  newLifetimePoints: number
): Promise<RankTier | null> {
  const oldRank = getRankByPoints(previousLifetimePoints);
  const newRank = getRankByPoints(newLifetimePoints);

  if (newRank.id > oldRank.id) {
    try {
      await notifyUser(
        userId,
        `¡Subiste de Rango! ${newRank.icon} ${newRank.name}`,
        `¡Felicitaciones! Has alcanzado el rango ${newRank.name} (${newRank.subtitle} · Nivel ${newRank.level}). ¡Tu compromiso ecológico sigue transformando la UNAN! 🏆`
      );
      return newRank;
    } catch (err) {
      console.error('[checkAndNotifyRankUpgrade] Error sending rank notification:', err);
    }
  }
  return null;
}
