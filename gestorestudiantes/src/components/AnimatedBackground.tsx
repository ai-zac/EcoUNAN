import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface Props {
  children: React.ReactNode;
}

export const AnimatedBackground: React.FC<Props> = ({ children }) => {
  const orb1Scale = useRef(new Animated.Value(1)).current;
  const orb1TranslateY = useRef(new Animated.Value(0)).current;
  const orb2Scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animOrb1 = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(orb1Scale, {
            toValue: 1.25,
            duration: 5000,
            useNativeDriver: true,
          }),
          Animated.timing(orb1TranslateY, {
            toValue: -30,
            duration: 5000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(orb1Scale, {
            toValue: 1,
            duration: 5000,
            useNativeDriver: true,
          }),
          Animated.timing(orb1TranslateY, {
            toValue: 0,
            duration: 5000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    const animOrb2 = Animated.loop(
      Animated.sequence([
        Animated.timing(orb2Scale, {
          toValue: 1.3,
          duration: 6000,
          useNativeDriver: true,
        }),
        Animated.timing(orb2Scale, {
          toValue: 1,
          duration: 6000,
          useNativeDriver: true,
        }),
      ])
    );

    animOrb1.start();
    animOrb2.start();

    return () => {
      animOrb1.stop();
      animOrb2.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#040914', '#0A1224', '#07101F']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={[
          styles.glowOrb,
          styles.orbCyan,
          {
            transform: [
              { scale: orb1Scale },
              { translateY: orb1TranslateY },
            ],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.glowOrb,
          styles.orbEmerald,
          {
            transform: [{ scale: orb2Scale }],
          },
        ]}
      />

      <View style={[styles.glowOrb, styles.orbElectric]} />

      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#040914',
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  glowOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbCyan: {
    top: -height * 0.1,
    left: -width * 0.2,
    width: width * 0.85,
    height: width * 0.85,
    backgroundColor: 'rgba(6, 182, 212, 0.14)',
  },
  orbEmerald: {
    bottom: -height * 0.12,
    right: -width * 0.25,
    width: width * 0.95,
    height: width * 0.95,
    backgroundColor: 'rgba(16, 185, 129, 0.11)',
  },
  orbElectric: {
    top: height * 0.4,
    right: -width * 0.35,
    width: width * 0.7,
    height: width * 0.7,
    backgroundColor: 'rgba(37, 99, 235, 0.10)',
  },
});
