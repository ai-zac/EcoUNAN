import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Animated, Alert, ActivityIndicator } from 'react-native';
import { ArrowLeft, MailCheck } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { AuthService } from '../api/services/auth.service';

export const ForgotPasswordScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const slideAnim1 = useRef(new Animated.Value(30)).current;
  const slideAnim2 = useRef(new Animated.Value(30)).current;
  
  const fadeAnim1 = useRef(new Animated.Value(0)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;

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
    ]).start();
  }, []);

  const handleRequestCode = async () => {
    if (!email.trim()) {
      Alert.alert('Campo requerido', 'Ingresa tu correo institucional.');
      return;
    }
    setLoading(true);
    try {
      await AuthService.forgotPassword(email.trim().toLowerCase());
      Alert.alert(
        'Revisa tu correo',
        'Si el correo está registrado recibirás un código de recuperación válido por 15 minutos.'
      );
      setStep(2);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'No se pudo enviar el código');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code.trim() || !newPassword || !confirmPassword) {
      Alert.alert('Campos incompletos', 'Completa el código y la nueva contraseña.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Contraseña débil', 'Debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('No coinciden', 'La confirmación no coincide con la nueva contraseña.');
      return;
    }

    setLoading(true);
    try {
      await AuthService.resetPassword(email.trim().toLowerCase(), code.trim(), newPassword);
      Alert.alert(
        'Contraseña restablecida',
        'Ya puedes iniciar sesión con tu nueva contraseña.',
        [{ text: 'Iniciar sesión', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'No se pudo restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <ArrowLeft color={colors.text} size={24} />
      </TouchableOpacity>
      
      <ScrollView contentContainerStyle={styles.container}>
        {step === 1 && (
          <>
            <Animated.View style={[styles.header, { opacity: fadeAnim1, transform: [{ translateY: slideAnim1 }] }]}>
              <Text style={styles.title}>Recuperar Contraseña</Text>
              <Text style={styles.subtitle}>
                Ingresa tu correo institucional y te enviaremos un código para restablecer tu contraseña.
              </Text>
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
              
              <Button 
                title="Enviar Instrucciones" 
                loading={loading}
                onPress={handleRequestCode}
                style={styles.submitButton}
              />
            </Animated.View>
          </>
        )}

        {step === 2 && (
          <>
            <Animated.View style={[styles.header, { opacity: fadeAnim1, transform: [{ translateY: slideAnim1 }] }]}>
              <View style={styles.iconBox}>
                <MailCheck size={26} color={colors.accent} />
              </View>
              <Text style={styles.title}>Ingresa el código</Text>
              <Text style={styles.subtitle}>
                Enviamos un código de 6 dígitos a {email}. Expira en 15 minutos.
              </Text>
            </Animated.View>

            <Animated.View style={[styles.form, { opacity: fadeAnim2, transform: [{ translateY: slideAnim2 }] }]}>
              <Input 
                label="Código de recuperación" 
                placeholder="123456" 
                keyboardType="number-pad"
                autoCapitalize="none"
                maxLength={6}
                value={code}
                onChangeText={(t) => setCode(t.replace(/[^0-9]/g, ''))}
              />
              <Input
                label="Nueva contraseña"
                placeholder="Mínimo 8 caracteres"
                isPassword
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <Input
                label="Confirmar nueva contraseña"
                placeholder="••••••••"
                isPassword
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />

              <Button 
                title="Restablecer contraseña" 
                loading={loading}
                onPress={handleResetPassword}
                style={styles.submitButton}
              />
              <TouchableOpacity onPress={() => setStep(1)} style={{ marginTop: theme.spacing.m }}>
                <Text style={styles.resendText}>Usar otro correo / reenviar código</Text>
              </TouchableOpacity>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  backButton: {
    padding: theme.spacing.m,
    paddingTop: theme.spacing.xl,
  },
  container: { flexGrow: 1, padding: theme.spacing.l, justifyContent: 'center' },
  header: { marginBottom: theme.spacing.xl },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.m,
    ...theme.shadows.soft,
  },
  title: { ...theme.typography.h1, marginBottom: theme.spacing.xs },
  subtitle: { ...theme.typography.body, color: colors.textSecondary, lineHeight: 22 },
  form: { marginBottom: theme.spacing.l },
  submitButton: { marginTop: theme.spacing.l },
  resendText: { ...theme.typography.bodySecondary, textAlign: 'center', fontWeight: '600' },
});
