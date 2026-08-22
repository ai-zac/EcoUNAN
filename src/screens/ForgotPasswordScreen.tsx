import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

export const ForgotPasswordScreen = ({ navigation }: any) => {
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <ArrowLeft color={theme.colors.text} size={24} />
      </TouchableOpacity>
      
      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View style={[styles.header, { opacity: fadeAnim1, transform: [{ translateY: slideAnim1 }] }]}>
          <Text style={styles.title}>Recuperar Contraseña</Text>
          <Text style={styles.subtitle}>
            Ingresa tu correo institucional y te enviaremos las instrucciones para restablecer tu contraseña.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.form, { opacity: fadeAnim2, transform: [{ translateY: slideAnim2 }] }]}>
          <Input 
            label="Correo institucional" 
            placeholder="usuario@unan.edu.ni" 
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <Button 
            title="Enviar Instrucciones" 
            onPress={() => navigation.goBack()} 
            style={styles.submitButton}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  backButton: {
    padding: theme.spacing.m,
    paddingTop: theme.spacing.xl,
  },
  container: { flexGrow: 1, padding: theme.spacing.l, justifyContent: 'center' },
  header: { marginBottom: theme.spacing.xl },
  title: { ...theme.typography.h1, marginBottom: theme.spacing.xs },
  subtitle: { ...theme.typography.body, color: theme.colors.textSecondary, lineHeight: 22 },
  form: { marginBottom: theme.spacing.l },
  submitButton: { marginTop: theme.spacing.l },
});
