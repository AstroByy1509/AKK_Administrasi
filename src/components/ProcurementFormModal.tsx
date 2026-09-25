import React, { useState, useRef, useEffect } from 'react';
import { X, Save, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

interface ProcurementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProcurementFormModal: React.FC<ProcurementFormModalProps> = ({ isOpen, onClose }) => {
  const componentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('procurement_form_draft');
    return saved ? JSON.parse(saved) : {
      category: '',
      quantity: '',
      urgency: 'medium',
      reason: '',
    };
  });

  const validate = () => formData.category && formData.quantity && formData.reason;

  useEffect(() => {
    localStorage.setItem('procurement_form_draft', JSON.stringify(formData));
  }, [formData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Form Permintaan Pengadaan Barang Distribusi</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6" ref={componentRef}>
          {/* Input Fields (Visible for editing) */}
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg print:hidden">
            <div>
              <label className="block text-sm font-medium">Kategori Barang</label>
              <select className="w-full border p-2 rounded" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="">Pilih Kategori</option>
                <option value="oli">Oli</option>
                <option value="ban">Ban</option>
                <option value="aki">Aki</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Jumlah</label>
              <input type="number" className="w-full border p-2 rounded" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium">Urgensi</label>
              <select className="w-full border p-2 rounded" value={formData.urgency} onChange={e => setFormData({...formData, urgency: e.target.value})}>
                <option value="low">Rendah</option>
                <option value="medium">Sedang</option>
                <option value="high">Tinggi</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium">Alasan Pengadaan</label>
              <textarea className="w-full border p-2 rounded" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} rows={2}></textarea>
            </div>
          </div>

          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">NO</th>
                <th className="border p-2">NAMA BARANG</th>
                <th className="border p-2">DI TANGAN</th>
                <th className="border p-2">REQ ORDER</th>
                <th className="border p-2">TANGGAL DIPERLUKAN</th>
                <th className="border p-2">UNTUK KEPERLUAN</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td className="border p-2 text-center">{i + 1}</td>
                  <td className="border p-2 h-8"></td>
                  <td className="border p-2 h-8"></td>
                  <td className="border p-2 h-8"></td>
                  <td className="border p-2 h-8"></td>
                  <td className="border p-2 h-8"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Tutup</button>
          <button 
            onClick={() => validate() ? handlePrint() : alert('Mohon lengkapi semua field wajib!')}
            className={`px-4 py-2 rounded flex items-center gap-2 ${validate() ? 'bg-slate-600 text-white hover:bg-slate-700' : 'bg-gray-400 text-gray-200 cursor-not-allowed'}`}
          >
            <Printer size={18} /> Cetak
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2">
            <Save size={18} /> Simpan ke Inventaris
          </button>
        </div>
      </div>
    </div>
  );
};
