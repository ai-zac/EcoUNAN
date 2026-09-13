import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Animated, ScrollView } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { Button } from '../components/Button';

export const HelpScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 7, useNativeDriver: true })
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Button title="<-" onPress={() => navigation.goBack()} style={styles.backBtn} />
        <Text style={styles.title}>Ayuda y Soporte</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={styles.section}>FAQ</Text>
          <Text style={styles.text}>• ¿Cómo gano puntos?\n  Respuesta: Reciclando materiales en la sección Reciclar.</Text>
          <Text style={styles.text}>• ¿Qué pasa si pierdo mi contraseña?\n  Respuesta: Usa la opción Cambiar contraseña en Configuración.</Text>
          <Text style={styles.section}>Contacto</Text>
          <Text style={styles.text}>Escríbenos a soporte@ecounan.edu.ni</Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.m, paddingTop: theme.spacing.s, paddingBottom: theme.spacing.m },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  title: { ...theme.typography.h3 },
  container: { padding: theme.spacing.m },
  section: { ...theme.typography.h3, marginTop: theme.spacing.l, marginBottom: theme.spacing.s },
  text: { ...theme.typography.body, color: colors.textSecondary, marginBottom: theme.spacing.s },
});
