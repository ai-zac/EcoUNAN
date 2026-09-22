import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Animated, ActivityIndicator, Alert } from 'react-native';
import { ArrowLeft, Bell, Info } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { notificationService } from '../api/services/notification.service';
import { refreshUnreadCount } from '../hooks/useUnreadCount';
import { Notification } from '../types';

export const NotificationsScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fadeAnims = useRef<{ [key: string]: Animated.Value }>({}).current;
  const slideAnims = useRef<{ [key: string]: Animated.Value }>({}).current;

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
      
      data.forEach((_, i) => {
        fadeAnims[i] = new Animated.Value(0);
        slideAnims[i] = new Animated.Value(20);
      });

      const animations = data.map((_, i) => {
        return Animated.parallel([
          Animated.timing(fadeAnims[i], { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.spring(slideAnims[i], { toValue: 0, tension: 50, friction: 7, useNativeDriver: true })
        ]);
      });
      Animated.stagger(100, animations).start();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron cargar las notificaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string, index: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => {
        const newNotifs = [...prev];
        newNotifs[index] = { ...newNotifs[index], isRead: true };
        return newNotifs;
      });
      refreshUnreadCount();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={64} color={colors.border} />
            <Text style={styles.emptyTitle}>No tienes notificaciones</Text>
          </View>
        ) : (
          notifications.map((notif, index) => {
            const Icon = Info;
            return (
              <Animated.View 
                key={notif._id} 
                style={[
                  styles.notificationCard,
                  !notif.isRead && styles.unreadCard,
                  fadeAnims[index] && slideAnims[index] ? { opacity: fadeAnims[index], transform: [{ translateY: slideAnims[index] }] } : {}
                ]}
              >
                <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                  <Icon size={24} color="#3B82F6" />
                </View>
                <View style={styles.textContent}>
                  <Text style={[styles.title, !notif.isRead && { fontWeight: '900', color: colors.primary }]}>{notif.title}</Text>
                  <Text style={styles.body}>{notif.message}</Text>
                  <Text style={styles.time}>{new Date(notif.createdAt).toLocaleDateString()}</Text>
                </View>
                {!notif.isRead && (
                  <TouchableOpacity 
                    style={styles.markReadBtn} 
                    onPress={() => handleMarkAsRead(notif._id, index)}
                  >
                    <View style={styles.unreadDot} />
                  </TouchableOpacity>
                )}
              </Animated.View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.m, paddingTop: theme.spacing.s, paddingBottom: theme.spacing.m },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...theme.typography.h3 },
  container: { padding: theme.spacing.m },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
    ...theme.shadows.soft,
  },
  unreadCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  iconBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.m },
  textContent: { flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  body: { fontSize: 14, color: colors.textSecondary, marginBottom: 8, lineHeight: 20 },
  time: { fontSize: 12, color: colors.border, fontWeight: '500' },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyTitle: { marginTop: theme.spacing.m, fontSize: 16, color: colors.textSecondary },
  markReadBtn: { padding: 8, alignSelf: 'flex-start' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
});
