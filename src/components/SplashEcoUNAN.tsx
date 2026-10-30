import React, { useEffect, useRef } from 'react';
import {
  Dimensions,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Animated, {
  Easing,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Ellipse,
  Path,
  Rect,
} from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const CORNER_DIST_X = width * 0.38;
const CORNER_DIST_Y = height * 0.33;

const TEXT_FADE_DURATION = 600;

const LOGO_SPRING_START = 600;

const COLOR_AWAKENING_START = 700;
const COLOR_AWAKENING_DURATION = 400;

const SUCTION_START = 1200;
const SUCTION_DURATION = 700;

const COLLISION_TIME = 1900;
const SHOCKWAVE_DURATION = 500;
const SPARKS_DURATION = 400;

const TRANSITION_TIME = 2500;

const RecyclingBottleIcon = ({ size = 44, color = '#64748B' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="9" y="2" width="6" height="2.5" rx="1" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path
      d="M10 4.5V7L7.5 10V20C7.5 21.1 8.4 22 9.5 22H14.5C15.6 22 16.5 21.1 16.5 20V10L14 7V4.5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M7.5 13H16.5" stroke={color} strokeWidth="1.8" strokeDasharray="2 2" strokeLinecap="round" />
    <Path d="M7.5 17H16.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

const RecyclingLeafIcon = ({ size = 44, color = '#64748B' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 20C17 20 22 15 22 9C22 5 19 2 15 2C9 2 4 7 4 13C4 17 7 20 11 20Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M2 22C4 20 8 16 11 13" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M11 13L16 8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

const RecyclingBoxIcon = ({ size = 44, color = '#64748B' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M12 12L20 7.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 12V21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 12L4 7.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M8 5.5L16 10" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
  </Svg>
);

const RecyclingCanIcon = ({ size = 44, color = '#64748B' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Ellipse cx="12" cy="5" rx="6.5" ry="2.8" stroke={color} strokeWidth="2" />
    <Path
      d="M5.5 5V19C5.5 20.55 8.41 21.8 12 21.8C15.59 21.8 18.5 20.55 18.5 19V5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M5.5 12C5.5 13.55 8.41 14.8 12 14.8C15.59 14.8 18.5 13.55 18.5 12" stroke={color} strokeWidth="1.8" strokeDasharray="2 2" />
    <Path d="M12 4.2V5.8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

const ChameleonIcon: React.FC<{
  IconComponent: React.ComponentType<{ size?: number; color?: string }>;
  vividColor: string;
  size?: number;
  awakeningOpacity: SharedValue<number>;
}> = ({ IconComponent, vividColor, size = 44, awakeningOpacity }) => {
  const animatedGrey = useAnimatedStyle(() => ({
    opacity: 1 - awakeningOpacity.value,
  }));
  const animatedColor = useAnimatedStyle(() => ({
    opacity: awakeningOpacity.value,
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute' }, animatedGrey]}>
        <IconComponent size={size} color="#64748B" />
      </Animated.View>
      <Animated.View style={[{ position: 'absolute' }, animatedColor]}>
        <IconComponent size={size} color={vividColor} />
      </Animated.View>
    </View>
  );
};

const TRICOLOR_SPARKS = [
  { angleDeg: 30, color: '#F59E0B', distance: 62 },
  { angleDeg: 90, color: '#22C55E', distance: 68 },
  { angleDeg: 150, color: '#3B82F6', distance: 64 },
  { angleDeg: 210, color: '#F59E0B', distance: 62 },
  { angleDeg: 270, color: '#22C55E', distance: 68 },
  { angleDeg: 330, color: '#3B82F6', distance: 64 },
];

const SparkItem = React.memo<{
  angleDeg: number;
  color: string;
  distance: number;
  progress: SharedValue<number>;
  opacity: SharedValue<number>;
}>(({ angleDeg, color, distance, progress, opacity }) => {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const animatedStyle = useAnimatedStyle(() => {
    const currentDist = distance * progress.value;
    return {
      opacity: opacity.value,
      transform: [
        { translateX: currentDist * cos },
        { translateY: currentDist * sin },
        { rotate: `${angleDeg}deg` },
        { scaleX: Math.max(0.35, progress.value) },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: 14,
          height: 3.5,
          borderRadius: 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
});

export interface SplashEcoUNANProps {
  onAnimationComplete?: () => void;
  onFinish?: () => void;
  /** Asset de imagen que contiene ÚNICAMENTE el símbolo del hexágono */
  logoSource?: ImageSourcePropType;
}

const SplashEcoUNAN: React.FC<SplashEcoUNANProps> = ({
  onAnimationComplete,
  onFinish,
  logoSource = require('../../assets/images/ecounan_hexagon_symbol.png'),
}) => {
  const completionCallback = onAnimationComplete || onFinish;
  const callbackRef = useRef(completionCallback);
  callbackRef.current = completionCallback;

  const hasHiddenSplashRef = useRef(false);
  const handleRootLayout = () => {
    if (!hasHiddenSplashRef.current) {
      hasHiddenSplashRef.current = true;
      SplashScreen.hideAsync().catch(() => {});
    }
  };

  // --- VALORES COMPARTIDOS (SHARED VALUES) ---

  // Fase 1: Texto tipográfico (aparece primero 0 a 600ms)
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(18);

  // Fase 2: Logo Principal (hexágono) escala de 0 a 1 con withSpring (600 a 1200ms)
  const logoScale = useSharedValue(0);

  // Fase 2 y 3: Íconos de reciclaje
  const iconsOpacity = useSharedValue(0);
  const iconsScale = useSharedValue(1);
  const suctionProgress = useSharedValue(0); // 0 = esquinas, 1 = centro (0, 0)

  // Tarea 2: Rotación de los íconos (720° sobre su propio eje durante la succión)
  const iconsRotation = useSharedValue(0);

  // Tarea 3: Despertar del color (0 = gris #64748B, 1 = colores vivos)
  const colorAwakening = useSharedValue(0);

  // Tarea 1: Onda Expansiva (Shockwave) y Chispas Tricolor
  const shockwaveScale = useSharedValue(0);
  const shockwaveOpacity = useSharedValue(0);
  const sparksProgress = useSharedValue(0);
  const sparksOpacity = useSharedValue(0);

  // --- COREOGRAFÍA COMPLETA (TIEMPOS DEFINIDOS) ---

  useEffect(() => {
    // ----------------------------------------------------
    // FASE 1 - LA BASE (0ms a 600ms):
    // El texto aparece primero de abajo hacia arriba en fade-in suave
    // ----------------------------------------------------
    textOpacity.value = withTiming(1, {
      duration: TEXT_FADE_DURATION,
      easing: Easing.out(Easing.quad),
    });
    textTranslateY.value = withTiming(0, {
      duration: TEXT_FADE_DURATION,
      easing: Easing.out(Easing.quad),
    });

    // Los 4 íconos aparecen sutilmente en gris en las esquinas
    iconsOpacity.value = withDelay(
      250,
      withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) })
    );

    // ----------------------------------------------------
    // FASE 2 - LA MARCA (600ms a 1200ms):
    // El hexágono aparece por encima del texto con rebote elástico withSpring
    // ----------------------------------------------------
    logoScale.value = withDelay(
      LOGO_SPRING_START,
      withSpring(1, {
        damping: 10,
        stiffness: 100,
        mass: 1,
      })
    );

    // ----------------------------------------------------
    // TAREA 3 - EL DESPERTAR DEL COLOR (700ms a 1100ms):
    // Medio segundo antes de la succión (a los 700ms), los íconos
    // transicionan suavemente de gris a sus colores vivos
    // ----------------------------------------------------
    colorAwakening.value = withDelay(
      COLOR_AWAKENING_START,
      withTiming(1, { duration: COLOR_AWAKENING_DURATION, easing: Easing.inOut(Easing.quad) })
    );

    // ----------------------------------------------------
    // FASE 3 - LA SUCCIÓN Y ROTACIÓN 720° (1200ms a 1900ms):
    // Los íconos son succionados hacia el hexágono con aceleración progresiva
    // mientras rotan 720° sobre su propio eje.
    // ----------------------------------------------------
    suctionProgress.value = withDelay(
      SUCTION_START,
      withTiming(1, {
        duration: SUCTION_DURATION,
        easing: Easing.in(Easing.exp), // Aceleración exponencial
      })
    );

    // Tarea 2: Rotación de 0° a 720° sobre su propio eje
    iconsRotation.value = withDelay(
      SUCTION_START,
      withTiming(720, {
        duration: SUCTION_DURATION,
        easing: Easing.in(Easing.quad),
      })
    );

    // Al llegar al centro exacto (últimos 250ms), la escala de los íconos colapsa a 0
    iconsScale.value = withDelay(
      SUCTION_START + SUCTION_DURATION - 250,
      withTiming(0, { duration: 250, easing: Easing.in(Easing.quad) })
    );

    // ----------------------------------------------------
    // FASE 4 - EL IMPACTO: SHOCKWAVE Y CHISPAS TRICOLOR (1900ms):
    // En el milisegundo exacto del choque (1900ms):
    // 1. Onda expansiva circular escala de 0 a 16 y se desvanece en 500ms
    // 2. Chispas tricolor disparadas radialmente ~65px desvaneciéndose en 400ms
    // ----------------------------------------------------
    // Tarea 1: Onda expansiva (Shockwave)
    shockwaveScale.value = withDelay(
      COLLISION_TIME,
      withTiming(16, { duration: SHOCKWAVE_DURATION, easing: Easing.out(Easing.quad) })
    );
    shockwaveOpacity.value = withDelay(
      COLLISION_TIME,
      withTiming(1, { duration: 30 }, () => {
        shockwaveOpacity.value = withTiming(0, {
          duration: SHOCKWAVE_DURATION - 30,
          easing: Easing.out(Easing.quad),
        });
      })
    );

    // Tarea 1: Chispas tricolor radiales
    sparksProgress.value = withDelay(
      COLLISION_TIME,
      withTiming(1, { duration: SPARKS_DURATION, easing: Easing.out(Easing.quad) })
    );
    sparksOpacity.value = withDelay(
      COLLISION_TIME,
      withTiming(1, { duration: 30 }, () => {
        sparksOpacity.value = withTiming(0, {
          duration: SPARKS_DURATION - 30,
          easing: Easing.out(Easing.quad),
        });
      })
    );

    // Micro-rebote de absorción de energía en el hexágono
    logoScale.value = withDelay(
      COLLISION_TIME,
      withSequence(
        withTiming(1.08, { duration: 90, easing: Easing.out(Easing.quad) }),
        withSpring(1, { damping: 11, stiffness: 140 })
      )
    );

    // ----------------------------------------------------
    // FASE 5 - TRANSICIÓN (2500ms):
    // Pantalla estable por ~500ms tras el estallido, luego transición al Dashboard
    // ----------------------------------------------------
    const finishTimer = setTimeout(() => {
      if (callbackRef.current) {
        callbackRef.current();
      }
    }, TRANSITION_TIME);

    return () => {
      clearTimeout(finishTimer);
    };
  }, []);

  // --- ESTILOS ANIMADOS DE LOS ÍCONOS DE ESQUINAS (TRASLACIÓN + ROTACIÓN 720°) ---

  const animatedTopLeft = useAnimatedStyle(() => {
    const factor = 1 - suctionProgress.value;
    return {
      opacity: iconsOpacity.value,
      transform: [
        { translateX: -CORNER_DIST_X * factor },
        { translateY: -CORNER_DIST_Y * factor },
        { rotate: `${iconsRotation.value}deg` },
        { scale: iconsScale.value },
      ],
    };
  });

  const animatedTopRight = useAnimatedStyle(() => {
    const factor = 1 - suctionProgress.value;
    return {
      opacity: iconsOpacity.value,
      transform: [
        { translateX: CORNER_DIST_X * factor },
        { translateY: -CORNER_DIST_Y * factor },
        { rotate: `${-iconsRotation.value}deg` },
        { scale: iconsScale.value },
      ],
    };
  });

  const animatedBottomLeft = useAnimatedStyle(() => {
    const factor = 1 - suctionProgress.value;
    return {
      opacity: iconsOpacity.value,
      transform: [
        { translateX: -CORNER_DIST_X * factor },
        { translateY: CORNER_DIST_Y * factor },
        { rotate: `${iconsRotation.value}deg` },
        { scale: iconsScale.value },
      ],
    };
  });

  const animatedBottomRight = useAnimatedStyle(() => {
    const factor = 1 - suctionProgress.value;
    return {
      opacity: iconsOpacity.value,
      transform: [
        { translateX: CORNER_DIST_X * factor },
        { translateY: CORNER_DIST_Y * factor },
        { rotate: `${-iconsRotation.value}deg` },
        { scale: iconsScale.value },
      ],
    };
  });

  // Tarea 1: Estilo de la Onda Expansiva (Shockwave)
  const animatedShockwaveStyle = useAnimatedStyle(() => ({
    opacity: shockwaveOpacity.value,
    transform: [{ scale: shockwaveScale.value }],
  }));

  // Hexágono central
  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  // Bloque de texto tipográfico
  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  return (
    <View style={styles.container} onLayout={handleRootLayout}>

      <Animated.View
        pointerEvents="none"
        style={[styles.shockwaveRing, animatedShockwaveStyle]}
      />

      <View pointerEvents="none" style={styles.sparksCenterContainer}>
        {TRICOLOR_SPARKS.map((spark, idx) => (
          <SparkItem
            key={`tricolor-spark-${idx}`}
            angleDeg={spark.angleDeg}
            color={spark.color}
            distance={spark.distance}
            progress={sparksProgress}
            opacity={sparksOpacity}
          />
        ))}
      </View>

      <Animated.View style={[styles.particleAbsolute, animatedTopLeft]}>
        <ChameleonIcon
          IconComponent={RecyclingBottleIcon}
          vividColor="#3B82F6" // Azul vibrante
          awakeningOpacity={colorAwakening}
        />
      </Animated.View>

      <Animated.View style={[styles.particleAbsolute, animatedTopRight]}>
        <ChameleonIcon
          IconComponent={RecyclingLeafIcon}
          vividColor="#22C55E" // Verde esmeralda
          awakeningOpacity={colorAwakening}
        />
      </Animated.View>

      <Animated.View style={[styles.particleAbsolute, animatedBottomLeft]}>
        <ChameleonIcon
          IconComponent={RecyclingBoxIcon}
          vividColor="#F59E0B" // Ámbar cálido
          awakeningOpacity={colorAwakening}
        />
      </Animated.View>

      <Animated.View style={[styles.particleAbsolute, animatedBottomRight]}>
        <ChameleonIcon
          IconComponent={RecyclingCanIcon}
          vividColor="#06B6D4" // Turquesa / Cyan
          awakeningOpacity={colorAwakening}
        />
      </Animated.View>

      <View style={styles.centerStage}>

        <Animated.View style={[styles.logoContainer, animatedLogoStyle]}>
          <Image
            source={logoSource}
            resizeMode="contain"
            style={styles.logoImage}
          />
        </Animated.View>

        <Animated.View style={[styles.textBlock, animatedTextStyle]}>
          <Text style={styles.titleEcoUNAN}>EcoUNAN</Text>
          <Text style={styles.subtitleEcoUNAN}>RECICLAJE UNIVERSITARIO</Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Fondo blanco puro
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerStage: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10, // Por encima de shockwave (3), chispas (4) e íconos (6)
  },
  // Tarea 1: Anillo de la Onda Expansiva (Shockwave)
  shockwaveRing: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2.5,
    borderColor: '#22C55E', // Verde esmeralda eléctrico
    backgroundColor: 'transparent',
    zIndex: 3,
  },
  // Íconos de reciclaje: zIndex 6 (por detrás del hexágono)
  particleAbsolute: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 6,
  },
  // Chispas radiales: zIndex 4 (detrás del hexágono en el centro)
  sparksCenterContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  // Contenedor del hexágono: transparente sin bordes ni cajas
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  logoImage: {
    width: Math.min(width * 0.40, 155),
    height: Math.min(width * 0.40, 155),
  },
  textBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  // Texto: "EcoUNAN" en #111827 (Charcoal Slate) con fuente gruesa
  titleEcoUNAN: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  // Subtítulo: "RECICLAJE UNIVERSITARIO" en #64748B con fuente menor y tracking amplio
  subtitleEcoUNAN: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 2.8,
    marginTop: 5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});

export default SplashEcoUNAN;
