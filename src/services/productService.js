// src/services/productService.js
import { supabase } from '../lib/supabase';
import { INITIAL_PRODUCTS, CATEGORIES } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Fetch all products (optionally filtered by category)
export const fetchProducts = async (category = null) => {
  try {
    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: true });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (data && data.length > 0) return data;

    if (category && category !== 'all') {
      return INITIAL_PRODUCTS.filter(p => p.category === category);
    }
    return INITIAL_PRODUCTS;
  } catch (error) {
    console.warn('Conexión a Supabase no disponible, usando catálogo local:', error.message || error);
    if (category && category !== 'all') {
      return INITIAL_PRODUCTS.filter(p => p.category === category);
    }
    return INITIAL_PRODUCTS;
  }
};

// Search products by name or type
export const searchProducts = async (term, category = null) => {
  try {
    let query = supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${term}%,type.ilike.%${term}%,description.ilike.%${term}%`);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.warn('Búsqueda remota no disponible, filtrando localmente:', error.message || error);
    const lowerTerm = term.toLowerCase();
    return INITIAL_PRODUCTS.filter(p => {
      const matchCat = !category || category === 'all' || p.category === category;
      const matchTerm = (p.name && p.name.toLowerCase().includes(lowerTerm)) ||
                        (p.type && p.type.toLowerCase().includes(lowerTerm)) ||
                        (p.description && p.description.toLowerCase().includes(lowerTerm));
      return matchCat && matchTerm;
    });
  }
};

// Add a new product (admin)
export const addProduct = async (productData) => {
  const { data, error } = await supabase
    .from('products')
    .insert([productData])
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Update an existing product (admin)
export const updateProduct = async (id, updates) => {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Delete a product (admin)
export const deleteProduct = async (id) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// Deduct stock after purchase
export const deductStock = async (cartItems) => {
  const updates = cartItems.map(item =>
    supabase.rpc('deduct_stock', { product_id: item.id, qty: item.quantity })
  );
  const results = await Promise.all(updates);
  const failed = results.find(r => r.error);
  if (failed) throw failed.error;
};

// Seed initial products if table is empty
export const seedProductsIfEmpty = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .limit(1);

    if (error) {
      console.warn('Supabase seed check warning:', error.message || error);
      return false;
    }

    if (data && data.length === 0) {
      const { error: insertError } = await supabase
        .from('products')
        .insert(INITIAL_PRODUCTS);
      if (insertError) {
        console.warn('Seed insert warning:', insertError.message || insertError);
        return false;
      }
      console.log('Products seeded successfully.');
      return true;
    }
  } catch (e) {
    console.warn('Supabase seed check skipped (offline or network error):', e.message || e);
    return false;
  }

  return false;
};

// Create an order record
export const createOrder = async ({ items, subtotal, discountAmount, deliveryFee = 0, total, promoCode }) => {
  const formattedItems = items.map(i => ({
    product_id: i.id,
    quantity: i.quantity,
    unit_price: i.price,
    subtotal: i.price * i.quantity
  }));

  const { data, error } = await supabase
    .rpc('place_order_v2', {
      p_customer_id: 1, // Default guest customer id
      p_subtotal: subtotal,
      p_discount_amount: discountAmount,
      p_tax_amount: 0,
      p_delivery_fee: deliveryFee,
      p_total: total,
      p_promo_code: promoCode || null,
      p_payment_method: 'Efectivo',
      p_items: formattedItems
    });

  if (error) throw error;
  
  // Return the created order with local items array formatted for the receipt UI
  return {
    ...data,
    delivery_fee: deliveryFee,
    items: items.map(i => ({
      product_id: i.id,
      name: i.name,
      price: i.price,
      quantity: i.quantity
    }))
  };
};

// Fetch delivery fee setting from Supabase settings table
export const fetchDeliveryFee = async () => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('delivery_fee')
      .eq('id', 1)
      .maybeSingle();

    if (!error && data && data.delivery_fee !== undefined && data.delivery_fee !== null) {
      const parsed = Number(data.delivery_fee);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }
  } catch (e) {
    console.warn('Could not fetch delivery_fee from settings:', e.message);
  }
  return null;
};

// Update delivery fee setting in Supabase settings table
export const updateDeliveryFeeInDB = async (fee) => {
  try {
    const numericFee = parseInt(fee, 10);
    if (isNaN(numericFee) || numericFee < 0) return;

    const { data } = await supabase
      .from('settings')
      .select('id')
      .eq('id', 1)
      .maybeSingle();

    if (data) {
      await supabase
        .from('settings')
        .update({ delivery_fee: numericFee })
        .eq('id', 1);
    } else {
      await supabase
        .from('settings')
        .insert([{ id: 1, store_name: "Thiago's Licores", delivery_fee: numericFee }]);
    }
  } catch (e) {
    console.warn('Could not update delivery_fee in settings:', e.message);
  }
};

// Fetch QR Code URL setting from Supabase settings table
export const fetchQrUrl = async () => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('qr_code_url')
      .eq('id', 1)
      .maybeSingle();

    if (!error && data && data.qr_code_url) {
      return data.qr_code_url;
    }
  } catch (e) {
    console.warn('Could not fetch qr_code_url from settings:', e.message);
  }
  return null;
};

// Update QR Code URL setting in Supabase settings table
export const updateQrUrlInDB = async (url) => {
  try {
    if (!url || typeof url !== 'string') return;
    const trimmed = url.trim();

    const { data } = await supabase
      .from('settings')
      .select('id')
      .eq('id', 1)
      .maybeSingle();

    if (data) {
      await supabase
        .from('settings')
        .update({ qr_code_url: trimmed })
        .eq('id', 1);
    } else {
      await supabase
        .from('settings')
        .insert([{ id: 1, store_name: "Thiago's Licores", qr_code_url: trimmed }]);
    }
  } catch (e) {
    console.warn('Could not update qr_code_url in settings:', e.message);
  }
};

// Delete an order
export const deleteOrder = async (orderId) => {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId);

  if (error) throw error;
  return true;
};

// Fetch order history with pagination
export const fetchOrders = async (page = 1, pageSize = 10) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        quantity,
        unit_price,
        subtotal,
        products (
          id,
          name,
          image_url
        )
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  const formattedData = (data || []).map(order => ({
    ...order,
    items: (order.order_items || []).map(item => ({
      product_id: item.product_id,
      name: item.products?.name || 'Producto Desconocido',
      price: item.unit_price,
      quantity: item.quantity,
      image_url: item.products?.image_url
    }))
  }));

  return { orders: formattedData, totalCount: count || 0 };
};

// Helper to convert base64 string to Uint8Array for binary uploads
const base64ToUint8Array = (base64Str) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = base64Str.replace(/=+$/, '');
  let bytes = new Uint8Array(Math.floor((str.length * 3) / 4));
  let p = 0;
  for (let i = 0; i < str.length; i += 4) {
    let n = (chars.indexOf(str[i]) << 18) |
            (chars.indexOf(str[i + 1]) << 12) |
            ((chars.indexOf(str[i + 2]) || 0) << 6) |
            (chars.indexOf(str[i + 3]) || 0);
    bytes[p++] = (n >> 16) & 255;
    if (str[i + 2] !== '=' && chars.indexOf(str[i + 2]) !== -1) bytes[p++] = (n >> 8) & 255;
    if (str[i + 3] !== '=' && chars.indexOf(str[i + 3]) !== -1) bytes[p++] = n & 255;
  }
  return bytes.subarray(0, p);
};

// Upload product image to Supabase storage or return Data URI
export const uploadProductImage = async (uri, base64) => {
  try {
    if (!uri) return '';

    const fileExt = (uri.split('.').pop() || 'jpg').toLowerCase().split('?')[0];
    const mimeType = fileExt === 'png' ? 'image/png' : 'image/jpeg';

    if (base64) {
      try {
        const fileName = `product_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const bytes = base64ToUint8Array(base64);

        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(fileName, bytes, {
            contentType: mimeType,
            upsert: true,
          });

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName);

          if (publicUrlData?.publicUrl) {
            return publicUrlData.publicUrl;
          }
        }
      } catch (storageErr) {
        console.warn('Supabase storage upload fallback to base64:', storageErr.message);
      }

      return `data:${mimeType};base64,${base64}`;
    }

    return uri;
  } catch (error) {
    console.warn('Error in uploadProductImage:', error.message);
    return uri;
  }
};

// Custom Categories Persistence
export const fetchCustomCategories = async () => {
  try {
    const json = await AsyncStorage.getItem('@custom_categories');
    if (json) {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Error reading custom categories:', e.message);
  }
  return [];
};

export const saveCustomCategory = async (newCategory) => {
  try {
    const existing = await fetchCustomCategories();
    if (existing.some(c => c.id === newCategory.id)) {
      return existing;
    }
    const updated = [...existing, newCategory];
    await AsyncStorage.setItem('@custom_categories', JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Error saving custom category:', e.message);
    return [];
  }
};
