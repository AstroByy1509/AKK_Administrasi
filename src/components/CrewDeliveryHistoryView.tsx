import React, { useState, useEffect } from 'react';
import { History, ShieldAlert, CheckCircle2, XCircle, Search, Filter, User, MapPin, Truck, Calendar, Award, Clock, AlertTriangle, ChevronRight, Sliders, FileText } from 'lucide-react';
import { Crew, CrewDeliveryHistory, AreaApprovalRequest, AreaDeliveryStat } from '../types';
import { logisticsStore } from '../services/store';
import { AreaApprovalModal } from './AreaApprovalModal';

export const CrewDeliveryHistoryView: React.FC = () => {
  const [crews, setCrews] = useState<Crew[]>(logisticsStore.getCrews());
  const [history, setHistory] = useState<CrewDeliveryHistory[]>(logisticsStore.getCrewDeliveryHistory());
  const [approvalRequests, setApprovalRequests] = useState<AreaApprovalRequest[]>(logisticsStore.getAreaApprovalRequests());
  const [threshold, setThreshold] = useState<number>(logisticsStore.getAreaDeliveryThreshold());

  const [selectedCrewId, setSelectedCrewId] = useState<string>('all');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'history' | 'approvals' | 'area_stats'>('history');

  // Interactive Approval Modal State
  const [modalData, setModalData] = useState<{
    isOpen: boolean;
    crewName: string;
    crewId: string;
    areaName: string;
    storeName: string;
    plateNumber: string;
    tripCount: number;
    threshold: number;
    recentTrips: CrewDeliveryHistory[];
    requestId?: string;
  }>({
    isOpen: false,
    crewName: '',
    crewId: '',
    areaName: '',
    storeName: '',
    plateNumber: '',
    tripCount: 0,
    threshold: 3,
    recentTrips: []
  });

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    return logisticsStore.subscribe(() => {
      setCrews(logisticsStore.getCrews());
      setHistory(logisticsStore.getCrewDeliveryHistory());
      setApprovalRequests(logisticsStore.getAreaApprovalRequests());
      setThreshold(logisticsStore.getAreaDeliveryThreshold());
    });
  }, []);

  const handleThresholdChange = (val: number) => {
    logisticsStore.setAreaDeliveryThreshold(val);
    setFeedbackMessage(`Batas maksimal pengiriman dalam 1 area diperbarui menjadi: ${val} kali.`);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleOpenSimulateApproval = (crew: Crew, stat: AreaDeliveryStat) => {
    const areaTrips = history.filter(
      h => h.crewId === crew.id && h.area.toLowerCase() === stat.area.toLowerCase()
    );

    setModalData({
      isOpen: true,
      crewName: crew.name,
      crewId: crew.id,
      areaName: stat.area,
      storeName: areaTrips[0]?.storeName || `Toko Retail di ${stat.area}`,
      plateNumber: areaTrips[0]?.vehiclePlate || 'B 9284 TQZ',
      tripCount: stat.totalTrips,
      threshold,
      recentTrips: areaTrips
    });
  };

  const handleApproveFromModal = (notes: string) => {
    logisticsStore.createAreaApprovalRequest({
      crewId: modalData.crewId,
      crewName: modalData.crewName,
      targetArea: modalData.areaName,
      currentTripsInArea: modalData.tripCount,
      thresholdLimit: threshold,
      storeName: modalData.storeName,
      plateNumber: modalData.plateNumber,
      departureDate: new Date().toISOString(),
      status: 'approved',
      reasonPolicy: `Disetujui dispensasi penugasan wilayah ${modalData.areaName} untuk trip ke-${modalData.tripCount + 1}.`,
      notes
    });

    setModalData(prev => ({ ...prev, isOpen: false }));
    setFeedbackMessage(`Penugasan wilayah untuk ${modalData.crewName} di ${modalData.areaName} berhasil DISETUJUI.`);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleDecideRequest = (reqId: string, status: 'approved' | 'rejected') => {
    logisticsStore.decideAreaApproval(reqId, status);
    setFeedbackMessage(`Permohonan otorisasi telah di-${status === 'approved' ? 'SETUJUI' : 'TOLAK'}.`);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const filteredHistory = history.filter(item => {
    const matchesCrew = selectedCrewId === 'all' || item.crewId === selectedCrewId;
    const matchesArea = selectedAreaFilter === 'all' || item.island === selectedAreaFilter || item.area.includes(selectedAreaFilter);
    const matchesSearch =
      item.crewName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCrew && matchesArea && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold mb-2">
              <History className="w-3.5 h-3.5" />
              <span>SOP Rotasi Wilayah & Fatigue Risk Management</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Histori Pengiriman Kru & Otorisasi Pengiriman Area Berulang
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Melacak riwayat penugasan supir berdasarkan wilayah/pulau, serta pop-up persetujuan otomatis jika seorang supir telah mencapai batas pengiriman berulang di area yang sama untuk menjaga stamina dan kepatuhan keselamatan.
            </p>
          </div>

          {/* Configurable Threshold Selector */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span className="font-semibold">Batas Rotasi Area:</span>
            </div>
            <div className="flex items-center gap-1.5">
              {[2, 3, 5].map(num => (
                <button
                  key={num}
                  onClick={() => handleThresholdChange(num)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                    threshold === num
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {num}x Kirim
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sub-Tabs & Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveSubTab('history')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                activeSubTab === 'history' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Log Riwayat Pengiriman ({history.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('approvals')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                activeSubTab === 'approvals' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Antrean Otorisasi Wilayah ({approvalRequests.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('area_stats')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                activeSubTab === 'area_stats' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Frekuensi Kru per Area</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari supir, resi, toko, area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={selectedCrewId}
              onChange={(e) => setSelectedCrewId(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none"
            >
              <option value="all">Semua Pengemudi</option>
              {crews.map(cr => (
                <option key={cr.id} value={cr.id}>{cr.name} ({cr.role})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 text-xs flex items-center gap-2 shadow animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Sub-Tab 1: Log Riwayat Pengiriman */}
      {activeSubTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3.5 font-semibold">Waktu & Resi Pengiriman</th>
                  <th className="p-3.5 font-semibold">Pengemudi (Kru)</th>
                  <th className="p-3.5 font-semibold">Toko Retail & Wilayah Tujuan</th>
                  <th className="p-3.5 font-semibold">Armada & Kargo</th>
                  <th className="p-3.5 font-semibold">Status SLA</th>
                  <th className="p-3.5 font-semibold">Frekuensi & Otorisasi Area</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredHistory.map(item => {
                  const isThresholdHit = (item.areaTripSequenceNumber || 1) >= threshold;

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-white text-xs">{item.trackingNumber}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{new Date(item.completionDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-blue-400" />
                          <span>{item.crewName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Rating: ⭐ {item.ratingReceived.toFixed(1)} / 5.0</div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-semibold text-white">{item.storeName}</div>
                        <div className="text-[11px] text-amber-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-amber-400" />
                          <span>{item.area}</span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-mono font-bold text-slate-200">{item.vehiclePlate}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {item.cargoWeightTon} Ton &bull; {item.vehicleType}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {item.onTimeStatus}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isThresholdHit
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            <span>Trip ke-{item.areaTripSequenceNumber || 1} di Area Ini</span>
                          </span>

                          {isThresholdHit && (
                            <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Telah Disetujui Manajer</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Antrean Otorisasi Wilayah (Approval Requests Queue) */}
      {activeSubTab === 'approvals' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {approvalRequests.map(req => (
              <div
                key={req.id}
                className={`p-5 rounded-xl border space-y-3.5 ${
                  req.status === 'pending'
                    ? 'bg-amber-950/20 border-amber-500/40 shadow-lg'
                    : req.status === 'approved'
                    ? 'bg-slate-900 border-emerald-500/30'
                    : 'bg-slate-900 border-rose-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{req.crewName}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      req.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                        : req.status === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {req.status === 'pending' && 'Menunggu Persetujuan'}
                      {req.status === 'approved' && 'Telah Disetujui'}
                      {req.status === 'rejected' && 'Ditolak / Rotasi'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(req.requestedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Wilayah Tujuan:</span>
                    <strong className="text-amber-300">{req.targetArea}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Toko Retail:</span>
                    <span className="text-slate-200">{req.storeName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Frekuensi Pengiriman:</span>
                    <strong className="text-white">Pengiriman ke-{req.currentTripsInArea + 1} (Batas: {req.thresholdLimit}x)</strong>
                  </div>
                </div>

                <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block mb-0.5">Alasan / Catatan Otorisasi:</span>
                  {req.notes || req.reasonPolicy}
                </div>

                {req.decidedBy && (
                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800">
                    <span>Disetujui Oleh: <strong className="text-slate-200">{req.decidedBy}</strong></span>
                    <span>Waktu: {new Date(req.decidedAt || '').toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                  </div>
                )}

                {req.status === 'pending' && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleDecideRequest(req.id, 'rejected')}
                      className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-semibold border border-rose-500/40 transition cursor-pointer"
                    >
                      Tolak & Ganti Driver
                    </button>
                    <button
                      onClick={() => handleDecideRequest(req.id, 'approved')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition cursor-pointer"
                    >
                      Setujui Otorisasi Wilayah
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Frekuensi Kru per Area & Tombol Simulasi Pop-Up */}
      {activeSubTab === 'area_stats' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {crews.map(crew => {
              const stats = logisticsStore.getCrewAreaStats(crew.id);

              return (
                <div key={crew.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-xs">
                        {crew.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{crew.name}</h4>
                        <span className="text-[11px] text-slate-400">{crew.role}</span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {crew.tripsCompleted} Total Trip
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">
                      Frekuensi per Wilayah:
                    </span>

                    {stats.length > 0 ? (
                      stats.map(st => {
                        const isExceeded = st.totalTrips >= threshold;

                        return (
                          <div
                            key={st.area}
                            className={`p-2.5 rounded-lg border flex items-center justify-between ${
                              isExceeded
                                ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                                : 'bg-slate-950/60 border-slate-800 text-slate-300'
                            }`}
                          >
                            <div>
                              <div className="font-bold text-white text-xs">{st.area}</div>
                              <div className="text-[10px] text-slate-400">
                                {st.totalTrips}x pengiriman ({isExceeded ? 'Batas Tercapai!' : `Batas: ${threshold}x`})
                              </div>
                            </div>

                            <button
                              onClick={() => handleOpenSimulateApproval(crew, st)}
                              className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                                isExceeded
                                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              {isExceeded ? 'Pop-up Otorisasi' : 'Detail'}
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-3 text-center text-slate-500 text-xs italic bg-slate-950/40 rounded-lg">
                        Belum ada riwayat pengiriman tercatat.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reusable Area Approval Pop-Up Modal */}
      <AreaApprovalModal
        isOpen={modalData.isOpen}
        onClose={() => setModalData(prev => ({ ...prev, isOpen: false }))}
        crewName={modalData.crewName}
        crewId={modalData.crewId}
        areaName={modalData.areaName}
        storeName={modalData.storeName}
        plateNumber={modalData.plateNumber}
        tripCount={modalData.tripCount}
        threshold={modalData.threshold}
        recentTrips={modalData.recentTrips}
        onApprove={handleApproveFromModal}
        onRejectAndPickOtherDriver={() => {
          setModalData(prev => ({ ...prev, isOpen: false }));
          setFeedbackMessage(`Pengiriman ke ${modalData.areaName} dialihkan untuk rotasi supir baru.`);
          setTimeout(() => setFeedbackMessage(null), 3500);
        }}
      />
    </div>
  );
};
