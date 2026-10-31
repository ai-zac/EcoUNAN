import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Animated, Image, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { Input } from '../components/Input';
import { EmailInput, isValidEmail } from '../components/EmailInput';
import { Button } from '../components/Button';
import { AuthService } from '../api/services/auth.service';

export const LoginScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos requeridos', 'Por favor ingresa tu correo electrónico y contraseña.');
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert('Correo inválido', 'Por favor ingresa un correo con formato válido (ejemplo: usuario@unan.edu.ni o usuario@gmail.com).');
      return;
    }
    setLoading(true);
    try {
      const response = await AuthService.login(email.trim().toLowerCase(), password);
      if (response.data.role === 'superadmin' || response.data.role === 'admin') {
        navigation.replace('AdminDashboard');
      } else if (response.data.role === 'brigadista') {
        navigation.replace('AdminRecycles');
      } else {
        navigation.replace('MainTabs');
      }
    } catch (error: any) {
      console.error(error);
      const rawError = error?.response?.data?.error || error?.message || '';
      let errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión o intenta más tarde.';
      if (rawError) {
        if (/invalid.*password/i.test(rawError) || /correo.*contraseña/i.test(rawError)) {
          errorMessage = 'Correo o contraseña incorrectos. Por favor, verifica tus datos.';
        } else if (/user.*not.*found/i.test(rawError) || /no.*encontrado/i.test(rawError)) {
          errorMessage = 'No existe una cuenta registrada con este correo.';
        } else if (/deshabilitada/i.test(rawError)) {
          errorMessage = 'Esta cuenta se encuentra deshabilitada. Contacta al administrador.';
        } else if (error?.response?.data?.error) {
          errorMessage = error.response.data.error;
        }
      }
      Alert.alert('Error al iniciar sesión', errorMessage);
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
            <Image 
              source={require('../../assets/images/ecounan_logo_transparent.png')}
              style={styles.logo}
            />
            <Text style={styles.title}>Iniciar sesión</Text>
            <Text style={styles.subtitle}>Continúa haciendo la diferencia.</Text>
          </Animated.View>

          <Animated.View style={[styles.form, { opacity: fadeAnim2, transform: [{ translateY: slideAnim2 }] }]}>
            <EmailInput 
              label="Correo institucional" 
              placeholder="usuario@unan.edu.ni" 
              value={email}
              onChangeText={setEmail}
              isRequired
            />
            <Input 
              label="Contraseña" 
              placeholder="••••••••" 
              isPassword
              value={password}
              onChangeText={setPassword}
            />
            
            <TouchableOpacity style={styles.forgotPassword} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <Button 
              title="Iniciar sesión" 
              onPress={handleLogin} 
              loading={loading}
              style={styles.loginButton}
            />
          </Animated.View>

          <Animated.View style={[{ opacity: fadeAnim3, transform: [{ translateY: slideAnim3 }] }, styles.footerSection]}>
            <View style={styles.footer}>
              <Text style={styles.footerText}>¿No tienes una cuenta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.footerLink}>Crear cuenta</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, padding: theme.spacing.l, justifyContent: 'center' },
  header: { marginBottom: theme.spacing.xl, alignItems: 'center' },
  logo: { width: 80, height: 80, resizeMode: 'contain', marginBottom: theme.spacing.m },
  title: { ...theme.typography.h1, color: colors.text, marginBottom: theme.spacing.xs },
  subtitle: { ...theme.typography.body, color: colors.textSecondary },
  form: { marginBottom: theme.spacing.l },
  forgotPassword: { alignItems: 'flex-end', marginBottom: theme.spacing.l },
  forgotPasswordText: { color: colors.textSecondary, fontWeight: '600' },
  loginButton: { marginTop: theme.spacing.s },
  footerSection: { marginTop: theme.spacing.m },
  footer: { flexDirection: 'row', justifyContent: 'center', paddingTop: theme.spacing.m },
  footerText: { color: colors.textSecondary },
  footerLink: { color: colors.accent, fontWeight: 'bold' },
});
