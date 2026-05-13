import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts';
import { LoadingSpinner } from './LoadingSpinner';

interface AdminRouteProps {
    children: ReactNode;
}

function hasAdminRole(user: { roles?: unknown[] } | null): boolean {
    if (!user?.roles) return false;
    return user.roles.some(r =>
        typeof r === 'string' ? r === 'ADMIN' : (r as { name?: string }).name === 'ADMIN'
    );
}

export function AdminRoute({ children }: AdminRouteProps) {
    const { isAuthenticated, isLoading, user } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!isAuthenticated || !hasAdminRole(user)) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
