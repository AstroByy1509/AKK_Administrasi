import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, Clock, ShieldAlert, CheckCircle2, XCircle, Search, Filter, Plus, Shield, User, Building, Phone, Mail, Calendar, AlertTriangle } from 'lucide-react';
import { UserProfile, UserRole, UserApprovalStatus } from '../types';
import { logisticsStore } from '../services/store';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>(logisticsStore.getUsers());
  const [currentUser, setCurrentUser] = useState<UserProfile>(logisticsStore.getCurrentUser());
  const [statusFilter, setStatusFilter] = useState<'all' | UserApprovalStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserForApproval, setSelectedUserForApproval] = useState<UserProfile | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [pendingRoleChanges, setPendingRoleChanges] = useState<Record<string, UserRole>>({});

  // New user form state
  const [newUser, setNewUser] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'dispatcher' as UserRole,
    department: 'Operasional Distribusi Packaging Banyuwangi',
    notes: 'Didaftarkan langsung oleh Administrator AKK'
  });

  useEffect(() => {
    return logisticsStore.subscribe(() => {
      setUsers(logisticsStore.getUsers());
      setCurrentUser(logisticsStore.getCurrentUser());
      setPendingRoleChanges({}); // Clear pending on external update
    });
  }, []);

  const handleApprove = (userId: string, notes?: string) => {
    logisticsStore.approveUser(userId, notes || 'Disetujui oleh ' + currentUser.fullName);
    setSelectedUserForApproval(null);
    setApprovalNotes('');
  };

  const handleReject = (userId: string, reason?: string) => {
    logisticsStore.rejectUser(userId, reason || 'Ditolak: Dokumen/Identitas belum terverifikasi');
    setSelectedUserForApproval(null);
    setApprovalNotes('');
  };

  const handleRoleChange = (userId: string, role: UserRole) => {
    setPendingRoleChanges(prev => ({ ...prev, [userId]: role }));
  };

  const saveRoleChange = (userId: string) => {
    const newRole = pendingRoleChanges[userId];
    if (newRole) {
      logisticsStore.updateUserRole(userId, newRole);
      setPendingRoleChanges(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    }
  };

  const handleDelete = (userId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus akun pengguna ini dari sistem AKK?')) {
      logisticsStore.deleteUser(userId);
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.fullName || !newUser.email) return;

    // Register user with pre-approved status if created by admin
    const created = logisticsStore.registerUser({
      ...newUser,
      notes: 'Akun dibuat langsung oleh Super Admin AKK'
    });
    // Auto approve
    logisticsStore.approveUser(created.id, 'Diverifikasi langsung oleh Super Admin');

    setIsAddUserModalOpen(false);
    setNewUser({
      fullName: '',
      email: '',
      phone: '',
      role: 'dispatcher',
      department: 'Operasional Distribusi Packaging Banyuwangi',
      notes: ''
    });
  };

  const pendingCount = users.filter(u => u.status === 'pending').length;
  const approvedCount = users.filter(u => u.status === 'approved').length;
  const rejectedCount = users.filter(u => u.status === 'rejected').length;

  const filteredUsers = users.filter(u => {
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    const matchesQuery =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <button
          onClick={() => setIsAddUserModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah User Langsung</span>
        </button>
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer whitespace-nowrap ${
              statusFilter === 'all' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua ({users.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'pending' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Menunggu Approval</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer whitespace-nowrap ${
              statusFilter === 'approved' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Disetujui ({approvedCount})
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer whitespace-nowrap ${
              statusFilter === 'rejected' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Ditolak ({rejectedCount})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama, email, divisi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="p-4">Identitas Pengguna</th>
                <th className="p-4">Hak Akses (Role)</th>
                <th className="p-4">Departemen / Divisi</th>
                <th className="p-4">Waktu Pendaftaran</th>
                <th className="p-4">Status Akun</th>
                <th className="p-4 text-right">Aksi & Persetujuan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Tidak ada akun pengguna yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const isCurrent = user.id === currentUser.id;

                  return (
                    <tr key={user.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow">
                            {user.fullName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-2">
                              <span>{user.fullName}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span>{user.email}</span>
                            </div>
                            {user.phone && (
                              <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <Phone className="w-2.5 h-2.5" />
                                <span>{user.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <select
                          value={pendingRoleChanges[user.id] || user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                          className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white font-medium cursor-pointer"
                        >
                          <option value="super_admin">👑 Super Admin / Manager</option>
                          <option value="dispatcher">🚛 Dispatcher / Logistik</option>
                          <option value="sales_admin">💼 Adm. Penjualan</option>
                          <option value="purchasing_admin">🛒 Adm. Pembelian</option>
                          <option value="hr_admin">👥 HR</option>
                          <option value="finance_tax_admin">💰 Finance & Tax</option>
                          <option value="warehouse_admin">📦 Gudang</option>
                          <option value="driver">🚚 Kru Supir / Driver</option>
                          <option value="marketing_online">🌐 Marketing Online</option>
                          <option value="marketing_offline">📣 Marketing Offline</option>
                        </select>
                      </td>

                      <td className="p-4">
                        <div className="text-slate-200 font-medium">{user.department}</div>
                        {user.notes && (
                          <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 italic" title={user.notes}>
                            &ldquo;{user.notes}&rdquo;
                          </div>
                        )}
                      </td>

                      <td className="p-4 text-slate-400">
                        <div>
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          }) : 'Sejak Awal'}
                        </div>
                        {user.approvedBy && (
                          <div className="text-[10px] text-emerald-400 mt-0.5">
                            Oleh: {user.approvedBy}
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        {user.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Aktif / Disetujui</span>
                          </span>
                        )}
                        {user.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Menunggu Approval</span>
                          </span>
                        )}
                        {user.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Ditolak</span>
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {pendingRoleChanges[user.id] && (
                            <button
                              onClick={() => saveRoleChange(user.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow transition cursor-pointer"
                              title="Simpan Perubahan Role"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Simpan</span>
                            </button>
                          )}
                          {user.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(user.id)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow transition cursor-pointer"
                                title="Setujui pendaftaran akun ini"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Setujui</span>
                              </button>

                              <button
                                onClick={() => handleReject(user.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-xs flex items-center gap-1 transition cursor-pointer"
                                title="Tolak pendaftaran akun"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Tolak</span>
                              </button>
                            </>
                          )}

                          {user.status === 'approved' && (
                            <button
                              onClick={() => handleReject(user.id, 'Akses dinonaktifkan sementara')}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 text-[11px] transition cursor-pointer"
                            >
                              Bekukan
                            </button>
                          )}

                          {user.status === 'rejected' && (
                            <button
                              onClick={() => handleApprove(user.id, 'Diaktifkan kembali oleh Admin')}
                              className="px-2.5 py-1 rounded bg-emerald-900/40 hover:bg-emerald-800 text-emerald-300 text-[11px] transition cursor-pointer"
                            >
                              Pulihkan
                            </button>
                          )}

                          {!isCurrent && (
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                              title="Hapus Pengguna"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-amber-400" />
                Tambah Pengguna Baru AKK
              </h3>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Nama Lengkap Karyawan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rahmat Hidayat, S.T."
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Email Perusahaan</label>
                <input
                  type="email"
                  required
                  placeholder="nama@akk-packaging.co.id"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">No. WhatsApp / Telepon</label>
                  <input
                    type="text"
                    placeholder="+62 812-..."
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Peran Akses (Role)</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="super_admin">Super Admin / Manajer</option>
                    <option value="dispatcher">Dispatcher Logistik</option>
                    <option value="sales_admin">Adm. Penjualan</option>
                    <option value="purchasing_admin">Adm. Pembelian</option>
                    <option value="hr_admin">HR</option>
                    <option value="finance_tax_admin">Finance & Tax</option>
                    <option value="warehouse_admin">Gudang</option>
                    <option value="driver">Kru Supir Utama</option>
                    <option value="marketing_online">Marketing Online</option>
                    <option value="marketing_offline">Marketing Offline</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Departemen / Unit Cabang</label>
                <input
                  type="text"
                  required
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold shadow"
                >
                  Simpan & Setujui
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
