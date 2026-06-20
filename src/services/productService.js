// src/services/productService.js
import { supabase } from '../lib/supabase';
import { INITIAL_PRODUCTS } from '../constants/theme';

// Fetch all products (optionally filtered by category)
export const fetchProducts = async (category = null) => {
  let query = supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: true });

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Search products by name or type
export const searchProducts = async (term, category = null) => {
  let query = supabase
    .from('products')
    .select('*')
    .or(`name.ilike.%${term}%,type.ilike.%${term}%,description.ilike.%${term}%`);

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
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
  const { data, error } = await supabase
    .from('products')
    .select('id')
    .limit(1);

  if (error) {
    console.warn('Supabase seed check failed:', error.message);
    return false;
  }

  if (data && data.length === 0) {
    const { error: insertError } = await supabase
      .from('products')
      .insert(INITIAL_PRODUCTS);
    if (insertError) {
      console.warn('Seed insert failed:', insertError.message);
      return false;
    }
    console.log('Products seeded successfully.');
    return true;
  }

  return false;
};

// Create an order record
export const createOrder = async ({ items, subtotal, discountAmount, total, promoCode }) => {
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
      p_total: total,
      p_promo_code: promoCode || null,
      p_payment_method: 'Efectivo',
      p_items: formattedItems
    });

  if (error) throw error;
  
  // Return the created order with local items array formatted for the receipt UI
  return {
    ...data,
    items: items.map(i => ({
      product_id: i.id,
      name: i.name,
      price: i.price,
      quantity: i.quantity
    }))
  };
};

// Fetch order history
export const fetchOrders = async () => {
  const { data, error } = await supabase
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
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(order => ({
    ...order,
    items: (order.order_items || []).map(item => ({
      product_id: item.product_id,
      name: item.products?.name || 'Producto Desconocido',
      price: item.unit_price,
      quantity: item.quantity,
      image_url: item.products?.image_url
    }))
  }));
};
