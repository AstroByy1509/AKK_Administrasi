import React, { useState } from 'react';
import { logisticsStore } from '../services/store';
import { Users, Building2, Database, ShoppingBag, TrendingUp, AlertCircle, CheckCircle2, UserCheck } from 'lucide-react';
import { TeamCalendar } from './TeamCalendar';
import { attendanceService } from '../services/attendanceService';

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

import { PresenceSummary } from './PresenceSummary';
import { AbsenceManagementModal } from './AbsenceManagementModal';

const HRDashboard = () => {
  const crews = logisticsStore.getCrews();
  const allRecords = attendanceService.getAllAttendanceRecords();

  const consecutiveAbsences = crews.filter(crew => {
    const records = allRecords
      .filter(r => r.crewId === crew.id && r.status === 'absent')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    let consecutive = 0;
    for (let i = 0; i < records.length; i++) {
      if (i === 0) {
        consecutive++;
      } else {
        const d1 = new Date(records[i-1].date);
        const d2 = new Date(records[i].date);
        if ((d1.getTime() - d2.getTime()) === 86400000) {
          consecutive++;
        } else {
          break;
        }
      }
    }
    return consecutive > 3;
  });

  const [showAbsenceModal, setShowAbsenceModal] = useState(false);

  return (
    <div className="space-y-6">
      {showAbsenceModal && <AbsenceManagementModal onClose={() => setShowAbsenceModal(false)} />}
      
      {consecutiveAbsences.length > 0 && (
        <div className="bg-rose-900/20 border border-rose-800 p-4 rounded-xl flex items-center gap-4">
          <AlertCircle className="w-6 h-6 text-rose-500" />
          <div>
            <h4 className="text-white font-semibold">Peringatan Ketidakhadiran</h4>
            <p className="text-rose-300 text-sm">
              Kru berikut tidak hadir lebih dari 3 hari berturut-turut: {consecutiveAbsences.map(c => c.name).join(', ')}
            </p>
          </div>
        </div>
      )}
      <div className="flex justify-end">
        <button 
          onClick={() => setShowAbsenceModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
        >
          <UserCheck className="w-5 h-5" /> Kelola Absensi & Penugasan
        </button>
      </div>
      <PresenceSummary />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard title="Staff Aktif" value="142" subtext="Tersebar di semua cabang" icon={Users} color="text-indigo-400" />
        <MetricCard title="Hadir Hari Ini" value="-" subtext="Driver & Helper" icon={CheckCircle2} color="text-emerald-400" />
        <MetricCard title="Ijin / Sakit" value="-" subtext="Perlu perhatikan" icon={AlertCircle} color="text-rose-400" />
        <MetricCard title="Target Rekrutmen" value="85%" subtext="Pencapaian bulan ini" icon={TrendingUp} color="text-emerald-400" />
      </div>
      <TeamCalendar role="hr_admin" />
    </div>
  );
};

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
    <div className="flex justify-end">
      <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
        <Database className="w-5 h-5" /> Analisa Stok
      </button>
    </div>
    <TeamCalendar role="purchasing_admin" />
  </div>
);

export const DepartmentDashboard: React.FC<{ dashboardType?: 'hr' | 'finance' | 'warehouse' | 'purchasing' }> = ({ dashboardType }) => {
  const user = logisticsStore.getCurrentUser();
  
  // Use dashboardType prop if provided, otherwise fallback to user's department role
  const typeToRender = dashboardType || (user.role === 'hr_admin' ? 'hr' : user.role === 'warehouse_admin' ? 'warehouse' : user.role === 'finance_tax_admin' ? 'finance' : user.role === 'purchasing_admin' ? 'purchasing' : 'hr');

  const renderDashboard = () => {
    switch (typeToRender) {
      case 'hr': return <HRDashboard />;
      case 'warehouse': return <WarehouseDashboard />;
      case 'finance': return <FinanceDashboard />;
      case 'purchasing': return <PurchasingDashboard />;
      default: return <div className="text-slate-400">Dashboard tidak tersedia untuk role ini.</div>;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-black text-white">Dashboard {typeToRender === 'hr' ? 'HR' : typeToRender === 'warehouse' ? 'Gudang' : typeToRender === 'finance' ? 'Finance' : 'Purchasing'}</h2>
      {renderDashboard()}
    </div>
  );
};
