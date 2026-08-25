import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { CheckCircle, AlertCircle, Info } from 'lucide-react-native';

type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  message: string;
  type: ToastType;
}

let listener: ((t: ToastState | null) => void) | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

/** Muestra un toast global. Uso: showToast('Guardado', 'success') */
export function showToast(message: string, type: ToastType = 'info'): void {
  if (hideTimer) clearTimeout(hideTimer);
  listener?.({ message, type });
  hideTimer = setTimeout(() => listener?.(null), 2600);
}

const ICONS: Record<ToastType, { Icon: any; color: string; bg: string }> = {
  success: { Icon: CheckCircle, color: '#16A34A', bg: '#DCFCE7' },
  error: { Icon: AlertCircle, color: '#EF4444', bg: '#FEE2E2' },
  info: { Icon: Info, color: '#3B82F6', bg: '#DBEAFE' },
};

/** Host global. Montar UNA vez en App.tsx encima del navegador. */
export const ToastHost = () => {
  const [toast, setToast] = useState<ToastState | null>(null);
  const anim = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    listener = setToast;
    return () => { listener = null; };
  }, []);

  useEffect(() => {
    if (toast) {
      Animated.spring(anim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 8 }).start();
    } else {
      anim.setValue(-120);
    }
  }, [toast]);

  if (!toast) return null;

  const { Icon, color, bg } = ICONS[toast.type];

  return (
    <View pointerEvents="none" style={styles.wrap}>
      <Animated.View style={[styles.box, { backgroundColor: bg, transform: [{ translateY: anim }] }]}>
        <Icon size={18} color={color} />
        <Text style={[styles.text, { color }]} numberOfLines={2}>{toast.message}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  text: { flexShrink: 1, fontSize: 14, fontWeight: '700' },
});
