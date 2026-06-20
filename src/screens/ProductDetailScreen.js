// src/screens/ProductDetailScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, CATEGORY_LABELS, CATEGORIES } from '../constants/theme';
import { useCart } from '../context/CartContext';

const { width, height } = Dimensions.get('window');

const ProductDetailScreen = ({ route, navigation }) => {
  const { product } = route.params;
  const { addItem, removeItem, increment, decrement, items } = useCart();
  const [quantity, setQuantity] = useState(1);

  const cartItem = items.find(i => i.id === product.id);
  const inCart = !!cartItem;
  const isOutOfStock = product.stock <= 0;
  const catConfig = CATEGORIES.find(c => c.id === product.category) || CATEGORIES[0];

  const formatPrice = (price) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price);

  const handleAddOrUpdate = () => {
    if (!isOutOfStock) {
      addItem(product);
      navigation.navigate('Cart');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header Back Button */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.image_url }}
            style={styles.productImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', COLORS.bgPrimary]}
            style={styles.imageGradient}
          />
          {/* Module Badge */}
          <LinearGradient
            colors={catConfig.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.moduleBadge}
          >
            <Ionicons name={catConfig.icon} size={14} color="#fff" />
            <Text style={styles.moduleBadgeText}>{CATEGORY_LABELS[product.category]}</Text>
          </LinearGradient>
        </View>

        {/* Product Content */}
        <View style={styles.contentContainer}>
          {/* Type & Name */}
          <Text style={styles.productType}>{product.type}</Text>
          <Text style={styles.productName}>{product.name}</Text>

          {/* Price & Stock Row */}
          <View style={styles.priceStockRow}>
            <View>
              <Text style={styles.priceLabel}>Precio unitario</Text>
              <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
            </View>
            <View style={styles.stockBox}>
              <Ionicons
                name={product.stock > 5 ? 'checkmark-circle' : 'alert-circle'}
                size={16}
                color={product.stock > 5 ? COLORS.success : COLORS.danger}
              />
              <Text style={[
                styles.stockText,
                { color: product.stock > 5 ? COLORS.success : COLORS.danger }
              ]}>
                {product.stock > 0 ? `${product.stock} disponibles` : 'Sin stock'}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.sectionLabel}>Descripción</Text>
          <Text style={styles.description}>{product.description || 'Sin descripción disponible.'}</Text>

          {/* Details Card */}
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>Módulo</Text>
              <Text style={styles.detailValue}>{CATEGORY_LABELS[product.category]}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>Tipo / Categoría</Text>
              <Text style={styles.detailValue}>{product.type}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>Stock</Text>
              <Text style={[
                styles.detailValue,
                { color: product.stock > 5 ? COLORS.success : COLORS.danger }
              ]}>
                {product.stock} unidades
              </Text>
            </View>
            {inCart && (
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>En tu carrito</Text>
                <Text style={[styles.detailValue, { color: COLORS.gold }]}>
                  {cartItem.quantity} unidad{cartItem.quantity > 1 ? 'es' : ''}
                </Text>
              </View>
            )}
          </View>

          {/* Total price if in cart */}
          {inCart && (
            <View style={styles.cartPreview}>
              <Ionicons name="bag-check" size={18} color={COLORS.gold} />
              <Text style={styles.cartPreviewText}>
                Subtotal en carrito: {formatPrice(product.price * cartItem.quantity)}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        {inCart ? (
          <>
            {/* Quantity control */}
            <View style={styles.qtyControl}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => decrement(product.id)}
              >
                <Ionicons name="remove" size={18} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{cartItem.quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => increment(product.id)}
                disabled={cartItem.quantity >= product.stock}
              >
                <Ionicons
                  name="add"
                  size={18}
                  color={cartItem.quantity >= product.stock ? COLORS.textMuted : COLORS.textPrimary}
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.viewCartBtn}
              onPress={() => navigation.navigate('Cart')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[COLORS.gold, COLORS.goldDark]}
                style={styles.viewCartGradient}
              >
                <Ionicons name="bag" size={20} color={COLORS.bgPrimary} />
                <Text style={styles.viewCartText}>Ver Carrito</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.addToCartBtn, isOutOfStock && styles.addToCartBtnDisabled]}
            onPress={handleAddOrUpdate}
            disabled={isOutOfStock}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={isOutOfStock ? [COLORS.bgTertiary, COLORS.bgSecondary] : [COLORS.gold, COLORS.goldDark]}
              style={styles.addToCartGradient}
            >
              <Ionicons name={isOutOfStock ? 'close-circle' : 'cart'} size={20} color={isOutOfStock ? COLORS.textMuted : COLORS.bgPrimary} />
              <Text style={[styles.addToCartText, isOutOfStock && { color: COLORS.textMuted }]}>
                {isOutOfStock ? 'Sin disponibilidad' : `Agregar al Carrito · ${formatPrice(product.price)}`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: SIZES.md,
    zIndex: 10,
    width: 40,
    height: 40,
    backgroundColor: COLORS.bgPrimary + 'cc',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  imageContainer: {
    height: height * 0.4,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  moduleBadge: {
    position: 'absolute',
    bottom: SIZES.md,
    left: SIZES.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: SIZES.radiusFull,
  },
  moduleBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  contentContainer: {
    padding: SIZES.md,
  },
  productType: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  productName: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
    marginBottom: SIZES.md,
  },
  priceStockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: SIZES.md,
  },
  priceLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  productPrice: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '700',
  },
  stockBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.bgSecondary,
    paddingHorizontal: SIZES.sm + 4,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusSm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SIZES.md,
  },
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SIZES.sm,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: SIZES.md,
  },
  detailsCard: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SIZES.md,
    gap: SIZES.sm,
    marginBottom: SIZES.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailKey: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  detailValue: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  cartPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
    backgroundColor: COLORS.goldSoft,
    borderRadius: SIZES.radiusSm,
    padding: SIZES.sm + 4,
    marginBottom: SIZES.sm,
  },
  cartPreviewText: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: '600',
  },
  bottomBar: {
    flexDirection: 'row',
    gap: SIZES.sm,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm + 4,
    backgroundColor: COLORS.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  addToCartBtn: {
    flex: 1,
    borderRadius: SIZES.radiusFull,
    overflow: 'hidden',
  },
  addToCartBtnDisabled: {
    opacity: 0.6,
  },
  addToCartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.sm,
    paddingVertical: 15,
    paddingHorizontal: SIZES.lg,
  },
  addToCartText: {
    color: COLORS.bgPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgTertiary,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 44,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: SIZES.sm,
    minWidth: 30,
    textAlign: 'center',
  },
  viewCartBtn: {
    flex: 1,
    borderRadius: SIZES.radiusFull,
    overflow: 'hidden',
  },
  viewCartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.sm,
    paddingVertical: 15,
  },
  viewCartText: {
    color: COLORS.bgPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
});

export default ProductDetailScreen;
