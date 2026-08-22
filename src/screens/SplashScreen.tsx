import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme/theme';

export const SplashScreen = ({ navigation }: any) => {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const fadeAnimTitle = useRef(new Animated.Value(0)).current;
  const fadeAnimSubtitle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnimTitle, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnimSubtitle, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    const checkSession = async () => {
      try {
        const token = await AsyncStorage.getItem('@auth_token');
        const userStr = await AsyncStorage.getItem('@user_data');
        
        setTimeout(() => {
          if (token && userStr) {
            const user = JSON.parse(userStr);
            if (user.role === 'admin') {
              navigation.replace('AdminDashboard');
            } else {
              navigation.replace('MainTabs');
            }
          } else {
            navigation.replace('Onboarding'); // We can change this to Login or Onboarding logic
          }
        }, 2800);
      } catch (e) {
        setTimeout(() => {
          navigation.replace('Onboarding');
        }, 2800);
      }
    };

    checkSession();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
        <Image 
          source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Logo_UNAN-Managua.png' }}
          style={{ width: 110, height: 110, resizeMode: 'contain' }}
        />
      </Animated.View>
      <Animated.Text style={[styles.title, { opacity: fadeAnimTitle }]}>
        EcoUNAN
      </Animated.Text>
      <Animated.Text style={[styles.subtitle, { opacity: fadeAnimSubtitle }]}>
        Reciclaje inteligente
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
    ...theme.shadows.medium,
  },
  title: {
    ...theme.typography.h1,
    marginBottom: theme.spacing.s,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
});
