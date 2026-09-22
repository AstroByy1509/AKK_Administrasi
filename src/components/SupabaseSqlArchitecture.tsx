import React, { useState } from 'react';
import { Database, Copy, Check, Server, ShieldCheck, Key, Globe, ExternalLink, Terminal, Code2, Layers } from 'lucide-react';
import { logisticsStore } from '../services/store';

export const SupabaseSqlArchitecture: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');

  const fullSqlSchema = `-- ====================================================================
-- SUPABASE POSTGRESQL ENTERPRISE LOGISTICS & B2B SUPPLY CHAIN SCHEMA
-- Includes Row Level Security (RLS), Indexes, and Foreign Key Cascades
-- ====================================================================

-- 1. Enable Required Extensions
create extension if not exists "uuid-ossp";

-- 2. User Roles Enum for RBAC
create type user_role as enum ('super_admin', 'dispatcher', 'driver');

-- 3. PROFILES (Extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text not null,
  role user_role default 'dispatcher'::user_role,
  department text default 'Logistics Operations',
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by authenticated users."
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile."
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "Super admins can manage all profiles."
  on public.profiles for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'super_admin'
    )
  );

-- 4. FLEETS (Armada Kendaraan)
create table public.fleets (
  id uuid default uuid_generate_v4() primary key,
  plate_number text unique not null,
  vehicle_type text not null, -- 'Pick Up Box', 'Engkel STD', 'Engkel Long', 'Double STD'
  tonnage_capacity numeric(5,2) not null, -- in metric tons
  current_tonnage numeric(5,2) default 0,
  status text default 'available' check (status in ('available', 'on-duty', 'maintenance')),
  gps_imei text,
  fuel_level_percent integer default 100 check (fuel_level_percent between 0 and 100),
  odometer_km integer default 0,
  year integer default 2024,
  last_maintenance date default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.fleets enable row level security;

create policy "Fleets readable by all authenticated users"
  on public.fleets for select
  to authenticated
  using (true);

create policy "Fleets modifiable by admins and dispatchers"
  on public.fleets for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('super_admin', 'dispatcher')
    )
  );

-- 5. CREWS (Supir dan Kernet)
create table public.crews (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  phone text not null,
  role text not null check (role in ('Driver Utama', 'Driver Cadangan', 'Kernet / Helper')),
  license_number text not null,
  license_type text not null check (license_type in ('SIM B2 Umum', 'SIM B1 Umum', 'SIM A')),
  status text default 'available' check (status in ('available', 'on-duty', 'off')),
  trips_completed integer default 0,
  rating numeric(3,2) default 5.00,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.crews enable row level security;

create policy "Crews viewable by authenticated users"
  on public.crews for select
  to authenticated
  using (true);

create policy "Crews modifiable by admins and dispatchers"
  on public.crews for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('super_admin', 'dispatcher')
    )
  );

-- 6. STORES (Toko Retail & Koordinat Pelanggan)
create table public.stores (
  id uuid default uuid_generate_v4() primary key,
  store_code text unique not null,
  store_name text not null,
  island text not null, -- 'Jawa', 'Sumatera', 'Bali & Nusa Tenggara', 'Kalimantan', 'Sulawesi', 'Papua & Maluku'
  province text not null,
  city text not null,
  address text not null,
  latitude numeric(10, 8) not null,
  longitude numeric(11, 8) not null,
  contact_person text not null,
  phone text not null,
  delivery_window text default '08:00 - 17:00',
  store_category text default 'Supermarket' check (store_category in ('Hypermarket', 'Supermarket', 'Distribution Hub', 'Minimarket Cluster')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.stores enable row level security;

create policy "Stores viewable by all authenticated users"
  on public.stores for select
  to authenticated
  using (true);

create policy "Stores modifiable by dispatchers and admins"
  on public.stores for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('super_admin', 'dispatcher')
    )
  );

-- 7. SCHEDULES (Jadwal Pengiriman & Penugasan Logistik)
create table public.schedules (
  id uuid default uuid_generate_v4() primary key,
  tracking_number text unique not null,
  origin_name text default 'Gudang Pusat Banyuwangi DC',
  origin_latitude numeric(10, 8) default -8.1906,
  origin_longitude numeric(11, 8) default 114.3708,
  store_id uuid references public.stores(id) on delete cascade not null,
  fleet_id uuid references public.fleets(id) on delete set null,
  crew_id uuid references public.crews(id) on delete set null,
  status text default 'scheduled' check (status in ('scheduled', 'in_transit', 'delivered', 'delayed')),
  departure_date timestamp with time zone not null,
  estimated_arrival timestamp with time zone not null,
  actual_arrival timestamp with time zone,
  cargo_description text not null,
  cargo_weight_ton numeric(5,2) not null,
  is_inter_island boolean default false,
  ferry_booking_code text,
  transit_port text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.schedules enable row level security;

create policy "Schedules viewable by all authenticated users"
  on public.schedules for select
  to authenticated
  using (true);

create policy "Schedules modifiable by dispatchers and admins"
  on public.schedules for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('super_admin', 'dispatcher')
    )
  );

-- 8. TRACKING_LOGS (Data Historis Import Excel GPS & Tracksolid)
create table public.tracking_logs (
  id uuid default uuid_generate_v4() primary key,
  schedule_id uuid references public.schedules(id) on delete cascade not null,
  timestamp timestamp with time zone not null,
  latitude numeric(10, 8) not null,
  longitude numeric(11, 8) not null,
  speed numeric(5, 2) default 0, -- in km/h
  engine_status text default 'IDLE' check (engine_status in ('RUNNING', 'STOP', 'IDLE')),
  location_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_tracking_logs_schedule on public.tracking_logs(schedule_id);
create index idx_tracking_logs_timestamp on public.tracking_logs(timestamp);

alter table public.tracking_logs enable row level security;

create policy "Tracking logs accessible by authenticated users"
  on public.tracking_logs for all
  to authenticated
  using (true);
`;

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const handleTestConnection = () => {
    setConnectionStatus('testing');
    setTimeout(() => {
      if (supabaseUrl && supabaseAnonKey) {
        setConnectionStatus('success');
        logisticsStore.setSupabaseConfig({
          url: supabaseUrl,
          anonKey: supabaseAnonKey,
          isConnected: true
        });
      } else {
        setConnectionStatus('failed');
      }
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-2">
              <Database className="w-3.5 h-3.5" />
              <span>Arsitektur PostgreSQL & Panduan Produksi Supabase</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Skema Database Supabase & Panduan Deploy Vercel
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Skrip SQL DDL PostgreSQL lengkap dengan definisi tabel, foreign key relasional, indeks performa, enum peran (RBAC), serta kebijakan Row Level Security (RLS) siap pakai di Supabase SQL Editor.
            </p>
          </div>

          <button
            onClick={() => copyToClipboard(fullSqlSchema, 'all-sql')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition cursor-pointer self-start lg:self-center"
          >
            {copiedSection === 'all-sql' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedSection === 'all-sql' ? 'Tersalin ke Clipboard!' : 'Salin Seluruh Skrip SQL'}</span>
          </button>
        </div>
      </div>

      {/* Supabase Connection Setup Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Konfigurasi Supabase Project (Opsional)</h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Aplikasi saat ini aktif dengan Enterprise Mock Engine & Local Storage.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">SUPABASE URL</label>
            <input
              type="text"
              placeholder="https://xyzcompany.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">SUPABASE ANON / PUBLIC KEY</label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              value={supabaseAnonKey}
              onChange={(e) => setSupabaseAnonKey(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs">
            {connectionStatus === 'testing' && <span className="text-amber-400">Memverifikasi kredensial...</span>}
            {connectionStatus === 'success' && <span className="text-emerald-400 font-semibold">Tersambung ke Supabase Client!</span>}
            {connectionStatus === 'failed' && <span className="text-red-400">Masukkan URL dan Anon Key terlebih dahulu.</span>}
          </div>

          <button
            onClick={handleTestConnection}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition cursor-pointer"
          >
            Uji & Simpan Koneksi
          </button>
        </div>
      </div>

      {/* SQL Script Viewer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white">schema.sql (PostgreSQL Supabase DDL)</span>
          </div>

          <button
            onClick={() => copyToClipboard(fullSqlSchema, 'all-sql-header')}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            {copiedSection === 'all-sql-header' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Salin SQL</span>
          </button>
        </div>

        <pre className="p-4 text-xs font-mono bg-slate-950 text-slate-300 overflow-x-auto max-h-[420px] leading-relaxed select-all">
          {fullSqlSchema}
        </pre>
      </div>

      {/* Vercel Deployment & Setup Walkthrough */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-400" />
          <h3 className="text-base font-bold text-white">Panduan Deploy ke Vercel & Supabase Production</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold flex items-center justify-center">1</div>
            <h4 className="font-bold text-white text-sm">Buat Database Supabase</h4>
            <p className="text-slate-400 leading-relaxed">
              Login ke <strong>supabase.com</strong>, buat project baru, buka menu <strong>SQL Editor</strong>, lalu tempel skrip SQL di atas dan klik <strong>Run</strong>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 font-bold flex items-center justify-center">2</div>
            <h4 className="font-bold text-white text-sm">Atur Environment Variables</h4>
            <p className="text-slate-400 leading-relaxed">
              Salin <strong>Project URL</strong> dan <strong>anon key</strong> dari Supabase Project Settings &gt; API. Simpan ke <code>.env.local</code> atau panel Vercel:
            </p>
            <div className="font-mono text-[11px] p-2 rounded bg-slate-900 text-slate-300">
              NEXT_PUBLIC_SUPABASE_URL=...<br/>
              NEXT_PUBLIC_SUPABASE_ANON_KEY=...
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 font-bold flex items-center justify-center">3</div>
            <h4 className="font-bold text-white text-sm">Deploy ke Vercel</h4>
            <p className="text-slate-400 leading-relaxed">
              Push kode ke GitHub, buka <strong>vercel.com</strong>, pilih <strong>Import Project</strong>, tambahkan environment variables di atas, lalu klik <strong>Deploy</strong>. Selesai dalam hitungan menit!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
