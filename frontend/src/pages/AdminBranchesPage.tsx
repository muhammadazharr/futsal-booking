import { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import type { AdminBranch } from '../services/adminService';
import { LoadingSpinner } from '../components';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';

interface FormData { name: string; address: string }

export function AdminBranchesPage() {
    const [branches, setBranches] = useState<AdminBranch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState<FormData>({ name: '', address: '' });
    const [submitting, setSubmitting] = useState(false);

    const load = () => {
        setLoading(true);
        adminService.getBranches()
            .then(setBranches)
            .catch((e) => setError(e?.response?.data?.message || 'Gagal memuat data'))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const openAdd = () => { setEditId(null); setForm({ name: '', address: '' }); setShowForm(true); };
    const openEdit = (b: AdminBranch) => { setEditId(b.branchId); setForm({ name: b.name, address: b.address ?? '' }); setShowForm(true); };
    const closeForm = () => { setShowForm(false); setEditId(null); };

    const handleSubmit = async () => {
        if (!form.name.trim()) return;
        setSubmitting(true);
        try {
            if (editId) await adminService.updateBranch(editId, form);
            else await adminService.createBranch(form);
            closeForm();
            load();
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            setError(err?.response?.data?.message || 'Gagal menyimpan');
        } finally { setSubmitting(false); }
    };

    const handleDelete = async (branchId: string) => {
        if (!confirm('Hapus cabang ini?')) return;
        try {
            await adminService.deleteBranch(branchId);
            load();
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            setError(err?.response?.data?.message || 'Gagal menghapus');
        }
    };

    const toggleActive = async (b: AdminBranch) => {
        try { await adminService.updateBranch(b.branchId, { isActive: !b.isActive }); load(); }
        catch { setError('Gagal mengubah status'); }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Cabang</h1>
                    <p className="text-gray-500 mt-1">Kelola cabang futsal</p>
                </div>
                <button onClick={openAdd} className="btn-primary flex items-center gap-2">
                    <Plus size={16} /> Tambah Cabang
                </button>
            </div>

            {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

            {/* Form */}
            {showForm && (
                <div className="card border border-green-200">
                    <h2 className="text-lg font-semibold mb-4">{editId ? 'Edit Cabang' : 'Tambah Cabang'}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama *</label>
                            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" placeholder="Futsal Center Jakarta" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                            <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="input-field" placeholder="Jl. Sudirman No. 1" />
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex items-center gap-1">
                            <Check size={16} /> {submitting ? 'Menyimpan...' : 'Simpan'}
                        </button>
                        <button onClick={closeForm} className="btn-secondary flex items-center gap-1"><X size={16} /> Batal</button>
                    </div>
                </div>
            )}

            {/* Table */}
            {loading ? <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div> : (
                <div className="card p-0 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr className="text-left text-gray-500">
                                <th className="px-6 py-3 font-medium">Nama</th>
                                <th className="px-6 py-3 font-medium">Alamat</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {branches.length === 0 ? (
                                <tr><td colSpan={4} className="text-center py-10 text-gray-400">Belum ada cabang</td></tr>
                            ) : branches.map(b => (
                                <tr key={b.branchId} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{b.name}</td>
                                    <td className="px-6 py-4 text-gray-600">{b.address || '-'}</td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => toggleActive(b)} className={`px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer ${b.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {b.isActive ? 'Aktif' : 'Non-aktif'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => openEdit(b)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"><Pencil size={15} /></button>
                                            <button onClick={() => handleDelete(b.branchId)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={15} /></button>
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
