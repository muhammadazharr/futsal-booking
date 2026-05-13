import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, BookingProvider } from './contexts';
import { Layout, ProtectedRoute, AdminRoute, AdminLayout } from './components';
import {
  HomePage,
  LoginPage,
  RegisterPage,
  AvailabilityPage,
  BookingConfirmPage,
  BookingDetailPage,
  BookingsPage,
  AdminDashboardPage,
  AdminBranchesPage,
  AdminFieldsPage,
  AdminSlotsPage,
  AdminPricingPage,
  AdminUsersPage,
  AdminBookingsPage,
} from './pages';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BookingProvider>
          <Routes>
            {/* Main layout routes */}
            <Route element={<Layout />}>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/availability" element={<AvailabilityPage />} />

              {/* Protected user routes */}
              <Route path="/booking/confirm" element={<ProtectedRoute><BookingConfirmPage /></ProtectedRoute>} />
              <Route path="/booking/:bookingId" element={<ProtectedRoute><BookingDetailPage /></ProtectedRoute>} />
              <Route path="/bookings" element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />
            </Route>

            {/* Admin layout routes – requires ADMIN role */}
            <Route
              path="/admin"
              element={<AdminRoute><Layout /></AdminRoute>}
            >
              <Route element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="branches" element={<AdminBranchesPage />} />
                <Route path="fields" element={<AdminFieldsPage />} />
                <Route path="slots" element={<AdminSlotsPage />} />
                <Route path="pricing" element={<AdminPricingPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="bookings" element={<AdminBookingsPage />} />
              </Route>
            </Route>
          </Routes>
        </BookingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
