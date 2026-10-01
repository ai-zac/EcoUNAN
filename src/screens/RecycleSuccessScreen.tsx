import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { Check, GlassWater } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

export const RecycleSuccessScreen = ({ navigation, route }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const recycleRecord = route.params?.recycle;
  const items = recycleRecord?.items || [];
  const totalPoints = recycleRecord?.totalPoints || 0;

  
  const circleScale = useRef(new Animated.Value(30)).current; 
  
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.sequence([
      
      Animated.timing(circleScale, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      
      Animated.parallel([
        Animated.timing(contentFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(contentSlide, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {}
        <View style={styles.topSection}>
          
          <View style={styles.circleContainer}>
            <Animated.View style={[styles.greenCircle, { transform: [{ scale: circleScale }] }]} />
            <Animated.View style={{ opacity: contentFade, position: 'absolute' }}>
              <Check size={60} color="#FFFFFF" strokeWidth={2} />
            </Animated.View>
          </View>

          <Animated.View style={{ opacity: contentFade, transform: [{ translateY: contentSlide }], alignItems: 'center' }}>
            <Text style={styles.title}>¡Reciclaje confirmado!</Text>
            <Text style={styles.description}>
              Tu contribución ayuda a construir una{'\n'}universidad más sostenible.
            </Text>
          </Animated.View>

        </View>

        {}
        <Animated.View style={{ opacity: contentFade, transform: [{ translateY: contentSlide }], flex: 1 }}>
          <View style={styles.detailsCard}>
            
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>DETALLES DE LA ENTREGA</Text>
              <Text style={styles.cardSuccess}>Éxito</Text>
            </View>

            {items.map((item: any, index: number) => (
              <View key={index}>
                <View style={styles.itemRow}>
                  <View style={styles.itemIconBg}>
                    <GlassWater size={24} color="#16A34A" />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>
                      {item.materialType.charAt(0).toUpperCase() + item.materialType.slice(1)}
                    </Text>
                    <Text style={styles.itemQuantity}>{item.weight} kg entregados</Text>
                  </View>
                  <Text style={styles.itemPoints}>+{item.pointsEarned} pts</Text>
                </View>
                {index < items.length - 1 && <View style={styles.divider} />}
              </View>
            ))}

            {items.length > 0 && <View style={styles.divider} />}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Puntos acumulados:</Text>
              <Text style={styles.totalPoints}>+{totalPoints} puntos</Text>
            </View>

          </View>
        </Animated.View>

        {}
        <Animated.View style={{ opacity: contentFade, paddingBottom: theme.spacing.m }}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => navigation.navigate('MainTabs', { screen: 'Puntos' })}
          >
            <Text style={styles.actionButtonText}>Ver mis puntos</Text>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  container: { flexGrow: 1, padding: theme.spacing.m, paddingBottom: 40 },
  
  topSection: { alignItems: 'center', marginTop: 60, marginBottom: 40 },
  
  circleContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  greenCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#16A34A',
    position: 'absolute',
  },
  
  title: { fontSize: 28, fontWeight: '900', color: colors.text, textAlign: 'center', marginBottom: 12 },
  description: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  detailsCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
    ...theme.shadows.soft,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 12, fontWeight: '800', color: colors.textSecondary, letterSpacing: 1 },
  cardSuccess: { fontSize: 14, fontWeight: '800', color: '#16A34A' },

  divider: { height: 1, backgroundColor: colors.surface, marginBottom: 16 },

  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  itemIconBg: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '900', color: colors.text, marginBottom: 4 },
  itemQuantity: { fontSize: 14, color: colors.textSecondary },
  itemPoints: { fontSize: 18, fontWeight: '900', color: '#16A34A' },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: '900', color: colors.text },
  totalPoints: { fontSize: 18, fontWeight: '900', color: '#16A34A' },

  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
});
