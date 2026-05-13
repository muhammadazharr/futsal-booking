import { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import type { AdminField, AdminBranch } from '../services/adminService';
import { LoadingSpinner } from '../components';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';

interface FormData { branchId: string; name: string }

export function AdminFieldsPage() {
    const [fields, setFields] = useState<AdminField[]>([]);
    const [branches, setBranches] = useState<AdminBranch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState<FormData>({ branchId: '', name: '' });
    const [submitting, setSubmitting] = useState(false);

    const load = () => {
        setLoading(true);
        Promise.all([adminService.getFields(), adminService.getBranches()])
            .then(([f, b]) => { setFields(f); setBranches(b); })
            .catch((e) => setError(e?.response?.data?.message || 'Gagal memuat data'))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const openAdd = () => { setEditId(null); setForm({ branchId: branches[0]?.branchId ?? '', name: '' }); setShowForm(true); };
    const openEdit = (f: AdminField) => { setEditId(f.fieldId); setForm({ branchId: f.branchId, name: f.name }); setShowForm(true); };
    const closeForm = () => { setShowForm(false); setEditId(null); };

    const handleSubmit = async () => {
        if (!form.name.trim() || !form.branchId) return;
        setSubmitting(true);
        try {
            if (editId) await adminService.updateField(editId, { name: form.name });
            else await adminService.createField(form);
            closeForm(); load();
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            setError(err?.response?.data?.message || 'Gagal menyimpan');
        } finally { setSubmitting(false); }
    };

    const handleDelete = async (fieldId: string) => {
        if (!confirm('Hapus lapangan ini?')) return;
        try { await adminService.deleteField(fieldId); load(); }
        catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            setError(err?.response?.data?.message || 'Gagal menghapus');
        }
    };

    const toggleActive = async (f: AdminField) => {
        try { await adminService.updateField(f.fieldId, { isActive: !f.isActive }); load(); }
        catch { setError('Gagal mengubah status'); }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Lapangan</h1>
                    <p className="text-gray-500 mt-1">Kelola lapangan per cabang</p>
                </div>
                <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16} /> Tambah Lapangan</button>
            </div>

            {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

            {showForm && (
                <div className="card border border-green-200">
                    <h2 className="text-lg font-semibold mb-4">{editId ? 'Edit Lapangan' : 'Tambah Lapangan'}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {!editId && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cabang *</label>
                                <select value={form.branchId} onChange={e => setForm(f => ({ ...f, branchId: e.target.value }))} className="input-field">
                                    {branches.map(b => <option key={b.branchId} value={b.branchId}>{b.name}</option>)}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lapangan *</label>
                            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" placeholder="Lapangan 1" />
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
                                <th className="px-6 py-3 font-medium">Nama</th>
                                <th className="px-6 py-3 font-medium">Cabang</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {fields.length === 0 ? (
                                <tr><td colSpan={4} className="text-center py-10 text-gray-400">Belum ada lapangan</td></tr>
                            ) : fields.map(f => (
                                <tr key={f.fieldId} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{f.name}</td>
                                    <td className="px-6 py-4 text-gray-600">{f.branchName}</td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => toggleActive(f)} className={`px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer ${f.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {f.isActive ? 'Aktif' : 'Non-aktif'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => openEdit(f)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"><Pencil size={15} /></button>
                                            <button onClick={() => handleDelete(f.fieldId)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={15} /></button>
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
