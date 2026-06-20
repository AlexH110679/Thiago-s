// src/lib/supabase.js
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// =========================================================
// IMPORTANT: Replace these values with your actual Supabase
// Project URL and Anon Key from:
// https://supabase.com/dashboard > Project Settings > API
// =========================================================
const SUPABASE_URL = 'https://lggktyfgrjkdvhkosono.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZ2t0eWZncmprZHZoa29zb25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4OTM4OTQsImV4cCI6MjA5NzQ2OTg5NH0.Tycbz-_LhTAp8bbYgjT2SHeZjF9mHlqPv_Ni8rvKXCk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
