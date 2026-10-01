import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Animated, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { Input } from '../components/Input';
import { SelectInput } from '../components/SelectInput';
import { Button } from '../components/Button';
import { AuthService } from '../api/services/auth.service';
import { DEPARTMENTS } from '../constants/departments';

export const RegisterScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [faculty, setFaculty] = useState('');
  const [career, setCareer] = useState('');

  const slideAnim1 = useRef(new Animated.Value(30)).current;
  const slideAnim2 = useRef(new Animated.Value(30)).current;
  const slideAnim3 = useRef(new Animated.Value(30)).current;
  
  const fadeAnim1 = useRef(new Animated.Value(0)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;
  const fadeAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (slide: Animated.Value, fade: Animated.Value) => {
      return Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slide, { toValue: 0, tension: 50, friction: 7, useNativeDriver: true })
      ]);
    };

    Animated.stagger(150, [
      createAnimation(slideAnim1, fadeAnim1),
      createAnimation(slideAnim2, fadeAnim2),
      createAnimation(slideAnim3, fadeAnim3),
    ]).start();
  }, []);

  const calculatePasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) return { score: 0, text: '', color: colors.textSecondary };
    if (pass.length > 8) score += 1;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score, text: 'Débil', color: '#EF4444', width: '25%' };
    if (score === 2) return { score, text: 'Regular', color: '#F59E0B', width: '50%' };
    if (score === 3) return { score, text: 'Buena', color: '#10B981', width: '75%' };
    return { score, text: 'Fuerte', color: '#16A34A', width: '100%' };
  };

  const strength = calculatePasswordStrength(password);

  const handleRegister = async () => {
    if (!name || !email || !studentId || !faculty || !career || !password || !confirmPassword || !acceptedTerms) {
      Alert.alert('Error', 'Por favor llena todos los campos obligatorios');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (strength.score < 2) {
      Alert.alert('Seguridad', 'Tu contraseña es muy débil. Usa al menos 8 caracteres combinando letras y números.');
      return;
    }

    setLoading(true);
    try {
      await AuthService.register(name, email, password, faculty, career, studentId);
      navigation.replace('MainTabs');
    } catch (error: any) {
      Alert.alert('Error al registrarse', error.response?.data?.error || 'Verifica tus datos o intenta más tarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Animated.View style={[styles.header, { opacity: fadeAnim1, transform: [{ translateY: slideAnim1 }] }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Crea tu cuenta</Text>
        </Animated.View>

        <Animated.View style={[styles.form, { opacity: fadeAnim2, transform: [{ translateY: slideAnim2 }] }]}>
          <Input 
            label="Nombre completo" 
            placeholder="Juan Pérez" 
            value={name} 
            onChangeText={setName} 
            isRequired
          />
          <Input 
            label="Correo institucional" 
            placeholder="juan.perez@unan.edu.ni" 
            keyboardType="email-address" 
            autoCapitalize="none" 
            value={email} 
            onChangeText={setEmail} 
            isRequired
          />
          <Input 
            label="Carnet / Código estudiantil" 
            placeholder="20045231" 
            keyboardType="numeric" 
            value={studentId} 
            onChangeText={setStudentId} 
            isRequired
          />
          
          <SelectInput
            label="Departamento"
            placeholder="Selecciona tu departamento"
            options={Object.keys(DEPARTMENTS)}
            value={faculty}
            onSelect={(val) => {
              setFaculty(val);
              setCareer(''); // reset career when faculty changes
            }}
            isRequired
          />

          <SelectInput
            label="Carrera"
            placeholder={faculty ? "Selecciona tu carrera" : "Selecciona un departamento primero"}
            options={faculty ? DEPARTMENTS[faculty as keyof typeof DEPARTMENTS] : []}
            value={career}
            onSelect={setCareer}
            isRequired
          />

          <Input 
            label="Contraseña" 
            placeholder="••••••••" 
            isPassword 
            value={password} 
            onChangeText={setPassword} 
            isRequired
          />
          
          {password.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBarBackground}>
                <View style={[styles.strengthBarFill, { width: strength.width as any, backgroundColor: strength.color }]} />
              </View>
              <Text style={[styles.strengthText, { color: strength.color }]}>
                Seguridad: {strength.text}
              </Text>
              <Text style={styles.strengthHint}>
                Sugerencia: Usa más de 8 caracteres, mayúsculas, números y símbolos (!@#$).
              </Text>
            </View>
          )}

          <Input 
            label="Confirmar Contraseña" 
            placeholder="••••••••" 
            isPassword 
            value={confirmPassword} 
            onChangeText={setConfirmPassword} 
            isRequired
            error={confirmPassword.length > 0 && password !== confirmPassword ? '✗ Las contraseñas no coinciden' : undefined}
            success={confirmPassword.length > 0 && password === confirmPassword ? '✓ Las contraseñas coinciden' : undefined}
          />
          
          <View style={styles.checkboxContainer}>
            <TouchableOpacity 
              style={[styles.checkbox, acceptedTerms && styles.checkboxActive]} 
              onPress={() => setAcceptedTerms(!acceptedTerms)}
            >
              {acceptedTerms && <View style={styles.checkboxInner} />}
            </TouchableOpacity>
            <Text style={styles.checkboxText}>
              Acepto los <Text style={styles.linkText}>términos y condiciones</Text> *
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.registerButton, (!acceptedTerms || loading) && { opacity: 0.7 }]} 
            onPress={handleRegister} 
            disabled={!acceptedTerms || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.registerButtonText}>Crear cuenta</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.footer, { opacity: fadeAnim3, transform: [{ translateY: slideAnim3 }] }]}>
          <Text style={styles.footerText}>¿Ya tienes una cuenta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Iniciar sesión</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, padding: theme.spacing.l, paddingBottom: 40 },
  header: { marginTop: 0, marginBottom: theme.spacing.l },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.m, marginTop: -8, marginLeft: -12 },
  title: { ...theme.typography.h1 },
  form: { marginBottom: theme.spacing.l },
  
  strengthContainer: { marginBottom: theme.spacing.m, marginTop: -8 },
  strengthBarBackground: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  strengthBarFill: { height: '100%', borderRadius: 3 },
  strengthText: { fontSize: 12, fontWeight: 'bold', marginBottom: 2 },
  strengthHint: { fontSize: 11, color: colors.textSecondary },

  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.l, marginTop: theme.spacing.s },
  checkbox: { width: 24, height: 24, borderRadius: 4, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.m },
  checkboxActive: { borderColor: colors.accent },
  checkboxInner: { width: 12, height: 12, backgroundColor: colors.accent, borderRadius: 2 },
  checkboxText: { color: colors.textSecondary, flex: 1 },
  linkText: { color: colors.accent, fontWeight: 'bold' },
  registerButton: { 
    backgroundColor: colors.primary, 
    borderRadius: theme.borderRadius.m, 
    paddingVertical: 16, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginTop: theme.spacing.s 
  },
  registerButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 'auto', paddingTop: theme.spacing.xl },
  footerText: { color: colors.textSecondary },
  footerLink: { color: colors.accent, fontWeight: 'bold' },
});
