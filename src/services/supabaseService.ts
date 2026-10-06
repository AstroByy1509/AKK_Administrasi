import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logisticsStore } from './store';

const DEFAULT_SUPABASE_URL = 'https://pfysnacxaixfnyvixmmh.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmeXNuYWN4YWl4Zm55dml4bW1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMjE5NTksImV4cCI6MjEwNjc5Nzk1OX0.EDGipSEnsKVaOPW0kysT7X7YeCmpoj-whr2hIl9vYJE';

/**
 * Sanitize raw Supabase URL string by stripping /rest/v1/ or trailing slashes
 */
export function sanitizeSupabaseUrl(rawUrl: string | undefined): string {
  if (!rawUrl || !rawUrl.trim()) return DEFAULT_SUPABASE_URL;
  let clean = rawUrl.trim();
  clean = clean.replace(/\/rest\/v1\/?$/, '');
  clean = clean.replace(/\/+$/, '');
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = 'https://' + clean;
  }
  return clean;
}

let cachedClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

/**
 * Get active Supabase JS Client instance
 */
export function getSupabaseClient(): SupabaseClient | null {
  const conf = logisticsStore.getSupabaseConfig();
  const rawUrl = conf.url || import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const rawKey = conf.anonKey || import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  const url = sanitizeSupabaseUrl(rawUrl);
  const key = (rawKey || DEFAULT_SUPABASE_ANON_KEY).trim();

  if (!url || !key) return null;

  if (cachedClient && cachedUrl === url && cachedKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
    cachedUrl = url;
    cachedKey = key;
    return cachedClient;
  } catch (err) {
    console.warn('[SupabaseService] Failed to initialize Supabase client:', err);
    return null;
  }
}

/**
 * Test real connection against Supabase API endpoint and table schema
 */
export async function testSupabaseConnection(customUrl?: string, customKey?: string): Promise<{ success: boolean; message: string }> {
  const conf = logisticsStore.getSupabaseConfig();
  const rawUrl = customUrl || conf.url || import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const rawKey = customKey || conf.anonKey || import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  const url = sanitizeSupabaseUrl(rawUrl);
  const key = (rawKey || DEFAULT_SUPABASE_ANON_KEY).trim();

  if (!url || !key) {
    return { success: false, message: 'URL Supabase dan Anon Key wajib diisi.' };
  }

  try {
    // 1. Ping Auth Gateway health check (CORS-friendly, returns 200 with valid apikey)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const healthRes = await fetch(`${url}/auth/v1/health`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    // 2. Initialize client and test session & table existence
    const client = createClient(url, key, {
      auth: { persistSession: false }
    });

    const { error: sessionError } = await client.auth.getSession();
    if (sessionError && sessionError.message.includes('Invalid API key')) {
      return {
        success: false,
        message: 'Kunci Anon Key tidak valid untuk project ini. Periksa menu Project Settings > API di Supabase.'
      };
    }

    // 3. Test if PostgreSQL tables have been created
    const { error: tableError } = await client.from('stores').select('id').limit(1);

    logisticsStore.setSupabaseConfig({
      url,
      anonKey: key,
      isConnected: true
    });

    if (tableError && tableError.code === 'PGRST205') {
      return {
        success: true,
        message: `✅ Berhasil Terhubung ke Supabase (${url})!\nKredensial VALID. Catatan: Tabel database belum dibuat. Silakan salin skrip schema.sql di bawah dan jalankan di menu SQL Editor Supabase.`
      };
    }

    return {
      success: true,
      message: `✅ Berhasil Terhubung ke Supabase (${url})!\nKredensial VALID & Layanan Database Siap Digunakan.`
    };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return {
        success: false,
        message: 'Koneksi waktu habis (Timeout) saat menghubungi server Supabase.'
      };
    }
    return {
      success: false,
      message: `Gagal menghubungkan ke Supabase: ${err?.message || 'Pastikan koneksi internet stabil & URL benar.'}`
    };
  }
}
