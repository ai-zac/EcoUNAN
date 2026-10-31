import { ImageSourcePropType } from 'react-native';

export const SPLASH_THEME: 'vibrant' | 'light' = 'vibrant';

export const ENABLE_CONFETTI = true;
export const ENABLE_POINT_POPS = true;
export const ENABLE_TAGLINE = true;

export const THEMES = {
  vibrant: {
    bgBase: '#1C875D',
    bgBottom: '#147049',
    centerGlow: '#3CC784',
    centerGlowOpacity: 0.45,
    blueGlow: '#378BF6',
    blueGlowOpacity: 0.28,
    warmGlow: '#E49F24',
    warmGlowOpacity: 0.12,
    cardBg: '#FFFFFF',
    cardShadowColor: '#0B4F35',
    cardGlow: '#FFFFFF',
    cardGlowOpacity: 0.35,
    pillBg: '#0F6B46',
    pillText: '#FFFFFF',
    arrowColor: 'rgba(255, 255, 255, 0.70)',
    popBg: '#FFFFFF',
    popText: '#1C875D',
  },
  light: {
    bgBase: '#FFFFFF',
    bgBottom: '#F1F7F3',
    centerGlow: '#26A766',
    centerGlowOpacity: 0.10,
    blueGlow: '#1E71D3',
    blueGlowOpacity: 0.05,
    warmGlow: '#E49F24',
    warmGlowOpacity: 0.04,
    cardBg: '#FFFFFF',
    cardShadowColor: 'rgba(11, 79, 53, 0.08)',
    cardGlow: 'rgba(38, 167, 102, 0.15)',
    cardGlowOpacity: 0.20,
    pillBg: '#E8F5E9',
    pillText: '#1C875D',
    arrowColor: 'rgba(58, 65, 74, 0.60)',
    popBg: '#FFFFFF',
    popText: '#26A766',
  },
};

export const COLORS = {
  bg: '#F8F8FB',
  greenPrimary: '#26A766',
  greenDark: '#1C875D',
  bluePrimary: '#1E71D3',
  orange: '#E49F24',
  textDark: '#3A414A',
  white: '#FFFFFF',
  gold: '#F2B233',
  mint: '#5BE3A0',
  emeraldDeep: '#0B4F35',
};

export const TAGLINE_STEPS = ['Recicla', 'Suma puntos', 'Gana premios'];

export const ENABLE_METRICS = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

export const DURATIONS = {

  logoDelay: 80,
  logoDuration: 320,
  logoSpring: {
    damping: 15,
    stiffness: 150,
    mass: 0.9,
  },

  bgCrossFadeDuration: 380,

  confettiStart: 380,
  confettiDuration: 900,

  cardShineDelay: 1700,
  cardShineDuration: 450,

  pill0Delay: 1000,
  pill1Delay: 1250,
  pill2Delay: 1500,
  pillSpring: {
    damping: 12,
    stiffness: 160,
  },

  pointPop0Delay: 1250,
  pointPop1Delay: 1500,
  pointPop2Delay: 1750,
  pointPopDuration: 900,

  staggerBaseDelay: 420,
  staggerStep: 16,
  staggerJitter: 20,
  entryDuration: 620,
  entryOpacityDuration: 160,
  scaleSpring: {
    damping: 9,
    stiffness: 170,
    mass: 0.7,
  },
  rotateSpring: {
    damping: 12,
    stiffness: 120,
  },

  idleClockDuration: 3600,
  idleGainDelay: 1350,
  idleGainDuration: 400,
  idleAmpMin: 2,
  idleAmpMax: 4,
  idleRotAmp: 2,

  exitDuration: 260,
  exitScale: 1.04,
  totalHoldTimeMs: 3200,

  reduceMotionLogoDuration: 400,
  reduceMotionHoldMs: 900,
};

export function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type IconType =
  | 'can'
  | 'coin'
  | 'droplet'
  | 'gem'
  | 'gift'
  | 'globe'
  | 'medal'
  | 'package'
  | 'plant'
  | 'recycle'
  | 'seedling'
  | 'sparkles'
  | 'star'
  | 'trophy';

