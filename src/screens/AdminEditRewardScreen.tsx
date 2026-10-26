import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, ActivityIndicator, Alert, Animated } from 'react-native';
import { 
  ArrowLeft, 
  Gift, 
  Coffee, 
  Shirt, 
  BookOpen, 
  Utensils, 
  ShoppingBag, 
  Award, 
  Trophy, 
  Medal, 
  Ticket, 
  Sparkles, 
  Droplet, 
  Star, 
  Zap, 
  Smartphone, 
  Package, 
  Check,
  Infinity as InfinityIcon
} from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { rewardService } from '../api/services/reward.service';
import { Reward } from '../types';

// Catálogo de íconos seleccionables para recompensas
const REWARD_ICONS = [
  { id: 'Gift', label: 'Regalo', Icon: Gift },
  { id: 'Coffee', label: 'Bebida', Icon: Coffee },
  { id: 'Shirt', label: 'Prenda', Icon: Shirt },
  { id: 'BookOpen', label: 'Libro', Icon: BookOpen },
  { id: 'Utensils', label: 'Comida', Icon: Utensils },
  { id: 'ShoppingBag', label: 'Kit', Icon: ShoppingBag },
  { id: 'Award', label: 'Premio', Icon: Award },
  { id: 'Trophy', label: 'Trofeo', Icon: Trophy },
  { id: 'Medal', label: 'Medalla', Icon: Medal },
  { id: 'Ticket', label: 'Boleto', Icon: Ticket },
  { id: 'Sparkles', label: 'Especial', Icon: Sparkles },
  { id: 'Droplet', label: 'Termo', Icon: Droplet },
  { id: 'Star', label: 'Estrella', Icon: Star },
  { id: 'Zap', label: 'Pase', Icon: Zap },
  { id: 'Smartphone', label: 'Tecno', Icon: Smartphone },
  { id: 'Package', label: 'Combo', Icon: Package },
];

// Paletas armónicas de colores (Color del ícono + Fondo suave)
const COLOR_PALETTES = [
  { id: 'amber', label: 'Ámbar', color: '#D97706', bg: '#FEF3C7' },
  { id: 'emerald', label: 'Verde', color: '#16A34A', bg: '#DCFCE7' },
  { id: 'blue', label: 'Azul', color: '#2563EB', bg: '#DBEAFE' },
  { id: 'purple', label: 'Púrpura', color: '#7C3AED', bg: '#EDE9FE' },
  { id: 'pink', label: 'Rosa', color: '#DB2777', bg: '#FCE7F3' },
  { id: 'red', label: 'Rojo', color: '#DC2626', bg: '#FEE2E2' },
  { id: 'teal', label: 'Teal', color: '#0D9488', bg: '#CCFBF1' },
  { id: 'orange', label: 'Naranja', color: '#EA580C', bg: '#FFEDD5' },
  { id: 'indigo', label: 'Índigo', color: '#4F46E5', bg: '#E0E7FF' },
  { id: 'slate', label: 'Pizarra', color: '#475569', bg: '#F1F5F9' },
];

