import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Animated, Image, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { AuthService } from '../api/services/auth.service';


const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;
const googleClientId =
  Platform.OS === 'ios'
    ? extra.googleIosClientId || extra.googleWebClientId || ''
    : Platform.OS === 'android'
    ? extra.googleAndroidClientId || extra.googleWebClientId || ''
    : extra.googleWebClientId || '';

const redirectUri = AuthSession.makeRedirectUri({ native: 'ecounan://' });

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
    if (!email || !password) return;
    setLoading(true);
    try {
      const response = await AuthService.login(email, password);
      if (response.data.role === 'superadmin' || response.data.role === 'admin') {
        navigation.replace('AdminDashboard');
      } else if (response.data.role === 'brigadista') {
        navigation.replace('AdminRecycles');
      } else {
        navigation.replace('MainTabs');
      }
    } catch (error: any) {
      console.error(error);
      const errorMessage = error?.response?.data?.error || 'No se pudo conectar con el servidor. Verifica tu conexión o intenta más tarde.';
      Alert.alert('Error al iniciar sesión', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  
  const [googleRequest, googleResponse, googlePromptAsync] = AuthSession.useAuthRequest(
    {
      clientId: googleClientId,
      scopes: ['openid', 'email', 'profile'],
      responseType: 'token',
      redirectUri,
    },
    { authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth' }
  );

  useEffect(() => {
    if (googleResponse?.type !== 'success') return;
    const accessToken = googleResponse.authentication?.accessToken;
    if (!accessToken) return;

    setLoading(true);
    AuthService.socialLogin('google', accessToken)
      .then((resp) => {
        if (resp.data.role === 'superadmin' || resp.data.role === 'admin') navigation.replace('AdminDashboard');
        else navigation.replace('MainTabs');
      })
      .catch((err: any) => {
        Alert.alert('Error', err?.response?.data?.error || 'No se pudo iniciar sesión con Google');
      })
      .finally(() => setLoading(false));
  }, [googleResponse]);

  const handleGoogle = () => {
    if (!googleClientId) {
      Alert.alert(
        'Configuración pendiente',
        'El login con Google requiere Client IDs. Agrégalos en app.json -> extra -> googleWebClientId (Google Cloud Console).'
      );
      return;
    }
    googlePromptAsync();
  };

  const handleApple = async () => {
    try {
      const available = await AppleAuthentication.isAvailableAsync();
      if (!available) {
        Alert.alert('No disponible', 'Sign in with Apple requiere un dispositivo iOS 13+.');
        return;
      }
      Alert.alert(
        'Próximamente',
        'Sign in with Apple requiere una cuenta de Apple Developer configurada en el backend.'
      );
    } catch (e) {
      Alert.alert('Error', 'No se pudo verificar la disponibilidad de Apple');
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
            source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Logo_UNAN-Managua.png' }}
            style={styles.logo}
          />
          <Text style={styles.title}>Iniciar sesión</Text>
          <Text style={styles.subtitle}>Continúa haciendo la diferencia.</Text>
        </Animated.View>

        <Animated.View style={[styles.form, { opacity: fadeAnim2, transform: [{ translateY: slideAnim2 }] }]}>
          <Input 
            label="Correo institucional" 
            placeholder="usuario@unan.edu.ni" 
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
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

        <Animated.View style={{ opacity: fadeAnim3, transform: [{ translateY: slideAnim3 }] }}>
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>O continúa con</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleGoogle}
              disabled={!googleRequest || loading}
            >
              <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/120px-Google_%22G%22_logo.svg.png' }} style={styles.socialIconImage} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} onPress={handleApple}>
              <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/120px-Apple_logo_black.svg.png' }} style={styles.socialIconImage} />
            </TouchableOpacity>
          </View>

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
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: theme.spacing.l },
  divider: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { marginHorizontal: theme.spacing.m, color: colors.textSecondary, fontWeight: '600' },
  socialButtonsContainer: { flexDirection: 'row', justifyContent: 'center', gap: theme.spacing.m },
  socialButton: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  socialIconImage: { width: 24, height: 24, resizeMode: 'contain' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 'auto', paddingTop: theme.spacing.xl },
  footerText: { color: colors.textSecondary },
  footerLink: { color: colors.accent, fontWeight: 'bold' },
});
