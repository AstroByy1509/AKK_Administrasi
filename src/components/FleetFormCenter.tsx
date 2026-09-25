import React, { useState } from 'react';
import { FileText, Wrench, Droplets, ShoppingCart, Plus, ChevronDown, History, Download, BarChart3 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ServiceFormModal } from './ServiceFormModal';
import { ProcurementFormModal } from './ProcurementFormModal';

export const FleetFormCenter: React.FC = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Mock log data
  const [printLogs] = useState([
    { id: 1, docType: 'Form Service Armada', timestamp: '2026-09-25 00:05', userId: 'BayuN791' },
    { id: 2, docType: 'Form Pengadaan', timestamp: '2026-09-24 23:55', userId: 'BayuN791' },
    { id: 3, docType: 'Form Cuci Armada', timestamp: '2026-09-24 22:00', userId: 'BayuN791' },
    { id: 4, docType: 'Form Service Armada', timestamp: '2026-09-24 20:00', userId: 'BayuN791' },
  ]);

  const chartData = [
    { name: 'Service', count: 2, color: '#6366f1' },
    { name: 'Cuci', count: 1, color: '#38bdf8' },
    { name: 'Pengadaan', count: 1, color: '#10b981' },
  ];

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(printLogs);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Log Cetak");
    XLSX.writeFile(workbook, "Log_Cetak_Formulir.xlsx");
  };

  const forms = [
    {
      id: 'service',
      title: 'Formulir Service Armada',
      description: 'Input detail perbaikan dan maintenance rutin armada.',
      icon: <Wrench className="w-8 h-8 text-indigo-400" />,
      color: 'bg-indigo-500/10 border-indigo-500/20'
    },
    {
      id: 'washing',
      title: 'Formulir Cuci Armada',
      description: 'Input data pencucian armada untuk kebersihan dan perawatan.',
      icon: <Droplets className="w-8 h-8 text-sky-400" />,
      color: 'bg-sky-500/10 border-sky-500/20'
    },
    {
      id: 'procurement',
      title: 'Formulir Pengadaan',
      description: 'Input permintaan pengadaan barang distribusi.',
      icon: <ShoppingCart className="w-8 h-8 text-emerald-400" />,
      color: 'bg-emerald-500/10 border-emerald-500/20'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Formulir Logistik & Armada</h2>
          <p className="text-slate-400 text-sm">Pilih jenis formulir yang ingin diisi untuk manajemen armada.</p>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
          >
            <Plus size={20} /> Tambah Formulir <ChevronDown size={20} />
          </button>
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-xl border border-slate-700 shadow-xl z-20 overflow-hidden">
              {forms.map(form => (
                <button 
                  key={form.id}
                  onClick={() => { setActiveModal(form.id); setShowDropdown(false); }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-700 text-white text-sm"
                >
                  {form.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Forms Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {forms.map(form => (
            <div key={form.id} className={`p-6 rounded-2xl border ${form.color} flex flex-col items-center text-center space-y-4 hover:scale-[1.02] transition cursor-pointer`}>
              {form.icon}
              <h3 className="text-sm font-bold text-white">{form.title}</h3>
              <button 
                onClick={() => setActiveModal(form.id)}
                className="w-full mt-auto py-2 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold text-xs transition"
              >
                Isi
              </button>
            </div>
          ))}
        </div>
        {/* Bar Chart Section */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="text-slate-400" />
            <h3 className="text-lg font-bold text-white">Distribusi Formulir</h3>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <Tooltip cursor={{fill: '#334155'}} contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155'}} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Log Cetak Section */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <History className="text-slate-400" />
            <h3 className="text-lg font-bold text-white">Log Cetak</h3>
          </div>
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition text-sm"
          >
            <Download size={16} /> Ekspor Excel
          </button>
        </div>
        <div className="space-y-2">
          {printLogs.map(log => (
            <div key={log.id} className="flex justify-between items-center bg-slate-800 p-3 rounded-lg text-sm text-slate-300">
              <span>{log.docType} dicetak oleh {log.userId}</span>
              <span className="text-slate-500">{log.timestamp}</span>
            </div>
          ))}
        </div>
      </div>

      <ServiceFormModal 
        isOpen={activeModal === 'service'} 
        onClose={() => setActiveModal(null)} 
      />
      <ProcurementFormModal 
        isOpen={activeModal === 'procurement'} 
        onClose={() => setActiveModal(null)} 
      />
    </div>
  );
};
