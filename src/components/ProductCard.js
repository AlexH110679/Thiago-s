// src/components/ProductCard.js
import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, CATEGORY_LABELS } from '../constants/theme';
import { useCart } from '../context/CartContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SIZES.md * 2 - SIZES.sm) / 2;

const CATEGORY_COLORS = {
  'cerveza-nacional': COLORS.gold,
  'cerveza-importada': COLORS.info,
  'licores': COLORS.purple,
  'snacks': COLORS.success,
};

const CATEGORY_ICONS = {
  'cerveza-nacional': 'beer',
  'cerveza-importada': 'beer-outline',
  'licores': 'wine',
  'snacks': 'fast-food',
};

const ProductCard = ({ product, onPress }) => {
  const { addItem, items } = useCart();
  const cartItem = items.find(i => i.id === product.id);
  const inCart = cartItem?.quantity > 0;
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const catColor = CATEGORY_COLORS[product.category] || COLORS.gold;
  const catIcon = CATEGORY_ICONS[product.category] || 'pricetag';

  const handleAdd = useCallback(() => {
    if (!isOutOfStock) {
      addItem(product);
    }
  }, [addItem, product, isOutOfStock]);

  const formatPrice = (price) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price);

  return (
    <TouchableOpacity
      style={[styles.card, inCart && styles.cardActive]}
      onPress={() => onPress(product)}
      activeOpacity={0.88}
    >
      {/* Image */}
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: product.image_url }}
          style={styles.image}
          resizeMode="cover"
        />
        {/* Category Badge */}
        <View style={[styles.categoryBadge, { backgroundColor: catColor + '22', borderColor: catColor + '44' }]}>
          <Ionicons name={catIcon} size={11} color={catColor} />
          <Text style={[styles.categoryBadgeText, { color: catColor }]}>
            {CATEGORY_LABELS[product.category] || product.category}
          </Text>
        </View>
        {/* Stock Badge */}
        {isOutOfStock && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>Agotado</Text>
          </View>
        )}
        {isLowStock && !isOutOfStock && (
          <View style={styles.lowStockBadge}>
            <Text style={styles.lowStockText}>¡Últimas {product.stock}!</Text>
          </View>
        )}
        {product.featured && !isOutOfStock && !isLowStock && (
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={10} color={COLORS.gold} />
            <Text style={styles.featuredText}>Destacado</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.productType} numberOfLines={1}>{product.type}</Text>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          <TouchableOpacity
            style={[
              styles.addBtn,
              isOutOfStock && styles.addBtnDisabled,
              inCart && styles.addBtnActive,
            ]}
            onPress={handleAdd}
            disabled={isOutOfStock}
          >
            <Ionicons
              name={inCart ? 'cart' : 'add'}
              size={16}
              color={isOutOfStock ? COLORS.textMuted : COLORS.bgPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: SIZES.md,
  },
  cardActive: {
    borderColor: COLORS.gold + '55',
  },
  imageWrapper: {
    height: 140,
    position: 'relative',
    backgroundColor: COLORS.bgTertiary,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.dangerSoft,
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  outOfStockText: {
    color: COLORS.danger,
    fontSize: 9,
    fontWeight: '700',
  },
  lowStockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.dangerSoft,
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  lowStockText: {
    color: COLORS.danger,
    fontSize: 9,
    fontWeight: '700',
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.goldSoft,
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  featuredText: {
    color: COLORS.gold,
    fontSize: 9,
    fontWeight: '700',
  },
  info: {
    padding: 10,
  },
  productType: {
    color: COLORS.gold,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  productName: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  addBtn: {
    backgroundColor: COLORS.gold,
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnActive: {
    backgroundColor: COLORS.goldDark,
  },
  addBtnDisabled: {
    backgroundColor: COLORS.bgTertiary,
  },
});

export default ProductCard;
