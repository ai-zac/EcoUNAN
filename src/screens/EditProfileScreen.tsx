import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Animated, ActivityIndicator, Alert, Image } from 'react-native';
import { ArrowLeft, User, Mail, Camera, Book, Briefcase } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { Button } from '../components/Button';
import { userService } from '../api/services/user.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const EditProfileScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [faculty, setFaculty] = useState('');
  const [career, setCareer] = useState('');
  const [studentId, setStudentId] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadProfile();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const user = await userService.getMe();
      setName(user.name || '');
      setEmail(user.email || '');
      setFaculty((user as any).faculty || '');
      setCareer((user as any).career || '');
      setStudentId((user as any).studentId || '');
      setProfilePicture((user as any).profilePicture || null);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo cargar tu perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name || !email) {
      Alert.alert('Error', 'El nombre y correo son obligatorios');
      return;
    }

    try {
      setSaving(true);
      const updatedUser = await userService.updateProfile({ name, email, faculty, career });
      await AsyncStorage.setItem('@user_data', JSON.stringify(updatedUser));
      Alert.alert('Éxito', 'Perfil actualizado correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.error || 'No se pudo actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsUploading(true);
        const updatedUser = await userService.uploadProfilePicture(result.assets[0].uri);
        setProfilePicture((updatedUser as any).profilePicture);
        await AsyncStorage.setItem('@user_data', JSON.stringify(updatedUser));
        Alert.alert('Éxito', 'Foto de perfil actualizada');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo actualizar la foto de perfil');
    } finally {
      setIsUploading(false);
    }
  };

  const getProfileImageUrl = (pic?: string | null) => {
    if (!pic) return null;
    const baseUrl = 'http://172.20.10.5:5000';
    return pic.startsWith('http') ? pic : `${baseUrl}${pic}`;
  };

  const getInitials = (nameStr: string) => {
    if (!nameStr) return '??';
    return nameStr.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} disabled={saving}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <Animated.ScrollView 
          contentContainerStyle={styles.container}
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          
          {/* Avatar Editor */}
          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage} disabled={isUploading}>
              <View style={[styles.avatar, { overflow: 'hidden' }]}>
                {isUploading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : profilePicture ? (
                  <Image source={{ uri: getProfileImageUrl(profilePicture) as string }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{getInitials(name)}</Text>
                )}
              </View>
              <View style={styles.cameraBtn}>
                <Camera size={16} color={colors.white} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre completo</Text>
              <View style={styles.inputWrapper}>
                <User size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Tu nombre completo"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo institucional</Text>
              <View style={styles.inputWrapper}>
                <Mail size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="Tu correo de la universidad"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Facultad</Text>
              <View style={styles.inputWrapper}>
                <Book size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  value={faculty}
                  onChangeText={setFaculty}
                  placeholder="Ej: Ciencias e Ingeniería"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Carrera</Text>
              <View style={styles.inputWrapper}>
                <Briefcase size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  value={career}
                  onChangeText={setCareer}
                  placeholder="Ej: Ingeniería en Sistemas"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>
            
            {studentId ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Código Estudiantil (Solo lectura)</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface }]}>
                  <User size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput 
                    style={[styles.input, { color: colors.textSecondary }]}
                    value={studentId}
                    editable={false}
                  />
                </View>
              </View>
            ) : null}

          </View>

          <Button 
            title={saving ? "Guardando..." : "Guardar cambios"} 
            onPress={handleSave} 
            disabled={saving}
            style={styles.saveBtn}
          />
          
        </Animated.ScrollView>
      )}
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.m, paddingTop: theme.spacing.s, paddingBottom: theme.spacing.m },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...theme.typography.h3 },
  
  container: { flexGrow: 1, padding: theme.spacing.m, paddingBottom: 100 },
  
  avatarSection: { alignItems: 'center', marginVertical: theme.spacing.xl },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.border },
  avatarImage: { width: '100%', height: '100%', borderRadius: 50 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: colors.primary },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.background },

  form: { flex: 1 },
  inputGroup: { marginBottom: theme.spacing.l },
  label: { ...theme.typography.body, fontWeight: 'bold', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: theme.borderRadius.m, paddingHorizontal: theme.spacing.m, ...theme.shadows.soft },
  inputIcon: { marginRight: theme.spacing.s },
  input: { flex: 1, height: 50, fontSize: 16, color: colors.text },

  saveBtn: { marginTop: theme.spacing.xl, marginBottom: theme.spacing.l },
});
