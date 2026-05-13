import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts';
import { LoadingSpinner, ErrorMessage } from '../components';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { register, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    // Basic validation
    if (!name.trim()) {
      setFormError('Nama wajib diisi');
      return;
    }
    if (!phone.trim()) {
      setFormError('Nomor telepon wajib diisi');
      return;
    }
    if (!password) {
      setFormError('Password wajib diisi');
      return;
    }
    if (password.length < 8) {
      setFormError('Password minimal 8 karakter');
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setFormError('Password harus mengandung huruf besar, huruf kecil, dan angka');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Konfirmasi password tidak sesuai');
      return;
    }

    try {
      await register({
        name: name.trim(),
        phone: phone.trim(),
        password,
        email: email.trim() || undefined,
      });
      navigate('/availability', { replace: true });
    } catch {
      // Error is handled by AuthContext
    }
  };

  const displayError = formError || error;

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Daftar</h1>
            <p className="text-gray-500 mt-2">
              Buat akun baru untuk mulai booking
            </p>
          </div>

          {displayError && (
            <div className="mb-6">
              <ErrorMessage
                message={displayError}
                onDismiss={() => {
                  setFormError(null);
                  clearError();
                }}
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nama Lengkap
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="input-field"
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nomor Telepon
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="input-field"
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email (Opsional)
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="input-field"
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-400 mt-1">
                Min. 8 karakter, mengandung huruf besar, huruf kecil, dan angka
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Konfirmasi Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Memproses...</span>
                </>
              ) : (
                'Daftar'
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-green-600 hover:text-green-700">
              Masuk sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
