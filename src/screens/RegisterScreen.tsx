import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ArrowLeft, MailCheck, Edit3 } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { Input } from '../components/Input';
import { EmailInput, isValidEmail } from '../components/EmailInput';
import { SelectInput } from '../components/SelectInput';
import { Button } from '../components/Button';
import { PolicyModal } from '../components/PolicyModal';
import { AuthService } from '../api/services/auth.service';
import { DEPARTMENTS } from '../constants/departments';

export const RegisterScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const [step, setStep] = useState<1 | 2>(1);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [faculty, setFaculty] = useState('');
  const [career, setCareer] = useState('');

  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyingLoading, setVerifyingLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [changingLoading, setChangingLoading] = useState(false);

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
        Animated.spring(slide, { toValue: 0, tension: 50, friction: 7, useNativeDriver: true }),
      ]);
    };

    Animated.stagger(150, [
      createAnimation(slideAnim1, fadeAnim1),
      createAnimation(slideAnim2, fadeAnim2),
      createAnimation(slideAnim3, fadeAnim3),
    ]).start();
  }, [step]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (step === 2 && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, resendCooldown]);

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
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanStudentId = studentId.trim();

    if (!cleanName || !cleanEmail || !cleanStudentId || !faculty || !career || !password || !confirmPassword || !acceptedTerms) {
      Alert.alert('Error', 'Por favor llena todos los campos obligatorios');
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      Alert.alert('Correo inválido', 'Por favor introduce una dirección de correo válida (ej: usuario@unan.edu.ni o usuario@gmail.com)');
      return;
    }

    if (cleanStudentId.length !== 8) {
      Alert.alert('Carnet incompleto', 'El carnet o código estudiantil debe contener exactamente 8 dígitos numéricos.');
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
      await AuthService.register(cleanName, cleanEmail, password, faculty, career, cleanStudentId);
      setVerificationEmail(cleanEmail);
      setResendCooldown(60);
      setVerificationCode('');
      setIsChangingEmail(false);
      setStep(2);
    } catch (error: any) {
      const rawError = error?.response?.data?.error || error?.message || '';
      let errorMessage = 'Verifica tus datos o intenta más tarde';
      if (/user.*already.*exists/i.test(rawError) || /ya.*está.*registrado/i.test(rawError)) {
        errorMessage = 'Este correo electrónico ya está registrado. Intenta iniciar sesión.';
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      Alert.alert('Error al registrarse', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    const cleanCode = verificationCode.trim();
    if (!cleanCode || cleanCode.length < 6) {
      Alert.alert('Código incompleto', 'Por favor ingresa los 6 dígitos que enviamos a tu correo.');
      return;
    }

    setVerifyingLoading(true);
    try {
      await AuthService.verifyEmail(verificationEmail, cleanCode);
      Alert.alert('¡Cuenta verificada!', 'Tu correo ha sido confirmado exitosamente.', [
        { text: 'Comenzar', onPress: () => navigation.replace('MainTabs') },
      ]);
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'Código incorrecto o expirado.';
      Alert.alert('Error de verificación', msg);
    } finally {
      setVerifyingLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    try {
      await AuthService.resendVerification(verificationEmail);
      Alert.alert('Código reenviado', `Hemos enviado un nuevo código de verificación a ${verificationEmail}`);
      setResendCooldown(60);
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'No se pudo reenviar el código. Intenta más tarde.';
      Alert.alert('Aviso', msg);
    }
  };

  const handleChangeEmail = async () => {
    const cleanNew = newEmailInput.trim().toLowerCase();
    if (!cleanNew) {
      Alert.alert('Correo requerido', 'Ingresa la nueva dirección de correo.');
      return;
    }
    if (!isValidEmail(cleanNew)) {
      Alert.alert('Correo inválido', 'Ingresa un correo electrónico con formato válido.');
      return;
    }
    if (cleanNew === verificationEmail.toLowerCase()) {
      Alert.alert('Mismo correo', 'El nuevo correo debe ser diferente al actual.');
      return;
    }

    setChangingLoading(true);
    try {
      await AuthService.changeUnverifiedEmail(verificationEmail, cleanNew);
      setVerificationEmail(cleanNew);
      setEmail(cleanNew);
      setIsChangingEmail(false);
      setNewEmailInput('');
      setVerificationCode('');
      setResendCooldown(60);
      Alert.alert('Correo actualizado', `Hemos enviado un nuevo código de verificación a ${cleanNew}`);
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'No se pudo actualizar el correo.';
      Alert.alert('Error', msg);
    } finally {
      setChangingLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {step === 1 && (
            <>
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
                <EmailInput
                  value={email}
                  onChangeText={setEmail}
                  isRequired
                />
                <Input
                  label="Carnet / Código estudiantil"
                  placeholder="20045231"
                  keyboardType="numeric"
                  maxLength={8}
                  value={studentId}
                  onChangeText={(text) => {
                    const clean = text.replace(/\D/g, '').slice(0, 8);
                    setStudentId(clean);
                  }}
                  isRequired
                />

                <SelectInput
                  label="Departamento"
                  placeholder="Selecciona tu departamento"
                  options={Object.keys(DEPARTMENTS)}
                  value={faculty}
                  onSelect={(val) => {
                    setFaculty(val);
                    setCareer('');
                  }}
                  isRequired
                />

                <SelectInput
                  label="Carrera"
                  placeholder={faculty ? 'Selecciona tu carrera' : 'Selecciona un departamento primero'}
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
                    Acepto los{' '}
                    <Text style={styles.linkText} onPress={() => setTermsModalVisible(true)}>
                      términos y condiciones
                    </Text>{' '}
                    *
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
            </>
          )}

          {step === 2 && (
            <>
              <Animated.View style={[styles.header, { opacity: fadeAnim1, transform: [{ translateY: slideAnim1 }] }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
                  <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.iconCircle}>
                  <MailCheck size={32} color="#16A34A" />
                </View>
                <Text style={[styles.title, styles.centerTitle]}>Verifica tu correo</Text>
                <Text style={styles.verifySubtitle}>
                  Enviamos un código de 6 dígitos a:
                </Text>
                <View style={styles.emailBadgeContainer}>
                  <Text style={styles.emailBadgeText} numberOfLines={1}>
                    {verificationEmail}
                  </Text>
                  <TouchableOpacity
                    style={styles.editEmailBtn}
                    onPress={() => {
                      setNewEmailInput(verificationEmail);
                      setIsChangingEmail(!isChangingEmail);
                    }}
                  >
                    <Edit3 size={14} color={colors.primary} />
                    <Text style={styles.editEmailText}>Cambiar</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>

              <Animated.View style={[styles.form, { opacity: fadeAnim2, transform: [{ translateY: slideAnim2 }] }]}>
                {isChangingEmail && (
                  <View style={styles.changeEmailCard}>
                    <Text style={styles.changeEmailTitle}>Cambiar dirección de correo</Text>
                    <EmailInput
                      label="Nuevo correo"
                      value={newEmailInput}
                      onChangeText={setNewEmailInput}
                      isRequired
                    />
                    <View style={styles.changeEmailActions}>
                      <TouchableOpacity
                        style={styles.cancelEmailBtn}
                        onPress={() => setIsChangingEmail(false)}
                      >
                        <Text style={styles.cancelEmailText}>Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.saveEmailBtn, changingLoading && { opacity: 0.7 }]}
                        onPress={handleChangeEmail}
                        disabled={changingLoading}
                      >
                        {changingLoading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.saveEmailText}>Actualizar y reenviar</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <Input
                  label="Código de verificación"
                  placeholder="123456"
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  maxLength={6}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  style={styles.codeInput}
                />

                <Button
                  title="Verificar y entrar"
                  loading={verifyingLoading}
                  onPress={handleVerifyEmail}
                  style={styles.verifyButton}
                />

                <View style={styles.resendSection}>
                  <Text style={styles.resendHint}>¿No recibiste el código?</Text>
                  <TouchableOpacity
                    onPress={handleResendCode}
                    disabled={resendCooldown > 0}
                    style={styles.resendBtn}
                  >
                    <Text
                      style={[
                        styles.resendBtnText,
                        resendCooldown > 0 ? styles.resendBtnDisabled : styles.resendBtnActive,
                      ]}
                    >
                      {resendCooldown > 0
                        ? `Reenviar código en ${resendCooldown}s`
                        : 'Reenviar código'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <PolicyModal
        visible={termsModalVisible}
        onClose={() => setTermsModalVisible(false)}
        onAccept={() => {
          setAcceptedTerms(true);
          setTermsModalVisible(false);
        }}
        initialTab="terms"
      />
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flexGrow: 1, padding: theme.spacing.l, paddingBottom: 40 },
    header: { marginTop: 0, marginBottom: theme.spacing.l },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.m,
      marginTop: -8,
      marginLeft: -12,
    },
    title: { ...theme.typography.h1 },
    form: { marginBottom: theme.spacing.l },

    strengthContainer: { marginBottom: theme.spacing.m, marginTop: -8 },
    strengthBarBackground: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 6,
    },
    strengthBarFill: { height: '100%', borderRadius: 3 },
    strengthText: { fontSize: 12, fontWeight: 'bold', marginBottom: 2 },
    strengthHint: { fontSize: 11, color: colors.textSecondary },

    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.l,
      marginTop: theme.spacing.s,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.m,
    },
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
      marginTop: theme.spacing.s,
    },
    registerButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 'auto',
      paddingTop: theme.spacing.xl,
    },
    footerText: { color: colors.textSecondary },
    footerLink: { color: colors.accent, fontWeight: 'bold' },

    iconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: '#DCFCE7',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      alignSelf: 'center',
    },
    verifySubtitle: {
      ...theme.typography.body,
      color: colors.textSecondary,
      marginTop: 8,
      textAlign: 'center',
    },
    centerTitle: {
      textAlign: 'center',
      alignSelf: 'center',
    },
    emailBadgeContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      alignSelf: 'center',
    },
    emailBadgeText: {
      fontSize: 15,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      maxWidth: 280,
    },
    editEmailBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      marginTop: 8,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    editEmailText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
    changeEmailCard: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    changeEmailTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 12,
    },
    changeEmailActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
      marginTop: 8,
    },
    cancelEmailBtn: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 8,
    },
    cancelEmailText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    saveEmailBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveEmailText: {
      fontSize: 14,
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    codeInput: {
      fontSize: 22,
      letterSpacing: 8,
      textAlign: 'center',
      fontWeight: 'bold',
    },
    verifyButton: {
      marginTop: 8,
    },
    resendSection: {
      alignItems: 'center',
      marginTop: 20,
    },
    resendHint: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 6,
    },
    resendBtn: {
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    resendBtnText: {
      fontSize: 14,
      fontWeight: '600',
    },
    resendBtnActive: {
      color: colors.primary,
    },
    resendBtnDisabled: {
      color: colors.textSecondary,
      opacity: 0.6,
    },
  });
