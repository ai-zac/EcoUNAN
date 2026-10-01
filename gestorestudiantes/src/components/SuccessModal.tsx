import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Modal, Animated, TouchableOpacity } from 'react-native';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  visible: boolean;
  type?: 'success' | 'danger' | 'info';
  title: string;
  message: string;
  onClose: () => void;
  confirmText?: string;
}

export const SuccessModal: React.FC<Props> = ({
  visible,
  type = 'success',
  title,
  message,
  onClose,
  confirmText = 'Continuar',
}) => {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.7);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  const isSuccess = type === 'success';
  const isDanger = type === 'danger';

  const iconColor = isSuccess ? '#10B981' : isDanger ? '#EF4444' : '#06B6D4';
  const gradientColors = isSuccess
    ? (['#065F46', '#047857'] as const)
    : isDanger
    ? (['#991B1B', '#DC2626'] as const)
    : (['#0E7490', '#0284C7'] as const);

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={[styles.iconWrapper, { borderColor: `${iconColor}40` }]}>
            <View style={[styles.iconInner, { backgroundColor: `${iconColor}20` }]}>
              {isSuccess && <CheckCircle2 size={42} color={iconColor} strokeWidth={2.4} />}
              {isDanger && <AlertTriangle size={42} color={iconColor} strokeWidth={2.4} />}
              {!isSuccess && !isDanger && <Info size={42} color={iconColor} strokeWidth={2.4} />}
            </View>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity style={styles.button} activeOpacity={0.85} onPress={onClose}>
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.buttonText}>{confirmText}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 17, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
