import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { User, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';

export const Register: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!captchaToken) {
      setError('الرجاء التحقق من الكابتشا');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('كلمة المرور وتأكيد كلمة المرور غير متطابقين');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/login`
        }
      });
      
      if (error) {
        if (error.message.includes('already registered') || error.message.includes('User already exists')) {
          throw new Error('هذا البريد مستخدم بالفعل');
        }
        throw new Error(error.message || 'حدث خطأ أثناء التسجيل');
      }

      // Supabase returns a user with empty identities if the email already exists and email confirmations are enabled
      if (data?.user && data.user.identities && data.user.identities.length === 0) {
        throw new Error('هذا البريد مستخدم بالفعل');
      }

      if (data.user) {
        navigate('/confirm-email', { state: { email, password } });
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء التسجيل');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white p-8 sm:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 relative z-10">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">إنشاء حساب جديد</h2>
        <p className="text-sm text-gray-500 mt-2 font-medium">ابدأ رحلتك المالية معنا اليوم</p>
      </div>
      
      {error && (
        <div className="bg-red-50/80 border border-red-100 text-red-600 p-4 rounded-2xl text-sm mb-6 flex items-center gap-3">
          <AlertCircle size={20} className="shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">الاسم الكامل</label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400">
              <User size={20} />
            </div>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full pr-12 pl-4 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none font-medium"
              placeholder="الاسم الكامل"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">البريد الإلكتروني</label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400">
              <Mail size={20} />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pr-12 pl-4 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none font-medium"
              placeholder="name@example.com"
              dir="ltr"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">كلمة المرور</label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400">
              <Lock size={20} />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full pr-12 pl-4 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none font-medium"
              placeholder="••••••••"
              dir="ltr"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">تأكيد كلمة المرور</label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400">
              <Lock size={20} />
            </div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full pr-12 pl-4 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none font-medium"
              placeholder="••••••••"
              dir="ltr"
            />
          </div>
        </div>

        <div className="flex justify-center mt-4">
          <Turnstile
            siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || ''}
            onSuccess={(token) => setCaptchaToken(token)}
            onError={() => setError('فشل التحقق من الكابتشا')}
            onExpire={() => setCaptchaToken(null)}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !captchaToken}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white py-4 rounded-2xl font-bold text-base shadow-sm active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-8"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>جاري إنشاء الحساب...</span>
            </>
          ) : (
            'إنشاء حساب'
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-gray-500 font-medium">
        لديك حساب بالفعل؟{' '}
        <Link to="/login" className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors">
          تسجيل الدخول
        </Link>
      </div>
    </div>
  );
};
