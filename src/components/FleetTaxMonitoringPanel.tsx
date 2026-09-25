import React, { useMemo } from 'react';
import { logisticsStore } from '../services/store';
import { AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';

export const FleetTaxMonitoringPanel: React.FC = () => {
  const fleets = logisticsStore.getFleets();

  const taxAlerts = useMemo(() => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    return fleets
      .filter(fleet => fleet.taxDueDate)
      .map(fleet => {
        const dueDate = new Date(fleet.taxDueDate!);
        const isExpired = dueDate < today;
        const isExpiringSoon = dueDate <= thirtyDaysFromNow && dueDate >= today;

        return {
          ...fleet,
          dueDate,
          isExpired,
          isExpiringSoon
        };
      })
      .filter(f => f.isExpired || f.isExpiringSoon)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }, [fleets]);

  if (taxAlerts.length === 0) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-amber-500" />
        Peringatan Pajak Armada
      </h3>
      <div className="space-y-3">
        {taxAlerts.map(fleet => (
          <div key={fleet.id} className={`p-4 rounded-xl flex items-center justify-between ${fleet.isExpired ? 'bg-red-500/10 border border-red-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
            <div className="flex items-center gap-3">
              {fleet.isExpired ? <AlertTriangle className="w-5 h-5 text-red-500" /> : <AlertTriangle className="w-5 h-5 text-amber-500" />}
              <div>
                <p className="font-semibold text-white">{fleet.plateNumber} ({fleet.initialCode})</p>
                <p className="text-xs text-slate-400">Jatuh Tempo: {fleet.taxDueDate}</p>
              </div>
            </div>
            <span className={`px-2 py-1 rounded text-xs font-bold ${fleet.isExpired ? 'text-red-500' : 'text-amber-500'}`}>
              {fleet.isExpired ? 'KADALUARSA' : 'JATUH TEMPO'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
