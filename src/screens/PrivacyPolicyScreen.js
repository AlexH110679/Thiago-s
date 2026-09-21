import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useAlert } from '../context/AlertContext';

const PrivacyPolicyScreen = ({ onAccept }) => {
  const { showAlert } = useAlert();

  const handleCancel = () => {
    showAlert(
      'Gracias por ingresar',
      'Debes aceptar las políticas para usar la aplicación. ¡Hasta pronto!',
      [{ text: 'Salir', style: 'cancel', onPress: () => BackHandler.exitApp() }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgPrimary} />
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={48} color={COLORS.gold} />
        <Text style={styles.title}>Políticas de Privacidad y Manejo de Datos</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.paragraph}>
          En <Text style={styles.bold}>Thiago's Licores & Snacks</Text>, valoramos tu privacidad y nos comprometemos a proteger tus datos personales. 
          Al utilizar nuestra aplicación, te solicitaremos información necesaria para gestionar y enviar tus pedidos a domicilio de manera efectiva.
        </Text>

        <Text style={styles.subtitle}>1. Información que recopilamos</Text>
        <Text style={styles.paragraph}>
          Para completar tu pedido, necesitamos recopilar los siguientes datos:
          {'\n'}• <Text style={styles.bold}>Nombre completo</Text> (Para identificarte en la entrega).
          {'\n'}• <Text style={styles.bold}>Número de celular / WhatsApp</Text> (Para confirmar tu pedido y contactarte si hay novedades).
          {'\n'}• <Text style={styles.bold}>Dirección de entrega y ubicación</Text> (Para que nuestro domiciliario pueda llevar tus productos).
        </Text>

        <Text style={styles.subtitle}>2. Uso de tu información</Text>
        <Text style={styles.paragraph}>
          Los datos que proporcionas se utilizarán única y exclusivamente para:
          {'\n'}• Procesar y enviar tus pedidos.
          {'\n'}• Contactarte mediante WhatsApp para proporcionarte actualizaciones o aclarar detalles sobre tu pedido.
          {'\n'}• Elaborar reportes internos de ventas sin compartir tu información personal de forma pública.
        </Text>
        
        <Text style={styles.subtitle}>3. Privacidad y Seguridad</Text>
        <Text style={styles.paragraph}>
          No venderemos ni compartiremos tu información con terceros, a excepción del domiciliario que llevará el pedido a tu dirección. Tienes derecho a solicitar que se borren tus datos escribiéndonos a nuestro WhatsApp.
        </Text>

      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Al presionar "Aceptar", confirmas que has leído y aceptas el manejo de tus datos de acuerdo con nuestras políticas.
        </Text>
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.8}>
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptBtn} onPress={onAccept} activeOpacity={0.8}>
            <LinearGradient colors={[COLORS.gold, COLORS.goldDark]} style={styles.acceptBtnGradient}>
              <Text style={styles.acceptBtnText}>Aceptar</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.bgPrimary} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  header: {
    alignItems: 'center',
    padding: SIZES.lg,
    paddingTop: SIZES.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bgSecondary,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: SIZES.sm,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SIZES.lg,
  },
  subtitle: {
    color: COLORS.gold,
    fontSize: 18,
    fontWeight: '700',
    marginTop: SIZES.md,
    marginBottom: SIZES.xs,
  },
  paragraph: {
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: SIZES.sm,
  },
  bold: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  footer: {
    padding: SIZES.lg,
    backgroundColor: COLORS.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: SIZES.md,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
  acceptBtn: {
    flex: 1,
    borderRadius: SIZES.radiusFull,
    overflow: 'hidden',
  },
  acceptBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 6,
  },
  acceptBtnText: {
    color: COLORS.bgPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
});

export default PrivacyPolicyScreen;
