import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import {
  X,
  User,
  BookOpen,
  Mail,
  Phone,
  Camera,
  GraduationCap,
  Hash,
  ChevronDown,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Estudiante } from '../types/student.types';
import { DEPARTMENTS, DepartmentKey } from '../constants/departments';
import { apiService } from '../services/api';

interface Props {
  visible: boolean;
  estudianteToEdit?: Estudiante | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Estudiante, 'id'>) => Promise<void>;
}

export const StudentFormModal: React.FC<Props> = ({
  visible,
  estudianteToEdit,
  loading,
  onClose,
  onSubmit,
}) => {
  const [nombre, setNombre] = useState('');
  const [studentId, setStudentId] = useState('');
  const [faculty, setFaculty] = useState<DepartmentKey>('Ciencia, Tecnología y Salud');
  const [carrera, setCarrera] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [showFacultyPicker, setShowFacultyPicker] = useState(false);
  const [showCareerPicker, setShowCareerPicker] = useState(false);

  useEffect(() => {
    if (estudianteToEdit) {
      setNombre(estudianteToEdit.nombre || '');
      setStudentId(estudianteToEdit.studentId || '');
      const validFaculty = Object.keys(DEPARTMENTS).includes(estudianteToEdit.faculty || '')
        ? (estudianteToEdit.faculty as DepartmentKey)
        : 'Ciencia, Tecnología y Salud';
      setFaculty(validFaculty);
      setCarrera(estudianteToEdit.carrera || '');
      setCorreo(estudianteToEdit.correo || '');
      setTelefono(estudianteToEdit.telefono || '');
      setFotoUrl(estudianteToEdit.fotoUrl || '');
      setLocalPhotoUri(null);
    } else {
      setNombre('');
      setStudentId('');
      setFaculty('Ciencia, Tecnología y Salud');
      setCarrera('');
      setCorreo('');
      setTelefono('');
      setFotoUrl('');
      setLocalPhotoUri(null);
    }
    setErrorMsg('');
  }, [estudianteToEdit, visible]);

  const handlePickPhoto = () => {
    Alert.alert('Foto de Perfil', '¿De dónde deseas obtener la fotografía del estudiante?', [
      {
        text: 'Tomar Foto (Cámara)',
        onPress: async () => {
          try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permiso Denegado', 'Se requiere acceso a la cámara para tomar la fotografía.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled && result.assets && result.assets[0].uri) {
              await processPhoto(result.assets[0].uri);
            }
          } catch (e) {
            console.error('Error al tomar foto:', e);
          }
        },
      },
      {
        text: 'Elegir de Galería',
        onPress: async () => {
          try {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled && result.assets && result.assets[0].uri) {
              await processPhoto(result.assets[0].uri);
            }
          } catch (e) {
            console.error('Error al elegir imagen:', e);
          }
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const processPhoto = async (uri: string) => {
    setLocalPhotoUri(uri);
    setUploadingPhoto(true);
    const uploadedUrl = await apiService.uploadPhoto(uri);
    setUploadingPhoto(false);
    if (uploadedUrl) {
      setFotoUrl(uploadedUrl);
    } else {
      setFotoUrl(uri);
    }
  };

  const handleSubmit = async () => {
    if (!nombre.trim() || !studentId.trim() || !faculty || !carrera.trim() || !correo.trim() || !telefono.trim()) {
      setErrorMsg('Por favor completa todos los campos obligatorios (*)');
      return;
    }

    if (!correo.includes('@')) {
      setErrorMsg('Por favor ingresa un correo electrónico válido');
      return;
    }

    setErrorMsg('');
    await onSubmit({
      nombre: nombre.trim(),
      studentId: studentId.trim(),
      faculty,
      carrera: carrera.trim(),
      correo: correo.trim().toLowerCase(),
      telefono: telefono.trim(),
      fotoUrl: fotoUrl.trim(),
    });
  };

  const availableCareers = DEPARTMENTS[faculty] || [];

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>
                  {estudianteToEdit ? 'Editar Estudiante' : 'Registrar Estudiante'}
                </Text>
                <Text style={styles.subtitle}>
                  {estudianteToEdit
                    ? 'Actualiza los datos del alumno'
                    : 'Ingresa los datos para registrarlo en la base de datos'}
                </Text>
              </View>

              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {errorMsg ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.avatarSection}>
                <TouchableOpacity
                  style={styles.avatarPicker}
                  onPress={handlePickPhoto}
                  disabled={uploadingPhoto}
                  activeOpacity={0.8}
                >
                  {localPhotoUri || fotoUrl ? (
                    <Image
                      source={{
                        uri: localPhotoUri || apiService.getImageUrl(fotoUrl) || fotoUrl,
                      }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <LinearGradient
                      colors={['#0F172A', '#1E293B']}
                      style={styles.avatarPlaceholder}
                    >
                      <User size={38} color="#64748B" />
                    </LinearGradient>
                  )}

                  <View style={styles.cameraBadge}>
                    {uploadingPhoto ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Camera size={15} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>

                <Text style={styles.avatarHint}>
                  {uploadingPhoto ? 'Subiendo foto...' : 'Toca para tomar foto o elegir de galería'}
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre Completo *</Text>
                <View style={styles.inputBox}>
                  <User size={18} color="#06B6D4" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ej. Franklin Escoto"
                    placeholderTextColor="#64748B"
                    value={nombre}
                    onChangeText={setNombre}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Carnet / Código Estudiantil *</Text>
                <View style={styles.inputBox}>
                  <Hash size={18} color="#06B6D4" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ej. 2022-00452"
                    placeholderTextColor="#64748B"
                    value={studentId}
                    onChangeText={setStudentId}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Departamento / Facultad *</Text>
                <TouchableOpacity
                  style={styles.inputBox}
                  onPress={() => setShowFacultyPicker(true)}
                  activeOpacity={0.7}
                >
                  <BookOpen size={18} color="#06B6D4" style={styles.inputIcon} />
                  <Text style={[styles.input, styles.selectText]}>{faculty}</Text>
                  <ChevronDown size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Carrera *</Text>
                <TouchableOpacity
                  style={styles.inputBox}
                  onPress={() => setShowCareerPicker(true)}
                  activeOpacity={0.7}
                >
                  <GraduationCap size={18} color="#06B6D4" style={styles.inputIcon} />
                  <Text
                    style={[
                      styles.input,
                      styles.selectText,
                      !carrera && { color: '#64748B' },
                    ]}
                  >
                    {carrera || 'Selecciona una carrera'}
                  </Text>
                  <ChevronDown size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Correo Institucional *</Text>
                <View style={styles.inputBox}>
                  <Mail size={18} color="#06B6D4" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="estudiante@unan.edu.ni"
                    placeholderTextColor="#64748B"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={correo}
                    onChangeText={setCorreo}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Teléfono *</Text>
                <View style={styles.inputBox}>
                  <Phone size={18} color="#06B6D4" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="+505 8888-9999"
                    placeholderTextColor="#64748B"
                    keyboardType="phone-pad"
                    value={telefono}
                    onChangeText={setTelefono}
                  />
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#06B6D4', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitText}>
                    {estudianteToEdit ? 'Actualizar Estudiante' : 'Guardar Estudiante'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <Modal visible={showFacultyPicker} transparent animationType="fade">
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerCard}>
              <Text style={styles.pickerTitle}>Selecciona Departamento</Text>
              {Object.keys(DEPARTMENTS).map((dept) => (
                <TouchableOpacity
                  key={dept}
                  style={[
                    styles.pickerItem,
                    faculty === dept && styles.pickerItemActive,
                  ]}
                  onPress={() => {
                    setFaculty(dept as DepartmentKey);
                    setCarrera('');
                    setShowFacultyPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      faculty === dept && styles.pickerItemTextActive,
                    ]}
                  >
                    {dept}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.pickerCancelBtn}
                onPress={() => setShowFacultyPicker(false)}
              >
                <Text style={styles.pickerCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={showCareerPicker} transparent animationType="fade">
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerCard}>
              <Text style={styles.pickerTitle}>Selecciona Carrera</Text>
              <ScrollView style={{ maxHeight: 320 }}>
                {availableCareers.map((car) => (
                  <TouchableOpacity
                    key={car}
                    style={[
                      styles.pickerItem,
                      carrera === car && styles.pickerItemActive,
                    ]}
                    onPress={() => {
                      setCarrera(car);
                      setShowCareerPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        carrera === car && styles.pickerItemTextActive,
                      ]}
                    >
                      {car}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.pickerCancelBtn}
                onPress={() => setShowCareerPicker(false)}
              >
                <Text style={styles.pickerCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 17, 0.88)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 22,
    paddingBottom: Platform.OS === 'ios' ? 34 : 22,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 16,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarPicker: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    borderColor: '#06B6D4',
    position: 'relative',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    height: 28,
    backgroundColor: 'rgba(6, 182, 212, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarHint: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 13,
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
  },
  selectText: {
    lineHeight: 48,
  },
  submitBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
  },
  submitGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 17, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  pickerCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#0F172A',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 14,
    textAlign: 'center',
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  pickerItemActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.16)',
    borderWidth: 1,
    borderColor: '#06B6D4',
  },
  pickerItemText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  pickerItemTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  pickerCancelBtn: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  pickerCancelText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
});
