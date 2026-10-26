import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { ArrowLeft, ScanLine, Sparkles, QrCode } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { RecycleService } from '../api/services/recycle.service';
import { AdminService } from '../api/services/admin.service';

export const QRScannerScreen = ({ navigation, route }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);
  const isRedemption = route.params?.scanningRedemption === true;

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(
    isRedemption ? 'Validando entrega de recompensa...' : 'Validando y asignando puntos...'
  );

  const lockRef = useRef(false);

  const resetScan = () => {
    lockRef.current = false;
    setScanned(false);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: any) => {
    if (lockRef.current) return;
    lockRef.current = true;
    setScanned(true);

    try {
      // 1. Caso QR de Canje (Para Administrador / Brigadista)
      if (typeof data === 'string' && data.startsWith('REDEMPTION-')) {
        setLoadingMessage('Validando entrega de recompensa...');
        setLoading(true);
        console.log('[QR Scanner] Redemption QR detected:', data);
        const result = await AdminService.scanRedemptionQR(data);
        navigation.replace('RedemptionSuccess', { redemption: result });
        return;
      }

      setLoadingMessage('Validando y asignando puntos...');
      setLoading(true);

      // 2. Caso QR de Aprobación de Reciclaje (Para Estudiante)
      let parsed: any = null;
      try {
        parsed = JSON.parse(data);
      } catch {
        // no es json
      }

      if (parsed?.type === 'eco-approve') {
        const record = await RecycleService.confirmPresential(data);
        // Navegación instantánea a la pantalla de celebración
        navigation.replace('RecycleSuccess', { recycle: record });
        return;
      }

      // 3. Código no reconocido
      Alert.alert(
        'QR no reconocido',
        'Este código QR no corresponde a ninguna operación de reciclaje o canje de EcoUNAN.',
        [{ text: 'Intentar de nuevo', onPress: resetScan }]
      );
    } catch (error: any) {
      console.error('[QR Scanner Error]', error);
      const serverMsg = error?.response?.data?.error;
      Alert.alert(
        'No se pudo validar',
        serverMsg || 'No se pudo procesar el código QR. Verifica que sea el código de tu solicitud y que no haya expirado.',
        [{ text: 'Intentar de nuevo', onPress: resetScan }]
      );
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.permissionText}>Solicitando permiso de cámara...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Sin acceso a cámara</Text>
        </View>
        <View style={styles.container}>
          <Text style={styles.permissionText}>
            Se requiere permiso para usar la cámara y escanear el código QR del brigadista.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTextCol}>
          <Text style={styles.title}>
            {isRedemption ? 'Escanear QR de Canje' : 'Escanear QR de Brigadista'}
          </Text>
          <Text style={styles.subtitle}>
            {isRedemption
              ? 'Apunta al código del estudiante para entregar premio'
              : 'Detectará tu solicitud automáticamente'}
          </Text>
        </View>
      </View>

      {/* Camera Viewfinder */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />

        {/* Viewfinder Target Overlay */}
        <View style={styles.overlay}>
          <View style={styles.targetFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            <ScanLine size={180} color="rgba(34, 197, 94, 0.6)" strokeWidth={1.5} />
          </View>

          <View style={styles.hintPill}>
            <Sparkles size={14} color="#22C55E" />
            <Text style={styles.hintPillText}>
              {isRedemption
                ? 'Apunta al QR del usuario'
                : 'Apunta al QR del brigadista'}
            </Text>
          </View>
        </View>
      </View>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>{loadingMessage}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#000000',
    },
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000000',
      padding: 24,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.m,
      paddingVertical: 14,
      backgroundColor: '#000000',
    },
    backButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      borderWidth: 1,
      borderColor: '#334155',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
      backgroundColor: '#0F172A',
    },
    headerTextCol: {
      flex: 1,
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: -0.2,
    },
    subtitle: {
      fontSize: 12,
      color: '#94A3B8',
      marginTop: 2,
    },
    cameraContainer: {
      flex: 1,
      overflow: 'hidden',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      position: 'relative',
      backgroundColor: '#000000',
    },
    overlay: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.35)',
    },
    targetFrame: {
      width: 250,
      height: 250,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    corner: {
      position: 'absolute',
      width: 24,
      height: 24,
      borderColor: '#22C55E',
    },
    cornerTL: {
      top: 0,
      left: 0,
      borderTopWidth: 3,
      borderLeftWidth: 3,
      borderTopLeftRadius: 8,
    },
    cornerTR: {
      top: 0,
      right: 0,
      borderTopWidth: 3,
      borderRightWidth: 3,
      borderTopRightRadius: 8,
    },
    cornerBL: {
      bottom: 0,
      left: 0,
      borderBottomWidth: 3,
      borderLeftWidth: 3,
      borderBottomLeftRadius: 8,
    },
    cornerBR: {
      bottom: 0,
      right: 0,
      borderBottomWidth: 3,
      borderRightWidth: 3,
      borderBottomRightRadius: 8,
    },
    hintPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      marginTop: 36,
      borderWidth: 1,
      borderColor: '#334155',
    },
    hintPillText: {
      color: '#F8FAFC',
      fontSize: 13,
      fontWeight: '600',
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(0,0,0,0.85)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    },
    loadingText: {
      color: '#FFFFFF',
      marginTop: 16,
      fontSize: 15,
      fontWeight: '700',
    },
    permissionText: {
      color: '#E2E8F0',
      fontSize: 15,
      textAlign: 'center',
      lineHeight: 22,
    },
  });
