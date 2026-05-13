import { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import type { AdminPricing, AdminField, AdminSlot } from '../services/adminService';
import { LoadingSpinner } from '../components';
import { Plus, Trash2, Check, X } from 'lucide-react';

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

interface FormData { fieldId: string; slotId: string; dayType: string; price: string }

export function AdminPricingPage() {
    const [pricing, setPricing] = useState<AdminPricing[]>([]);
    const [fields, setFields] = useState<AdminField[]>([]);
    const [slots, setSlots] = useState<AdminSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<FormData>({ fieldId: '', slotId: '', dayType: 'WEEKDAY', price: '' });
    const [submitting, setSubmitting] = useState(false);

    const load = () => {
        setLoading(true);
        Promise.all([adminService.getPricing(), adminService.getFields(), adminService.getSlots()])
            .then(([p, f, s]) => { setPricing(p); setFields(f); setSlots(s); })
            .catch((e) => setError(e?.response?.data?.message || 'Gagal memuat data'))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const openAdd = () => {
        setForm({ fieldId: fields[0]?.fieldId ?? '', slotId: slots[0]?.slotId ?? '', dayType: 'WEEKDAY', price: '' });
        setShowForm(true);
    };

    const handleSubmit = async () => {
        if (!form.fieldId || !form.slotId || !form.price) return;
        setSubmitting(true);
        try {
            await adminService.upsertPricing({ ...form, price: Number(form.price) });
            setShowForm(false); load();
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            setError(err?.response?.data?.message || 'Gagal menyimpan');
        } finally { setSubmitting(false); }
    };

    const handleDelete = async (pricingId: string) => {
        if (!confirm('Hapus harga ini?')) return;
        try { await adminService.deletePricing(pricingId); load(); }
        catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            setError(err?.response?.data?.message || 'Gagal menghapus');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Harga</h1>
                    <p className="text-gray-500 mt-1">Kelola harga per lapangan, slot, dan hari</p>
                </div>
                <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16} /> Tambah Harga</button>
            </div>

            {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

            {showForm && (
                <div className="card border border-green-200">
                    <h2 className="text-lg font-semibold mb-4">Tambah / Update Harga</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Lapangan *</label>
                            <select value={form.fieldId} onChange={e => setForm(f => ({ ...f, fieldId: e.target.value }))} className="input-field">
                                {fields.map(f => <option key={f.fieldId} value={f.fieldId}>{f.name} ({f.branchName})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Slot *</label>
                            <select value={form.slotId} onChange={e => setForm(f => ({ ...f, slotId: e.target.value }))} className="input-field">
                                {slots.filter(s => s.isActive).map(s => (
                                    <option key={s.slotId} value={s.slotId}>{s.startTime.substring(0, 5)}–{s.endTime.substring(0, 5)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hari *</label>
                            <select value={form.dayType} onChange={e => setForm(f => ({ ...f, dayType: e.target.value }))} className="input-field">
                                <option value="WEEKDAY">Weekday</option>
                                <option value="WEEKEND">Weekend</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp) *</label>
                            <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="input-field" placeholder="100000" min="0" />
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex items-center gap-1"><Check size={16} /> {submitting ? 'Menyimpan...' : 'Simpan'}</button>
                        <button onClick={() => setShowForm(false)} className="btn-secondary flex items-center gap-1"><X size={16} /> Batal</button>
                    </div>
                </div>
            )}

            {loading ? <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div> : (
                <div className="card p-0 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr className="text-left text-gray-500">
                                <th className="px-6 py-3 font-medium">Lapangan</th>
                                <th className="px-6 py-3 font-medium">Slot</th>
                                <th className="px-6 py-3 font-medium">Hari</th>
                                <th className="px-6 py-3 font-medium text-right">Harga</th>
                                <th className="px-6 py-3 font-medium text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pricing.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-10 text-gray-400">Belum ada harga</td></tr>
                            ) : pricing.map(p => (
                                <tr key={p.pricingId} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{p.fieldName}</td>
                                    <td className="px-6 py-4 text-gray-600">{p.startTime?.substring(0, 5)}–{p.endTime?.substring(0, 5)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.dayType === 'WEEKDAY' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {p.dayType === 'WEEKDAY' ? 'Weekday' : 'Weekend'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium">{formatCurrency(Number(p.price))}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleDelete(p.pricingId)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={15} /></button>
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
