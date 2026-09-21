// App.js — Root of the Ambrosia Application
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Platform, TouchableOpacity, Linking, Modal } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './src/screens/HomeScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import CartScreen from './src/screens/CartScreen';
import AdminScreen from './src/screens/AdminScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import { CartProvider, useCart } from './src/context/CartContext';
import { AlertProvider } from './src/context/AlertContext';
import { COLORS, SIZES } from './src/constants/theme';
import { seedProductsIfEmpty } from './src/services/productService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Font from 'expo-font';
import { fetchQrUrl } from './src/services/productService'; // Para obtener el link del APK

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// --- Navigation Theme ---
const AmbrosiaNavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.bgPrimary,
    card: COLORS.bgSecondary,
    text: COLORS.textPrimary,
    border: COLORS.border,
    notification: COLORS.gold,
  },
};

// --- Shop Stack (Home + ProductDetail) ---
const ShopStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
    }}
  >
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
  </Stack.Navigator>
);

// --- Cart Tab Icon with Badge ---
const CartTabIcon = ({ color, focused }) => {
  const { itemCount } = useCart();
  return (
    <View style={{ position: 'relative' }}>
      <Ionicons name={focused ? 'bag' : 'bag-outline'} size={24} color={color} />
      {itemCount > 0 && (
        <View style={tabStyles.badge}>
          <Text style={tabStyles.badgeText}>{itemCount > 9 ? '9+' : itemCount}</Text>
        </View>
      )}
    </View>
  );
};

const tabStyles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: COLORS.gold,
    borderRadius: SIZES.radiusFull,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: COLORS.bgPrimary,
    fontSize: 9,
    fontWeight: '700',
  },
});

// --- Main Tab Navigator ---
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: COLORS.gold,
      tabBarInactiveTintColor: COLORS.textMuted,
      tabBarStyle: {
        backgroundColor: COLORS.bgSecondary,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        height: 85,
        paddingBottom: 30,
        paddingTop: 6,
        elevation: 0,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
      },
    })}
  >
    <Tab.Screen
      name="Tienda"
      component={ShopStack}
      options={{
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? 'storefront' : 'storefront-outline'} size={24} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="Cart"
      component={CartScreen}
      options={{
        title: 'Carrito',
        tabBarIcon: CartTabIcon,
      }}
    />
  </Tab.Navigator>
);

const RootStack = createNativeStackNavigator();

const AppNav = () => (
  <RootStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
    <RootStack.Screen name="Main" component={MainTabs} />
    <RootStack.Screen name="Admin" component={AdminScreen} />
    <RootStack.Screen name="AdminOrders" component={OrdersScreen} />
  </RootStack.Navigator>
);

// --- App Entry ---
export default function App() {
  const [initialized, setInitialized] = useState(false);
  const [policiesAccepted, setPoliciesAccepted] = useState(false);
  const [initError, setInitError] = useState(null);

  const [showWebPrompt, setShowWebPrompt] = useState(Platform.OS === 'web');
  const [apkUrl, setApkUrl] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        await Font.loadAsync({
          ...Ionicons.font,
        });

        await seedProductsIfEmpty();
        const accepted = await AsyncStorage.getItem('policies_accepted_v5');
        if (accepted === 'true') {
          setPoliciesAccepted(true);
        }

        const storedApk = await fetchQrUrl();
        if (storedApk) setApkUrl(storedApk);
        
        const webChoice = await AsyncStorage.getItem('@web_choice_made');
        if (webChoice) setShowWebPrompt(false);

      } catch (e) {
        // Fail silently — app works in offline mode
        console.warn('Init seed failed:', e.message);
      } finally {
        setInitialized(true);
      }
    };
    init();
  }, []);

  if (!initialized) {
    return (
      <View style={appStyles.splash}>
        <Text style={appStyles.splashLogo}>Thiago's</Text>
        <Text style={appStyles.splashTagline}>Licores & Snacks</Text>
        <ActivityIndicator size="large" color={COLORS.gold} style={{ marginTop: SIZES.lg }} />
      </View>
    );
  }

  const handleAcceptPolicies = async () => {
    try {
      await AsyncStorage.setItem('policies_accepted_v5', 'true');
      setPoliciesAccepted(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleWebContinue = async () => {
    await AsyncStorage.setItem('@web_choice_made', 'true');
    setShowWebPrompt(false);
  };

  if (!policiesAccepted) {
    return (
      <SafeAreaProvider>
        <AlertProvider>
          <PrivacyPolicyScreen onAccept={handleAcceptPolicies} />
        </AlertProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AlertProvider>
          <CartProvider>
            
            {showWebPrompt && (
              <Modal visible transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                  <View style={{ backgroundColor: COLORS.bgSecondary, padding: 30, borderRadius: 20, alignItems: 'center', maxWidth: 400, width: '100%', borderWidth: 1, borderColor: COLORS.gold }}>
                    <Ionicons name="phone-portrait-outline" size={50} color={COLORS.gold} style={{ marginBottom: 15 }} />
                    <Text style={{ color: COLORS.textPrimary, fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>¡Bienvenido a Thiago's!</Text>
                    <Text style={{ color: COLORS.textMuted, fontSize: 15, textAlign: 'center', marginBottom: 25, lineHeight: 22 }}>
                      Para una experiencia más rápida y completa, te recomendamos descargar nuestra Aplicación oficial (APK).
                    </Text>

                    <TouchableOpacity 
                      style={{ backgroundColor: COLORS.gold, width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 }}
                      onPress={() => apkUrl ? Linking.openURL(apkUrl) : alert('El administrador aún no ha cargado el APK.')}
                    >
                      <Text style={{ color: COLORS.bgPrimary, fontWeight: 'bold', fontSize: 16 }}>📲 Descargar Aplicación</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={{ backgroundColor: COLORS.bgTertiary, width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border }}
                      onPress={handleWebContinue}
                    >
                      <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold', fontSize: 16 }}>🌐 Usar Navegador Web</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            )}

            <NavigationContainer theme={AmbrosiaNavTheme}>
              <AppNav />
            </NavigationContainer>
          </CartProvider>
        </AlertProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const appStyles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    color: COLORS.gold,
    fontSize: 48,
    fontWeight: '700',
    fontStyle: 'italic',
    letterSpacing: 2,
  },
  splashTagline: {
    color: COLORS.textMuted,
    fontSize: 14,
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginTop: SIZES.xs,
  },
});
