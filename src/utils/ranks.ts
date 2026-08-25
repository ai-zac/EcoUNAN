export interface LeagueRank {
  id: number;
  name: string;
  minPoints: number;
  maxPoints: number;
  icon: string;
  color: string;
}

export const LEAGUES: LeagueRank[] = [
  { id: 1, name: 'Semilla', minPoints: 0, maxPoints: 499, icon: '🌱', color: '#8B5A2B' }, 
  { id: 2, name: 'Brote', minPoints: 500, maxPoints: 1499, icon: '🌿', color: '#84CC16' },  
  { id: 3, name: 'Planta', minPoints: 1500, maxPoints: 3499, icon: '🪴', color: '#22C55E' }, 
  { id: 4, name: 'Árbol', minPoints: 3500, maxPoints: 6999, icon: '🌳', color: '#16A34A' }, 
  { id: 5, name: 'Bosque', minPoints: 7000, maxPoints: Infinity, icon: '🌲', color: '#047857' }, 
];

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
    progressPercentage = (pointsInCurrentTier / tierTotalPoints) * 100;
    pointsNeeded = nextRank.minPoints - currentPoints;
  }

  return {
    currentRank,
    nextRank,
    progressPercentage,
    pointsNeeded,
    totalPoints: currentPoints
  };
};
