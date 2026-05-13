import { Link } from 'react-router-dom';
import { useAuth } from '../contexts';

export function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Booking Lapangan Futsal
          <span className="text-green-600"> Online</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Pesan lapangan futsal dengan mudah dan cepat. Lihat ketersediaan
          secara realtime dan bayar dengan aman.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/availability" className="btn-primary text-lg px-8 py-3">
            Lihat Ketersediaan
          </Link>
          {!isAuthenticated && (
            <Link to="/register" className="btn-secondary text-lg px-8 py-3">
              Daftar Gratis
            </Link>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-8">
        <div className="card text-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-lg mb-2">Realtime</h3>
          <p className="text-gray-500">
            Lihat ketersediaan lapangan secara realtime. Tidak perlu telepon
            atau datang langsung.
          </p>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-lg mb-2">Mudah & Cepat</h3>
          <p className="text-gray-500">
            Proses booking hanya dalam hitungan menit. Pilih, book, dan bayar
            dengan mudah.
          </p>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-lg mb-2">Harga Transparan</h3>
          <p className="text-gray-500">
            Lihat harga langsung tanpa biaya tersembunyi. Dapatkan diskon
            membership dan promo.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="card">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Cara Booking
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
              1
            </div>
            <h4 className="font-medium mb-1">Pilih Tanggal</h4>
            <p className="text-sm text-gray-500">
              Pilih tanggal yang diinginkan
            </p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
              2
            </div>
            <h4 className="font-medium mb-1">Pilih Slot</h4>
            <p className="text-sm text-gray-500">
              Pilih lapangan dan jam bermain
            </p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
              3
            </div>
            <h4 className="font-medium mb-1">Konfirmasi</h4>
            <p className="text-sm text-gray-500">
              Periksa detail dan konfirmasi
            </p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
              4
            </div>
            <h4 className="font-medium mb-1">Bayar</h4>
            <p className="text-sm text-gray-500">
              Bayar DP untuk mengamankan slot
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      {!isAuthenticated && (
        <section className="card bg-green-600 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Siap Bermain?</h2>
          <p className="mb-6 text-green-100">
            Daftar sekarang dan dapatkan akses ke semua fitur booking online.
          </p>
          <Link
            to="/register"
            className="inline-block bg-white text-green-600 font-medium py-3 px-8 rounded-lg hover:bg-green-50 transition-colors"
          >
            Daftar Sekarang
          </Link>
        </section>
      )}
    </div>
  );
}
