import React, { createContext, useContext, useState } from 'react';
import CustomAlertModal from '../components/CustomAlertModal';

const AlertContext = createContext();

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'Aceptar',
    cancelText: null,
    onConfirm: null,
    onCancel: null,
  });

  const showAlert = (title, message, options = []) => {
    // options is usually an array of buttons, similar to Alert.alert(title, message, options)
    let config = {
      visible: true,
      title,
      message,
      type: 'info',
      confirmText: 'Aceptar',
      cancelText: null,
      onConfirm: null,
      onCancel: null,
    };

    if (options && options.length > 0) {
      if (options.length === 1) {
        config.confirmText = options[0].text || 'Aceptar';
        config.onConfirm = options[0].onPress || null;
        if (options[0].style === 'destructive') config.type = 'danger';
      } else if (options.length >= 2) {
        // Typically Cancel is first or second. 
        const cancelBtn = options.find(o => o.style === 'cancel') || options[0];
        const confirmBtn = options.find(o => o.style !== 'cancel') || options[1];

        config.cancelText = cancelBtn.text || 'Cancelar';
        config.onCancel = cancelBtn.onPress || null;
        
        config.confirmText = confirmBtn.text || 'Aceptar';
        config.onConfirm = confirmBtn.onPress || null;
        
        if (confirmBtn.style === 'destructive') config.type = 'danger';
      }
    }

    setAlertConfig(config);
  };

  const closeAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <CustomAlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
        onConfirm={alertConfig.onConfirm}
        onCancel={alertConfig.onCancel}
        onClose={closeAlert}
      />
    </AlertContext.Provider>
  );
};
