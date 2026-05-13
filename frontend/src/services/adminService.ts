import api from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminBranch {
    branchId: string;
    name: string;
    address: string;
    isActive: boolean;
}

export interface AdminField {
    fieldId: string;
    branchId: string;
    branchName: string;
    name: string;
    isActive: boolean;
}

export interface AdminSlot {
    slotId: string;
    startTime: string;
    endTime: string;
    isDay: boolean;
    isActive: boolean;
}

export interface AdminPricing {
    pricingId: string;
    fieldId: string;
    fieldName: string;
    slotId: string;
    startTime: string;
    endTime: string;
    dayType: 'WEEKDAY' | 'WEEKEND';
    price: number;
}

export interface AdminUser {
    userId: string;
    name: string;
    phone: string;
    email: string | null;
    roles: { roleId: number; roleName: string }[];
    createdAt: string;
}

export interface AdminBooking {
    bookingId: string;
    userId: string;
    userName: string;
    userPhone: string;
    branchName: string;
    fieldName: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    finalPrice: number;
    status: string;
    createdAt: string;
}

export interface AdminDashboard {
    totalBookings: number;
    totalRevenue: number;
    totalUsers: number;
    activeFields: number;
    recentBookings: AdminBooking[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extract<T>(res: { data: unknown }): T {
    const d = res.data as { data?: T } | T;
    return (d && typeof d === 'object' && 'data' in (d as object))
        ? (d as { data: T }).data
        : d as T;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const adminService = {
    // Dashboard
    async getDashboard(): Promise<AdminDashboard> {
        const res = await api.get('/admin/dashboard');
        return extract<AdminDashboard>(res);
    },

    // ── Branches ────────────────────────────────────────────────────────────────
    async getBranches(): Promise<AdminBranch[]> {
        const res = await api.get('/admin/branches');
        return extract<AdminBranch[]>(res);
    },
    async createBranch(data: { name: string; address?: string }): Promise<AdminBranch> {
        const res = await api.post('/admin/branches', data);
        return extract<AdminBranch>(res);
    },
    async updateBranch(branchId: string, data: { name?: string; address?: string; isActive?: boolean }): Promise<AdminBranch> {
        const res = await api.put(`/admin/branches/${branchId}`, data);
        return extract<AdminBranch>(res);
    },
    async deleteBranch(branchId: string): Promise<void> {
        await api.delete(`/admin/branches/${branchId}`);
    },

    // ── Fields ──────────────────────────────────────────────────────────────────
    async getFields(): Promise<AdminField[]> {
        const res = await api.get('/admin/fields');
        return extract<AdminField[]>(res);
    },
    async createField(data: { branchId: string; name: string }): Promise<AdminField> {
        const res = await api.post('/admin/fields', data);
        return extract<AdminField>(res);
    },
    async updateField(fieldId: string, data: { name?: string; isActive?: boolean }): Promise<AdminField> {
        const res = await api.put(`/admin/fields/${fieldId}`, data);
        return extract<AdminField>(res);
    },
    async deleteField(fieldId: string): Promise<void> {
        await api.delete(`/admin/fields/${fieldId}`);
    },

    // ── Slots ───────────────────────────────────────────────────────────────────
    async getSlots(): Promise<AdminSlot[]> {
        const res = await api.get('/admin/slots');
        return extract<AdminSlot[]>(res);
    },
    async createSlot(data: { startTime: string; endTime: string; isDay: boolean }): Promise<AdminSlot> {
        const res = await api.post('/admin/slots', data);
        return extract<AdminSlot>(res);
    },
    async updateSlot(slotId: string, data: { startTime?: string; endTime?: string; isDay?: boolean; isActive?: boolean }): Promise<AdminSlot> {
        const res = await api.put(`/admin/slots/${slotId}`, data);
        return extract<AdminSlot>(res);
    },
    async deleteSlot(slotId: string): Promise<void> {
        await api.delete(`/admin/slots/${slotId}`);
    },

    // ── Pricing ─────────────────────────────────────────────────────────────────
    async getPricing(): Promise<AdminPricing[]> {
        const res = await api.get('/admin/pricing');
        return extract<AdminPricing[]>(res);
    },
    async upsertPricing(data: { fieldId: string; slotId: string; dayType: string; price: number }): Promise<AdminPricing> {
        const res = await api.post('/admin/pricing', data);
        return extract<AdminPricing>(res);
    },
    async deletePricing(pricingId: string): Promise<void> {
        await api.delete(`/admin/pricing/${pricingId}`);
    },

    // ── Users ───────────────────────────────────────────────────────────────────
    async getUsers(): Promise<AdminUser[]> {
        const res = await api.get('/admin/users');
        return extract<AdminUser[]>(res);
    },
    async getRoles(): Promise<{ roleId: number; roleName: string }[]> {
        const res = await api.get('/admin/roles');
        return extract<{ roleId: number; roleName: string }[]>(res);
    },
    async assignUserRole(userId: string, roleId: number): Promise<void> {
        await api.post(`/admin/users/${userId}/roles`, { roleId });
    },
    async removeUserRole(userId: string, roleId: number): Promise<void> {
        await api.delete(`/admin/users/${userId}/roles/${roleId}`);
    },

    // ── Bookings ─────────────────────────────────────────────────────────────────
    async getBookings(params?: { status?: string; page?: number; limit?: number }): Promise<{ bookings: AdminBooking[]; pagination: { page: number; limit: number; total: number } }> {
        const res = await api.get('/admin/bookings', { params });
        return extract(res);
    },
};
