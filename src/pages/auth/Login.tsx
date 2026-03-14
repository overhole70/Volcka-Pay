import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Execute Supabase login directly on client (only once)
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          navigate('/confirm-email', { state: { email, password } });
        } else if (error.message.includes('Invalid login credentials')) {
          setError('بيانات الدخول غير صحيحة');
        } else {
          setError(error.message || 'حدث خطأ أثناء تسجيل الدخول');
        }
        setLoading(false);
        return;
      }

      // 2. Redirect immediately after successful login
      if (data.session) {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع');
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-3xl font-black text-gray-900 mb-8 text-center">تسجيل الدخول</h2>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm mb-8 font-medium text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-3">البريد الإلكتروني</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:ring-0 focus:border-gray-900 transition-colors bg-white outline-none text-lg"
            placeholder="name@example.com"
            dir="ltr"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-3">كلمة المرور</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:ring-0 focus:border-gray-900 transition-colors bg-white outline-none text-lg"
            placeholder="••••••••"
            dir="ltr"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50 mt-8"
        >
          {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
        </button>
      </form>

      <div className="mt-10 text-center text-gray-500 font-medium">
        ليس لديك حساب؟{' '}
        <Link to="/register" className="text-gray-900 font-bold hover:underline">
          إنشاء حساب جديد
        </Link>
      </div>
    </div>
  );
};
