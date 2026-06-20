// src/screens/CartScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ScrollView,
  Modal,
  StatusBar,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, CATEGORY_LABELS } from '../constants/theme';
import { useCart } from '../context/CartContext';
import { createOrder } from '../services/productService';

const CartScreen = ({ navigation }) => {
  const {
    items,
    subtotal,
    discountAmount,
    deliveryFee,
    total,
    itemCount,
    promoCode,
    discountPercent,
    increment,
    decrement,
    removeItem,
    clearCart,
    applyPromo,
    removePromo,
  } = useCart();

  const [promoInput, setPromoInput] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [deliveryModalVisible, setDeliveryModalVisible] = useState(false);
  const [deliveryData, setDeliveryData] = useState({
    nombre: '',
    celular: '',
    direccion: '',
    barrio: '',
    detalles: '',
  });
  const [orderData, setOrderData] = useState(null);

  const formatPrice = (price) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price);

  const handlePromo = () => {
    if (!promoInput.trim()) return;
    const result = applyPromo(promoInput);
    if (result.success) {
      Alert.alert('¡Descuento aplicado!', `Código ${promoInput.toUpperCase()} activo: ${result.discount}% de descuento.`);
      setPromoInput('');
    } else {
      Alert.alert('Código inválido', 'El código ingresado no es válido. Intenta con THIAGO10, FIESTA20 o LICOR15.');
    }
  };

  const promptDeliveryForm = () => {
    if (items.length === 0) return;
    setDeliveryModalVisible(true);
  };

  const handleCheckout = async () => {
    if (!deliveryData.nombre || !deliveryData.celular || !deliveryData.direccion || !deliveryData.barrio) {
      Alert.alert('Datos incompletos', 'Por favor, completa los campos obligatorios (Nombre, Celular, Dirección y Barrio).');
      return;
    }

    setCheckoutLoading(true);
    try {
      const order = await createOrder({
        items,
        subtotal,
        discountAmount,
        total,
        promoCode,
      });
      setOrderData({ ...order, itemsSnapshot: [...items] });
      
      // WhatsApp Message Formatting
      const ADMIN_PHONE = "573114661605"; // Cambiar por el número real del administrador
      let msg = `Hola Thiago's Licores, quiero realizar el siguiente pedido (Orden #${order.id}):\n\n`;
      items.forEach(item => {
        msg += `- ${item.quantity}x ${item.name} (${formatPrice(item.price)})\n`;
      });
      msg += `\nSubtotal: ${formatPrice(subtotal)}`;
      if (discountAmount > 0) msg += `\nDescuento: -${formatPrice(discountAmount)}`;
      if (deliveryFee > 0) msg += `\nDomicilio: ${formatPrice(deliveryFee)}`;
      msg += `\n*TOTAL A PAGAR: ${formatPrice(total)}*\n\n`;
      msg += `*Datos de envío:*\n`;
      msg += `Nombre: ${deliveryData.nombre}\n`;
      msg += `Celular: ${deliveryData.celular}\n`;
      msg += `Dirección: ${deliveryData.direccion}\n`;
      msg += `Barrio: ${deliveryData.barrio}\n`;
      if (deliveryData.detalles) msg += `Casa/Apto: ${deliveryData.detalles}\n`;
      
      const whatsappUrl = `whatsapp://send?phone=${ADMIN_PHONE}&text=${encodeURIComponent(msg)}`;
      
      clearCart();
      removePromo();
      setDeliveryModalVisible(false);
      setReceiptVisible(true);
      
      try {
        await Linking.openURL(whatsappUrl);
      } catch (err) {
        console.log("No se pudo abrir WhatsApp:", err);
      }
      
    } catch (e) {
      Alert.alert('Error al procesar', e.message || 'No se pudo completar la compra. Verifica tu conexión.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCloseReceipt = () => {
    setReceiptVisible(false);
    setDeliveryData({ nombre: '', celular: '', direccion: '', barrio: '', detalles: '' });
    navigation.navigate('Tienda');
  };

  const renderItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image
        source={{ uri: item.image_url }}
        style={styles.cartItemImage}
        resizeMode="cover"
      />
      <View style={styles.cartItemDetails}>
        <Text style={styles.cartItemType}>{item.type}</Text>
        <Text style={styles.cartItemName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.cartItemPrice}>{formatPrice(item.price)}</Text>
      </View>
      <View style={styles.cartItemActions}>
        <View style={styles.qtyControl}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => decrement(item.id)}>
            <Ionicons name="remove" size={14} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.qtyValue}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => increment(item.id)}
            disabled={item.quantity >= item.stock}
          >
            <Ionicons
              name="add"
              size={14}
              color={item.quantity >= item.stock ? COLORS.textMuted : COLORS.textPrimary}
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.cartItemTotal}>{formatPrice(item.price * item.quantity)}</Text>
        <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.removeBtn}>
          <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgPrimary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Carrito</Text>
        {items.length > 0 && (
          <TouchableOpacity
            onPress={() => Alert.alert('Vaciar carrito', '¿Deseas eliminar todos los artículos?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Vaciar', style: 'destructive', onPress: clearCart },
            ])}
          >
            <Text style={styles.clearBtn}>Vaciar</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyCart}>
          <View style={styles.emptyCartIcon}>
            <Ionicons name="bag-outline" size={60} color={COLORS.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
          <Text style={styles.emptyDesc}>Agrega productos desde el catálogo para comenzar tu pedido.</Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => navigation.navigate('Tienda')}
          >
            <LinearGradient colors={[COLORS.gold, COLORS.goldDark]} style={styles.emptyBtnGradient}>
              <Text style={styles.emptyBtnText}>Ver Catálogo</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListFooterComponent={
              <View style={styles.summaryCard}>
                {/* Promo Code */}
                <Text style={styles.promoTitle}>Código de Descuento</Text>
                {promoCode ? (
                  <View style={styles.promoApplied}>
                    <Ionicons name="pricetag" size={16} color={COLORS.success} />
                    <Text style={styles.promoAppliedText}>{promoCode} — {discountPercent}% aplicado</Text>
                    <TouchableOpacity onPress={removePromo}>
                      <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.promoRow}>
                    <TextInput
                      style={styles.promoInput}
                      placeholder="Ej: THIAGO10"
                      placeholderTextColor={COLORS.textMuted}
                      value={promoInput}
                      onChangeText={setPromoInput}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity style={styles.promoBtn} onPress={handlePromo}>
                      <Text style={styles.promoBtnText}>Aplicar</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Order Summary */}
                <View style={styles.orderSummary}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Subtotal ({itemCount} items)</Text>
                    <Text style={styles.summaryVal}>{formatPrice(subtotal)}</Text>
                  </View>
                  {discountAmount > 0 && (
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryKey, { color: COLORS.success }]}>Descuento</Text>
                      <Text style={[styles.summaryVal, { color: COLORS.success }]}>-{formatPrice(discountAmount)}</Text>
                    </View>
                  )}
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Domicilio</Text>
                    <Text style={styles.summaryVal}>{formatPrice(deliveryFee)}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.totalKey}>TOTAL VENTA</Text>
                    <Text style={styles.totalVal}>{formatPrice(total)}</Text>
                  </View>
                </View>
              </View>
            }
          />

          {/* Checkout Button */}
          <View style={styles.checkoutBar}>
            <View style={styles.checkoutInfo}>
              <Text style={styles.checkoutLabel}>Total a pagar</Text>
              <Text style={styles.checkoutTotal}>{formatPrice(total)}</Text>
            </View>
            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={promptDeliveryForm}
              disabled={checkoutLoading}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[COLORS.gold, COLORS.goldDark]}
                style={styles.checkoutBtnGradient}
              >
                {checkoutLoading ? (
                  <Text style={styles.checkoutBtnText}>Cargando...</Text>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.bgPrimary} />
                    <Text style={styles.checkoutBtnText}>Confirmar Pedido</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Delivery Form Modal */}
      <Modal visible={deliveryModalVisible} transparent animationType="slide">
        <View style={styles.receiptOverlay}>
          <View style={[styles.receiptModal, { padding: 0 }]}>
            <View style={{ padding: SIZES.lg, width: '100%' }}>
              <Text style={styles.receiptTitle}>Datos de Envío</Text>
              <Text style={[styles.receiptSubtitle, { marginBottom: SIZES.md }]}>
                Por favor, ingresa los datos para entregar tu pedido.
              </Text>
              
              <TextInput
                style={styles.inputField}
                placeholder="Nombre completo *"
                placeholderTextColor={COLORS.textMuted}
                value={deliveryData.nombre}
                onChangeText={(text) => setDeliveryData({ ...deliveryData, nombre: text })}
              />
              <TextInput
                style={styles.inputField}
                placeholder="Celular *"
                keyboardType="phone-pad"
                placeholderTextColor={COLORS.textMuted}
                value={deliveryData.celular}
                onChangeText={(text) => setDeliveryData({ ...deliveryData, celular: text })}
              />
              <TextInput
                style={styles.inputField}
                placeholder="Dirección completa *"
                placeholderTextColor={COLORS.textMuted}
                value={deliveryData.direccion}
                onChangeText={(text) => setDeliveryData({ ...deliveryData, direccion: text })}
              />
              <TextInput
                style={styles.inputField}
                placeholder="Barrio *"
                placeholderTextColor={COLORS.textMuted}
                value={deliveryData.barrio}
                onChangeText={(text) => setDeliveryData({ ...deliveryData, barrio: text })}
              />
              <TextInput
                style={styles.inputField}
                placeholder="Casa / Apto / Detalles (Opcional)"
                placeholderTextColor={COLORS.textMuted}
                value={deliveryData.detalles}
                onChangeText={(text) => setDeliveryData({ ...deliveryData, detalles: text })}
              />
              
              <View style={{ flexDirection: 'row', gap: SIZES.sm, marginTop: SIZES.md }}>
                <TouchableOpacity
                  style={{ flex: 1, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.radiusMd }}
                  onPress={() => setDeliveryModalVisible(false)}
                >
                  <Text style={{ color: COLORS.textMuted, fontWeight: '700' }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, borderRadius: SIZES.radiusMd, overflow: 'hidden' }}
                  onPress={handleCheckout}
                  disabled={checkoutLoading}
                >
                  <LinearGradient colors={[COLORS.gold, COLORS.goldDark]} style={{ paddingVertical: 15, alignItems: 'center' }}>
                    <Text style={{ color: COLORS.bgPrimary, fontWeight: '700' }}>
                      {checkoutLoading ? 'Enviando...' : 'Confirmar Pedido'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Receipt Modal */}
      <Modal
        visible={receiptVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
      >
        <View style={styles.receiptOverlay}>
          <View style={styles.receiptModal}>
            {/* Header */}
            <View style={styles.receiptHeader}>
              <View style={styles.receiptCheckIcon}>
                <Ionicons name="checkmark-circle" size={52} color={COLORS.success} />
              </View>
              <Text style={styles.receiptTitle}>¡Pedido Exitoso!</Text>
              <Text style={styles.receiptSubtitle}>Gracias por elegir Thiago's Licores & Snacks</Text>
            </View>

            {/* Order Details */}
            <View style={styles.receiptDivider}>
              <View style={styles.receiptDividerLine} />
              <Text style={styles.receiptDividerText}>FACTURA</Text>
              <View style={styles.receiptDividerLine} />
            </View>

            {orderData && (
              <View style={styles.receiptMeta}>
                <View style={styles.receiptMetaRow}>
                  <Text style={styles.receiptMetaKey}>Fecha</Text>
                  <Text style={styles.receiptMetaVal}>{new Date(orderData.created_at).toLocaleString('es-CO')}</Text>
                </View>
                <View style={styles.receiptMetaRow}>
                  <Text style={styles.receiptMetaKey}>N° Pedido</Text>
                  <Text style={[styles.receiptMetaVal, { color: COLORS.gold }]}>#{orderData.id?.toString().padStart(4, '0') || 'N/A'}</Text>
                </View>

                <View style={{ marginTop: 10, marginBottom: 10 }}>
                  <Text style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 6 }}>Productos:</Text>
                  {orderData.itemsSnapshot?.map((it, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ color: COLORS.textPrimary, fontSize: 13, flex: 1 }}>{it.quantity}x {it.name}</Text>
                      <Text style={{ color: COLORS.textPrimary, fontSize: 13 }}>{formatPrice(it.price * it.quantity)}</Text>
                    </View>
                  ))}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text style={{ color: COLORS.textPrimary, fontSize: 13, flex: 1 }}>Domicilio</Text>
                    <Text style={{ color: COLORS.textPrimary, fontSize: 13 }}>$ 4.000</Text>
                  </View>
                </View>

                <View style={styles.receiptMetaRow}>
                  <Text style={styles.receiptMetaKey}>Valor a pagar</Text>
                  <Text style={[styles.receiptMetaVal, { color: COLORS.success, fontWeight: '700', fontSize: 18 }]}>
                    {formatPrice(orderData.total)}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.receiptCloseBtn} onPress={handleCloseReceipt}>
              <LinearGradient colors={[COLORS.gold, COLORS.goldDark]} style={styles.receiptCloseBtnGrad}>
                <Text style={styles.receiptCloseBtnText}>Entendido</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  clearBtn: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCart: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.lg,
    gap: SIZES.sm,
  },
  emptyCartIcon: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.sm,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  emptyDesc: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SIZES.sm,
  },
  emptyBtn: {
    borderRadius: SIZES.radiusFull,
    overflow: 'hidden',
    marginTop: SIZES.sm,
  },
  emptyBtnGradient: {
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  emptyBtnText: {
    color: COLORS.bgPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.sm,
    paddingBottom: SIZES.md,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.sm,
    overflow: 'hidden',
  },
  cartItemImage: {
    width: 80,
    height: 90,
  },
  cartItemDetails: {
    flex: 1,
    padding: SIZES.sm,
    justifyContent: 'center',
  },
  cartItemType: {
    color: COLORS.gold,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cartItemName: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 4,
  },
  cartItemPrice: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  cartItemActions: {
    padding: SIZES.sm,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgTertiary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 6,
    minWidth: 24,
    textAlign: 'center',
  },
  cartItemTotal: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  removeBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.dangerSoft,
    borderRadius: 6,
  },
  summaryCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SIZES.md,
    marginTop: SIZES.sm,
    gap: SIZES.sm,
  },
  promoTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SIZES.xs,
  },
  promoRow: {
    flexDirection: 'row',
    gap: SIZES.sm,
  },
  promoInput: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusSm,
    paddingHorizontal: SIZES.sm + 4,
    paddingVertical: SIZES.sm,
    color: COLORS.textPrimary,
    fontSize: 14,
    height: 44,
  },
  inputField: {
    backgroundColor: COLORS.bgPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusSm,
    paddingHorizontal: SIZES.sm + 4,
    paddingVertical: SIZES.sm,
    color: COLORS.textPrimary,
    fontSize: 14,
    height: 44,
    marginBottom: SIZES.sm,
    width: '100%',
  },
  promoBtn: {
    backgroundColor: COLORS.goldSoft,
    borderRadius: SIZES.radiusSm,
    paddingHorizontal: SIZES.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.gold + '44',
    height: 44,
  },
  promoBtnText: {
    color: COLORS.gold,
    fontWeight: '700',
    fontSize: 13,
  },
  promoApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
    backgroundColor: COLORS.successSoft,
    borderRadius: SIZES.radiusSm,
    padding: SIZES.sm + 4,
    borderWidth: 1,
    borderColor: COLORS.success + '33',
  },
  promoAppliedText: {
    flex: 1,
    color: COLORS.success,
    fontWeight: '600',
    fontSize: 13,
  },
  orderSummary: {
    gap: SIZES.sm,
    marginTop: SIZES.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryKey: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  summaryVal: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SIZES.xs,
  },
  totalKey: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalVal: {
    color: COLORS.gold,
    fontSize: 22,
    fontWeight: '700',
  },
  checkoutBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm + 4,
    backgroundColor: COLORS.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SIZES.md,
  },
  checkoutInfo: {
    flex: 1,
  },
  checkoutLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  checkoutTotal: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  checkoutBtn: {
    borderRadius: SIZES.radiusFull,
    overflow: 'hidden',
  },
  checkoutBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  checkoutBtnText: {
    color: COLORS.bgPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  // Receipt Modal
  receiptOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.md,
  },
  receiptModal: {
    backgroundColor: '#1a1a22',
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  receiptCheckIcon: {
    marginBottom: SIZES.sm,
  },
  receiptTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  receiptSubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  receiptDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
    marginVertical: SIZES.md,
    width: '100%',
  },
  receiptDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  receiptDividerText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  receiptMeta: {
    width: '100%',
    gap: SIZES.sm,
    marginBottom: SIZES.lg,
  },
  receiptMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  receiptMetaKey: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  receiptMetaVal: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  receiptCloseBtn: {
    borderRadius: SIZES.radiusFull,
    overflow: 'hidden',
    width: '100%',
  },
  receiptCloseBtnGrad: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  receiptCloseBtnText: {
    color: COLORS.bgPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
});

export default CartScreen;
