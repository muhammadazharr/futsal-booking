import { useEffect, useState, useCallback } from 'react';
import { adminService } from '../services/adminService';
import type { AdminBooking } from '../services/adminService';
import { LoadingSpinner } from '../components';

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const STATUS_OPTIONS = ['', 'LOCKED', 'PENDING_PAYMENT', 'CONFIRMED', 'RESCHEDULED', 'EXPIRED'];

const statusColor: Record<string, string> = {
    CONFIRMED: 'bg-green-100 text-green-700',
    LOCKED: 'bg-yellow-100 text-yellow-700',
    PENDING_PAYMENT: 'bg-blue-100 text-blue-700',
    RESCHEDULED: 'bg-indigo-100 text-indigo-700',
    EXPIRED: 'bg-gray-100 text-gray-500',
};

export function AdminBookingsPage() {
    const [bookings, setBookings] = useState<AdminBooking[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const limit = 20;

    const load = useCallback(() => {
        setLoading(true);
        adminService.getBookings({ status: statusFilter || undefined, page, limit })
            .then(({ bookings: b, pagination }) => { setBookings(b); setTotal(pagination.total); })
            .catch((e) => setError(e?.response?.data?.message || 'Gagal memuat data'))
            .finally(() => setLoading(false));
    }, [statusFilter, page]);

    useEffect(load, [load]);

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Booking</h1>
                    <p className="text-gray-500 mt-1">Semua booking: {total} total</p>
                </div>
                <select
                    value={statusFilter}
                    onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                    className="input-field w-auto"
                >
                    {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{s || 'Semua Status'}</option>
                    ))}
                </select>
            </div>

            {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

            {loading ? <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div> : (
                <div className="card p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr className="text-left text-gray-500">
                                    <th className="px-6 py-3 font-medium">Pengguna</th>
                                    <th className="px-6 py-3 font-medium">Lapangan</th>
                                    <th className="px-6 py-3 font-medium">Tanggal</th>
                                    <th className="px-6 py-3 font-medium">Waktu</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium text-right">Harga</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {bookings.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-10 text-gray-400">Belum ada booking</td></tr>
                                ) : bookings.map(b => (
                                    <tr key={b.bookingId} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-gray-900">{b.userName}</p>
                                            <p className="text-xs text-gray-400">{b.userPhone}</p>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{b.fieldName}</td>
                                        <td className="px-6 py-4 text-gray-600">{b.bookingDate}</td>
                                        <td className="px-6 py-4 text-gray-600">{b.startTime?.substring(0, 5)}–{b.endTime?.substring(0, 5)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                                {b.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium">{formatCurrency(b.finalPrice)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
                            <span className="text-sm text-gray-500">Halaman {page} dari {totalPages}</span>
                            <div className="flex gap-2">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm py-1 px-3">Sebelumnya</button>
                                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary text-sm py-1 px-3">Berikutnya</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
