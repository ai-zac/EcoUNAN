import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { Mail, Phone, Edit3, Trash2, GraduationCap, Hash } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Estudiante } from '../types/student.types';
import { apiService } from '../services/api';

interface Props {
  estudiante: Estudiante;
  onEdit: (estudiante: Estudiante) => void;
  onDelete: (estudiante: Estudiante) => void;
}

export const StudentCard: React.FC<Props> = ({ estudiante, onEdit, onDelete }) => {
  const getInitials = (nombre: string, apellido?: string) => {
    const n = nombre ? nombre[0].toUpperCase() : '';
    const a = apellido ? apellido[0].toUpperCase() : (nombre.split(' ')[1]?.[0]?.toUpperCase() || '');
    return `${n}${a}`;
  };

  const imageUri = apiService.getImageUrl(estudiante.fotoUrl);

  return (
    <View style={styles.cardContainer}>
      <LinearGradient
        colors={['rgba(30, 41, 59, 0.75)', 'rgba(15, 23, 42, 0.85)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.headerRow}>
          <View style={styles.avatarWrapper}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.avatarImage} />
            ) : (
              <LinearGradient
                colors={['#06B6D4', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarPlaceholder}
              >
                <Text style={styles.initialsText}>
                  {getInitials(estudiante.nombre, estudiante.apellido)}
                </Text>
              </LinearGradient>
            )}
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.studentName} numberOfLines={1}>
              {estudiante.nombre} {estudiante.apellido || ''}
            </Text>

            <View style={styles.badgesRow}>
              {estudiante.studentId ? (
                <View style={styles.idBadge}>
                  <Hash size={11} color="#A7F3D0" style={{ marginRight: 2 }} />
                  <Text style={styles.idText}>{estudiante.studentId}</Text>
                </View>
              ) : null}

              <View style={styles.careerBadge}>
                <GraduationCap size={11} color="#38BDF8" style={{ marginRight: 4 }} />
                <Text style={styles.careerText} numberOfLines={1}>
                  {estudiante.carrera}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.iconButton, styles.editButton]}
              onPress={() => onEdit(estudiante)}
              activeOpacity={0.7}
            >
              <Edit3 size={15} color="#38BDF8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconButton, styles.deleteButton]}
              onPress={() => onDelete(estudiante)}
              activeOpacity={0.7}
            >
              <Trash2 size={15} color="#FB7185" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.separator} />

        <View style={styles.contactContainer}>
          <View style={styles.contactItem}>
            <Mail size={13} color="#94A3B8" style={{ marginRight: 6 }} />
            <Text style={styles.contactText} numberOfLines={1}>
              {estudiante.correo}
            </Text>
          </View>

          <View style={styles.contactItem}>
            <Phone size={13} color="#94A3B8" style={{ marginRight: 6 }} />
            <Text style={styles.contactText} numberOfLines={1}>
              {estudiante.telefono}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  cardGradient: {
    padding: 15,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.4)',
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
  initialsText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  headerInfo: {
    flex: 1,
    marginRight: 6,
  },
  studentName: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  idBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  idText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '700',
  },
  careerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: '75%',
  },
  careerText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  deleteButton: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.25)',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 10,
  },
  contactContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 130,
  },
  contactText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
});
