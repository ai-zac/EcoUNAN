import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { ArrowLeft, ScanLine } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { RecycleService } from '../api/services/recycle.service';

export const QRScannerScreen = ({ navigation }: any) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: any) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);

    try {
      await RecycleService.scanQR(data);
      Alert.alert(
        '¡Éxito!',
        'El reciclaje ha sido validado y los puntos se han sumado a tu cuenta automáticamente.',
        [{ text: 'Aceptar', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error(error);
      Alert.alert(
        'Error',
        'No se pudo validar el código QR. Puede que no sea válido o ya haya sido utilizado.',
        [{ text: 'Intentar de nuevo', onPress: () => { setScanned(false); setLoading(false); } }]
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
        <Text style={styles.title}>Escanear QR Admin</Text>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
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
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Validando reciclaje...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  cameraContainer: { flex: 1, overflow: 'hidden', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
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
