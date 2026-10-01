import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Dimensions,
  TouchableOpacity,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GraduationCap, Sparkles } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface Props {
  onFinish: () => void;
}

const STARS = [
  { top: '8%', left: '15%', size: 3, delay: 0 },
  { top: '12%', left: '78%', size: 2, delay: 300 },
  { top: '22%', left: '42%', size: 4, delay: 600 },
  { top: '30%', left: '88%', size: 3, delay: 150 },
  { top: '35%', left: '12%', size: 2, delay: 450 },
  { top: '48%', left: '72%', size: 3, delay: 750 },
  { top: '55%', left: '25%', size: 4, delay: 200 },
  { top: '65%', left: '85%', size: 2, delay: 500 },
  { top: '72%', left: '18%', size: 3, delay: 850 },
  { top: '80%', left: '60%', size: 3, delay: 100 },
  { top: '88%', left: '38%', size: 4, delay: 400 },
  { top: '92%', left: '82%', size: 2, delay: 650 },
];

export const SplashScreen: React.FC<Props> = ({ onFinish }) => {
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const containerScale = useRef(new Animated.Value(1)).current;

  const body1X = useRef(new Animated.Value(-width * 0.55)).current;
  const body1Y = useRef(new Animated.Value(-height * 0.35)).current;
  const body1Scale = useRef(new Animated.Value(0.4)).current;
  const body1Opacity = useRef(new Animated.Value(0)).current;
  const body1Rotate = useRef(new Animated.Value(0)).current;

  const body2X = useRef(new Animated.Value(width * 0.55)).current;
  const body2Y = useRef(new Animated.Value(height * 0.35)).current;
  const body2Scale = useRef(new Animated.Value(0.4)).current;
  const body2Opacity = useRef(new Animated.Value(0)).current;
  const body2Rotate = useRef(new Animated.Value(0)).current;

  const flashOpacity = useRef(new Animated.Value(0)).current;
  const shockwaveScale = useRef(new Animated.Value(0.1)).current;
  const shockwaveOpacity = useRef(new Animated.Value(0)).current;

  const shockwave2Scale = useRef(new Animated.Value(0.1)).current;
  const shockwave2Opacity = useRef(new Animated.Value(0)).current;

  const logoScale = useRef(new Animated.Value(0.2)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoPulse = useRef(new Animated.Value(1)).current;

  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(28)).current;

  const progressWidth = useRef(new Animated.Value(0)).current;

  const hasSkipped = useRef(false);

  const handleSkip = () => {
    if (hasSkipped.current) return;
    hasSkipped.current = true;
    Animated.timing(containerOpacity, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start(() => {
      onFinish();
    });
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, {
          toValue: 1.08,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoPulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    const sequence = Animated.sequence([
      Animated.parallel([
        Animated.timing(body1Opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(body2Opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(body1X, {
          toValue: 0,
          duration: 1600,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.timing(body1Y, {
          toValue: 0,
          duration: 1600,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.timing(body1Scale, {
          toValue: 1.15,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(body1Rotate, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(body2X, {
          toValue: 0,
          duration: 1600,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.timing(body2Y, {
          toValue: 0,
          duration: 1600,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.timing(body2Scale, {
          toValue: 1.15,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(body2Rotate, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
      ]),

      Animated.parallel([
        Animated.timing(flashOpacity, {
          toValue: 1,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(body1Opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(body2Opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(shockwaveScale, {
          toValue: 3.5,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(shockwaveOpacity, {
            toValue: 0.9,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(shockwaveOpacity, {
            toValue: 0,
            duration: 720,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(120),
          Animated.parallel([
            Animated.timing(shockwave2Scale, {
              toValue: 2.8,
              duration: 750,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(shockwave2Opacity, {
                toValue: 0.8,
                duration: 90,
                useNativeDriver: true,
              }),
              Animated.timing(shockwave2Opacity, {
                toValue: 0,
                duration: 660,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ]),
        Animated.sequence([
          Animated.delay(100),
          Animated.timing(flashOpacity, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
      ]),

      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 550,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 550,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(progressWidth, {
          toValue: 1,
          duration: 950,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),

      Animated.delay(350),

      Animated.parallel([
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 450,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(containerScale, {
          toValue: 1.08,
          duration: 450,
          useNativeDriver: true,
        }),
      ]),
    ]);

    sequence.start(() => {
      if (!hasSkipped.current) {
        hasSkipped.current = true;
        onFinish();
      }
    });

    return () => {
      sequence.stop();
    };
  }, []);

  const spin1 = body1Rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '240deg'],
  });

  const spin2 = body2Rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-240deg'],
  });

  const progressInterpolate = progressWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.fullScreen,
        {
          opacity: containerOpacity,
          transform: [{ scale: containerScale }],
        },
      ]}
    >
      <LinearGradient
        colors={['#020612', '#040A18', '#071228']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {STARS.map((star, i) => (
        <View
          key={i}
          style={[
            styles.star,
            {
              top: star.top as any,
              left: star.left as any,
              width: star.size,
              height: star.size,
              borderRadius: star.size / 2,
              opacity: 0.35 + (i % 3) * 0.25,
            },
          ]}
        />
      ))}

      <Animated.View
        style={[
          styles.celestialBody,
          styles.body1Glow,
          {
            opacity: body1Opacity,
            transform: [
              { translateX: body1X },
              { translateY: body1Y },
              { scale: body1Scale },
              { rotate: spin1 },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['#38BDF8', '#06B6D4', '#0284C7']}
          start={{ x: 0.1, y: 0.1 }}
          end={{ x: 0.9, y: 0.9 }}
          style={styles.planetCore}
        />
        <View style={styles.orbitRingCyan} />
      </Animated.View>

      <Animated.View
        style={[
          styles.celestialBody,
          styles.body2Glow,
          {
            opacity: body2Opacity,
            transform: [
              { translateX: body2X },
              { translateY: body2Y },
              { scale: body2Scale },
              { rotate: spin2 },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['#2DD4BF', '#10B981', '#059669']}
          start={{ x: 0.1, y: 0.1 }}
          end={{ x: 0.9, y: 0.9 }}
          style={styles.planetCore}
        />
        <View style={styles.orbitRingEmerald} />
      </Animated.View>

      <Animated.View
        style={[
          styles.shockwaveRing,
          {
            borderColor: '#38BDF8',
            opacity: shockwaveOpacity,
            transform: [{ scale: shockwaveScale }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.shockwaveRing,
          {
            borderColor: '#2DD4BF',
            opacity: shockwave2Opacity,
            transform: [{ scale: shockwave2Scale }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.flashOverlay,
          {
            opacity: flashOpacity,
          },
        ]}
      />

      <View style={styles.centerContent} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.emblemContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: Animated.multiply(logoScale, logoPulse) }],
            },
          ]}
        >
          <View style={styles.emblemAura} />
          <LinearGradient
            colors={['#0F766E', '#0369A1', '#1E3A8A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emblemCircle}
          >
            <GraduationCap size={48} color="#FFFFFF" strokeWidth={2.2} />
          </LinearGradient>
          <View style={styles.sparkleBadge}>
            <Sparkles size={16} color="#38BDF8" />
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          <Text style={styles.appTitle}>GESTOR DE ESTUDIANTES</Text>
          <Text style={styles.universityTag}>UNAN MANAGUA • CONTROL ACADÉMICO</Text>

          <View style={styles.progressBarWrapper}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressInterpolate,
                },
              ]}
            >
              <LinearGradient
                colors={['#06B6D4', '#38BDF8', '#10B981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
        </Animated.View>
      </View>

      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkip}
        activeOpacity={0.7}
      >
        <Text style={styles.skipText}>Saltar</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#020612',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
  },
  celestialBody: {
    position: 'absolute',
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planetCore: {
    width: 76,
    height: 76,
    borderRadius: 38,
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 26,
    elevation: 20,
  },
  body1Glow: {
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 30,
  },
  body2Glow: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 30,
  },
  orbitRingCyan: {
    position: 'absolute',
    width: 120,
    height: 48,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(56, 189, 248, 0.7)',
    transform: [{ rotate: '35deg' }],
  },
  orbitRingEmerald: {
    position: 'absolute',
    width: 120,
    height: 48,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(45, 212, 191, 0.7)',
    transform: [{ rotate: '-35deg' }],
  },
  flashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
    pointerEvents: 'none',
  },
  shockwaveRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  emblemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  emblemAura: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(6, 182, 212, 0.28)',
  },
  emblemCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(56, 189, 248, 0.6)',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 16,
  },
  sparkleBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#041026',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 3,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  universityTag: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.2,
    color: '#38BDF8',
    marginTop: 8,
    textAlign: 'center',
  },
  progressBarWrapper: {
    width: 170,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginTop: 22,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  skipButton: {
    position: 'absolute',
    top: height > 800 ? 54 : 38,
    right: 22,
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    zIndex: 50,
  },
  skipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
});
