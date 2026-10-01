import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { ArrowLeft, ScanLine } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { RecycleService } from '../api/services/recycle.service';
import { AdminService } from '../api/services/admin.service';

export const QRScannerScreen = ({ navigation, route }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);
  const awaitingApproval: boolean = route.params?.awaitingApproval === true;

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  
  
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
    setLoading(true);

    try {
      
      
      if (typeof data === 'string' && data.startsWith('REDEMPTION-')) {
        console.log('[QR Scanner] Redemption QR detected:', data);
        const result = await AdminService.scanRedemptionQR(data);
        console.log('[QR Scanner] Redemption completed successfully');
        navigation.replace('RedemptionSuccess', { redemption: result });
        return;
      }

      
      let parsed: any = null;
      try { parsed = JSON.parse(data); } catch {  }

      
      if (parsed?.type === 'eco-approve') {
        const record = await RecycleService.confirmPresential(data);
        Alert.alert(
          '¡Reciclaje validado! ♻️',
          `Tu entrega presencial fue confirmada. Ganaste +${record.totalPoints ?? 0} puntos.`,
          [{ text: 'Ver éxito', onPress: () => navigation.replace('RecycleSuccess', { recycle: record }) }]
        );
        return;
      }

      
      Alert.alert(
        'QR no reconocido',
        'Este código QR no corresponde a ninguna operación de EcoUNAN.',
        [{ text: 'Intentar de nuevo', onPress: resetScan }]
      );
    } catch (error: any) {
      console.error('[QR Scanner Error]', error);
      Alert.alert(
        'Error',
        error?.response?.data?.error || 'No se pudo procesar el código QR. Puede que no sea válido o ya haya sido utilizado.',
        [{ text: 'Intentar de nuevo', onPress: resetScan }]
      );
    }
  };

  if (hasPermission === null) {
    return <View style={styles.container}><Text>Solicitando permiso de cámara...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.container}><Text>Sin acceso a la cámara</Text></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {route?.params?.scanningRedemption ? "Escanear QR de Usuario" : (awaitingApproval ? 'Esperando QR del brigadista' : 'Escanear QR Admin')}
        </Text>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        />
        <View style={styles.overlay}>
          <ScanLine size={250} color="rgba(255, 255, 255, 0.4)" strokeWidth={1} />
        </View>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Validando reciclaje...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000000' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: theme.spacing.m, 
    paddingTop: theme.spacing.xl,
    backgroundColor: '#000'
  },
  backButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#333', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  title: { fontSize: 22, fontWeight: '900', color: '#FFFFFF' },
  cameraContainer: { flex: 1, overflow: 'hidden', borderTopLeftRadius: 30, borderTopRightRadius: 30, position: 'relative' },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: { color: 'white', marginTop: 16, fontSize: 16, fontWeight: 'bold' }
});
