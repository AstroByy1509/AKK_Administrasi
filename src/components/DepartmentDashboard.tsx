import React from 'react';
import { logisticsStore } from '../services/store';
import { Users, Building2, Database, ShoppingBag, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { TeamCalendar } from './TeamCalendar';

const MetricCard = ({ title, value, subtext, icon: Icon, color }: { title: string, value: string, subtext: string, icon: any, color: string }) => (
  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-slate-400 text-xs font-semibold uppercase">{title}</h3>
      <Icon className={`w-5 h-5 ${color}`} />
    </div>
    <div className="text-2xl font-black text-white">{value}</div>
    <p className="text-slate-500 text-xs mt-1">{subtext}</p>
  </div>
);

const HRDashboard = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <MetricCard title="Staff Aktif" value="142" subtext="Tersebar di semua cabang" icon={Users} color="text-indigo-400" />
      <MetricCard title="Pengajuan Cuti" value="5" subtext="Menunggu persetujuan" icon={AlertCircle} color="text-amber-400" />
      <MetricCard title="Target Rekrutmen" value="85%" subtext="Pencapaian bulan ini" icon={TrendingUp} color="text-emerald-400" />
    </div>
    <TeamCalendar role="hr_admin" />
  </div>
);

const WarehouseDashboard = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <MetricCard title="Total SKU" value="1,204" subtext="Aktif dalam sistem" icon={Building2} color="text-indigo-400" />
      <MetricCard title="Pending Outbound" value="28" subtext="Pesanan menunggu kirim" icon={AlertCircle} color="text-amber-400" />
      <MetricCard title="Akurasi Stok" value="99.2%" subtext="Hasil opname terakhir" icon={CheckCircle2} color="text-emerald-400" />
    </div>
    <TeamCalendar role="warehouse_admin" />
  </div>
);

const FinanceDashboard = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <MetricCard title="Invoice Pending" value="Rp 450 Jt" subtext="Jatuh tempo minggu depan" icon={Database} color="text-rose-400" />
      <MetricCard title="Pajak Bulan Ini" value="Rp 85 Jt" subtext="Sudah dilaporkan" icon={CheckCircle2} color="text-emerald-400" />
      <MetricCard title="Realisasi Budget" value="78%" subtext="Dari alokasi tahunan" icon={TrendingUp} color="text-indigo-400" />
    </div>
    <TeamCalendar role="finance_tax_admin" />
  </div>
);

const PurchasingDashboard = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <MetricCard title="PO Aktif" value="12" subtext="Dalam proses pengiriman" icon={ShoppingBag} color="text-indigo-400" />
      <MetricCard title="Supplier Terlambat" value="2" subtext="Perlu follow-up" icon={AlertCircle} color="text-rose-400" />
      <MetricCard title="Efisiensi Biaya" value="12%" subtext="Penghematan vs budget" icon={TrendingUp} color="text-emerald-400" />
    </div>
    <TeamCalendar role="purchasing_admin" />
  </div>
);

export const DepartmentDashboard: React.FC = () => {
  const user = logisticsStore.getCurrentUser();

  const renderDashboard = () => {
    switch (user.role) {
      case 'hr_admin': return <HRDashboard />;
      case 'warehouse_admin': return <WarehouseDashboard />;
      case 'finance_tax_admin': return <FinanceDashboard />;
      case 'purchasing_admin': return <PurchasingDashboard />;
      default: return <div className="text-slate-400">Dashboard tidak tersedia untuk role ini.</div>;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-black text-white">Dashboard {user.department}</h2>
      {renderDashboard()}
    </div>
  );
};
