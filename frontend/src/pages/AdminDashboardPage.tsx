import { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import type { AdminDashboard } from '../services/adminService';
import { LoadingSpinner } from '../components';
import { Users, CalendarCheck, DollarSign, Layers } from 'lucide-react';

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
    return (
        <div className="card flex items-center gap-4">
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon size={22} className="text-white" />
            </div>
            <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );
}

function formatCurrency(n: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

export function AdminDashboardPage() {
    const [data, setData] = useState<AdminDashboard | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        adminService.getDashboard()
            .then(setData)
            .catch((e) => setError(e?.response?.data?.message || 'Gagal memuat dashboard'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
    if (error) return <div className="text-red-600 p-4 bg-red-50 rounded-lg">{error}</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-1">Ringkasan statistik sistem</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Booking" value={data?.totalBookings ?? 0} icon={CalendarCheck} color="bg-blue-500" />
                <StatCard label="Total Revenue" value={formatCurrency(data?.totalRevenue ?? 0)} icon={DollarSign} color="bg-green-600" />
                <StatCard label="Total Pengguna" value={data?.totalUsers ?? 0} icon={Users} color="bg-purple-500" />
                <StatCard label="Lapangan Aktif" value={data?.activeFields ?? 0} icon={Layers} color="bg-orange-500" />
            </div>

            <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Terbaru</h2>
                {(!data?.recentBookings || data.recentBookings.length === 0) ? (
                    <p className="text-gray-500 text-center py-8">Belum ada booking</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 border-b">
                                    <th className="pb-3 font-medium">Pengguna</th>
                                    <th className="pb-3 font-medium">Lapangan</th>
                                    <th className="pb-3 font-medium">Tanggal</th>
                                    <th className="pb-3 font-medium">Status</th>
                                    <th className="pb-3 font-medium text-right">Harga</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.recentBookings.map((b) => (
                                    <tr key={b.bookingId} className="py-2">
                                        <td className="py-3 font-medium">{b.userName}</td>
                                        <td className="py-3 text-gray-600">{b.fieldName}</td>
                                        <td className="py-3 text-gray-600">{b.bookingDate}</td>
                                        <td className="py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${b.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                                                    b.status === 'LOCKED' ? 'bg-yellow-100 text-yellow-700' :
                                                        b.status === 'EXPIRED' ? 'bg-gray-100 text-gray-600' :
                                                            'bg-blue-100 text-blue-700'
                                                }`}>{b.status}</span>
                                        </td>
                                        <td className="py-3 text-right font-medium">{formatCurrency(b.finalPrice)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
