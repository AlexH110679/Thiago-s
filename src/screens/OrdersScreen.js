import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CustomAlertModal from '../components/CustomAlertModal';
import { COLORS, SIZES } from '../constants/theme';
import { fetchOrders, deleteOrder } from '../services/productService';

const OrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Custom Styled Alert State
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

  const showAlert = ({ title, message, type = 'info', confirmText = 'Aceptar', cancelText = null, onConfirm = null, onCancel = null }) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      confirmText,
      cancelText,
      onConfirm,
      onCancel,
    });
  };
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const pageSize = 10;
  const totalPages = Math.ceil(totalOrders / pageSize);

  const formatPrice = (p) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(p);

  const loadOrders = useCallback(async (currentPage = 1) => {
    try {
      setLoading(true);
      const { orders: fetchedOrders, totalCount } = await fetchOrders(currentPage, pageSize);
      setOrders(fetchedOrders);
      setTotalOrders(totalCount);
      setPage(currentPage);
    } catch (e) {
      console.error('Error loading orders:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrders(1);
    }, [loadOrders])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadOrders(page);
  }, [loadOrders, page]);

  const handleDeleteOrder = (orderId) => {
    showAlert({
      title: 'Eliminar Historial',
      message: `¿Estás seguro de que deseas borrar el pedido #${String(orderId).padStart(4, '0')} del historial? Esta acción no se puede revertir.`,
      type: 'danger',
      confirmText: 'Sí, Eliminar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          setLoading(true);
          await deleteOrder(orderId);
          setSelectedOrder(null);
          await loadOrders(page);
          showAlert({
            title: 'Historial Eliminado',
            message: 'El registro del pedido fue borrado exitosamente del sistema.',
            type: 'success',
          });
        } catch (error) {
          showAlert({
            title: 'Error al Eliminar',
            message: 'No se pudo eliminar el pedido del historial. Inténtalo nuevamente.',
            type: 'danger',
          });
          setLoading(false);
        }
      },
    });
  };

  const getOrderItems = (order) => {
    try {
      return typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
    } catch {
      return [];
    }
  };

  const renderOrder = ({ item }) => {
    const items = getOrderItems(item);
    const date = new Date(item.created_at);
    const dateStr = date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => setSelectedOrder(item)}
        activeOpacity={0.8}
      >
        {/* Header Row */}
        <View style={styles.orderCardHeader}>
          <View style={styles.orderIdBadge}>
            <Text style={styles.orderIdText}>#{String(item.id).padStart(4, '0')}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
            <Text style={styles.statusText}>Completado</Text>
          </View>
        </View>

        {/* Date & Items Count */}
        <Text style={styles.orderDate}>{dateStr} · {timeStr}</Text>
        <Text style={styles.orderItemsCount}>
          {items.length} artículo{items.length !== 1 ? 's' : ''}
          {items.length > 0 && `: ${items.map(i => i.name).slice(0, 2).join(', ')}${items.length > 2 ? '...' : ''}`}
        </Text>

        {/* Total */}
        <View style={styles.orderTotal}>
          <Text style={styles.orderTotalLabel}>Total</Text>
          <Text style={styles.orderTotalValue}>{formatPrice(item.total)}</Text>
        </View>

        {/* Promo Code */}
        {item.promo_code && (
          <View style={styles.promoTag}>
            <Ionicons name="pricetag" size={11} color={COLORS.success} />
            <Text style={styles.promoTagText}>{item.promo_code}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgPrimary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={{ marginRight: SIZES.md }} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial de Pedidos</Text>
        {orders.length > 0 && (
          <View style={styles.orderCountBadge}>
            <Text style={styles.orderCountText}>{orders.length}</Text>
          </View>
        )}
      </View>

      {/* Stats Banner */}
      {totalOrders > 0 && (
        <View style={styles.statsBanner}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalOrders}</Text>
            <Text style={styles.statLabel}>Total Pedidos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {formatPrice(orders.reduce((s, o) => s + (o.total || 0), 0))}
            </Text>
            <Text style={styles.statLabel}>Facturado (Pág. {page})</Text>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.gold} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderOrder}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={60} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Sin pedidos aún</Text>
              <Text style={styles.emptyDesc}>Tus compras realizadas aparecerán aquí.</Text>
            </View>
          }
          ListFooterComponent={
            totalOrders > 0 && totalPages > 1 ? (
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
                  onPress={() => loadOrders(page - 1)}
                  disabled={page === 1}
                >
                  <Ionicons name="chevron-back" size={20} color={page === 1 ? COLORS.textMuted : COLORS.textPrimary} />
                  <Text style={[styles.pageBtnText, page === 1 && { color: COLORS.textMuted }]}>Anterior</Text>
                </TouchableOpacity>
                
                <Text style={styles.pageIndicator}>
                  Pág {page} de {totalPages}
                </Text>

                <TouchableOpacity
                  style={[styles.pageBtn, page === totalPages && styles.pageBtnDisabled]}
                  onPress={() => loadOrders(page + 1)}
                  disabled={page === totalPages}
                >
                  <Text style={[styles.pageBtnText, page === totalPages && { color: COLORS.textMuted }]}>Siguiente</Text>
                  <Ionicons name="chevron-forward" size={20} color={page === totalPages ? COLORS.textMuted : COLORS.textPrimary} />
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}

      {/* Order Detail Modal */}
      <Modal
        visible={!!selectedOrder}
        animationType="slide"
        transparent
        statusBarTranslucent
      >
        {selectedOrder && (
          <View style={styles.detailOverlay}>
            <View style={styles.detailModal}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailTitle}>Pedido #{String(selectedOrder.id).padStart(4, '0')}</Text>
                <View style={{ flexDirection: 'row', gap: 15, alignItems: 'center' }}>
                  <TouchableOpacity onPress={() => handleDeleteOrder(selectedOrder.id)}>
                    <Ionicons name="trash-outline" size={24} color={COLORS.danger} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                    <Ionicons name="close-circle" size={28} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailMeta}>
                  <Text style={styles.detailMetaText}>
                    {new Date(selectedOrder.created_at).toLocaleString('es-CO')}
                  </Text>
                </View>

                <Text style={styles.detailSectionLabel}>Artículos</Text>
                {getOrderItems(selectedOrder).map((item, idx) => (
                  <View key={idx} style={styles.detailItemRow}>
                    <Text style={styles.detailItemQty}>{item.quantity}x</Text>
                    <Text style={styles.detailItemName}>{item.name}</Text>
                    <Text style={styles.detailItemPrice}>{formatPrice(item.price * item.quantity)}</Text>
                  </View>
                ))}

                <View style={styles.detailDivider} />
                <View style={styles.detailTotalRow}>
                  <View style={styles.detailAmountRow}>
                    <Text style={styles.detailAmountLabel}>Subtotal</Text>
                    <Text style={styles.detailAmountValue}>{formatPrice(selectedOrder.subtotal)}</Text>
                  </View>
                  {selectedOrder.discount_amount > 0 && (
                    <View style={styles.detailAmountRow}>
                      <Text style={[styles.detailAmountLabel, { color: COLORS.success }]}>
                        Descuento {selectedOrder.promo_code && `(${selectedOrder.promo_code})`}
                      </Text>
                      <Text style={[styles.detailAmountValue, { color: COLORS.success }]}>
                        -{formatPrice(selectedOrder.discount_amount)}
                      </Text>
                    </View>
                  )}
                  {selectedOrder.delivery_fee > 0 && (
                    <View style={styles.detailAmountRow}>
                      <Text style={styles.detailAmountLabel}>Domicilio</Text>
                      <Text style={styles.detailAmountValue}>{formatPrice(selectedOrder.delivery_fee)}</Text>
                    </View>
                  )}
                  <View style={styles.detailAmountRow}>
                    <Text style={styles.detailTotalLabel}>TOTAL</Text>
                    <Text style={styles.detailTotalValue}>{formatPrice(selectedOrder.total)}</Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        )}
      </Modal>

      {/* Custom Styled Alert Modal */}
      <CustomAlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
        onConfirm={alertConfig.onConfirm}
        onCancel={alertConfig.onCancel}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
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
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  orderCountBadge: {
    backgroundColor: COLORS.goldSoft,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  orderCountText: {
    color: COLORS.gold,
    fontWeight: '700',
    fontSize: 13,
  },
  statsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSecondary,
    marginHorizontal: SIZES.md,
    marginVertical: SIZES.sm,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SIZES.sm + 4,
  },
  statValue: {
    color: COLORS.gold,
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: SIZES.md,
    paddingBottom: SIZES.xxl,
  },
  orderCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    gap: SIZES.xs + 2,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderIdBadge: {
    backgroundColor: COLORS.goldSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: SIZES.radiusFull,
  },
  orderIdText: {
    color: COLORS.gold,
    fontWeight: '700',
    fontSize: 13,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.successSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: SIZES.radiusFull,
  },
  statusText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '600',
  },
  orderDate: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  orderItemsCount: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  orderTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SIZES.xs + 2,
    marginTop: SIZES.xs,
  },
  orderTotalLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  orderTotalValue: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  promoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.successSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  promoTagText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: SIZES.sm,
  },
  emptyTitle: {
    color: COLORS.textSecondary,
    fontSize: 18,
    fontWeight: '600',
  },
  emptyDesc: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SIZES.md,
    marginTop: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: SIZES.radiusSm,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  pageBtnDisabled: {
    opacity: 0.5,
  },
  pageBtnText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: 13,
  },
  pageIndicator: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  // Detail Modal
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  detailModal: {
    backgroundColor: COLORS.bgSecondary,
    borderTopLeftRadius: SIZES.radiusLg,
    borderTopRightRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    maxHeight: '80%',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  detailTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  detailMeta: {
    marginBottom: SIZES.md,
  },
  detailMetaText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  detailSectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SIZES.sm,
  },
  detailItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SIZES.sm,
  },
  detailItemQty: {
    color: COLORS.gold,
    fontWeight: '700',
    fontSize: 14,
    minWidth: 28,
  },
  detailItemName: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  detailItemPrice: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  detailDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SIZES.md,
  },
  detailTotalRow: {
    gap: SIZES.sm,
  },
  detailAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailAmountLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  detailAmountValue: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  detailTotalLabel: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  detailTotalValue: {
    color: COLORS.gold,
    fontSize: 20,
    fontWeight: '700',
  },
});

export default OrdersScreen;
