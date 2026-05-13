import { NavLink, Outlet } from 'react-router-dom';
import {
    LayoutDashboard,
    MapPin,
    Layers,
    Clock,
    DollarSign,
    Users,
    CalendarCheck,
    ChevronRight,
} from 'lucide-react';

const navItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/branches', label: 'Cabang', icon: MapPin },
    { to: '/admin/fields', label: 'Lapangan', icon: Layers },
    { to: '/admin/slots', label: 'Slot Waktu', icon: Clock },
    { to: '/admin/pricing', label: 'Harga', icon: DollarSign },
    { to: '/admin/users', label: 'Pengguna', icon: Users },
    { to: '/admin/bookings', label: 'Booking', icon: CalendarCheck },
];

export function AdminLayout() {
    return (
        <div className="flex min-h-[calc(100vh-64px)]">
            {/* Sidebar */}
            <aside className="w-60 bg-gray-900 text-white flex-shrink-0">
                <div className="px-4 py-5 border-b border-gray-700">
                    <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Admin Panel</p>
                </div>
                <nav className="py-3">
                    {navItems.map(({ to, label, icon: Icon, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors group ${isActive
                                    ? 'bg-green-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                }`
                            }
                        >
                            <Icon size={18} />
                            <span className="flex-1">{label}</span>
                            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </NavLink>
                    ))}
                </nav>
            </aside>

            {/* Content */}
            <main className="flex-1 bg-gray-50 p-8 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
}