export const ICON_ASSETS: Record<IconType, ImageSourcePropType> = {
  can: require('../../../assets/splash/icons/can.webp'),
  coin: require('../../../assets/splash/icons/coin.webp'),
  droplet: require('../../../assets/splash/icons/droplet.webp'),
  gem: require('../../../assets/splash/icons/gem.webp'),
  gift: require('../../../assets/splash/icons/gift.webp'),
  globe: require('../../../assets/splash/icons/globe.webp'),
  medal: require('../../../assets/splash/icons/medal.webp'),
  package: require('../../../assets/splash/icons/package.webp'),
  plant: require('../../../assets/splash/icons/plant.webp'),
  recycle: require('../../../assets/splash/icons/recycle.webp'),
  seedling: require('../../../assets/splash/icons/seedling.webp'),
  sparkles: require('../../../assets/splash/icons/sparkles.webp'),
  star: require('../../../assets/splash/icons/star.webp'),
  trophy: require('../../../assets/splash/icons/trophy.webp'),
};

export const ALL_ICON_TYPES: IconType[] = [
  'can',
  'coin',
  'droplet',
  'gem',
  'gift',
  'globe',
  'medal',
  'package',
  'plant',
  'recycle',
  'seedling',
  'sparkles',
  'star',
  'trophy',
];

export interface ParticleConfig {
  id: string;
  type: IconType;
  tier: 'hero' | 'medium' | 'small';
  size: number;
  restX: number;
  restY: number;
  restRotate: number;
  initialOffsetY: number;
  initialRotateOffset: number;
  delay: number;
  rank: number;
  ampY: number;
  phaseY: number;
  phaseRot: number;
  targetOpacity: number;
}

export interface SplashInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface CardAndPillsBBox {
  cardTop: number;
  cardBottom: number;
  pillsBottom: number;
}

export const PARTICLE_COUNT = 32;

