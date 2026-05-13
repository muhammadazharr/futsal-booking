import { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import type { AdminSlot } from '../services/adminService';
import { LoadingSpinner } from '../components';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';

interface FormData { startTime: string; endTime: string; isDay: boolean }

export function AdminSlotsPage() {
    const [slots, setSlots] = useState<AdminSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState<FormData>({ startTime: '08:00', endTime: '09:00', isDay: true });
    const [submitting, setSubmitting] = useState(false);

    const load = () => {
        setLoading(true);
        adminService.getSlots()
            .then(setSlots)
            .catch((e) => setError(e?.response?.data?.message || 'Gagal memuat data'))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const openAdd = () => { setEditId(null); setForm({ startTime: '08:00', endTime: '09:00', isDay: true }); setShowForm(true); };
    const openEdit = (s: AdminSlot) => {
        setEditId(s.slotId);
        setForm({ startTime: s.startTime.substring(0, 5), endTime: s.endTime.substring(0, 5), isDay: s.isDay });
        setShowForm(true);
    };
    const closeForm = () => { setShowForm(false); setEditId(null); };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            if (editId) await adminService.updateSlot(editId, form);
            else await adminService.createSlot(form);
            closeForm(); load();
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            setError(err?.response?.data?.message || 'Gagal menyimpan');
        } finally { setSubmitting(false); }
    };

    const handleDelete = async (slotId: string) => {
        if (!confirm('Hapus slot ini?')) return;
        try { await adminService.deleteSlot(slotId); load(); }
        catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            setError(err?.response?.data?.message || 'Gagal menghapus');
        }
    };

    const toggleActive = async (s: AdminSlot) => {
        try { await adminService.updateSlot(s.slotId, { isActive: !s.isActive }); load(); }
        catch { setError('Gagal mengubah status'); }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Slot Waktu</h1>
                    <p className="text-gray-500 mt-1">Kelola slot waktu booking</p>
                </div>
                <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16} /> Tambah Slot</button>
            </div>

            {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

            {showForm && (
                <div className="card border border-green-200">
                    <h2 className="text-lg font-semibold mb-4">{editId ? 'Edit Slot' : 'Tambah Slot'}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mulai *</label>
                            <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Selesai *</label>
                            <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                            <select value={form.isDay ? 'day' : 'night'} onChange={e => setForm(f => ({ ...f, isDay: e.target.value === 'day' }))} className="input-field">
                                <option value="day">Siang</option>
                                <option value="night">Malam</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex items-center gap-1"><Check size={16} /> {submitting ? 'Menyimpan...' : 'Simpan'}</button>
                        <button onClick={closeForm} className="btn-secondary flex items-center gap-1"><X size={16} /> Batal</button>
                    </div>
                </div>
            )}

            {loading ? <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div> : (
                <div className="card p-0 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr className="text-left text-gray-500">
                                <th className="px-6 py-3 font-medium">Mulai</th>
                                <th className="px-6 py-3 font-medium">Selesai</th>
                                <th className="px-6 py-3 font-medium">Tipe</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {slots.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-10 text-gray-400">Belum ada slot</td></tr>
                            ) : slots.map(s => (
                                <tr key={s.slotId} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium">{s.startTime.substring(0, 5)}</td>
                                    <td className="px-6 py-4">{s.endTime.substring(0, 5)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.isDay ? 'bg-yellow-100 text-yellow-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                            {s.isDay ? 'Siang' : 'Malam'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => toggleActive(s)} className={`px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {s.isActive ? 'Aktif' : 'Non-aktif'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => openEdit(s)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"><Pencil size={15} /></button>
                                            <button onClick={() => handleDelete(s.slotId)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={15} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
