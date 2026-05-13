import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts';

// Helper: backend returns roles as string[] OR Role[]
function isAdmin(user: { roles?: unknown[] } | null): boolean {
  if (!user?.roles) return false;
  return user.roles.some(r =>
    typeof r === 'string' ? r === 'ADMIN' : (r as { name?: string }).name === 'ADMIN'
  );
}

export function Layout() {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-green-600">Futsal</span>
              <span className="text-xl font-light text-gray-600">Book</span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-6">
              <Link
                to="/availability"
                className="text-gray-600 hover:text-green-600 transition-colors"
              >
                Ketersediaan
              </Link>

              {isAuthenticated ? (
                <>
                  {isAdmin(user) && (
                    <Link
                      to="/admin"
                      className="text-purple-600 font-semibold hover:text-purple-700 transition-colors"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <Link
                    to="/bookings"
                    className="text-gray-600 hover:text-green-600 transition-colors"
                  >
                    Booking Saya
                  </Link>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                      Halo, {user?.name}
                    </span>
                    <button
                      onClick={handleLogout}
                      disabled={isLoading}
                      className="text-sm text-red-600 hover:text-red-700 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-600 hover:text-green-600 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="btn-primary text-sm"
                  >
                    Daftar
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} FutsalBook. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
