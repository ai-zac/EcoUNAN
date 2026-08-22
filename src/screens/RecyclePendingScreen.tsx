import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { Clock } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { RecycleService } from '../api/services/recycle.service';

export const RecyclePendingScreen = ({ navigation }: any) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ])
    );
    loop.start();

    // Polling logic
    let intervalId: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const history = await RecycleService.getHistory();
        if (history && history.length > 0) {
          // Asumimos que el primer elemento es el más reciente (ordenado por fecha desc)
          const latest = history[0];
          if (latest.status === 'validated') {
            setIsChecking(false);
            clearInterval(intervalId);
            navigation.replace('RecycleSuccess', { recycle: latest });
          }
        }
      } catch (error) {
        console.error('Error checking status:', error);
      }
    };

    intervalId = setInterval(checkStatus, 3000); // Poll every 3 seconds
    checkStatus(); // Initial check

    return () => {
      loop.stop();
      clearInterval(intervalId);
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        <View style={styles.content}>
          <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
            <Clock size={60} color="#D97706" />
          </Animated.View>

          <Text style={styles.title}>Validación pendiente</Text>
          <Text style={styles.description}>
            Tu reciclaje está siendo validado por el centro de acopio. Por favor, espera unos momentos.
          </Text>

          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loaderText}>Consultando estado...</Text>
          </View>
        </View>

        <View style={styles.bottomSection}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={() => navigation.navigate('MainTabs', { screen: 'Inicio' })}
          >
            <Text style={styles.cancelButtonText}>Volver al Inicio</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, padding: theme.spacing.xl, justifyContent: 'space-between' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  
  iconContainer: { 
    marginBottom: 24, 
    backgroundColor: '#FEF3C7', 
    padding: 20, 
    borderRadius: 60, 
  },
  title: { fontSize: 26, fontWeight: '900', textAlign: 'center', color: '#0F172A', marginBottom: 12 },
  description: { fontSize: 15, color: '#64748B', textAlign: 'center', marginBottom: 40, lineHeight: 22 },
  
  loaderContainer: { marginTop: 40, alignItems: 'center' },
  loaderText: { marginTop: 12, fontSize: 15, color: theme.colors.primary, fontWeight: '600' },

  bottomSection: { gap: 12 },
  
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: { fontSize: 15, fontWeight: '800', color: '#64748B' },
});
