const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'src/screens');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') && f !== 'PrivacyPolicyScreen.js' && f !== 'HomeScreen.js');

for(const file of files) {
  const p = path.join(dir, file);
  let content = fs.readFileSync(p, 'utf-8');
  
  if (content.includes('Alert.alert(')) {
    // 1. replace Alert.alert( with showAlert(
    content = content.replace(/Alert\.alert\(/g, 'showAlert(');
    
    // 2. ensure useAlert is imported
    if (!content.includes('useAlert')) {
      if (content.includes('../context/CartContext')) {
        content = content.replace(/(import .*? from '..\/context\/CartContext';)/, "$1\nimport { useAlert } from '../context/AlertContext';");
      } else {
        content = content.replace(/(import React.*? from 'react';)/, "$1\nimport { useAlert } from '../context/AlertContext';");
      }
    }

    // 3. inject showAlert hook
    if (file === 'CartScreen.js') {
      content = content.replace(/(const {[\s\S]*?} = useCart\(\);)/, "$1\n  const { showAlert } = useAlert();");
    } else if (file === 'ProductDetailScreen.js') {
      content = content.replace(/(const { addToCart } = useCart\(\);)/, "$1\n  const { showAlert } = useAlert();");
    } else if (file === 'AdminScreen.js') {
      content = content.replace(/(const AdminScreen = \({[^}]*}\) => {)/, "$1\n  const { showAlert } = useAlert();");
    } else if (file === 'OrdersScreen.js') {
      content = content.replace(/(const OrdersScreen = \({[^}]*}\) => {)/, "$1\n  const { showAlert } = useAlert();");
    }
    
    fs.writeFileSync(p, content, 'utf-8');
    console.log('Fixed ' + file);
  }
}
