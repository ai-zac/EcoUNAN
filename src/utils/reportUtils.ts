import { useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { API_BASE_URL } from '../api/apiClient';
import { tokenStorage } from './tokenStorage';

export type DatePreset = 'today' | 'week' | 'month' | 'all';

export const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'today', label: 'Hoy' },
  { key: 'week', label: 'Últimos 7 días' },
  { key: 'month', label: 'Este Mes' },
  { key: 'all', label: 'Todo' },
];

/** Formatea una fecha local en YYYY-MM-DD (hora de Nicaragua). */
export const toIsoDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Calcula startDate y endDate según el preset seleccionado. */
export const getPresetDates = (
  preset: DatePreset,
): { startDate?: string; endDate?: string } => {
  if (preset === 'all') return {};
  const now = new Date();
  const endDate = toIsoDate(now);

  if (preset === 'today') return { startDate: endDate, endDate };
  if (preset === 'week') {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    return { startDate: toIsoDate(start), endDate };
  }
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return { startDate: toIsoDate(startOfMonth), endDate };
};

/** Formatea fecha y hora en español de Nicaragua ("25/10/2026, 20:45"). */
export const formatReportDateTime = (dateValue: string | Date): string =>
  new Date(dateValue).toLocaleString('es-NI', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/**
 * Hook que verifica en cliente que el usuario tenga rol 'admin' o 'superadmin'.
 * El microservicio también valida el JWT en servidor.
 */
export const useRequireAdminAccess = (navigation: any) => {
  useEffect(() => {
    AsyncStorage.getItem('@user_data').then((raw) => {
      if (!raw) return;
      try {
        const user = JSON.parse(raw);
        if (user?.role && user.role !== 'admin' && user.role !== 'superadmin') {
          Alert.alert(
            'Acceso restringido',
            'El módulo de reportes es exclusivo para administradores.',
          );
          navigation.goBack();
        }
      } catch {
        // ignorar JSON malformado
      }
    });
  }, [navigation]);
};

export interface ExportReportOptions {
  /** Ruta base del reporte en el microservicio, ej: 'recycles' | 'users' | 'rewards' */
  reportSlug: 'recycles' | 'users' | 'rewards';
  format: 'excel' | 'pdf';
  filenamePrefix: string;
  dialogTitle: string;
  params: Record<string, string | undefined>;
}

/**
 * Descarga un reporte en Excel (.xlsx) o PDF (.pdf) desde el microservicio
 * usando la API moderna de Expo SDK 58 (`File.downloadFileAsync` + `Paths.document`)
 * y abre el diálogo nativo de compartir.
 */
export const downloadAndShareReport = async ({
  reportSlug,
  format,
  filenamePrefix,
  dialogTitle,
  params,
}: ExportReportOptions): Promise<void> => {
  const token = await tokenStorage.getToken();
  if (!token) {
    Alert.alert('Sesión requerida', 'Inicia sesión nuevamente para exportar el reporte.');
    return;
  }

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && value !== 'all') {
      searchParams.append(key, value);
    }
  });

  const qs = searchParams.toString();
  const url = `${API_BASE_URL}/reports/${reportSlug}/export/${format}${qs ? `?${qs}` : ''}`;
  const ext = format === 'excel' ? 'xlsx' : 'pdf';
  const mimeType =
    format === 'excel'
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'application/pdf';
  const filename = `${filenamePrefix}-${toIsoDate(new Date())}.${ext}`;

  if (Platform.OS === 'web') {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error(`Error ${response.status} al generar el archivo.`);
    }
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    return;
  }

  const destination = new File(Paths.document, filename);
  const downloadedFile = await File.downloadFileAsync(url, destination, {
    headers: { Authorization: `Bearer ${token}` },
    idempotent: true,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    Alert.alert('Archivo guardado', `El reporte se guardó en: ${downloadedFile.uri}`);
    return;
  }

  await Sharing.shareAsync(downloadedFile.uri, {
    mimeType,
    dialogTitle,
    UTI: format === 'excel' ? 'org.openxmlformats.spreadsheetml.sheet' : 'com.adobe.pdf',
  });
};

