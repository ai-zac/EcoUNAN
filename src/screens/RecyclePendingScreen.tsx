import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Animated, ActivityIndicator, Alert } from 'react-native';
import { Clock, AlertTriangle, ArrowRight } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { RecycleService } from '../api/services/recycle.service';

export const RecyclePendingScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [isChecking, setIsChecking] = useState(true);
  const [isDelayed, setIsDelayed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();

    // Notificación visual si demora más de 30s para que el usuario no sienta que la app se congeló
    const delayedTimer = setTimeout(() => {
      if (isMounted) setIsDelayed(true);
    }, 30000);

    let intervalId: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const history = await RecycleService.getHistory();
        if (!isMounted) return;

        if (history && history.length > 0) {
          const latest = history[0];
          if (latest.status === 'validated') {
            setIsChecking(false);
            clearInterval(intervalId);
            clearTimeout(delayedTimer);
            navigation.replace('RecycleSuccess', { recycle: latest });
          } else if (latest.status === 'rejected') {
            setIsChecking(false);
            clearInterval(intervalId);
            clearTimeout(delayedTimer);
            Alert.alert(
              'Solicitud no aprobada',
              'Tu registro de reciclaje no pudo ser validado por el centro de acopio. Puedes intentarlo de nuevo o consultar con un brigadista.',
              [
                {
                  text: 'Entendido',
                  onPress: () => navigation.navigate('MainTabs', { screen: 'Inicio' }),
                },
              ]
            );
          }
        }
      } catch (error) {
        console.error('Error checking status:', error);
      }
    };

    intervalId = setInterval(checkStatus, 3000);
    checkStatus();

    return () => {
      isMounted = false;
      loop.stop();
      clearInterval(intervalId);
      clearTimeout(delayedTimer);
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
            Tu reciclaje está siendo verificado por el centro de acopio. Por favor, espera unos momentos.
          </Text>

          {isDelayed && (
            <View style={styles.delayedNotice}>
              <AlertTriangle size={18} color="#D97706" style={{ marginRight: 8 }} />
              <Text style={styles.delayedText}>
                El centro está tomando más tiempo de lo habitual. Puedes volver al inicio con tranquilidad; tus EcoPoints se sumarán automáticamente cuando sea aprobado.
              </Text>
            </View>
          )}

          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loaderText}>Consultando estado con el centro...</Text>
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

const useStyles = (colors: typeof theme.colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  container: { flex: 1, padding: theme.spacing.xl, justifyContent: 'space-between' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  
  iconContainer: { 
    marginBottom: 24, 
    backgroundColor: '#FEF3C7', 
    padding: 20, 
    borderRadius: 60, 
  },
  title: { fontSize: 26, fontWeight: '900', textAlign: 'center', color: colors.text, marginBottom: 12 },
  description: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginBottom: 40, lineHeight: 22 },
  
  loaderContainer: { marginTop: 40, alignItems: 'center' },
  loaderText: { marginTop: 12, fontSize: 15, color: colors.primary, fontWeight: '600' },

  bottomSection: { gap: 12 },
  
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: { fontSize: 15, fontWeight: '800', color: colors.text },
  delayedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 20,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  delayedText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
    fontWeight: '500',
  },
});
