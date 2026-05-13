import { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import type { AdminUser } from '../services/adminService';
import { LoadingSpinner } from '../components';
import { ShieldCheck, ShieldOff } from 'lucide-react';

export function AdminUsersPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [adminRoleId, setAdminRoleId] = useState<number | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const [u, roles] = await Promise.all([adminService.getUsers(), adminService.getRoles()]);
            setUsers(u);
            const adminRole = roles.find(r => r.roleName === 'ADMIN');
            if (adminRole) setAdminRoleId(adminRole.roleId);
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            setError(err?.response?.data?.message || 'Gagal memuat data');
        } finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const isAdmin = (user: AdminUser) => user.roles.some(r => r.roleName === 'ADMIN');

    const toggleAdmin = async (user: AdminUser) => {
        if (!adminRoleId) return;
        try {
            if (isAdmin(user)) await adminService.removeUserRole(user.userId, adminRoleId);
            else await adminService.assignUserRole(user.userId, adminRoleId);
            load();
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            setError(err?.response?.data?.message || 'Gagal mengubah role');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Pengguna</h1>
                <p className="text-gray-500 mt-1">Kelola pengguna dan role admin</p>
            </div>

            {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

            {loading ? <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div> : (
                <div className="card p-0 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr className="text-left text-gray-500">
                                <th className="px-6 py-3 font-medium">Nama</th>
                                <th className="px-6 py-3 font-medium">Telepon</th>
                                <th className="px-6 py-3 font-medium">Email</th>
                                <th className="px-6 py-3 font-medium">Role</th>
                                <th className="px-6 py-3 font-medium">Daftar</th>
                                <th className="px-6 py-3 font-medium text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Belum ada pengguna</td></tr>
                            ) : users.map(u => (
                                <tr key={u.userId} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{u.name}</td>
                                    <td className="px-6 py-4 text-gray-600">{u.phone}</td>
                                    <td className="px-6 py-4 text-gray-600">{u.email ?? '-'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {u.roles.map(r => (
                                                <span key={r.roleId} className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.roleName === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {r.roleName}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-xs">
                                        {new Date(u.createdAt).toLocaleDateString('id-ID')}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => toggleAdmin(u)}
                                            title={isAdmin(u) ? 'Cabut role Admin' : 'Jadikan Admin'}
                                            className={`p-1.5 rounded transition-colors ${isAdmin(u) ? 'text-purple-600 hover:bg-purple-50 hover:text-red-600' : 'text-gray-400 hover:bg-purple-50 hover:text-purple-600'}`}
                                        >
                                            {isAdmin(u) ? <ShieldOff size={16} /> : <ShieldCheck size={16} />}
                                        </button>
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
