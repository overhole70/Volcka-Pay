import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { createNotification } from '../../lib/notifications';
import { Turnstile } from '@marsidev/react-turnstile';
import toast from 'react-hot-toast';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!captchaToken) {
      toast.error('الرجاء التحقق من الكابتشا');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          navigate('/confirm-email', { state: { email, password } });
        } else if (error.message.includes('Invalid login credentials')) {
          toast.error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        } else {
          toast.error('حدث خطأ أثناء تسجيل الدخول');
        }
        setLoading(false);
        return;
      }

      if (data.session) {
        // Create login notification
        await createNotification(
          data.user.id,
          'تسجيل دخول جديد',
          'تم تسجيل الدخول إلى حسابك بنجاح.',
          'security',
          'ShieldAlert'
        );
        navigate('/home');
      }
    } catch (err: any) {
      toast.error('حدث خطأ غير متوقع');
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white p-8 sm:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 relative z-10">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">تسجيل الدخول</h2>
        <p className="text-sm text-gray-500 mt-2 font-medium">مرحباً بك مجدداً في حسابك</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
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
          <div className="flex justify-between items-center">
            <label className="block text-sm font-semibold text-gray-700">كلمة المرور</label>
            <button
              type="button"
              onClick={() => navigate('/reset-password')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              نسيت كلمة المرور؟
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400">
              <Lock size={20} />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
            onError={() => toast.error('فشل التحقق من الكابتشا')}
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
              <span>جاري الدخول...</span>
            </>
          ) : (
            'تسجيل الدخول'
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-gray-500 font-medium">
        ليس لديك حساب؟{' '}
        <Link to="/signup" className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors">
          إنشاء حساب جديد
        </Link>
      </div>
    </div>
  );
};
