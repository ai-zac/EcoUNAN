import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Animated, Switch } from 'react-native';
import { ArrowLeft, Moon, Globe, Lock, ShieldCheck } from 'lucide-react-native';
import { theme } from '../theme/theme';

const SETTINGS_OPTIONS = [
  { id: 'dark_mode', title: 'Modo Oscuro', description: 'Cambia la apariencia de la app', icon: Moon, type: 'switch', color: '#64748B', bg: '#F1F5F9' },
  { id: 'language', title: 'Idioma', description: 'Español (Latinoamérica)', icon: Globe, type: 'nav', color: '#3B82F6', bg: '#EFF6FF' },
  { id: 'password', title: 'Cambiar contraseña', description: 'Actualiza tu contraseña', icon: Lock, type: 'nav', color: '#F59E0B', bg: '#FEF3C7' },
  { id: 'privacy', title: 'Privacidad y Seguridad', description: 'Gestiona tus datos', icon: ShieldCheck, type: 'nav', color: '#10B981', bg: '#D1FAE5' },
];

export const SettingsScreen = ({ navigation }: any) => {
  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  const handlePress = (id: string) => {
    switch (id) {
      case 'language':
        navigation.navigate('Language');
        break;
      case 'password':
        navigation.navigate('ChangePassword');
        break;
      case 'privacy':
        navigation.navigate('Privacy');
        break;
      default:
        break;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View style={[styles.menuContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {SETTINGS_OPTIONS.map((item, index) => {
            const Icon = item.icon;
            return (
              <View key={item.id}>
                <TouchableOpacity
                  style={styles.menuItem}
                  activeOpacity={item.type === 'nav' ? 0.7 : 1}
                  onPress={() => {
                    if (item.type === 'nav') handlePress(item.id);
                  }}
                >
                  <View style={[styles.iconBox, { backgroundColor: item.bg }]}>
                    <Icon size={20} color={item.color} />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.description}>{item.description}</Text>
                  </View>
                  {item.type === 'switch' && (
                    <Switch value={false} onValueChange={() => {}} />
                  )}
                </TouchableOpacity>
                {index < SETTINGS_OPTIONS.length - 1 && <View style={styles.divider} />}
              </View>
            );
          })}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.m, paddingTop: theme.spacing.s, paddingBottom: theme.spacing.m },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...theme.typography.h3 },
  container: { padding: theme.spacing.m },
  menuContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.5)',
    paddingHorizontal: theme.spacing.m,
    ...theme.shadows.medium,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: theme.spacing.l },
  iconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.m },
  textContainer: { flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold', color: theme.colors.text, marginBottom: 2 },
  description: { fontSize: 13, color: theme.colors.textSecondary },
  divider: { height: 1, backgroundColor: theme.colors.border },
});
