// src/screens/AdminScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, CATEGORY_LABELS, CATEGORIES } from '../constants/theme';
import { useCart } from '../context/CartContext';
import {
  fetchProducts,
  addProduct,
  updateProduct,
  deleteProduct,
} from '../services/productService';

const CATEGORY_COLORS = {
  'cerveza-nacional': COLORS.gold,
  'cerveza-importada': COLORS.info,
  'licores': COLORS.purple,
  'snacks': COLORS.success,
};

const AdminScreen = ({ navigation }) => {
  const { baseDeliveryCost, updateDeliveryCost } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [configDelivery, setConfigDelivery] = useState(baseDeliveryCost?.toString() || '4000');

  const handleSaveConfig = async () => {
    const success = await updateDeliveryCost(configDelivery);
    if (success) {
      Alert.alert('Éxito', 'Valor del domicilio actualizado.');
      setConfigModalVisible(false);
    } else {
      Alert.alert('Error', 'No se pudo guardar la configuración.');
    }
  };
  const [formCategory, setFormCategory] = useState('cerveza-nacional');
  const [formType, setFormType] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formFeatured, setFormFeatured] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProducts();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory('cerveza-nacional');
    setFormType('');
    setFormPrice('');
    setFormStock('');
    setFormImage('');
    setFormDesc('');
    setFormFeatured(false);
    setModalVisible(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormCategory(product.category);
    setFormType(product.type);
    setFormPrice(String(product.price));
    setFormStock(String(product.stock));
    setFormImage(product.image_url || '');
    setFormDesc(product.description || '');
    setFormFeatured(product.featured || false);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formType.trim() || !formPrice || !formStock) {
      Alert.alert('Campos requeridos', 'Por favor completa nombre, tipo, precio y stock.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        category: formCategory,
        type: formType.trim(),
        price: parseInt(formPrice),
        stock: parseInt(formStock),
        image_url: formImage.trim() || null,
        description: formDesc.trim(),
        featured: formFeatured,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
      } else {
        await addProduct(payload);
      }

      setModalVisible(false);
      await loadProducts();
      Alert.alert('¡Éxito!', editingProduct ? 'Producto actualizado.' : 'Producto agregado al catálogo.');
    } catch (e) {
      Alert.alert('Error al guardar', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (product) => {
    Alert.alert(
      'Eliminar Producto',
      `¿Seguro deseas eliminar "${product.name}"? Esta acción es irreversible.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(product.id);
              await loadProducts();
            } catch (e) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  };

  // Metrics
  const totalProducts = products.length;
  const totalBeers = products.filter(p => p.category.startsWith('cerveza')).length;
  const totalLiquors = products.filter(p => p.category === 'licores').length;
  const totalSnacks = products.filter(p => p.category === 'snacks').length;

  const metrics = [
    { label: 'Total', value: totalProducts, icon: 'cube', color: COLORS.gold, bg: COLORS.goldSoft },
    { label: 'Cervezas', value: totalBeers, icon: 'beer', color: COLORS.info, bg: COLORS.infoSoft },
    { label: 'Licores', value: totalLiquors, icon: 'wine', color: COLORS.purple, bg: COLORS.purpleSoft },
    { label: 'Snacks', value: totalSnacks, icon: 'fast-food', color: COLORS.success, bg: COLORS.successSoft },
  ];

  const renderItem = ({ item }) => {
    const catColor = CATEGORY_COLORS[item.category] || COLORS.gold;
    return (
      <View style={styles.productRow}>
        <Image source={{ uri: item.image_url }} style={styles.rowImage} resizeMode="cover" />
        <View style={styles.rowContent}>
          <View style={[styles.catBadge, { backgroundColor: catColor + '22' }]}>
            <Text style={[styles.catBadgeText, { color: catColor }]}>
              {CATEGORY_LABELS[item.category] || item.category}
            </Text>
          </View>
          <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.rowMeta}>
            <Text style={styles.rowPrice}>
              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.price)}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.rowStock, { color: item.stock <= 5 ? COLORS.danger : COLORS.success }]}>
                Stock: {item.stock}
              </Text>
              {item.stock <= 5 && (
                <View style={{ backgroundColor: COLORS.dangerSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ color: COLORS.danger, fontSize: 9, fontWeight: 'bold' }}>¡BAJO STOCK!</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <View style={styles.rowActions}>
          <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
            <Ionicons name="create-outline" size={18} color={COLORS.gold} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View>
      <View style={styles.pageHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SIZES.sm }}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={{ padding: 8, backgroundColor: COLORS.bgSecondary, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border }}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.pageTitle}>Panel de Control</Text>
            <Text style={styles.pageSubtitle}>Inventario de Thiago's</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity style={styles.addBtn} onPress={() => { setConfigDelivery(baseDeliveryCost?.toString() || '4000'); setConfigModalVisible(true); }}>
            <View style={[styles.addBtnGrad, { backgroundColor: COLORS.bgSecondary, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="settings-outline" size={20} color={COLORS.gold} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
            <LinearGradient colors={[COLORS.gold, COLORS.goldDark]} style={styles.addBtnGrad}>
              <Ionicons name="add" size={22} color={COLORS.bgPrimary} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Metrics */}
      <View style={styles.metricsGrid}>
        {metrics.map((m) => (
          <View key={m.label} style={[styles.metricCard, { backgroundColor: m.bg }]}>
            <View style={[styles.metricIcon, { backgroundColor: m.bg }]}>
              <Ionicons name={m.icon} size={22} color={m.color} />
            </View>
            <Text style={[styles.metricValue, { color: m.color }]}>{m.value}</Text>
            <Text style={styles.metricLabel}>{m.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.inventoryLabel}>Inventario ({totalProducts} productos)</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgPrimary} />

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.gold} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={50} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Sin productos en el inventario.</Text>
              <TouchableOpacity style={styles.emptyAddBtn} onPress={openAddModal}>
                <Text style={styles.emptyAddText}>+ Agregar primer producto</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Product Form Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        statusBarTranslucent
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <Text style={[styles.modalSaveText, saving && { opacity: 0.5 }]}>
                {saving ? 'Guardando...' : 'Guardar'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
            {/* Name */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Nombre del Producto *</Text>
              <TextInput
                style={styles.formInput}
                value={formName}
                onChangeText={setFormName}
                placeholder="Ej: Johnnie Walker Black Label"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            {/* Category Selector */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Módulo / Categoría *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catSelector}>
                {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.catOption,
                      formCategory === cat.id && styles.catOptionActive,
                    ]}
                    onPress={() => setFormCategory(cat.id)}
                  >
                    <Ionicons name={cat.icon} size={16} color={formCategory === cat.id ? COLORS.bgPrimary : COLORS.textSecondary} />
                    <Text style={[
                      styles.catOptionText,
                      formCategory === cat.id && { color: COLORS.bgPrimary },
                    ]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Type */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tipo / Variedad *</Text>
              <TextInput
                style={styles.formInput}
                value={formType}
                onChangeText={setFormType}
                placeholder="Ej: Whisky Escocés 12 Años"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            {/* Price & Stock in row */}
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Precio (COP) *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formPrice}
                  onChangeText={setFormPrice}
                  placeholder="Ej: 165000"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: SIZES.sm }]}>
                <Text style={styles.formLabel}>Stock Inicial *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formStock}
                  onChangeText={setFormStock}
                  placeholder="Ej: 24"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Image URL */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>URL de Imagen</Text>
              <TextInput
                style={styles.formInput}
                value={formImage}
                onChangeText={setFormImage}
                placeholder="https://ejemplo.com/imagen.jpg"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
                keyboardType="url"
              />
              {formImage.length > 0 && (
                <Image source={{ uri: formImage }} style={styles.imagePreview} resizeMode="cover" />
              )}
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Descripción</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={formDesc}
                onChangeText={setFormDesc}
                placeholder="Descripción del producto, origen, características..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Featured Toggle */}
            <View style={styles.formGroup}>
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setFormFeatured(!formFeatured)}
              >
                <View>
                  <Text style={styles.formLabel}>¿Producto Destacado?</Text>
                  <Text style={styles.toggleHint}>Los destacados aparecen con una estrella dorada</Text>
                </View>
                <View style={[styles.toggle, formFeatured && styles.toggleActive]}>
                  {formFeatured && <Ionicons name="checkmark" size={14} color={COLORS.bgPrimary} />}
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Config Modal */}
      <Modal visible={configModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#1a1a22', width: '100%', maxWidth: 320, padding: 24, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' }}>
            <Ionicons name="cash-outline" size={40} color={COLORS.gold} style={{ marginBottom: 10 }} />
            <Text style={{ color: COLORS.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 5 }}>Costo del Domicilio</Text>
            <Text style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 20, textAlign: 'center' }}>Ingresa el nuevo valor para los envíos.</Text>
            <TextInput
              style={{ width: '100%', height: 50, backgroundColor: COLORS.bgPrimary, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, color: COLORS.textPrimary, fontSize: 18, textAlign: 'center', marginBottom: 20 }}
              placeholder="Ej: 4000"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="number-pad"
              value={configDelivery}
              onChangeText={setConfigDelivery}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={{ flex: 1, height: 44, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: 8 }}
                onPress={() => setConfigModalVisible(false)}
              >
                <Text style={{ color: COLORS.textMuted, fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, height: 44, backgroundColor: COLORS.gold, justifyContent: 'center', alignItems: 'center', borderRadius: 8 }}
                onPress={handleSaveConfig}
              >
                <Text style={{ color: COLORS.bgPrimary, fontWeight: '700' }}>Guardar</Text>
              </TouchableOpacity>
            </View>
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
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: SIZES.md,
    paddingBottom: SIZES.xxl,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.md,
  },
  pageTitle: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  pageSubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  addBtn: {
    borderRadius: SIZES.radiusMd,
    overflow: 'hidden',
  },
  addBtnGrad: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SIZES.radiusMd,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: SIZES.sm,
    marginBottom: SIZES.md,
  },
  metricCard: {
    flex: 1,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.sm + 4,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: SIZES.radiusSm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  metricLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  inventoryLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SIZES.sm,
    paddingTop: SIZES.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  productRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.sm,
    overflow: 'hidden',
    alignItems: 'center',
  },
  rowImage: {
    width: 72,
    height: 72,
    backgroundColor: COLORS.bgTertiary,
  },
  rowContent: {
    flex: 1,
    padding: SIZES.sm,
    gap: 3,
  },
  catBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
  },
  catBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  rowName: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  rowMeta: {
    flexDirection: 'row',
    gap: SIZES.sm,
    alignItems: 'center',
  },
  rowPrice: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '700',
  },
  rowStock: {
    fontSize: 11,
    fontWeight: '500',
  },
  rowActions: {
    paddingRight: SIZES.sm,
    gap: SIZES.sm,
    alignItems: 'center',
  },
  editBtn: {
    width: 34,
    height: 34,
    backgroundColor: COLORS.goldSoft,
    borderRadius: SIZES.radiusSm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.gold + '33',
  },
  deleteBtn: {
    width: 34,
    height: 34,
    backgroundColor: COLORS.dangerSoft,
    borderRadius: SIZES.radiusSm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.danger + '33',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SIZES.xxl,
    gap: SIZES.sm,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  emptyAddBtn: {
    marginTop: SIZES.sm,
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.sm,
    backgroundColor: COLORS.goldSoft,
    borderRadius: SIZES.radiusFull,
  },
  emptyAddText: {
    color: COLORS.gold,
    fontWeight: '700',
    fontSize: 14,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalCloseBtn: {
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
  modalTitle: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  modalSaveText: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: '700',
  },
  formContent: {
    padding: SIZES.md,
    gap: SIZES.xs,
  },
  formGroup: {
    marginBottom: SIZES.md,
  },
  formLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: SIZES.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  formInput: {
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusSm,
    paddingHorizontal: SIZES.sm + 4,
    paddingVertical: SIZES.sm + 4,
    color: COLORS.textPrimary,
    fontSize: 15,
    height: 48,
  },
  textArea: {
    height: 100,
    paddingTop: SIZES.sm,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: SIZES.md,
  },
  catSelector: {
    gap: SIZES.sm,
    paddingVertical: SIZES.xs,
  },
  catOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SIZES.sm + 4,
    paddingVertical: 9,
    backgroundColor: COLORS.bgSecondary,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catOptionActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  catOptionText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  imagePreview: {
    width: '100%',
    height: 140,
    borderRadius: SIZES.radiusMd,
    marginTop: SIZES.sm,
    backgroundColor: COLORS.bgTertiary,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.bgSecondary,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.sm + 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleHint: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  toggle: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: COLORS.bgTertiary,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
});

export default AdminScreen;
