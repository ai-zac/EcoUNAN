import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  Search,
  Plus,
  Users,
  RefreshCw,
  X,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { StudentCard } from '../components/StudentCard';
import { StudentFormModal } from '../components/StudentFormModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { SuccessModal } from '../components/SuccessModal';
import { Estudiante } from '../types/student.types';
import { DEPARTMENTS, DepartmentKey } from '../constants/departments';
import { apiService } from '../services/api';

interface Props {
  initialFocus?: 'all' | 'edit' | 'delete';
  onBack: () => void;
  openCreateDirectly?: boolean;
}

const FACULTY_LIST = ['Todas', ...Object.keys(DEPARTMENTS)];

export const EstudiantesScreen: React.FC<Props> = ({
  initialFocus = 'all',
  onBack,
  openCreateDirectly = false,
}) => {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('Todas');
  const [selectedCareer, setSelectedCareer] = useState<string>('Todas');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const [formModalVisible, setFormModalVisible] = useState(openCreateDirectly);
  const [estudianteToEdit, setEstudianteToEdit] = useState<Estudiante | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [estudianteToDelete, setEstudianteToDelete] = useState<Estudiante | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [feedback, setFeedback] = useState<{
    visible: boolean;
    type?: 'success' | 'danger';
    title: string;
    message: string;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const fetchEstudiantes = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const res = await apiService.getEstudiantes(
      searchQuery.trim(),
      selectedFaculty,
      selectedCareer,
      1,
      25
    );
    setLoading(false);
    setRefreshing(false);

    if (res.success && res.data) {
      setEstudiantes(res.data);
      setPage(1);
      setHasMore(res.hasMore ?? (res.data.length === 25));
      setTotalCount(res.total ?? res.data.length);
    }
  }, [searchQuery, selectedFaculty, selectedCareer]);

  const handleLoadMore = async () => {
    if (loadingMore || loading || refreshing || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const res = await apiService.getEstudiantes(
      searchQuery.trim(),
      selectedFaculty,
      selectedCareer,
      nextPage,
      25
    );
    setLoadingMore(false);

    if (res.success && res.data && res.data.length > 0) {
      const newItems = res.data;
      setEstudiantes((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        const uniqueNew = newItems.filter((e) => !existingIds.has(e.id));
        return [...prev, ...uniqueNew];
      });
      setPage(nextPage);
      setHasMore(res.hasMore ?? (newItems.length === 25));
      if (res.total !== undefined) setTotalCount(res.total);
    } else {
      setHasMore(false);
    }
  };

  useEffect(() => {
    fetchEstudiantes();
  }, [fetchEstudiantes]);

  const handleSaveStudent = async (data: Omit<Estudiante, 'id'>) => {
    setFormSubmitting(true);
    let res;

    if (estudianteToEdit) {
      res = await apiService.updateEstudiante(estudianteToEdit.id, data);
    } else {
      res = await apiService.createEstudiante(data);
    }

    setFormSubmitting(false);

    if (res.success) {
      setFormModalVisible(false);
      setEstudianteToEdit(null);
      await fetchEstudiantes();
      setFeedback({
        visible: true,
        type: 'success',
        title: estudianteToEdit ? '¡Estudiante Actualizado!' : '¡Estudiante Registrado!',
        message: res.mensaje || 'Los datos fueron guardados exitosamente en la base de datos.',
      });
    } else {
      setFeedback({
        visible: true,
        type: 'danger',
        title: 'Error al Guardar',
        message: res.error || 'No se pudo completar la operación.',
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!estudianteToDelete) return;
    setDeleting(true);

    const res = await apiService.deleteEstudiante(estudianteToDelete.id);
    setDeleting(false);
    setDeleteModalVisible(false);

    if (res.success) {
      setEstudianteToDelete(null);
      await fetchEstudiantes();
      setFeedback({
        visible: true,
        type: 'success',
        title: '¡Estudiante Eliminado!',
        message: res.mensaje || 'El registro fue eliminado de la base de datos.',
      });
    } else {
      setFeedback({
        visible: true,
        type: 'danger',
        title: 'Error al Eliminar',
        message: res.error || 'No se pudo eliminar el estudiante.',
      });
    }
  };

  const careersForFaculty =
    selectedFaculty !== 'Todas' && DEPARTMENTS[selectedFaculty as DepartmentKey]
      ? ['Todas', ...DEPARTMENTS[selectedFaculty as DepartmentKey]]
      : [];

  return (
    <AnimatedBackground>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
            <ArrowLeft size={20} color="#F8FAFC" />
          </TouchableOpacity>

          <View style={styles.headerTitles}>
            <Text style={styles.screenTitle}>Gestión de Estudiantes</Text>
            <Text style={styles.screenSubtitle}>
              {initialFocus === 'edit'
                ? 'Modificar información'
                : initialFocus === 'delete'
                ? 'Eliminar registros'
                : 'Consulta académica y CRUD'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => fetchEstudiantes(true)}
            activeOpacity={0.7}
          >
            <RefreshCw size={18} color="#38BDF8" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Search size={18} color="#06B6D4" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre, carnet o correo..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                <X size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.filtersWrapper}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={FACULTY_LIST}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.filtersList}
            renderItem={({ item }) => {
              const active = selectedFaculty === item;
              return (
                <TouchableOpacity
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => {
                    setSelectedFaculty(item);
                    setSelectedCareer('Todas');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {item === 'Todas' ? 'Todas las Facultades' : item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {careersForFaculty.length > 0 && (
          <View style={[styles.filtersWrapper, { marginTop: -4 }]}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={careersForFaculty}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.filtersList}
              renderItem={({ item }) => {
                const active = selectedCareer === item;
                return (
                  <TouchableOpacity
                    style={[styles.careerChip, active && styles.careerChipActive]}
                    onPress={() => setSelectedCareer(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.careerChipText, active && styles.careerChipTextActive]}>
                      {item === 'Todas' ? 'Todas las Carreras' : item}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

        {totalCount !== null && estudiantes.length > 0 && (
          <View style={styles.countBanner}>
            <Text style={styles.countBannerText}>
              Mostrando <Text style={styles.countBannerHighlight}>{estudiantes.length}</Text> de{' '}
              <Text style={styles.countBannerHighlight}>{totalCount.toLocaleString()}</Text> estudiantes
            </Text>
          </View>
        )}

        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#06B6D4" />
            <Text style={styles.loadingText}>Cargando registros...</Text>
          </View>
        ) : estudiantes.length === 0 ? (
          <View style={styles.centerContainer}>
            <View style={styles.emptyIconBox}>
              <Users size={36} color="#64748B" />
            </View>
            <Text style={styles.emptyTitle}>No hay estudiantes encontrados</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || selectedFaculty !== 'Todas'
                ? 'No coinciden resultados con los filtros actuales.'
                : 'Aún no hay estudiantes registrados en la base de datos.'}
            </Text>
            <TouchableOpacity
              style={styles.addFirstBtn}
              onPress={() => {
                setEstudianteToEdit(null);
                setFormModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.addFirstBtnText}>+ Registrar Primer Estudiante</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={estudiantes}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            initialNumToRender={12}
            maxToRenderPerBatch={15}
            windowSize={7}
            removeClippedSubviews={Platform.OS === 'android'}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() => {
              if (loadingMore) {
                return (
                  <View style={styles.footerLoader}>
                    <ActivityIndicator size="small" color="#06B6D4" />
                    <Text style={styles.footerLoaderText}>Cargando más estudiantes...</Text>
                  </View>
                );
              }
              if (!hasMore && estudiantes.length > 0) {
                return (
                  <View style={styles.footerEnd}>
                    <Text style={styles.footerEndText}>
                      Has visto los {estudiantes.length} estudiantes registrados
                    </Text>
                  </View>
                );
              }
              return null;
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchEstudiantes(true)}
                tintColor="#06B6D4"
                colors={['#06B6D4', '#2563EB']}
              />
            }
            renderItem={({ item }) => (
              <StudentCard
                estudiante={item}
                onEdit={(est) => {
                  setEstudianteToEdit(est);
                  setFormModalVisible(true);
                }}
                onDelete={(est) => {
                  setEstudianteToDelete(est);
                  setDeleteModalVisible(true);
                }}
              />
            )}
          />
        )}

        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            setEstudianteToEdit(null);
            setFormModalVisible(true);
          }}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#06B6D4', '#2563EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Plus size={26} color="#FFFFFF" strokeWidth={2.5} />
          </LinearGradient>
        </TouchableOpacity>

        <StudentFormModal
          visible={formModalVisible}
          estudianteToEdit={estudianteToEdit}
          loading={formSubmitting}
          onClose={() => {
            setFormModalVisible(false);
            setEstudianteToEdit(null);
          }}
          onSubmit={handleSaveStudent}
        />

        <DeleteConfirmModal
          visible={deleteModalVisible}
          estudiante={estudianteToDelete}
          loading={deleting}
          onCancel={() => {
            setDeleteModalVisible(false);
            setEstudianteToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
        />

        <SuccessModal
          visible={feedback.visible}
          type={feedback.type}
          title={feedback.title}
          message={feedback.message}
          onClose={() => setFeedback({ ...feedback, visible: false })}
        />
      </View>
    </AnimatedBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 36,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitles: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  screenSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },
  filtersWrapper: {
    marginBottom: 10,
  },
  filtersList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.18)',
    borderColor: '#06B6D4',
  },
  filterChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  careerChip: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  careerChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderColor: '#10B981',
  },
  careerChipText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  careerChipTextActive: {
    color: '#34D399',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 90,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 12,
  },
  emptyIconBox: {
    width: 70,
    height: 70,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F1F5F9',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  addFirstBtn: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#06B6D4',
  },
  addFirstBtnText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
  fabGradient: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countBanner: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countBannerText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  countBannerHighlight: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  footerLoader: {
    paddingVertical: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  footerLoaderText: {
    color: '#06B6D4',
    fontSize: 12,
    fontWeight: '600',
  },
  footerEnd: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerEndText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
});
