import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, BookingProvider } from './contexts';
import { Layout, ProtectedRoute } from './components';
import {
  HomePage,
  LoginPage,
  RegisterPage,
  AvailabilityPage,
  BookingConfirmPage,
  BookingDetailPage,
  BookingsPage,
} from './pages';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BookingProvider>
          <Routes>
            <Route element={<Layout />}>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/availability" element={<AvailabilityPage />} />

              {/* Protected routes */}
              <Route
                path="/booking/confirm"
                element={
                  <ProtectedRoute>
                    <BookingConfirmPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking/:bookingId"
                element={
                  <ProtectedRoute>
                    <BookingDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bookings"
                element={
                  <ProtectedRoute>
                    <BookingsPage />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </BookingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