export const AdminEditRewardScreen = ({ route, navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const { rewardId } = route.params || {};
  const isEditing = !!rewardId;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Campos principales del formulario
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pointsCost, setPointsCost] = useState('');
  const [isUnlimitedStock, setIsUnlimitedStock] = useState(false);
  const [stock, setStock] = useState('10');
  const [isActive, setIsActive] = useState(true);
  
  // Selección visual de apariencia
  const [iconName, setIconName] = useState('Gift');
  const [iconColor, setIconColor] = useState('#D97706');
  const [iconBg, setIconBg] = useState('#FEF3C7');

  // Animaciones de entrada instantánea tipo RecycleScreen
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(14)).current;
  const backButtonScale = useRef(new Animated.Value(0.7)).current;

  const previewFade = useRef(new Animated.Value(0)).current;
  const previewSlide = useRef(new Animated.Value(18)).current;
  const previewScale = useRef(new Animated.Value(0.96)).current;
  const previewIconScale = useRef(new Animated.Value(0.3)).current;

  const formFade = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(18)).current;

  const appearanceFade = useRef(new Animated.Value(0)).current;
  const appearanceSlide = useRef(new Animated.Value(18)).current;

  const footerFade = useRef(new Animated.Value(0)).current;
  const footerSlide = useRef(new Animated.Value(18)).current;

  const playEntranceAnimation = () => {
    headerFade.setValue(0);
    headerSlide.setValue(14);
    backButtonScale.setValue(0.7);

    previewFade.setValue(0);
    previewSlide.setValue(18);
    previewScale.setValue(0.96);
    previewIconScale.setValue(0.3);

    formFade.setValue(0);
    formSlide.setValue(18);

    appearanceFade.setValue(0);
    appearanceSlide.setValue(18);

    footerFade.setValue(0);
    footerSlide.setValue(18);

    Animated.stagger(65, [
      // 1. Cabecera y botón volver
      Animated.parallel([
        Animated.timing(headerFade, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(headerSlide, { toValue: 0, tension: 70, friction: 8, useNativeDriver: true }),
        Animated.spring(backButtonScale, { toValue: 1, tension: 80, friction: 7, useNativeDriver: true }),
      ]),

      // 2. Tarjeta de vista previa en tiempo real con micro-pop
      Animated.parallel([
        Animated.timing(previewFade, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(previewSlide, { toValue: 0, tension: 70, friction: 8, useNativeDriver: true }),
        Animated.spring(previewScale, { toValue: 1, tension: 70, friction: 8, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(40),
          Animated.spring(previewIconScale, { toValue: 1, tension: 100, friction: 6, useNativeDriver: true }),
        ]),
      ]),

      // 3. Campos de información básica y stock
      Animated.parallel([
        Animated.timing(formFade, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(formSlide, { toValue: 0, tension: 70, friction: 8, useNativeDriver: true }),
      ]),

      // 4. Selectores visuales de íconos y colores
      Animated.parallel([
        Animated.timing(appearanceFade, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(appearanceSlide, { toValue: 0, tension: 70, friction: 8, useNativeDriver: true }),
      ]),

      // 5. Estado y botón de guardar
      Animated.parallel([
        Animated.timing(footerFade, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(footerSlide, { toValue: 0, tension: 70, friction: 8, useNativeDriver: true }),
      ]),
    ]).start();
  };

  useEffect(() => {
    playEntranceAnimation();
    if (isEditing) {
      loadReward();
    }
  }, [isEditing]);

  const loadReward = async () => {
    setLoading(true);
    try {
      const rewards = await rewardService.getRewards();
      const reward = rewards.find((r: Reward) => r._id === rewardId);
      if (reward) {
        setTitle(reward.title);
        setDescription(reward.description || '');
        setPointsCost(reward.pointsCost.toString());
        
        if (reward.stock === -1) {
          setIsUnlimitedStock(true);
          setStock('');
        } else {
          setIsUnlimitedStock(false);
          setStock(reward.stock.toString());
        }

        setIsActive(reward.isActive);
        setIconName(reward.iconName || 'Gift');
        setIconColor(reward.iconColor || '#D97706');
        setIconBg(reward.iconBg || '#FEF3C7');
      } else {
        Alert.alert('Error', 'No se encontró la recompensa especificada.');
        navigation.goBack();
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo cargar la información de la recompensa.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPalette = (palette: typeof COLOR_PALETTES[0]) => {
    setIconColor(palette.color);
    setIconBg(palette.bg);
  };

  const handleSave = async () => {
    // 1. Validaciones de campos obligatorios
    if (!title.trim()) {
      Alert.alert('Nombre requerido', 'Por favor ingresa un nombre para la recompensa.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Descripción requerida', 'Por favor ingresa una breve descripción para que los estudiantes conozcan la recompensa.');
      return;
    }

    const parsedPoints = parseInt(pointsCost, 10);
    if (isNaN(parsedPoints) || parsedPoints <= 0) {
      Alert.alert('Costo inválido', 'El costo en puntos debe ser un número entero mayor a 0 (ej: 250).');
      return;
    }

    let finalStock = -1;
    if (!isUnlimitedStock) {
      const parsedStock = parseInt(stock, 10);
      if (isNaN(parsedStock) || parsedStock <= 0) {
        Alert.alert('Stock requerido', 'Ingresa una cantidad de stock válida mayor a 0, o activa la opción "Stock ilimitado".');
        return;
      }
      finalStock = parsedStock;
    }

    setSaving(true);
    try {
      const rewardData = {
        title: title.trim(),
        description: description.trim(),
        pointsCost: parsedPoints,
        stock: finalStock,
        isActive,
        iconName,
        iconColor,
        iconBg
      };

      if (isEditing) {
        await rewardService.updateReward(rewardId, rewardData);
        Alert.alert('¡Actualizada!', 'La recompensa se ha modificado correctamente.');
      } else {
        await rewardService.createReward(rewardData);
        Alert.alert('¡Creada!', 'La nueva recompensa ya está registrada en el catálogo.');
      }
      navigation.goBack();
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error al guardar', error?.response?.data?.error || 'No se pudieron guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  const selectedIconObj = REWARD_ICONS.find(i => i.id === iconName) || REWARD_ICONS[0];
  const CurrentIconComponent = selectedIconObj.Icon;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={[styles.header, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
        <Animated.View style={{ transform: [{ scale: backButtonScale }] }}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Volver atrás"
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
        </Animated.View>
        <Text style={styles.title}>{isEditing ? 'Editar recompensa' : 'Nueva recompensa'}</Text>
      </Animated.View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          
          {/* Vista previa en tiempo real */}
          <Animated.View 
            style={[
              styles.previewContainer, 
              { 
                opacity: previewFade, 
                transform: [
                  { translateY: previewSlide },
                  { scale: previewScale }
                ] 
              }
            ]}
          >
            <Text style={styles.sectionTitle}>Vista previa para el estudiante</Text>
            <View style={styles.previewCard}>
              <Animated.View style={[styles.previewIconBox, { backgroundColor: iconBg, transform: [{ scale: previewIconScale }] }]}>
                <CurrentIconComponent size={26} color={iconColor} />
              </Animated.View>
              <View style={styles.previewInfo}>
                <Text style={styles.previewTitle} numberOfLines={1}>
                  {title.trim() || 'Nombre de la recompensa'}
                </Text>
                <Text style={styles.previewDesc} numberOfLines={2}>
                  {description.trim() || 'Aquí aparecerá la descripción detallada del artículo o beneficio...'}
                </Text>
                <View style={styles.previewBadgesRow}>
                  <View style={styles.previewPointsBadge}>
                    <Text style={styles.previewPointsText}>
                      {pointsCost ? `${parseInt(pointsCost, 10) || 0} pts` : '0 pts'}
                    </Text>
                  </View>
                  <View style={[styles.previewStockBadge, isUnlimitedStock ? styles.stockUnlimitedBadge : styles.stockLimitedBadge]}>
                    <Text style={[styles.previewStockText, isUnlimitedStock ? styles.stockUnlimitedText : styles.stockLimitedText]}>
                      {isUnlimitedStock ? 'Stock ilimitado' : (stock ? `${stock} disponibles` : 'Sin stock definido')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Bloque de datos generales */}
          <Animated.View style={{ opacity: formFade, transform: [{ translateY: formSlide }] }}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nombre de la recompensa <Text style={styles.requiredMark}>*</Text></Text>
              <TextInput 
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Ej: Termo Metálico EcoUNAN"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Descripción <Text style={styles.requiredMark}>*</Text></Text>
              <TextInput 
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Ej: Botella térmica de 750ml reutilizable para tus clases diarias..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Costo en puntos EcoUNAN <Text style={styles.requiredMark}>*</Text></Text>
              <TextInput 
                style={styles.input}
                value={pointsCost}
                onChangeText={setPointsCost}
                keyboardType="numeric"
                placeholder="Ej: 350"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Selector moderno de Stock / Disponibilidad (sin -1 visible) */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Disponibilidad de inventario <Text style={styles.requiredMark}>*</Text></Text>
              <View style={styles.stockModeRow}>
                <TouchableOpacity
                  style={[styles.stockModeBtn, !isUnlimitedStock && styles.stockModeBtnActive]}
                  onPress={() => setIsUnlimitedStock(false)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.stockModeText, !isUnlimitedStock && styles.stockModeTextActive]}>
                    Cantidad Limitada
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.stockModeBtn, isUnlimitedStock && styles.stockModeBtnActive]}
                  onPress={() => setIsUnlimitedStock(true)}
                  activeOpacity={0.8}
                >
                  <InfinityIcon size={16} color={isUnlimitedStock ? '#FFFFFF' : colors.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={[styles.stockModeText, isUnlimitedStock && styles.stockModeTextActive]}>
                    Stock Ilimitado
                  </Text>
                </TouchableOpacity>
              </View>

              {isUnlimitedStock ? (
                <View style={styles.unlimitedNotice}>
                  <Sparkles size={16} color="#16A34A" />
                  <Text style={styles.unlimitedNoticeText}>
                    Esta recompensa estará disponible para canje continuo sin límite de stock.
                  </Text>
                </View>
              ) : (
                <View style={{ marginTop: 10 }}>
                  <TextInput 
                    style={styles.input}
                    value={stock}
                    onChangeText={setStock}
                    keyboardType="number-pad"
                    placeholder="Ej: 25 unidades disponibles"
                    placeholderTextColor="#94A3B8"
                  />
                  <Text style={styles.helperText}>Indica el número de unidades físicas disponibles para canjear.</Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Bloque visual: Selector de Ícono y Paleta de Colores */}
          <Animated.View style={{ opacity: appearanceFade, transform: [{ translateY: appearanceSlide }] }}>
            <View style={styles.appearanceSection}>
              <Text style={styles.sectionTitle}>Selección visual del ícono</Text>
              <Text style={styles.helperText}>Elige el símbolo que mejor represente el artículo:</Text>
              
              <View style={styles.iconsGrid}>
                {REWARD_ICONS.map((item) => {
                  const isSelected = iconName === item.id;
                  const IconComp = item.Icon;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.iconTile,
                        isSelected && { borderColor: iconColor, backgroundColor: iconBg }
                      ]}
                      onPress={() => setIconName(item.id)}
                      activeOpacity={0.7}
                    >
                      <IconComp size={22} color={isSelected ? iconColor : colors.textSecondary} />
                      <Text style={[styles.iconTileText, isSelected && { color: iconColor, fontWeight: '900' }]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.appearanceSection}>
              <Text style={styles.sectionTitle}>Combinación de colores</Text>
              <Text style={styles.helperText}>Selecciona la paleta de contraste para el fondo y el símbolo:</Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.palettesScroll}>
                {COLOR_PALETTES.map((palette) => {
                  const isSelected = iconColor === palette.color && iconBg === palette.bg;

                  return (
                    <TouchableOpacity
                      key={palette.id}
                      style={[
                        styles.paletteChip,
                        { backgroundColor: palette.bg, borderColor: isSelected ? palette.color : 'transparent' },
                        isSelected && styles.paletteChipSelected
                      ]}
                      onPress={() => handleSelectPalette(palette)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.paletteDot, { backgroundColor: palette.color }]}>
                        {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                      </View>
                      <Text style={[styles.paletteLabel, { color: palette.color }]}>
                        {palette.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </Animated.View>

          {/* Bloque final: Estado y Botón de guardar */}
          <Animated.View style={{ opacity: footerFade, transform: [{ translateY: footerSlide }] }}>
            <View style={styles.switchGroup}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.switchLabel}>Visibilidad pública</Text>
                <Text style={styles.switchSubtitle}>
                  {isActive ? 'Visible inmediatamente en el catálogo de estudiantes' : 'Oculta temporalmente para los usuarios'}
                </Text>
              </View>
              <Switch 
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: '#CBD5E1', true: '#10B981' }}
                thumbColor={'#FFFFFF'}
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, saving && { opacity: 0.7 }]} 
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>{isEditing ? 'Guardar Cambios' : 'Publicar Recompensa'}</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: theme.spacing.m, 
    paddingTop: theme.spacing.xl, 
    paddingBottom: theme.spacing.m 
  },
  backButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: colors.border, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 12 
  },
  title: { fontSize: 22, fontWeight: '900', color: colors.text },
  container: { padding: theme.spacing.m, paddingBottom: 100 },

  // Vista previa
  previewContainer: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: colors.text, marginBottom: 8 },
  helperText: { fontSize: 13, color: colors.textSecondary, marginBottom: 12 },
  requiredMark: { color: '#EF4444', fontWeight: '900' },
  previewCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: theme.spacing.m,
    alignItems: 'center',
    ...theme.shadows.soft,
  },
  previewIconBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  previewInfo: { flex: 1 },
  previewTitle: { fontSize: 16, fontWeight: '900', color: colors.text, marginBottom: 3 },
  previewDesc: { fontSize: 12, color: colors.textSecondary, marginBottom: 8, lineHeight: 16 },
  previewBadgesRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewPointsBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  previewPointsText: { fontSize: 12, fontWeight: '900', color: '#16A34A' },
  previewStockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  previewStockText: { fontSize: 11, fontWeight: '700' },
  stockLimitedBadge: { backgroundColor: '#F1F5F9' },
  stockLimitedText: { color: colors.textSecondary },
  stockUnlimitedBadge: { backgroundColor: '#EDE9FE' },
  stockUnlimitedText: { color: '#7C3AED' },

  // Formularios e inputs
  formGroup: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 8 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 15,
    color: colors.text,
  },
  textArea: {
    height: 85,
    paddingTop: 12,
    textAlignVertical: 'top',
  },

  // Selector de stock
  stockModeRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 4,
    gap: 6,
  },
  stockModeBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockModeBtnActive: {
    backgroundColor: colors.primary,
  },
  stockModeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  stockModeTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  unlimitedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    gap: 8,
  },
  unlimitedNoticeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
    flex: 1,
  },

  // Selector de íconos
  appearanceSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconTile: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  iconTileText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },

  // Selector de paletas de color
  palettesScroll: {
    paddingVertical: 4,
    gap: 8,
  },
  paletteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    gap: 6,
  },
  paletteChipSelected: {
    ...theme.shadows.soft,
  },
  paletteDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteLabel: {
    fontSize: 12,
    fontWeight: '800',
  },

  // Switch y botón guardar
  switchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    marginVertical: 14,
  },
  switchLabel: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 2 },
  switchSubtitle: { fontSize: 12, color: colors.textSecondary },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 40,
    ...theme.shadows.soft,
  },
  saveButtonText: { fontSize: 16, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
});
