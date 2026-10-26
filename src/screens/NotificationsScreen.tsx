import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import {
  ArrowLeft,
  Bell,
  Info,
  CheckCheck,
  Target,
  Gift,
  Recycle,
  AlertCircle,
} from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { notificationService } from '../api/services/notification.service';
import { refreshUnreadCount } from '../hooks/useUnreadCount';
import { Notification } from '../types';

/**
 * Corrige de forma transparente cualquier texto con codificación corrupta (mojibake)
 * proveniente de registros antiguos en la base de datos.
 */
const cleanNotificationText = (str?: string): string => {
  if (!str) return '';
  return str
    .replace(/Â¡/g, '¡')
    .replace(/ðŸŽ¯/g, '🎯')
    .replace(/ðŸŽ/g, '🎁')
    .replace(/â™»ï¸/g, '♻️')
    .replace(/ðŸŒ±/g, '🌱')
    .replace(/ðŸ†/g, '🏆')
    .replace(/ðŸ/g, '');
};

export const NotificationsScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const fadeAnims = useRef<{ [key: string]: Animated.Value }>({}).current;
  const slideAnims = useRef<{ [key: string]: Animated.Value }>({}).current;

  useEffect(() => {
    fetchNotifications(false);

    let pollingInterval: NodeJS.Timeout | null = null;
    const startPolling = () => {
      if (pollingInterval) clearInterval(pollingInterval);
      pollingInterval = setInterval(() => {
        fetchNotifications(true);
      }, 4000);
    };

    const stopPolling = () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
    };

    const unsubscribeFocus = navigation.addListener('focus', () => {
      fetchNotifications(true);
      startPolling();
    });

    const unsubscribeBlur = navigation.addListener('blur', stopPolling);

    startPolling();

    return () => {
      stopPolling();
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation]);

  const fetchNotifications = async (silent: boolean = false) => {
    try {
      const data = await notificationService.getNotifications();
      const sanitized = data.map((item) => ({
        ...item,
        title: cleanNotificationText(item.title),
        message: cleanNotificationText(item.message),
      }));

      setNotifications((prev) => {
        if (!silent || prev.length !== sanitized.length) {
          sanitized.forEach((_, i) => {
            if (!fadeAnims[i]) fadeAnims[i] = new Animated.Value(silent ? 1 : 0);
            if (!slideAnims[i]) slideAnims[i] = new Animated.Value(silent ? 0 : 16);
          });
          if (!silent) {
            sanitized.forEach((_, i) => {
              fadeAnims[i].setValue(0);
              slideAnims[i].setValue(16);
            });
            const animations = sanitized.map((_, i) => {
              return Animated.parallel([
                Animated.timing(fadeAnims[i], { toValue: 1, duration: 320, useNativeDriver: true }),
                Animated.spring(slideAnims[i], { toValue: 0, tension: 65, friction: 8, useNativeDriver: true }),
              ]);
            });
            Animated.stagger(60, animations).start();
          }
        }
        return sanitized;
      });
    } catch (error) {
      if (!silent) {
        console.error(error);
        Alert.alert('Error', 'No se pudieron cargar las notificaciones');
      }
    } finally {
      if (!silent) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    refreshUnreadCount();
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      // Actualización optimista inmediata en la UI
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      await notificationService.markAsRead(id);
      refreshUnreadCount();
    } catch (error) {
      console.error('[NotificationsScreen] Error marcando como leída:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    if (unreadCount === 0 || markingAll) return;

    try {
      setMarkingAll(true);
      // Actualización optimista de todas a leídas
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await notificationService.markAllAsRead();
      refreshUnreadCount();
    } catch (error) {
      console.error('[NotificationsScreen] Error marcando todas como leídas:', error);
      Alert.alert('Error', 'No se pudieron marcar todas como leídas');
    } finally {
      setMarkingAll(false);
    }
  };

  const getNotificationIcon = (title: string, message: string) => {
    const text = `${title} ${message}`.toLowerCase();
    if (text.includes('meta')) {
      return { Icon: Target, color: '#10B981', bg: '#DCFCE7' };
    }
    if (text.includes('canje') || text.includes('recompensa')) {
      return { Icon: Gift, color: '#F59E0B', bg: '#FEF3C7' };
    }
    if (text.includes('recicl')) {
      return { Icon: Recycle, color: '#16A34A', bg: '#DCFCE7' };
    }
    if (text.includes('cancelad') || text.includes('rechazad')) {
      return { Icon: AlertCircle, color: '#EF4444', bg: '#FEE2E2' };
    }
    return { Icon: Info, color: '#3B82F6', bg: '#EFF6FF' };
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Volver atrás"
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>

        {/* Botón para marcar todas como leídas */}
        {unreadCount > 0 ? (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
            disabled={markingAll}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Marcar todas como leídas"
          >
            {markingAll ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <CheckCheck size={18} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={styles.markAllText}>Leídas</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary, colors.accent]}
            tintColor={colors.primary}
          />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={64} color={colors.border} />
            <Text style={styles.emptyTitle}>No tienes notificaciones</Text>
          </View>
        ) : (
          notifications.map((notif, index) => {
            const { Icon, color, bg } = getNotificationIcon(notif.title, notif.message);
            const isUnread = !notif.isRead;

            return (
              <TouchableOpacity
                key={notif._id}
                activeOpacity={0.75}
                onPress={() => {
                  if (isUnread) {
                    handleMarkAsRead(notif._id);
                  }
                }}
              >
                <Animated.View
                  style={[
                    styles.notificationCard,
                    isUnread && styles.unreadCard,
                    fadeAnims[index] && slideAnims[index]
                      ? {
                          opacity: fadeAnims[index],
                          transform: [{ translateY: slideAnims[index] }],
                        }
                      : {},
                  ]}
                >
                  <View style={[styles.iconBox, { backgroundColor: bg }]}>
                    <Icon size={22} color={color} />
                  </View>
                  <View style={styles.textContent}>
                    <Text
                      style={[
                        styles.title,
                        isUnread ? styles.titleUnread : styles.titleRead,
                      ]}
                    >
                      {notif.title}
                    </Text>
                    <Text style={styles.body}>{notif.message}</Text>
                    <Text style={styles.time}>
                      {new Date(notif.createdAt).toLocaleDateString([], {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>

                  {/* Indicador de no leído */}
                  {isUnread && (
                    <TouchableOpacity
                      style={styles.markReadBtn}
                      onPress={() => handleMarkAsRead(notif._id)}
                      accessibilityRole="button"
                      accessibilityLabel="Marcar esta notificación como leída"
                    >
                      <View style={styles.unreadDot} />
                    </TouchableOpacity>
                  )}
                </Animated.View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.m,
      paddingTop: theme.spacing.s,
      paddingBottom: theme.spacing.m,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '33',
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      ...theme.typography.h3,
      color: colors.text,
      fontWeight: 'bold',
    },
    markAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.primary + '44',
    },
    markAllText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primary,
    },
    container: { padding: theme.spacing.m, paddingBottom: 40 },
    notificationCard: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      padding: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
      marginBottom: theme.spacing.m,
      borderWidth: 1,
      borderColor: colors.border,
      ...theme.shadows.soft,
    },
    unreadCard: {
      backgroundColor: colors.white,
      borderColor: colors.primary + '55',
      shadowOpacity: 0.12,
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.m,
    },
    textContent: { flex: 1 },
    title: {
      fontSize: 15,
      color: colors.text,
      marginBottom: 4,
    },
    titleUnread: {
      fontWeight: '800',
      color: colors.text,
    },
    titleRead: {
      fontWeight: '600',
      color: colors.textSecondary,
    },
    body: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
      lineHeight: 20,
    },
    time: { fontSize: 12, color: colors.border, fontWeight: '500' },
    emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyTitle: { marginTop: theme.spacing.m, fontSize: 16, color: colors.textSecondary },
    markReadBtn: {
      padding: 8,
      alignSelf: 'flex-start',
    },
    unreadDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
    },
  });
