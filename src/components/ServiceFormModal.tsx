import React, { useState, useRef, useEffect } from 'react';
import { X, Save, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ServiceFormModal: React.FC<ServiceFormModalProps> = ({ isOpen, onClose }) => {
  const componentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('service_form_draft');
    return saved ? JSON.parse(saved) : {
      date: new Date().toISOString().split('T')[0],
      lastKm: '',
      damageDetails: '',
    };
  });

  const validate = () => formData.date && formData.lastKm && formData.damageDetails;

  useEffect(() => {
    localStorage.setItem('service_form_draft', JSON.stringify(formData));
  }, [formData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Permohonan Service dan Pemeliharaan</h2>
          <div className="flex gap-2">
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6" ref={componentRef}>
          {/* Input Area (Visible for editing) */}
          <div className="grid grid-cols-2 gap-4 border p-4 mb-4 bg-gray-50 print:hidden">
            <div>
              <label className="block text-sm font-medium">Tanggal</label>
              <input type="date" className="w-full border p-2 rounded" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium">KM Terakhir</label>
              <input type="number" className="w-full border p-2 rounded" value={formData.lastKm} onChange={e => setFormData({...formData, lastKm: e.target.value})} placeholder="Contoh: 15000" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium">Detail Kerusakan</label>
              <textarea className="w-full border p-2 rounded" value={formData.damageDetails} onChange={e => setFormData({...formData, damageDetails: e.target.value})} rows={3} placeholder="Jelaskan kendala armada..."></textarea>
            </div>
          </div>

          {/* Printable Display Area */}
          <div className="border p-4 mb-4">
            <h3 className="font-bold border-b pb-1 mb-2">KERUSAKAN (Data Cetak)</h3>
            <p>Tanggal Service: {formData.date}</p>
            <p>KM Terakhir: {formData.lastKm}</p>
            <p className="mt-2">Kendala: <span className="font-mono">{formData.damageDetails || '_________________________________________________'}</span></p>
          </div>
          
          {/* Signature Area */}
          <div className="grid grid-cols-3 gap-4 border mt-4">
            {['Yang Menerima', 'Menyetujui', 'Yang Mengajukan'].map((role) => (
              <div key={role} className="p-4 text-center">
                <p>{role},</p>
                <div className="h-20 border-b mt-12 mb-2"></div>
                <p>(___________)</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Tutup</button>
          <button 
            onClick={() => validate() ? handlePrint() : alert('Mohon lengkapi semua field wajib!')}
            className={`px-4 py-2 rounded flex items-center gap-2 ${validate() ? 'bg-slate-600 text-white hover:bg-slate-700' : 'bg-gray-400 text-gray-200 cursor-not-allowed'}`}
          >
            <Printer size={18} /> Cetak PDF
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2">
            <Save size={18} /> Simpan
          </button>
        </div>
      </div>
    </div>
  );
};
