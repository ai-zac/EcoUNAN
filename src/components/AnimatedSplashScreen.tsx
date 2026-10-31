import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Image,
  ImageSourcePropType,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Animated, {
  cancelAnimation,
  Easing,
  SharedValue,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import {
  COLORS,
  ConfettiItemConfig,
  DURATIONS,
  ENABLE_CONFETTI,
  ENABLE_METRICS,
  ENABLE_POINT_POPS,
  ENABLE_TAGLINE,
  generateConfettiItems,
  generateSplashLayout,
  ICON_ASSETS,
  ParticleConfig,
  SPLASH_THEME,
  TAGLINE_STEPS,
  THEMES,
} from './splash/constants';

interface ParticleItemProps {
  config: ParticleConfig;
  time: SharedValue<number>;
  idleGain: SharedValue<number>;
}

const ParticleItem = React.memo<ParticleItemProps>(({ config, time, idleGain }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(config.initialOffsetY);
  const scale = useSharedValue(0.5);
  const rotate = useSharedValue(config.restRotate + config.initialRotateOffset);

  useEffect(() => {
    opacity.value = withDelay(
      config.delay,
      withTiming(config.targetOpacity, {
        duration: DURATIONS.entryOpacityDuration,
        easing: Easing.out(Easing.quad),
      })
    );

    translateY.value = withDelay(
      config.delay,
      withTiming(0, {
        duration: DURATIONS.entryDuration,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      })
    );

    scale.value = withDelay(config.delay, withSpring(1, DURATIONS.scaleSpring));

    rotate.value = withDelay(
      config.delay,
      withSpring(config.restRotate, DURATIONS.rotateSpring)
    );
  }, [config.delay, config.restRotate, config.targetOpacity]);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const floatY =
      Math.sin(2 * Math.PI * (time.value + config.phaseY)) * config.ampY * idleGain.value;
    const floatRot =
      Math.sin(2 * Math.PI * (time.value + config.phaseRot)) *
      DURATIONS.idleRotAmp *
      idleGain.value;

    return {
      opacity: opacity.value,
      transform: [
        { translateX: config.restX - config.size / 2 },
        { translateY: config.restY - config.size / 2 + translateY.value + floatY },
        { scale: scale.value },
        { rotate: `${rotate.value + floatRot}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 0,
          top: 0,
          width: config.size,
          height: config.size,
          alignItems: 'center',
          justifyContent: 'center',
        },
        animatedStyle,
      ]}
    >
      <Image
        source={ICON_ASSETS[config.type]}
        resizeMode="contain"
        fadeDuration={0}
        style={{ width: config.size, height: config.size }}
      />
    </Animated.View>
  );
});

/**
 * Partícula efímera de confeti (18 piezas al aterrizar el logo).
 */
const ConfettiItem = React.memo<{
  item: ConfettiItemConfig;
  centerX: number;
  centerY: number;
  progress: SharedValue<number>;
}>(({ item, centerX, centerY, progress }) => {
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const p = progress.value;
    const dist = item.targetDist * p;
    const currentX = centerX + dist * Math.cos(item.angle) - item.size / 2;
    const currentY = centerY + dist * Math.sin(item.angle) - item.size / 2;
    const rot = item.rotateDeg * p;

    // Opacidad 1->0 en el último 40% (p >= 0.6)
    const op = p < 0.6 ? 1 : Math.max(0, 1 - (p - 0.6) / 0.4);

    return {
      opacity: op,
      transform: [
        { translateX: currentX },
        { translateY: currentY },
        { rotate: `${rot}deg` },
        { scale: p < 0.2 ? p / 0.2 : 1 },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: 0,
          top: 0,
          width: item.size,
          height: item.size,
          alignItems: 'center',
          justifyContent: 'center',
        },
        animatedStyle,
      ]}
    >
      {item.shape === 'circle' && (
        <View
          style={{
            width: item.size,
            height: item.size,
            borderRadius: item.size / 2,
            backgroundColor: item.color,
          }}
        />
      )}
      {item.shape === 'pill' && (
        <View
          style={{
            width: item.size * 1.5,
            height: item.size * 0.7,
            borderRadius: 3,
            backgroundColor: item.color,
          }}
        />
      )}
      {item.shape === 'star' && (
        <Svg width={item.size} height={item.size} viewBox="0 0 24 24">
          <Path
            d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z"
            fill={item.color}
          />
        </Svg>
      )}
    </Animated.View>
  );
});

/**
 * Badge "+10" flotante efímero cerca de las esquinas de la tarjeta.
 */
const PointPopBadge = React.memo<{
  text: string;
  x: number;
  y: number;
  delay: number;
  textColor: string;
  bgColor: string;
}>(({ text, x, y, delay, textColor, bgColor }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0.6);

  useEffect(() => {
    // 1. Escala con spring pop
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 11, stiffness: 180, mass: 0.8 })
    );

    // 2. Desplazamiento vertical hacia arriba (0.06H ~ 50px)
    translateY.value = withDelay(
      delay,
      withTiming(-48, { duration: DURATIONS.pointPopDuration, easing: Easing.out(Easing.quad) })
    );

    // 3. Opacidad: aparece instantáneamente, se mantiene, y en el último 45% (después de 500ms) se desvanece
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 120, easing: Easing.out(Easing.quad) })
    );
    opacity.value = withDelay(
      delay + 500,
      withTiming(0, { duration: 400, easing: Easing.in(Easing.quad) })
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: x }, { translateY: y + translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: 0,
          top: 0,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 999,
          backgroundColor: bgColor,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.4)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        animatedStyle,
      ]}
    >
      <Text
        style={{
          color: textColor,
          fontWeight: '900',
          fontSize: 13,
          letterSpacing: 0.2,
        }}
      >
        {text}
      </Text>
    </Animated.View>
  );
});

/**
 * Píldora individual de propuesta de valor ("Recicla", "Suma puntos", "Gana premios").
 */
const TaglinePill = React.memo<{
  text: string;
  delay: number;
  bgColor: string;
  textColor: string;
  fontSize: number;
}>(({ text, delay, bgColor, textColor, fontSize }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);
  const scale = useSharedValue(0.85);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 280, easing: Easing.out(Easing.quad) })
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: 280, easing: Easing.out(Easing.quad) })
    );
    scale.value = withDelay(delay, withSpring(1, DURATIONS.pillSpring));
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          backgroundColor: bgColor,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 999,
          marginHorizontal: 3,
          marginVertical: 3,
        },
        animatedStyle,
      ]}
    >
      <Text
        style={{
          color: textColor,
          fontWeight: '800',
          fontSize,
          letterSpacing: 0.4,
        }}
      >
        {text}
      </Text>
    </Animated.View>
  );
});

export interface AnimatedSplashScreenProps {
  onFinish: () => void;
  logoSource?: ImageSourcePropType;
  /** Duración total opcional de permanencia antes de iniciar salida (default 3200ms en PASADA 3+) */
  totalHoldTimeMs?: number;
  /** Tagline opcional bajo el logo (si se omite y ENABLE_TAGLINE=true, muestra TAGLINE_STEPS) */
  tagline?: string;
}

export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({
  onFinish,
  logoSource = require('../../assets/images/ecounan_logo_transparent.png'),
  totalHoldTimeMs = DURATIONS.totalHoldTimeMs,
  tagline,
}) => {
  const { width, height } = useWindowDimensions();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [confettiActive, setConfettiActive] = useState(ENABLE_CONFETTI);

  const insets = useSafeAreaInsets();
  const theme = THEMES[SPLASH_THEME];

  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const isMounted = useRef(true);
  const hasHiddenSplashRef = useRef(false);

  const handleRootLayout = useCallback(() => {
    if (!hasHiddenSplashRef.current) {
      hasHiddenSplashRef.current = true;
      SplashScreen.hideAsync().catch(() => {});
    }
  }, []);

  // Proporción y dimensiones reales del logo
  const sourceInfo = Image.resolveAssetSource(logoSource);
  const aspectRatio =
    sourceInfo && sourceInfo.width && sourceInfo.height
      ? sourceInfo.width / sourceInfo.height
      : 438 / 390;

  const logoWidth = Math.min(width * 0.58, 280);
  const logoHeight = logoWidth / aspectRatio;
  const logoCenterY = height * 0.47;

  // Tarjeta blanca del logo: ancho = logoWidth*1.3, alto = logoHeight*1.32, radio = ancho*0.14
  const cardWidth = logoWidth * 1.30;
  const cardHeight = logoHeight * 1.32;
  const cardRadius = cardWidth * 0.14;
  const cardLeft = (width - cardWidth) / 2;
  const cardTop = logoCenterY - cardHeight / 2;

  // Layout determinista de 32 partículas (16 arriba / 16 abajo)
  const particles = useMemo(
    () => generateSplashLayout(width, height, logoHeight, insets),
    [width, height, logoHeight, insets]
  );

  // 18 confetis efímeros
  const confettiItems = useMemo(
    () => generateConfettiItems(width),
    [width]
  );

  // Shared Values del contenedor y Fondo
  const containerOpacity = useSharedValue(1);
  const bgOpacity = useSharedValue(0);

  // Shared Values del conjunto Logo + Tarjeta
  const cardScale = useSharedValue(0.85);
  const cardOpacity = useSharedValue(0);

  // Brillo diagonal sobre la tarjeta a ~1700ms
  const shineTranslateX = useSharedValue(-cardWidth * 1.2);

  // Confeti progress (0 -> 1 en 900ms a los 380ms)
  const confettiProgress = useSharedValue(0);

  // Un único reloj compartido para el flotado idle
  const time = useSharedValue(0);
  const idleGain = useSharedValue(0);

  // Medidor de FPS
  const frameCount = useSharedValue(0);
  const totalTime = useSharedValue(0);
  const framesOver20 = useSharedValue(0);
  const framesOver34 = useSharedValue(0);

  useFrameCallback((frameInfo) => {
    'worklet';
    if (!ENABLE_METRICS) return;
    const dt = frameInfo.timeSincePreviousFrame;
    if (dt === null || dt === undefined || dt <= 0) return;
    frameCount.value += 1;
    totalTime.value += dt;
    if (dt > 20) framesOver20.value += 1;
    if (dt > 34) framesOver34.value += 1;
  });

  useEffect(() => {
    isMounted.current = true;

    let exitTimer: ReturnType<typeof setTimeout> | null = null;
    let finishTimer: ReturnType<typeof setTimeout> | null = null;
    let confettiTimer: ReturnType<typeof setTimeout> | null = null;

    // 1. Cross-fade del fondo multicromático en 380ms desde el frame 0 (#F8F8FB)
    bgOpacity.value = withTiming(1, { duration: DURATIONS.bgCrossFadeDuration });

    // 2. Entrada del wrapper Logo + Tarjeta con resorte ágil (80-620ms)
    cardOpacity.value = withDelay(
      DURATIONS.logoDelay,
      withTiming(1, { duration: DURATIONS.logoDuration, easing: Easing.out(Easing.quad) })
    );
    cardScale.value = withDelay(
      DURATIONS.logoDelay,
      withSpring(1, DURATIONS.logoSpring)
    );

    // 3. Estallido de confeti al aterrizar el logo (a los 380ms, dura 900ms)
    if (ENABLE_CONFETTI) {
      confettiProgress.value = withDelay(
        DURATIONS.confettiStart,
        withTiming(1, { duration: DURATIONS.confettiDuration, easing: Easing.out(Easing.cubic) })
      );

      // Desmontar el confeti al terminar para liberar memoria
      confettiTimer = setTimeout(() => {
        if (isMounted.current) setConfettiActive(false);
      }, DURATIONS.confettiStart + DURATIONS.confettiDuration + 50);
    }

    // 4. Brillo diagonal sobre la tarjeta blanca a ~1700ms
    shineTranslateX.value = withDelay(
      DURATIONS.cardShineDelay,
      withTiming(cardWidth * 1.6, {
        duration: DURATIONS.cardShineDuration,
        easing: Easing.inOut(Easing.quad),
      })
    );

    // 5. Reloj idle continuo y rampa de oscilación
    time.value = withRepeat(
      withTiming(1, { duration: DURATIONS.idleClockDuration, easing: Easing.linear }),
      -1,
      false
    );
    idleGain.value = withDelay(
      DURATIONS.idleGainDelay,
      withTiming(1, { duration: DURATIONS.idleGainDuration, easing: Easing.inOut(Easing.quad) })
    );

    // Helper de salida y disparo de onFinish
    const triggerExit = (duration: number) => {
      containerOpacity.value = withTiming(0, {
        duration,
        easing: Easing.in(Easing.quad),
      });
      cardScale.value = withTiming(DURATIONS.exitScale, {
        duration,
        easing: Easing.in(Easing.quad),
      });

      finishTimer = setTimeout(() => {
        if (!isMounted.current) return;

        if (ENABLE_METRICS) {
          const count = frameCount.value;
          const total = totalTime.value;
          const avgFps = count > 0 && total > 0 ? (count / (total / 1000)).toFixed(1) : '120.0';
          console.log(`[AnimatedSplashScreen] Performance Report:
- Avg FPS: ${avgFps}
- Frames > 20ms: ${framesOver20.value}
- Frames > 34ms: ${framesOver34.value}
- Total Frames Measured: ${count}`);
        }

        try {
          onFinishRef.current?.();
        } catch (err) {
          console.error('[AnimatedSplashScreen] onFinish error:', err);
        }
      }, duration);
    };

    // Salida estándar al alcanzar totalHoldTimeMs (3200ms)
    exitTimer = setTimeout(() => {
      if (!isMounted.current) return;
      triggerExit(DURATIONS.exitDuration);
    }, totalHoldTimeMs);

    // 6. Reduce Motion
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (!isMounted.current) return;
        if (enabled) {
          cancelAnimation(time);
          cancelAnimation(idleGain);
          cancelAnimation(confettiProgress);

          setReduceMotion(true);
          setConfettiActive(false);

          cardOpacity.value = withTiming(1, { duration: DURATIONS.reduceMotionLogoDuration });
          cardScale.value = 1;

          if (exitTimer) clearTimeout(exitTimer);
          exitTimer = setTimeout(() => {
            if (!isMounted.current) return;
            triggerExit(DURATIONS.exitDuration);
          }, DURATIONS.reduceMotionLogoDuration + DURATIONS.reduceMotionHoldMs);
        }
      })
      .catch(() => {});

    return () => {
      isMounted.current = false;
      if (exitTimer) clearTimeout(exitTimer);
      if (finishTimer) clearTimeout(finishTimer);
      if (confettiTimer) clearTimeout(confettiTimer);
    };
  }, [totalHoldTimeMs]);

  // Estilo animado de fondo (cross-fade 380ms)
  const bgAnimatedStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  // Estilos animados del wrapper Logo + Tarjeta
  const cardWrapperAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const cardShineAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: '25deg' },
      { translateX: shineTranslateX.value },
    ],
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  // Dimensiones del resplandor blanco radial detrás de la tarjeta
  const glowWidth = cardWidth * 1.55;
  const glowHeight = cardHeight * 1.45;

  // Tamaño de fuente de las píldoras de propuesta de valor
  const pillFontSize = Math.min(width * 0.038, 15);

  return (
    <View
      onLayout={handleRootLayout}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: COLORS.bg,
      }}
    >

      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
          },
          bgAnimatedStyle,
        ]}
      >
        <Svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0 }}>
          <Defs>

            <LinearGradient id="bgBaseGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={theme.bgBase} stopOpacity="1" />
              <Stop offset="100%" stopColor={theme.bgBottom} stopOpacity="1" />
            </LinearGradient>

            <RadialGradient
              id="bgCenterGlow"
              cx="50%"
              cy={`${(logoCenterY / height) * 100}%`}
              rx="55%"
              ry="55%"
              fx="50%"
              fy={`${(logoCenterY / height) * 100}%`}
            >
              <Stop offset="0%" stopColor={theme.centerGlow} stopOpacity={theme.centerGlowOpacity} />
              <Stop offset="100%" stopColor={theme.centerGlow} stopOpacity="0" />
            </RadialGradient>

            <RadialGradient id="bgBlueGlow" cx="85%" cy="85%" rx="60%" ry="60%">
              <Stop offset="0%" stopColor={theme.blueGlow} stopOpacity={theme.blueGlowOpacity} />
              <Stop offset="100%" stopColor={theme.blueGlow} stopOpacity="0" />
            </RadialGradient>

            <RadialGradient id="bgWarmGlow" cx="15%" cy="15%" rx="60%" ry="60%">
              <Stop offset="0%" stopColor={theme.warmGlow} stopOpacity={theme.warmGlowOpacity} />
              <Stop offset="100%" stopColor={theme.warmGlow} stopOpacity="0" />
            </RadialGradient>
          </Defs>

          <Rect x="0" y="0" width={width} height={height} fill="url(#bgBaseGradient)" />
          <Rect x="0" y="0" width={width} height={height} fill="url(#bgCenterGlow)" />
          <Rect x="0" y="0" width={width} height={height} fill="url(#bgBlueGlow)" />
          <Rect x="0" y="0" width={width} height={height} fill="url(#bgWarmGlow)" />
        </Svg>
      </Animated.View>

      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            overflow: 'hidden',
          },
          containerAnimatedStyle,
        ]}
      >

        <Svg
          width={glowWidth}
          height={glowHeight}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: (width - glowWidth) / 2,
            top: logoCenterY - glowHeight / 2,
          }}
        >
          <Defs>
            <RadialGradient id="cardGlowPulse" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor={theme.cardGlow} stopOpacity={theme.cardGlowOpacity} />
              <Stop offset="100%" stopColor={theme.cardGlow} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Ellipse
            cx={glowWidth / 2}
            cy={glowHeight / 2}
            rx={glowWidth / 2}
            ry={glowHeight / 2}
            fill="url(#cardGlowPulse)"
          />
        </Svg>

        {!reduceMotion &&
          particles.map((p) => (
            <ParticleItem key={p.id} config={p} time={time} idleGain={idleGain} />
          ))}

        {!reduceMotion &&
          confettiActive &&
          confettiItems.map((item) => (
            <ConfettiItem
              key={item.id}
              item={item}
              centerX={width / 2}
              centerY={logoCenterY}
              progress={confettiProgress}
            />
          ))}

        <Animated.View
          style={[
            {
              position: 'absolute',
              left: cardLeft,
              top: cardTop,
              width: cardWidth,
              height: cardHeight,
              alignItems: 'center',
              justifyContent: 'center',
            },
            cardWrapperAnimatedStyle,
          ]}
        >

          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: -12,
              top: -12 + height * 0.012,
              width: cardWidth + 24,
              height: cardHeight + 24,
              borderRadius: cardRadius + 12,
              backgroundColor: theme.cardShadowColor,
              opacity: 0.04,
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: -8,
              top: -8 + height * 0.012,
              width: cardWidth + 16,
              height: cardHeight + 16,
              borderRadius: cardRadius + 8,
              backgroundColor: theme.cardShadowColor,
              opacity: 0.07,
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: -4,
              top: -4 + height * 0.012,
              width: cardWidth + 8,
              height: cardHeight + 8,
              borderRadius: cardRadius + 4,
              backgroundColor: theme.cardShadowColor,
              opacity: 0.10,
            }}
          />

          <View
            style={{
              width: cardWidth,
              height: cardHeight,
              borderRadius: cardRadius,
              backgroundColor: theme.cardBg,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >

            <Image
              source={logoSource}
              resizeMode="contain"
              fadeDuration={0}
              style={{ width: logoWidth, height: logoHeight }}
            />

            {!reduceMotion && (
              <Animated.View
                pointerEvents="none"
                style={[
                  {
                    position: 'absolute',
                    top: -cardHeight * 0.5,
                    left: 0,
                    width: 32,
                    height: cardHeight * 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.45)',
                  },
                  cardShineAnimatedStyle,
                ]}
              />
            )}
          </View>
        </Animated.View>

        {!reduceMotion && ENABLE_POINT_POPS && (
          <>
            <PointPopBadge
              text="+10"
              x={cardLeft + cardWidth - 14}
              y={cardTop - 10}
              delay={DURATIONS.pointPop0Delay}
              textColor={theme.popText}
              bgColor={theme.popBg}
            />
            <PointPopBadge
              text="+10"
              x={cardLeft - 18}
              y={cardTop + 24}
              delay={DURATIONS.pointPop1Delay}
              textColor={theme.popText}
              bgColor={theme.popBg}
            />
            <PointPopBadge
              text="+10"
              x={cardLeft + cardWidth - 18}
              y={cardTop + cardHeight - 20}
              delay={DURATIONS.pointPop2Delay}
              textColor={theme.popText}
              bgColor={theme.popBg}
            />
          </>
        )}

        {ENABLE_TAGLINE && (
          <View
            style={{
              position: 'absolute',
              left: 16,
              right: 16,
              top: cardTop + cardHeight + 16,
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {tagline ? (
              <View
                style={{
                  backgroundColor: theme.pillBg,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 999,
                }}
              >
                <Text
                  style={{
                    color: theme.pillText,
                    fontWeight: '800',
                    fontSize: pillFontSize,
                    letterSpacing: 0.3,
                  }}
                >
                  {tagline}
                </Text>
              </View>
            ) : (
              <>
                <TaglinePill
                  text={TAGLINE_STEPS[0]}
                  delay={reduceMotion ? 0 : DURATIONS.pill0Delay}
                  bgColor={theme.pillBg}
                  textColor={theme.pillText}
                  fontSize={pillFontSize}
                />
                <Text
                  style={{
                    color: theme.arrowColor,
                    fontSize: 14,
                    fontWeight: '900',
                    marginHorizontal: 3,
                  }}
                >
                  →
                </Text>
                <TaglinePill
                  text={TAGLINE_STEPS[1]}
                  delay={reduceMotion ? 0 : DURATIONS.pill1Delay}
                  bgColor={theme.pillBg}
                  textColor={theme.pillText}
                  fontSize={pillFontSize}
                />
                <Text
                  style={{
                    color: theme.arrowColor,
                    fontSize: 14,
                    fontWeight: '900',
                    marginHorizontal: 3,
                  }}
                >
                  →
                </Text>
                <TaglinePill
                  text={TAGLINE_STEPS[2]}
                  delay={reduceMotion ? 0 : DURATIONS.pill2Delay}
                  bgColor={theme.pillBg}
                  textColor={theme.pillText}
                  fontSize={pillFontSize}
                />
              </>
            )}
          </View>
        )}
      </Animated.View>
    </View>
  );
};
