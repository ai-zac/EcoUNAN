export interface LeagueRank {
  id: number;
  name: string;
  minPoints: number;
  maxPoints: number;
  icon: string;
  color: string;
  level: number;
  subtitle: string;
  description: string;
  perk: string;
}

export const LEAGUES: LeagueRank[] = [
  {
    id: 1,
    name: 'Semilla',
    minPoints: 0,
    maxPoints: 499,
    icon: '🌱',
    color: '#8B5A2B',
    level: 1,
    subtitle: 'Iniciador Verde',
    description: 'El inicio de tu camino. Cada semilla sembrada despierta conciencia ecológica en el campus.',
    perk: 'Acceso básico al catálogo de recompensas',
  },
  {
    id: 2,
    name: 'Brote',
    minPoints: 500,
    maxPoints: 1499,
    icon: '🌿',
    color: '#84CC16',
    level: 2,
    subtitle: 'Reciclador Activo',
    description: 'Tus acciones comienzan a germinar y generan un impacto tangible en la comunidad universitaria.',
    perk: 'Insignia Brote Verde en perfil y eventos',
  },
  {
    id: 3,
    name: 'Planta',
    minPoints: 1500,
    maxPoints: 3499,
    icon: '🪴',
    color: '#22C55E',
    level: 3,
    subtitle: 'Líder Verde',
    description: 'Un compromiso sólido que florece y motiva a tus compañeros hacia la sostenibilidad activa.',
    perk: 'Acceso a sorteos mensuales y retos de reciclaje',
  },
  {
    id: 4,
    name: 'Árbol',
    minPoints: 3500,
    maxPoints: 6999,
    icon: '🌳',
    color: '#16A34A',
    level: 4,
    subtitle: 'Guardián Ambiental',
    description: 'Un pilar de ecología con raíces firmes y una huella verde admirable y transformadora.',
    perk: 'Prioridad de canje en premios exclusivos',
  },
  {
    id: 5,
    name: 'Bosque',
    minPoints: 7000,
    maxPoints: Infinity,
    icon: '🌲',
    color: '#047857',
    level: 5,
    subtitle: 'Leyenda Ecológica',
    description: 'El máximo honor: un ecosistema vivo de liderazgo verde que transforma el campus y la sociedad.',
    perk: 'Distinción Honorífica EcoUNAN y Avatar Leyenda',
  },
];

export const RANKS = LEAGUES;

export const getUserRank = (lifetimePoints: number) => {
  const currentPoints = lifetimePoints || 0;
  
  let currentRankIndex = 0;
  for (let i = 0; i < LEAGUES.length; i++) {
    if (currentPoints >= LEAGUES[i].minPoints) {
      currentRankIndex = i;
    }
  }
  
  const currentRank = LEAGUES[currentRankIndex];
  const nextRank = currentRankIndex < LEAGUES.length - 1 ? LEAGUES[currentRankIndex + 1] : null;
  
  let progressPercentage = 100;
  let pointsNeeded = 0;
  
  if (nextRank) {
    const pointsInCurrentTier = currentPoints - currentRank.minPoints;
    const tierTotalPoints = nextRank.minPoints - currentRank.minPoints;
    progressPercentage = Math.min(100, Math.max(0, Math.round((pointsInCurrentTier / tierTotalPoints) * 100)));
    pointsNeeded = Math.max(0, nextRank.minPoints - currentPoints);
  }

  return {
    currentRank,
    nextRank,
    progressPercentage,
    pointsNeeded,
    totalPoints: currentPoints,
    isMaxRank: !nextRank,
  };
};
