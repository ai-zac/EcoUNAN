import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Animated, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { theme } from '../theme/theme';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { AuthService } from '../api/services/auth.service';

export const RegisterScreen = ({ navigation }: any) => {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleRegister = async () => {
    if (!name || !email || !password || !acceptedTerms) {
      Alert.alert('Error', 'Por favor llena los campos obligatorios (Nombre, Correo, Contraseña)');
      return;
    }

    setLoading(true);
    try {
      await AuthService.register(name, email, password, faculty, career, studentId);
      // Once registered and token saved, navigate to MainTabs
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
          <Text style={styles.title}>Crea tu cuenta</Text>
        </Animated.View>

        <Animated.View style={[styles.form, { opacity: fadeAnim2, transform: [{ translateY: slideAnim2 }] }]}>
          <Input 
            label="Nombre completo" 
            placeholder="Juan Pérez" 
            value={name} 
            onChangeText={setName} 
          />
          <Input 
            label="Correo institucional" 
            placeholder="juan.perez@unan.edu.ni" 
            keyboardType="email-address" 
            autoCapitalize="none" 
            value={email} 
            onChangeText={setEmail} 
          />
          <Input 
            label="Código estudiantil" 
            placeholder="20045231" 
            keyboardType="numeric" 
            value={studentId} 
            onChangeText={setStudentId} 
          />
          <Input 
            label="Facultad" 
            placeholder="Ciencias e Ingeniería" 
            value={faculty} 
            onChangeText={setFaculty} 
          />
          <Input 
            label="Carrera" 
            placeholder="Ingeniería en Sistemas" 
            value={career} 
            onChangeText={setCareer} 
          />
          <Input 
            label="Contraseña" 
            placeholder="••••••••" 
            isPassword 
            value={password} 
            onChangeText={setPassword} 
          />
          
          <View style={styles.checkboxContainer}>
            <TouchableOpacity 
              style={[styles.checkbox, acceptedTerms && styles.checkboxActive]} 
              onPress={() => setAcceptedTerms(!acceptedTerms)}
            >
              {acceptedTerms && <View style={styles.checkboxInner} />}
            </TouchableOpacity>
            <Text style={styles.checkboxText}>
              Acepto los <Text style={styles.linkText}>términos y condiciones.</Text>
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  container: { flexGrow: 1, padding: theme.spacing.l },
  header: { marginTop: theme.spacing.xl, marginBottom: theme.spacing.l },
  title: { ...theme.typography.h1 },
  form: { marginBottom: theme.spacing.l },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.l, marginTop: theme.spacing.s },
  checkbox: { width: 24, height: 24, borderRadius: 4, borderWidth: 2, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.m },
  checkboxActive: { borderColor: theme.colors.accent },
  checkboxInner: { width: 12, height: 12, backgroundColor: theme.colors.accent, borderRadius: 2 },
  checkboxText: { color: theme.colors.textSecondary, flex: 1 },
  linkText: { color: theme.colors.accent, fontWeight: 'bold' },
  registerButton: { 
    backgroundColor: theme.colors.primary, 
    borderRadius: theme.borderRadius.m, 
    paddingVertical: 16, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginTop: theme.spacing.s 
  },
  registerButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 'auto', paddingTop: theme.spacing.xl },
  footerText: { color: theme.colors.textSecondary },
  footerLink: { color: theme.colors.accent, fontWeight: 'bold' },
});