export function generateSplashLayout(
  width: number,
  height: number,
  logoHeight: number = 190,
  insets: SplashInsets = { top: 0, bottom: 0, left: 0, right: 0 },
  seed: number = 20260928
): ParticleConfig[] {
  const rng = mulberry32(seed);

  const logoWidth = Math.min(width * 0.62, 300);
  const cardHeight = logoHeight * 1.32;
  const logoCenterY = height * 0.47;
  const cardTop = logoCenterY - cardHeight / 2;
  const cardBottom = logoCenterY + cardHeight / 2;

  const pillsBottom = cardBottom + 16 + 38;

  const safeTop = Math.max(insets.top, 0);
  const safeBottom = Math.max(insets.bottom, 0);

  const baseTypes = [...ALL_ICON_TYPES, 'recycle', 'globe', 'trophy', 'plant', 'coin', 'gem', 'star', 'seedling'] as IconType[];

  const shuffle = (arr: IconType[]) => {
    const res = [...arr];
    for (let i = res.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const temp = res[i];
      res[i] = res[j];
      res[j] = temp;
    }
    return res;
  };

  const topTypes = shuffle(baseTypes).slice(0, 16);
  const bottomTypes = shuffle(baseTypes).slice(0, 16);

  function generateBand(isTop: boolean, assignedTypes: IconType[]) {

    const rawYMin = isTop ? Math.max(0, safeTop - 6) : pillsBottom + 0.10 * height;
    const rawYMax = isTop ? cardTop - 0.10 * height : height - Math.max(safeBottom, 12);
    const bandHeight = Math.max(30, rawYMax - rawYMin);

    const list: Array<{
      tier: 'hero' | 'medium' | 'small';
      size: number;
      x: number;
      y: number;
      restRotate: number;
      isTop: boolean;
      type: IconType;
      canBleed: boolean;
      targetOpacity: number;
    }> = [];

    list.push({
      tier: 'hero',
      size: width * (0.22 + rng() * 0.02),
      x: width * (0.08 + rng() * 0.08),
      y: isTop
        ? rawYMin + Math.pow(rng(), 1.5) * bandHeight
        : rawYMax - Math.pow(rng(), 1.5) * bandHeight,
      restRotate: (rng() - 0.5) * 16,
      isTop,
      type: assignedTypes[0],
      canBleed: false,
      targetOpacity: 1.0,
    });

    list.push({
      tier: 'hero',
      size: width * (0.22 + rng() * 0.02),
      x: width * (0.84 + rng() * 0.08),
      y: isTop
        ? rawYMin + Math.pow(rng(), 1.5) * bandHeight
        : rawYMax - Math.pow(rng(), 1.5) * bandHeight,
      restRotate: (rng() - 0.5) * 16,
      isTop,
      type: assignedTypes[1],
      canBleed: false,
      targetOpacity: 1.0,
    });

    for (let i = 0; i < 6; i++) {
      const isBleeder = i === 0;
      let xPos: number;
      if (isBleeder) {
        xPos = -0.02 * width + rng() * 0.04 * width;
      } else {
        const colX = width * (0.18 + ((i - 1 + 0.5) / 5) * 0.64);
        xPos = colX + (rng() - 0.5) * 0.06 * width;
      }

      list.push({
        tier: 'medium',
        size: width * (0.14 + rng() * 0.03),
        x: xPos,
        y: isTop
          ? rawYMin + Math.pow(rng(), 1.5) * bandHeight
          : rawYMax - Math.pow(rng(), 1.5) * bandHeight,
        restRotate: (rng() - 0.5) * 20,
        isTop,
        type: assignedTypes[2 + i],
        canBleed: isBleeder,
        targetOpacity: 1.0,
      });
    }

    for (let i = 0; i < 8; i++) {
      const isBleeder = i === 0;
      let xPos: number;
      if (isBleeder) {
        xPos = width * 0.98 + rng() * 0.04 * width;
      } else {
        const colX = width * (0.10 + ((i - 1 + 0.5) / 7) * 0.80);
        xPos = colX + (rng() - 0.5) * 0.05 * width;
      }

      list.push({
        tier: 'small',
        size: width * (0.09 + rng() * 0.02),
        x: xPos,
        y: isTop
          ? rawYMin + Math.pow(rng(), 1.5) * bandHeight
          : rawYMax - Math.pow(rng(), 1.5) * bandHeight,
        restRotate: (rng() - 0.5) * 20,
        isTop,
        type: assignedTypes[8 + i],
        canBleed: isBleeder,
        targetOpacity: 0.85,
      });
    }

    for (let iter = 0; iter < 40; iter++) {
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const p1 = list[i];
          const p2 = list[j];
          const r1 = p1.size / 2;
          const r2 = p2.size / 2;
          const minDist = 0.85 * (r1 + r2);
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < minDist && dist > 0.001) {
            const overlap = minDist - dist;
            const nx = dx / dist;
            const ny = dy / dist;
            const push = 0.5 * overlap;
            const w1 = r2 / (r1 + r2);
            const w2 = r1 / (r1 + r2);

            p1.x += nx * push * w1;
            p1.y += ny * push * w1;
            p2.x -= nx * push * w2;
            p2.y -= ny * push * w2;

            p1.x = p1.canBleed
              ? Math.max(-0.04 * width, Math.min(1.04 * width, p1.x))
              : Math.max(r1 + 2, Math.min(width - r1 - 2, p1.x));

            p2.x = p2.canBleed
              ? Math.max(-0.04 * width, Math.min(1.04 * width, p2.x))
              : Math.max(r2 + 2, Math.min(width - r2 - 2, p2.x));

            const p1MaxY = isTop ? cardTop - 0.10 * height - r1 : rawYMax - r1;
            const p1MinY = isTop ? rawYMin + r1 : pillsBottom + 0.10 * height + r1;
            const p2MaxY = isTop ? cardTop - 0.10 * height - r2 : rawYMax - r2;
            const p2MinY = isTop ? rawYMin + r2 : pillsBottom + 0.10 * height + r2;

            p1.y = Math.max(p1MinY, Math.min(p1MaxY, p1.y));
            p2.y = Math.max(p2MinY, Math.min(p2MaxY, p2.y));
          }
        }
      }
    }

    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      const r = p.size / 2;

      if (isTop) {
        const isNearNotchCenter = Math.abs(p.x - width * 0.5) < 0.28 * width;
        if (isNearNotchCenter && safeTop > 0) {
          if (p.y < safeTop + r + 6) p.y = safeTop + r + 6;
        }
        const topLimit = cardTop - 0.10 * height - r;
        if (p.y > topLimit) p.y = topLimit;
      } else {
        if (safeBottom > 0) {
          const bottomLimit = height - safeBottom - 4;
          if (p.y > bottomLimit) p.y = bottomLimit;
        }
        const bottomLimit = pillsBottom + 0.10 * height + r;
        if (p.y < bottomLimit) p.y = bottomLimit;
      }

      if (!p.canBleed) {
        if (p.x - r < 0) p.x = r + 2;
        if (p.x + r > width) p.x = width - r - 2;
      }
    }

    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        if (Math.abs(list[i].y - list[j].y) < 3.0) {
          const step = 4 + rng() * 6;
          if (isTop) {
            list[j].y = Math.max(rawYMin + list[j].size / 2, list[j].y - step);
          } else {
            list[j].y = Math.min(rawYMax - list[j].size / 2, list[j].y + step);
          }
        }
      }
    }

    return list;
  }

  const topList = generateBand(true, topTypes);
  const bottomList = generateBand(false, bottomTypes);
  const combined = [...topList, ...bottomList];

  for (let i = 0; i < combined.length; i++) {
    for (let j = i + 1; j < combined.length; j++) {
      if (combined[i].type === combined[j].type) {
        const dx = combined[i].x - combined[j].x;
        const dy = combined[i].y - combined[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 0.30 * width) {
          for (let k = 0; k < combined.length; k++) {
            if (k !== i && k !== j && combined[k].type !== combined[i].type) {
              const temp = combined[j].type;
              combined[j].type = combined[k].type;
              combined[k].type = temp;
              break;
            }
          }
        }
      }
    }
  }

  const ranked = combined.map((p, idx) => {
    const distOuterX = Math.min(Math.abs(p.x), Math.abs(width - p.x));
    const distOuterY = p.isTop ? Math.abs(p.y - safeTop) : Math.abs(height - safeBottom - p.y);
    const borderDist = Math.min(distOuterX, distOuterY);
    return Object.assign({}, p, { borderDist, origIndex: idx });
  });

  ranked.sort((a, b) => a.borderDist - b.borderDist);

  const particles: ParticleConfig[] = ranked.map((p, rank) => {
    const jitter = (rng() - 0.5) * DURATIONS.staggerJitter * 2;
    const delay = Math.max(
      DURATIONS.staggerBaseDelay,
      Math.round(DURATIONS.staggerBaseDelay + rank * DURATIONS.staggerStep + jitter)
    );

    const offsetMagnitude = (0.10 + rng() * 0.05) * height;
    const initialOffsetY = p.isTop ? -offsetMagnitude : offsetMagnitude;
    const initialRotateOffset = (rng() > 0.5 ? 1 : -1) * 30;

    return {
      id: `p-${p.tier}-${rank}-${p.type}`,
      type: p.type,
      tier: p.tier,
      size: p.size,
      restX: p.x,
      restY: p.y,
      restRotate: p.restRotate,
      initialOffsetY,
      initialRotateOffset,
      delay,
      rank,
      ampY: 2 + rng() * 2,
      phaseY: rng(),
      phaseRot: rng(),
      targetOpacity: p.targetOpacity,
    };
  });

  // Z-order: pequeñas al fondo (0), medianas al medio (1), hero al frente (2)
  const tierOrder = { small: 0, medium: 1, hero: 2 };
  particles.sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier]);

  return particles;
}

export interface ConfettiItemConfig {
  id: string;
  shape: 'circle' | 'pill' | 'star';
  color: string;
  size: number;
  targetDist: number;
  angle: number;
  rotateDeg: number;
}

/**
 * 18 partículas de confeti efímeras generadas determinísticamente.
 */
export function generateConfettiItems(width: number, seed: number = 20260928): ConfettiItemConfig[] {
  const rng = mulberry32(seed + 99);
  const colors = ['#FFFFFF', '#E49F24', '#F2B233', '#378BF6', '#5BE3A0'];
  const shapes: Array<'circle' | 'pill' | 'star'> = ['circle', 'pill', 'star'];

  const list: ConfettiItemConfig[] = [];
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * 2 * Math.PI + (rng() - 0.5) * 0.35;
    const targetDist = width * (0.28 + rng() * 0.22); // 0.28 - 0.50W
    list.push({
      id: `confetti-${i}`,
      shape: shapes[i % 3],
      color: colors[i % colors.length],
      size: 6 + rng() * 4, // 6-10px
      targetDist,
      angle,
      rotateDeg: (rng() - 0.5) * 360,
    });
  }
  return list;
}
