import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { X, ShieldCheck, FileText, CheckCircle2, ArrowLeft } from 'lucide-react-native';
import { useThemeColors } from '../context/ThemeContext';

interface PolicyModalProps {
  visible: boolean;
  onClose: () => void;
  onAccept?: () => void;
  initialTab?: 'terms' | 'privacy';
}

export const PolicyModal = ({
  visible,
  onClose,
  onAccept,
  initialTab = 'terms',
}: PolicyModalProps) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);

  React.useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
    }
  }, [visible, initialTab]);

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose} activeOpacity={0.7}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Marco Legal y Políticas</Text>
            <Text style={styles.headerSubtitle}>Programa Institucional EcoUNAN</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Selector de Pestaña */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'terms' && styles.tabButtonActive]}
            onPress={() => setActiveTab('terms')}
            activeOpacity={0.8}
          >
            <FileText size={16} color={activeTab === 'terms' ? '#FFFFFF' : colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'terms' && styles.tabTextActive]}>
              Términos de Uso
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'privacy' && styles.tabButtonActive]}
            onPress={() => setActiveTab('privacy')}
            activeOpacity={0.8}
          >
            <ShieldCheck size={16} color={activeTab === 'privacy' ? '#FFFFFF' : colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'privacy' && styles.tabTextActive]}>
              Privacidad y Datos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contenido del Documento */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
          {activeTab === 'terms' ? (
            <View style={styles.section}>
              <Text style={styles.updatedDate}>Última actualización: Octubre 2026 · Versión 1.0 Oficial</Text>

              <Text style={styles.heading}>1. Marco Institucional y Propósito</Text>
              <Text style={styles.paragraph}>
                La aplicación EcoUNAN es una plataforma tecnológica desarrollada por y para la comunidad universitaria de la
                Universidad Nacional Autónoma de Nicaragua (UNAN-Managua). Su objetivo principal es incentivar la cultura del
                reciclaje, la gestión ambiental responsable y la mitigación de residuos sólidos en todos los recintos universitarios.
              </Text>

              <Text style={styles.heading}>2. Registro y Cuentas Estudiantiles</Text>
              <Text style={styles.paragraph}>
                El acceso a la plataforma está destinado a estudiantes activos, docentes y personal administrativo. Al registrarte:
              </Text>
              <Text style={styles.bullet}>• Te comprometes a suministrar información verídica (nombre real, correo institucional y carnet/cédula).</Text>
              <Text style={styles.bullet}>• La cuenta es personal e intransferible. Cada estudiante solo puede poseer una cuenta activa.</Text>
              <Text style={styles.bullet}>• El uso de correos falsos o carnets de terceros resultará en la baja inmediata del usuario.</Text>

              <Text style={styles.heading}>3. Registro de Reciclaje y Asignación de Puntos</Text>
              <Text style={styles.paragraph}>
                Los ecoPuntos se otorgan según el peso y tipo de material entregado (PET, aluminio, cartón, papel y plástico).
              </Text>
              <Text style={styles.bullet}>• En modalidad presencial, la validación se realiza mediante pesaje verificado y código QR por brigadistas acreditados.</Text>
              <Text style={styles.bullet}>• En modalidad fotográfica, las fotos deben evidenciar claramente el material y estar sujetas a revisión.</Text>
              <Text style={styles.bullet}>• Queda estrictamente prohibido intentar alterar pesajes o subir imágenes duplicadas/falsas.</Text>

              <Text style={styles.heading}>4. Catálogo y Canje de Recompensas</Text>
              <Text style={styles.paragraph}>
                Los ecoPuntos no constituyen moneda de curso legal y no son canjeables por dinero en efectivo. Las recompensas
                están sujetas a stock disponible en los centros de acopio universitarios. Una vez canjeada una recompensa, el
                código QR generado es único y se invalida automáticamente tras la entrega del incentivo.
              </Text>

              <Text style={styles.heading}>5. Normas de Conducta y Sanciones</Text>
              <Text style={styles.paragraph}>
                Cualquier intento de vulneración a la seguridad informática de la plataforma o falsificación de entregas
                conllevará la suspensión permanente de la cuenta y notificación a las autoridades académicas correspondientes.
              </Text>
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.updatedDate}>Conforme a las normativas de protección de datos institucionales</Text>

              <Text style={styles.heading}>1. Información que Recopilamos</Text>
              <Text style={styles.paragraph}>
                EcoUNAN únicamente recopila la información estrictamente necesaria para la prestación del servicio:
              </Text>
              <Text style={styles.bullet}>• Datos de identificación: Nombre completo, correo electrónico institucional (@unan.edu.ni) y número de carnet.</Text>
              <Text style={styles.bullet}>• Datos académicos: Facultad y carrera para fines de estadísticas interfacultades y rankings.</Text>
              <Text style={styles.bullet}>• Registros de actividad: Historial de pesajes de reciclaje, puntos acumulados y canjes realizados.</Text>
              <Text style={styles.bullet}>• Evidencias fotográficas: Fotografías tomadas voluntariamente para validar entregas de reciclaje.</Text>

              <Text style={styles.heading}>2. Finalidad del Tratamiento de Datos</Text>
              <Text style={styles.paragraph}>
                Tus datos se utilizan con los siguientes fines:
              </Text>
              <Text style={styles.bullet}>• Generar indicadores de sostenibilidad universitaria y cálculo de reducción de huella de carbono.</Text>
              <Text style={styles.bullet}>• Administrar tu saldo de ecoPuntos y validar canjes de incentivos en acopios oficiales.</Text>
              <Text style={styles.bullet}>• Enviar notificaciones relacionadas con tus reciclajes, subidas de rango o novedades del programa.</Text>

              <Text style={styles.heading}>3. Confidencialidad y No Comercialización</Text>
              <Text style={styles.paragraph}>
                La UNAN-Managua y el equipo de EcoUNAN <Text style={{ fontWeight: 'bold' }}>NUNCA</Text> venderán, comercializarán
                ni transferirán tus datos personales a empresas privadas ni terceros con fines publicitarios. Toda la información
                reside en bases de datos con cifrado TLS/SSL y contraseñas protegidas mediante algoritmos unidireccionales bcrypt.
              </Text>

              <Text style={styles.heading}>4. Derechos del Usuario (Acceso, Rectificación y Cancelación)</Text>
              <Text style={styles.paragraph}>
                Puedes consultar tu información en cualquier momento desde tu Perfil. Asimismo, tienes derecho a solicitar la
                corrección de datos desactualizados o la eliminación definitiva de tu cuenta y registros enviando una solicitud a
                soporte@ecounan.edu.ni o a través de la sección de Configuración de la aplicación.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Botón Inferior */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              if (onAccept) onAccept();
              onClose();
            }}
            activeOpacity={0.8}
          >
            <CheckCircle2 size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.actionButtonText}>
              {onAccept ? 'Aceptar y Continuar' : 'Entendido'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const useStyles = (colors: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    headerTitleContainer: {
      flex: 1,
      marginLeft: 8,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    closeButton: {
      padding: 8,
      borderRadius: 20,
    },
    tabContainer: {
      flexDirection: 'row',
      padding: 12,
      gap: 10,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tabButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tabButtonActive: {
      backgroundColor: '#16A34A',
      borderColor: '#16A34A',
    },
    tabText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    tabTextActive: {
      color: '#FFFFFF',
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    section: {
      gap: 10,
    },
    updatedDate: {
      fontSize: 12,
      fontWeight: '600',
      color: '#16A34A',
      marginBottom: 12,
    },
    heading: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
      marginTop: 14,
      marginBottom: 4,
    },
    paragraph: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 22,
      opacity: 0.88,
    },
    bullet: {
      fontSize: 13.5,
      color: colors.textSecondary,
      lineHeight: 21,
      paddingLeft: 8,
      marginVertical: 2,
    },
    footer: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#16A34A',
      paddingVertical: 14,
      borderRadius: 14,
    },
    actionButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
    },
  });
