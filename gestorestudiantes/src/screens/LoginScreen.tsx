import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { User, Lock, GraduationCap, ArrowRight, UserPlus, Mail } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { SuccessModal } from '../components/SuccessModal';
import { apiService } from '../services/api';

interface Props {
  onLoginSuccess: (user: any) => void;
}

export const LoginScreen: React.FC<Props> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');

  const [regNombre, setRegNombre] = useState('');
  const [regUsuario, setRegUsuario] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successModal, setSuccessModal] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const handleLogin = async () => {
    if (!usuario.trim() || !password.trim()) {
      setErrorMsg('Ingresa tu usuario y contraseña');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const res = await apiService.login(usuario.trim(), password.trim());
    setLoading(false);

    if (res.success) {
      onLoginSuccess(res.usuario);
    } else {
      setErrorMsg(res.error || 'Credenciales incorrectas');
    }
  };

  const handleRegister = async () => {
    if (!regNombre.trim() || !regUsuario.trim() || !regPassword.trim() || !regConfirmPassword.trim()) {
      setErrorMsg('Por favor completa todos los campos');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Las contraseñas no coinciden');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const res = await apiService.registerDocente(
      regNombre.trim(),
      regUsuario.trim(),
      regPassword.trim()
    );
    setLoading(false);

    if (res.success) {
      setSuccessModal({
        visible: true,
        title: '¡Cuenta Docente Creada!',
        message: 'Tu cuenta ha sido registrada con éxito. Ya puedes iniciar sesión en el sistema.',
      });
      setUsuario(regUsuario.trim());
      setPassword('');
      setRegNombre('');
      setRegUsuario('');
      setRegPassword('');
      setRegConfirmPassword('');
      setMode('login');
    } else {
      setErrorMsg(res.error || 'Error al crear la cuenta docente');
    }
  };

  return (
    <AnimatedBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['#06B6D4', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoBadge}
            >
              <GraduationCap size={44} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.appTitle}>Gestor de Estudiantes</Text>
            <Text style={styles.appSubtitle}>Plataforma Académica UNAN</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabBtn, mode === 'login' && styles.tabBtnActive]}
                onPress={() => {
                  setMode('login');
                  setErrorMsg('');
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>
                  Iniciar Sesión
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, mode === 'register' && styles.tabBtnActive]}
                onPress={() => {
                  setMode('register');
                  setErrorMsg('');
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>
                  Crear Cuenta
                </Text>
              </TouchableOpacity>
            </View>

            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {mode === 'login' ? (
              <View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Usuario o Correo Institucional</Text>
                  <View style={styles.inputBox}>
                    <User size={18} color="#06B6D4" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="usuario@unan.edu.ni"
                      placeholderTextColor="#64748B"
                      autoCapitalize="none"
                      value={usuario}
                      onChangeText={setUsuario}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Contraseña</Text>
                  <View style={styles.inputBox}>
                    <Lock size={18} color="#06B6D4" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor="#64748B"
                      secureTextEntry
                      value={password}
                      onChangeText={setPassword}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#06B6D4', '#2563EB']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientSubmit}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <View style={styles.btnRow}>
                        <Text style={styles.submitText}>Ingresar</Text>
                        <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nombre Completo *</Text>
                  <View style={styles.inputBox}>
                    <User size={18} color="#06B6D4" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Prof. Roberto Gómez"
                      placeholderTextColor="#64748B"
                      value={regNombre}
                      onChangeText={setRegNombre}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Correo o Usuario Institucional *</Text>
                  <View style={styles.inputBox}>
                    <Mail size={18} color="#06B6D4" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="docente@unan.edu.ni"
                      placeholderTextColor="#64748B"
                      autoCapitalize="none"
                      value={regUsuario}
                      onChangeText={setRegUsuario}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Contraseña *</Text>
                  <View style={styles.inputBox}>
                    <Lock size={18} color="#06B6D4" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Mínimo 6 caracteres"
                      placeholderTextColor="#64748B"
                      secureTextEntry
                      value={regPassword}
                      onChangeText={setRegPassword}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirmar Contraseña *</Text>
                  <View style={styles.inputBox}>
                    <Lock size={18} color="#06B6D4" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Repite tu contraseña"
                      placeholderTextColor="#64748B"
                      secureTextEntry
                      value={regConfirmPassword}
                      onChangeText={setRegConfirmPassword}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleRegister}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#0D9488', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientSubmit}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <View style={styles.btnRow}>
                        <UserPlus size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={styles.submitText}>Crear Cuenta Docente</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        <SuccessModal
          visible={successModal.visible}
          type="success"
          title={successModal.title}
          message={successModal.message}
          onClose={() => setSuccessModal({ ...successModal, visible: false })}
        />
      </KeyboardAvoidingView>
    </AnimatedBackground>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 50,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 26,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
  appTitle: {
    fontSize: 25,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: -0.4,
  },
  appSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
  formCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    height: '100%',
  },
  submitBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 10,
  },
  gradientSubmit: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
