// src/components/CustomAlertModal.js
import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

const CustomAlertModal = ({
  visible,
  title,
  message,
  type = 'info', // 'info' | 'success' | 'warning' | 'danger'
  confirmText = 'Aceptar',
  cancelText = null,
  onConfirm,
  onCancel,
  onClose,
}) => {
  if (!visible) return null;

  const handleClose = () => {
    if (onClose) onClose();
  };

  const getIconName = () => {
    switch (type) {
      case 'danger':
        return 'trash';
      case 'warning':
        return 'alert-circle';
      case 'success':
        return 'checkmark-circle';
      default:
        return 'information-circle';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'danger':
        return COLORS.danger;
      case 'warning':
        return COLORS.info;
      case 'success':
        return COLORS.gold;
      default:
        return COLORS.purple;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'danger':
        return COLORS.dangerSoft;
      case 'warning':
        return COLORS.infoSoft;
      case 'success':
        return COLORS.goldSoft;
      default:
        return COLORS.purpleSoft;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Icon Header */}
          <View style={[styles.iconCircle, { backgroundColor: getIconBg() }]}>
            <Ionicons name={getIconName()} size={36} color={getIconColor()} />
          </View>

          {/* Title & Message */}
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            {cancelText ? (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  if (onCancel) onCancel();
                  handleClose();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelText}>{cancelText}</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                type === 'danger' && { backgroundColor: COLORS.danger },
                type === 'success' && { backgroundColor: COLORS.gold },
                !cancelText && { flex: 1 },
              ]}
              onPress={() => {
                if (onConfirm) onConfirm();
                handleClose();
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.confirmText,
                  type === 'success' && { color: COLORS.bgPrimary },
                  type === 'danger' && { color: '#ffffff' },
                ]}
              >
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1a1a24',
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    color: COLORS.bgPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
});

export default CustomAlertModal;
