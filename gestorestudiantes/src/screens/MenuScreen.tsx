import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  UserPlus,
  Users,
  UserCheck,
  UserX,
  LogOut,
  Database,
  GraduationCap,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { SuccessModal } from '../components/SuccessModal';
import { SeedModal } from '../components/SeedModal';
import { apiService } from '../services/api';

interface Props {
  user: any;
  onNavigateToList: (focusMode?: 'all' | 'edit' | 'delete') => void;
  onOpenCreate: () => void;
  onLogout: () => void;
}

export const MenuScreen: React.FC<Props> = ({
  user,
  onNavigateToList,
  onOpenCreate,
  onLogout,
}) => {
  const [totalStudents, setTotalStudents] = useState<number | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedModalVisible, setSeedModalVisible] = useState(false);
  const [feedback, setFeedback] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: 'success' | 'danger';
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const loadStats = async () => {
    const res = await apiService.getStats();
    if (res.success && res.data) {
      setTotalStudents(res.data.totalStudents);
    } else {
      const fallback = await apiService.getEstudiantes(undefined, undefined, undefined, 1);
      if (fallback.success && fallback.total !== undefined) {
        setTotalStudents(fallback.total);
      }
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleSeedConfirm = async (count: number) => {
    setSeeding(true);
    const res = await apiService.seedEstudiantes(count, true);
    setSeeding(false);
    setSeedModalVisible(false);

    if (res.success) {
      const inserted = res.data?.inserted ?? (res as any).inserted ?? count;
      const total = res.data?.total ?? (res as any).total ?? inserted;
      const timeMs = res.data?.timeMs ?? (res as any).timeMs ?? 0;
      setTotalStudents(total);
      setFeedback({
        visible: true,
        type: 'success',
        title: '¡Base de Datos Poblada!',
        message: `Se insertaron ${inserted.toLocaleString()} estudiantes en MongoDB Atlas. Tiempo: ${(timeMs / 1000).toFixed(2)}s.`,
      });
    } else {
      setFeedback({
        visible: true,
        type: 'danger',
        title: 'Error al Poblar',
        message: res.error || 'Error al conectar o poblar la base de datos.',
      });
    }
  };

  return (
    <AnimatedBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View>
            <Text style={styles.welcomeLabel}>Docente Conectado</Text>
            <Text style={styles.userName}>{user?.nombre || 'Docente UNAN'}</Text>
          </View>

          <View style={styles.topActions}>
            <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.7}>
              <LogOut size={18} color="#FB7185" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statCard}>
          <LinearGradient
            colors={['rgba(6, 182, 212, 0.18)', 'rgba(37, 99, 235, 0.22)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statGradient}
          >
            <View style={styles.statIconBox}>
              <GraduationCap size={32} color="#38BDF8" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statCount}>
                {totalStudents !== null ? totalStudents : '—'}
              </Text>
              <Text style={styles.statLabel}>Estudiantes en la Base de Datos</Text>
            </View>
          </LinearGradient>
        </View>

        <Text style={styles.sectionTitle}>Menú Principal</Text>
        <Text style={styles.sectionSubtitle}>
          Selecciona una de las actividades del gestor académico:
        </Text>

        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.menuCard}
            onPress={onOpenCreate}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#0F766E', '#0D9488']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.menuGradient}
            >
              <View style={styles.menuIconCircle}>
                <UserPlus size={26} color="#FFFFFF" />
              </View>
              <Text style={styles.menuCardTitle}>Registrar Estudiante</Text>
              <Text style={styles.menuCardDesc}>Crear nuevo registro en la base de datos</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => onNavigateToList('all')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#1D4ED8', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.menuGradient}
            >
              <View style={styles.menuIconCircle}>
                <Users size={26} color="#FFFFFF" />
              </View>
              <Text style={styles.menuCardTitle}>Consultar Estudiantes</Text>
              <Text style={styles.menuCardDesc}>Listado general con búsqueda y filtros</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => onNavigateToList('edit')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#D97706', '#F59E0B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.menuGradient}
            >
              <View style={styles.menuIconCircle}>
                <UserCheck size={26} color="#FFFFFF" />
              </View>
              <Text style={styles.menuCardTitle}>Editar Estudiante</Text>
              <Text style={styles.menuCardDesc}>Modificar información de alumnos</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => onNavigateToList('delete')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#BE123C', '#E11D48']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.menuGradient}
            >
              <View style={styles.menuIconCircle}>
                <UserX size={26} color="#FFFFFF" />
              </View>
              <Text style={styles.menuCardTitle}>Eliminar Estudiante</Text>
              <Text style={styles.menuCardDesc}>Dar de baja registros con confirmación</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.seedCard}
          onPress={() => setSeedModalVisible(true)}
          disabled={seeding}
          activeOpacity={0.8}
        >
          <Database size={18} color="#06B6D4" style={{ marginRight: 10 }} />
          {seeding ? (
            <ActivityIndicator size="small" color="#06B6D4" />
          ) : (
            <Text style={styles.seedText}>
              Cargar datos demo en MongoDB (Seleccionar cantidad...)
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <SeedModal
        visible={seedModalVisible}
        onClose={() => setSeedModalVisible(false)}
        onConfirm={handleSeedConfirm}
        loading={seeding}
      />

      <SuccessModal
        visible={feedback.visible}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
        onClose={() => setFeedback({ ...feedback, visible: false })}
      />
    </AnimatedBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  welcomeLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  userName: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
  },
  topActions: {
    flexDirection: 'row',
    gap: 8,
  },
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.25)',
  },
  statCard: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    marginBottom: 26,
  },
  statGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  statIconBox: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: 'rgba(6, 182, 212, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statInfo: {
    flex: 1,
  },
  statCount: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },
  statLabel: {
    color: '#BAE6FD',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 20,
  },
  menuCard: {
    width: '48%',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  menuGradient: {
    padding: 18,
    minHeight: 148,
    justifyContent: 'space-between',
  },
  menuIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuCardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 10,
  },
  menuCardDesc: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 14,
  },
  seedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
  },
  seedText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '600',
  },
});
